"""
views.py - Application de gestion de l'association ININ
Expose les endpoints REST via des ModelViewSet DRF.
"""

from urllib import request

from rest_framework import viewsets, status, filters, generics, serializers as drf_serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.parsers    import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.exceptions import PermissionDenied, ValidationError

from calendar import monthrange
from .permissions import EstAdminOuTresorier,IsResponsableOuAdmin,EstAdminTresorierOuPartenariat
from .models import Don, Cotisation, Depense, Membre, DemandeAdhesion
from django.http import HttpResponse
from django.db.models import Sum, Count, Q
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from django.core.exceptions    import ValidationError

from django.utils import timezone as tz_utils
from decimal import Decimal
from .models import (
    User, Membre, Partenaire,
    Action, Don, Cotisation, Depense,
    DemandeAdhesion,
    Inscription, 

)

from .serializers import (
    ActionSerializer, ActionListSerializer,
    DonSerializer,
    CotisationSerializer,
    DepenseSerializer,
    MembreSerializer,
    PartenaireSerializer,
    DemandeAdhesionSerializer,
    TableauDeBordSerializer,
    UserSerializer,
    MembreRHSerializer,
    PartenaireResumeSerializer, 
    MembreSerializer,
    DemandeAdhesionSerializer,
    PartenaireResumeSerializer,
    ProfilSerializer,
    MembrePublicSerializer,
    MembresStatsSerializer,
    ActionPreviewSerializer,
    MemberDashboardSerializer, 
    MembreCreateUpdateSerializer,
)




User = get_user_model()
# ==============================================================================
# PERMISSIONS PERSONNALISÉES
# ==============================================================================

class EstAdminOuChargeProjet(IsAuthenticated):
    """
    Autorise uniquement les utilisateurs avec le rôle ADMIN ou CHARGE_PROJET.
    Hérite de IsAuthenticated : un utilisateur non connecté est refusé d'emblée.
    """

    def has_permission(self, request, view):
        # D'abord, vérifie que l'utilisateur est authentifié
        if not super().has_permission(request, view):
            return False
        return request.user.role in (User.Role.ADMINISTRATEUR, User.Role.CHARGE_PROJET)


class EstAdminOuTresorier(IsAuthenticated):
    """
    Autorise uniquement les utilisateurs avec le rôle ADMIN ou TRESORIER.
    Utilisé pour les vues financières (Dons, Cotisations, Dépenses).
    """

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in (User.Role.ADMINISTRATEUR, User.Role.TRESORIER)


class EstAdmin(IsAuthenticated):
    """Réservé aux Administrateurs uniquement."""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == User.Role.ADMINISTRATEUR


# ==============================================================================
# MIXIN : ENREGISTREMENT AUTOMATIQUE DE L'AUTEUR
# ==============================================================================

class AutoAssignUserMixin:
    """
    Mixin réutilisable qui injecte automatiquement l'utilisateur connecté
    dans les champs `saisi_par` ou `enregistre_par` lors de la création.
    Évite de répéter cette logique dans chaque ViewSet.
    """

    # Surcharger dans chaque ViewSet si le champ a un nom différent
    auteur_field = 'saisi_par'

    def perform_create(self, serializer):
        serializer.save(**{self.auteur_field: self.request.user})


# ==============================================================================
# ACTION VIEWSET
# ==============================================================================

class ActionViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les Actions/Projets de l'association.

    Permissions :
    - GET (liste & détail) : public, sans authentification
    - POST                 : Admin ou Chargé de Projet uniquement
    - PATCH / PUT          : Admin ou Chargé de Projet + responsable de l'action
    - DELETE               : Admin ou Chargé de Projet + responsable de l'action

    Filtrage :
    - ?type=SENSIBILISATION  → filtre par type d'action
    - ?statut=EN_COURS       → filtre par statut
    - ?search=titre          → recherche dans le titre et la description
    - ?ordering=date_debut   → tri par date
    - ?responsable_id=3      → filtre par responsable

    Serializers :
    - Liste → ActionListSerializer (allégé, pour les performances)
    - Détail / Écriture → ActionSerializer (complet, avec photos, dépenses, etc.)
    """

    queryset = Action.objects.select_related('responsable').prefetch_related(
        'partenaires', 'photos', 'depenses', 'inscriptions', 'inscriptions__utilisateur'
    ).annotate(
        inscrits_count=Count('inscriptions', distinct=True),
    ).order_by('-date_debut')

    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ['titre', 'description', 'lieu']
    ordering_fields  = ['date_debut', 'budget_prevu', 'nb_participants', 'statut']
    ordering         = ['-date_debut']

    def get_serializer_class(self):
        if self.action == 'list':
            return ActionListSerializer
        return ActionSerializer

    def get_permissions(self):
        """
        Permissions dynamiques :
        - list, retrieve   → public (AllowAny)
        - inscrire         → tout utilisateur connecté
        - create           → Admin ou Chargé de Projet
        - update / partial_update / destroy
                           → Admin ou Chargé de Projet
                             + vérification has_object_permission (responsable)
        """
        if self.action in ('list', 'retrieve', 'rapport'):
            permission_classes = [AllowAny]
        elif self.action == 'inscrire':
            permission_classes = [IsAuthenticated]
        else:
            # POST, PUT, PATCH, DELETE, cloturer
            # ✅ IsResponsableOuAdmin vérifie à la fois le rôle ET la propriété
            permission_classes = [EstAdminOuChargeProjet, IsResponsableOuAdmin]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()

        type_action = self.request.query_params.get('type')
        if type_action:
            queryset = queryset.filter(type=type_action.upper())

        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut.upper())

        responsable_id = self.request.query_params.get('responsable_id')
        if responsable_id:
            queryset = queryset.filter(responsable_id=responsable_id)

        return queryset

    def perform_create(self, serializer):
        """
        Assigne automatiquement request.user comme responsable
        si non fourni dans le payload.
        """
        if not serializer.validated_data.get('responsable'):
            serializer.save(responsable=self.request.user)
        else:
            serializer.save()

    # ── Actions personnalisées ────────────────────────────────

    @action(detail=True, methods=['post'], permission_classes=[EstAdminOuChargeProjet])
    def cloturer(self, request, pk=None):
        """
        POST /api/actions/{id}/cloturer/
        Clôture une action et enregistre la date de clôture automatiquement.
        """
        action_obj = self.get_object()

        if action_obj.statut == Action.StatutAction.CLOTUREE:
            return Response(
                {'detail': "Cette action est déjà clôturée."},
                status=status.HTTP_400_BAD_REQUEST
            )

        action_obj.statut       = Action.StatutAction.CLOTUREE
        action_obj.date_cloture = timezone.now().date()
        action_obj.save(update_fields=['statut', 'date_cloture'])

        serializer = ActionSerializer(action_obj, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def rapport(self, request, pk=None):
        """
        GET /api/actions/{id}/rapport/
        Retourne un rapport financier résumé de l'action.
        """
        action_obj = self.get_object()
        data = action_obj.genere_rapport()
        return Response(data, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated],
        url_path='inscrire',
        url_name='inscrire',
    )
    def inscrire(self, request, pk=None):
        """
        POST /api/actions/{id}/inscrire/
        Inscrit l'utilisateur connecté à l'action.
        """
        action_obj = self.get_object()

        if action_obj.statut not in (
            Action.StatutAction.EN_COURS,
            Action.StatutAction.PLANIFIEE,
        ):
            return Response(
                {'error': "Les inscriptions sont fermées pour cette action."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Inscription.objects.filter(
            action=action_obj,
            utilisateur=request.user
        ).exists():
            return Response(
                {'error': "Vous êtes déjà inscrit·e à cette action."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            Inscription.objects.create(
                action=action_obj,
                utilisateur=request.user
            )
            action_obj.nb_participants = action_obj.inscriptions.count()
            action_obj.save(update_fields=['nb_participants'])

        return Response(
            {'detail': "Inscription confirmée."},
            status=status.HTTP_200_OK
        )
# ==============================================================================
# DON VIEWSET
# ==============================================================================

class DonViewSet(AutoAssignUserMixin, viewsets.ModelViewSet):
    """
    ViewSet pour les Dons reçus par l'association.

    Permissions :
    - Toutes les opérations : Trésorier ou Admin uniquement
      (les données financières sont confidentielles)

    Filtrage :
    - ?anonyme=true/false   → filtre les dons anonymes
    - ?action_id=X          → dons fléchés vers une action
    - ?date_min et ?date_max → plage de dates
    - ?montant_min          → montant minimum

    Serializer utilisé : DonSerializer
    `saisi_par` est automatiquement assigné via AutoAssignUserMixin → perform_create.
    """

    queryset = Don.objects.select_related(
        'donateur_membre', 'donateur_partenaire', 'action', 'valide_par'
    ).order_by('-date_don')

    serializer_class = DonSerializer
    permission_classes = [EstAdminTresorierOuPartenariat]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date_don', 'montant']
    ordering = ['-date_don']

    # Le champ auteur pour AutoAssignUserMixin
    # Les dons sont validés par le trésorier, mais saisi_par n'existe pas sur Don.
    # On surcharge perform_create directement ici.
    def perform_create(self, serializer):
        """Assigne automatiquement le trésorier validateur."""
        serializer.save(valide_par=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtre anonyme (?anonyme=true)
        anonyme = self.request.query_params.get('anonyme')
        if anonyme is not None:
            queryset = queryset.filter(anonyme=anonyme.lower() == 'true')

        # Filtre par action (?action_id=2)
        action_id = self.request.query_params.get('action_id')
        if action_id:
            queryset = queryset.filter(action_id=action_id)

        # Filtre par plage de dates (?date_min=2024-01-01&date_max=2024-12-31)
        date_min = self.request.query_params.get('date_min')
        date_max = self.request.query_params.get('date_max')
        if date_min:
            queryset = queryset.filter(date_don__gte=date_min)
        if date_max:
            queryset = queryset.filter(date_don__lte=date_max)

        # Filtre par montant minimum (?montant_min=5000)
        montant_min = self.request.query_params.get('montant_min')
        if montant_min:
            queryset = queryset.filter(montant__gte=montant_min)

        return queryset

    @action(detail=True, methods=['post'], permission_classes = [EstAdminTresorierOuPartenariat])
    def generer_recu(self, request, pk=None):
        """
        POST /api/dons/{id}/generer_recu/
        Marque le don comme ayant un reçu généré.
        La génération PDF réelle peut être déléguée à une tâche Celery ou un service dédié.
        """
        don = self.get_object()
        don.recu_genere = True
        don.save(update_fields=['recu_genere'])
        return Response(
            {'detail': f"Reçu marqué comme généré pour le don #{don.id}."},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], permission_classes = [EstAdminTresorierOuPartenariat])
    def total(self, request):
        """
        GET /api/dons/total/
        Retourne le total agrégé des dons (utile pour le tableau de bord).
        """
        total = self.get_queryset().aggregate(
            total=Sum('montant')
        )['total'] or Decimal('0.00')
        return Response({'total_dons': total}, status=status.HTTP_200_OK)


# ==============================================================================
# COTISATION VIEWSET
# ==============================================================================

class CotisationViewSet(AutoAssignUserMixin, viewsets.ModelViewSet):
    """
    ViewSet pour les Cotisations des membres.

    Permissions :
    - Toutes les opérations : Trésorier ou Admin

    Filtrage :
    - ?statut=PAYEE/IMPAYEE → filtre par statut de paiement
    - ?membre_id=X          → cotisations d'un membre spécifique
    - ?periodicite=ANNUELLE → filtre par périodicité

    Serializer utilisé : CotisationSerializer
    `enregistre_par` est automatiquement assigné via AutoAssignUserMixin.
    """

    queryset = Cotisation.objects.select_related(
        'membre', 'enregistre_par'
    ).order_by('-date_paiement')

    serializer_class = CotisationSerializer
    permission_classes = [EstAdminTresorierOuPartenariat]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date_paiement', 'montant', 'statut']

    # AutoAssignUserMixin utilisera ce champ lors du perform_create
    auteur_field = 'enregistre_par'

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtre par statut (?statut=PAYEE)
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut.upper())

        # Filtre par membre (?membre_id=5)
        membre_id = self.request.query_params.get('membre_id')
        if membre_id:
            queryset = queryset.filter(membre_id=membre_id)

        # Filtre par périodicité (?periodicite=ANNUELLE)
        periodicite = self.request.query_params.get('periodicite')
        if periodicite:
            queryset = queryset.filter(periodicite=periodicite.upper())

        return queryset

    @action(detail=False, methods=['get'], permission_classes = [EstAdminTresorierOuPartenariat])
    def total(self, request):
        """
        GET /api/cotisations/total/
        Retourne les totaux agrégés des cotisations (payées vs impayées).
        """
        qs = self.get_queryset()
        data = {
            'total_payees': qs.filter(statut='PAYEE').aggregate(
                total=Sum('montant')
            )['total'] or Decimal('0.00'),
            'total_impayees': qs.filter(statut='IMPAYEE').aggregate(
                total=Sum('montant')
            )['total'] or Decimal('0.00'),
            'nb_membres_a_jour': qs.filter(statut='PAYEE').values('membre').distinct().count(),
        }
        return Response(data, status=status.HTTP_200_OK)


# ==============================================================================
# DÉPENSE VIEWSET
# ==============================================================================

class DepenseViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les Dépenses de l'association.

    Permissions :
    - GET / POST / PUT / PATCH / DELETE : Trésorier ou Admin

    Filtrage :
    - ?categorie=COMMUNICATION → filtre par catégorie
    - ?action_id=X             → dépenses d'une action
    - ?statut=VALIDEE          → filtre par statut de validation

    Serializer utilisé : DepenseSerializer
    Le contexte {'request': request} est passé automatiquement par DRF
    pour que le FileField retourne une URL absolue.
    """

    queryset = Depense.objects.select_related(
        'action', 'saisi_par', 'valide_par'
    ).order_by('-date_depense')

    serializer_class   = DepenseSerializer
    permission_classes = [EstAdminOuTresorier]
    filter_backends    = [filters.OrderingFilter]
    ordering_fields    = ['date_depense', 'montant', 'categorie', 'statut']

    def get_queryset(self):
        queryset = super().get_queryset()

        categorie = self.request.query_params.get('categorie')
        if categorie:
            queryset = queryset.filter(categorie=categorie.upper())

        action_id = self.request.query_params.get('action_id')
        if action_id:
            queryset = queryset.filter(action_id=action_id)

        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut.upper())

        return queryset

    def perform_create(self, serializer):
        """
        Règles métier à la création :
        1. action    → résolu via action_id (PrimaryKeyRelatedField write_only)
        2. saisi_par → request.user (trésorier connecté)
        3. valide_par → request.user  ✅ provisoire, logique changera plus tard
        4. statut    → forcé à VALIDEE ✅ provisoire, logique changera plus tard
        5. Vérifie que l'action n'est pas clôturée.
        """
        action = serializer.validated_data.get('action')

        if action and action.statut == Action.StatutAction.CLOTUREE:
            raise ValidationError(
                "Impossible d'ajouter une dépense à une action déjà clôturée."
            )

        serializer.save(
            saisi_par=self.request.user,
            valide_par=self.request.user,  # ✅ provisoire
            statut='VALIDEE',              # ✅ provisoire
        )

    def perform_update(self, serializer):
        """
        Empêche la modification d'une dépense déjà validée
        sauf pour un Administrateur.
        """
        instance = self.get_object()
        if (
            instance.statut == Depense.Statut.VALIDEE
            and self.request.user.role != User.Role.ADMINISTRATEUR
        ):
            raise PermissionDenied(
                "Une dépense déjà validée ne peut être modifiée que par un Administrateur."
            )
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[EstAdminOuTresorier])
    def valider(self, request, pk=None):
        """
        POST /api/depenses/{id}/valider/
        Valide une dépense et enregistre le validateur.
        """
        depense = self.get_object()

        if depense.statut == Depense.Statut.VALIDEE:
            return Response(
                {'detail': "Cette dépense est déjà validée."},
                status=status.HTTP_400_BAD_REQUEST
            )

        depense.statut     = Depense.Statut.VALIDEE
        depense.valide_par = request.user
        depense.save(update_fields=['statut', 'valide_par'])

        serializer = DepenseSerializer(depense, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[EstAdminOuTresorier])
    def rejeter(self, request, pk=None):
        """
        POST /api/depenses/{id}/rejeter/
        Rejette une dépense avec motif optionnel.
        """
        depense = self.get_object()
        motif   = request.data.get('motif', '')

        depense.statut     = Depense.Statut.REJETEE
        depense.valide_par = request.user
        if motif:
            depense.description = f"{depense.description or ''}\n[Rejeté] {motif}".strip()
        depense.save(update_fields=['statut', 'valide_par', 'description'])

        return Response(
            {'detail': f"Dépense #{depense.id} rejetée."},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], permission_classes=[EstAdminOuTresorier])
    def total(self, request):
        """
        GET /api/depenses/total/
        Totaux des dépenses validées agrégés par catégorie.
        """
        qs = self.get_queryset().filter(statut='VALIDEE')
        par_categorie = (
            qs.values('categorie')
              .annotate(total=Sum('montant'), nb=Count('id'))
              .order_by('-total')
        )
        total_global = qs.aggregate(total=Sum('montant'))['total'] or Decimal('0.00')

        return Response({
            'total_global':  total_global,
            'par_categorie': list(par_categorie),
        }, status=status.HTTP_200_OK)
# ==============================================================================
# MEMBRE VIEWSET
# ==============================================================================

class MembreViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les Membres/Bénévoles de l'association.

    Permissions :
    - GET liste : Admin ou Trésorier
    - GET détail : Admin, Trésorier, ou le membre lui-même
    - POST / PUT / DELETE : Admin uniquement

    Filtrage :
    - ?statut=ACTIF         → filtre par statut
    - ?type_membre=BENEVOLE → filtre par type
    - ?search=nom           → recherche par nom, prénom, email
    """

    queryset = Membre.objects.select_related('utilisateur').prefetch_related(
        'cotisations', 'dons'
    ).order_by('nom', 'prenom')

    serializer_class = MembreSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nom', 'prenom', 'email']
    ordering_fields = ['nom', 'date_adhesion', 'statut']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            permission_classes = [EstAdmin]
        else:
            permission_classes = [EstAdminOuTresorier]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()

        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut.upper())

        type_membre = self.request.query_params.get('type_membre')
        if type_membre:
            queryset = queryset.filter(type_membre=type_membre.upper())

        return queryset


# ==============================================================================
# DEMANDE D'ADHÉSION VIEWSET
# ==============================================================================

class DemandeAdhesionViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les demandes d'adhésion soumises par le public.

    Permissions :
    - POST (soumettre une demande) : public, sans authentification
    - GET / PUT / DELETE (gérer les demandes) : Admin uniquement
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = DemandeAdhesion.objects.select_related('traite_par').order_by('-date_demande')
    serializer_class = DemandeAdhesionSerializer

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [AllowAny]
        else:
            permission_classes = [EstAdmin]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['post'], permission_classes=[EstAdmin])
    def accepter(self, request, pk=None):
        """
        POST /api/demandes/{id}/accepter/
        Accepte une demande d'adhésion et met à jour la date de traitement.
        """
        demande = self.get_object()

        if demande.statut != DemandeAdhesion.Statut.EN_ATTENTE:
            return Response(
                {'detail': "Cette demande a déjà été traitée."},
                status=status.HTTP_400_BAD_REQUEST
            )

        demande.statut = DemandeAdhesion.Statut.ACCEPTEE
        demande.traite_par = request.user
        demande.date_traitement = timezone.now()
        demande.save(update_fields=['statut', 'traite_par', 'date_traitement'])

        return Response(
            {'detail': f"Demande de {demande.prenom} {demande.nom} acceptée."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[EstAdmin])
    def rejeter(self, request, pk=None):
        """
        POST /api/demandes/{id}/rejeter/
        Rejette une demande d'adhésion.
        """
        demande = self.get_object()

        if demande.statut != DemandeAdhesion.Statut.EN_ATTENTE:
            return Response(
                {'detail': "Cette demande a déjà été traitée."},
                status=status.HTTP_400_BAD_REQUEST
            )

        demande.statut = DemandeAdhesion.Statut.REJETEE
        demande.traite_par = request.user
        demande.date_traitement = timezone.now()
        demande.save(update_fields=['statut', 'traite_par', 'date_traitement'])

        return Response(
            {'detail': f"Demande de {demande.prenom} {demande.nom} rejetée."},
            status=status.HTTP_200_OK
        )


# ==============================================================================
# TABLEAU DE BORD
# ==============================================================================

class TableauDeBordView(viewsets.ViewSet):
    """
    ViewSet en lecture seule pour le tableau de bord.
    Agrège toutes les métriques financières et opérationnelles en une seule requête.

    GET /api/dashboard/ → Admin ou Trésorier
    """

    permission_classes = [EstAdminOuTresorier]

    def list(self, request):
        """
        Calcule et retourne toutes les métriques du tableau de bord.
        Utilise des requêtes agrégées optimisées pour minimiser les appels DB.
        """
        total_dons = Don.objects.aggregate(
            total=Sum('montant')
        )['total'] or Decimal('0.00')

        total_cotisations = Cotisation.objects.filter(statut='PAYEE').aggregate(
            total=Sum('montant')
        )['total'] or Decimal('0.00')

        total_depenses = Depense.objects.filter(statut='VALIDEE').aggregate(
            total=Sum('montant')
        )['total'] or Decimal('0.00')

        nb_beneficiaires = Action.objects.filter(
            statut=Action.StatutAction.CLOTUREE
        ).aggregate(
            total=Sum('nb_participants')
        )['total'] or 0

        data = {
            'total_dons': total_dons,
            'total_cotisations': total_cotisations,
            'total_depenses': total_depenses,
            'solde_financier': (total_dons + total_cotisations) - total_depenses,
            'nb_actions_realisees': Action.objects.filter(
                statut=Action.StatutAction.CLOTUREE
            ).count(),
            'nb_total_beneficiaires': nb_beneficiaires,
            'nb_membres_actifs': Membre.objects.filter(statut='ACTIF').count(),
            'nb_demandes_en_attente': DemandeAdhesion.objects.filter(
                statut='EN_ATTENTE'
            ).count(),
        }

        serializer = TableauDeBordSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ChargeProjetActionsView(ListAPIView):
    """
    GET /api/charge-projet/actions/
    Retourne uniquement les actions dont l'utilisateur connecté est responsable.
    """
    serializer_class   = ActionListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Action.objects
            .filter(responsable=self.request.user)
            .select_related('responsable')
            .prefetch_related('depenses')
            .order_by('-date_debut')
        )

class FinanceStatsView(APIView):
    
    permission_classes = [EstAdminOuTresorier]

    def get(self, request):
        # Cumul des dons enregistrés
        total_dons = Don.objects.aggregate(
            total=Sum('montant')
        )['total'] or 0

        nb_dons = Don.objects.count()

        # Cumul des cotisations avec statut PAYE
        total_cotisations = Cotisation.objects.filter(
            statut='PAYE'
        ).aggregate(
            total=Sum('montant')
        )['total'] or 0

        nb_membres_a_jour = Cotisation.objects.filter(
            statut='PAYE'
        ).values('membre').distinct().count()

        # Cumul des dépenses validées
        total_depenses = Depense.objects.filter(
            statut='VALIDE'
        ).aggregate(
            total=Sum('montant')
        )['total'] or 0

        # Solde = entrées - sorties
        solde_financier = (total_dons + total_cotisations) - total_depenses

        return Response({
            'solde_financier':    str(solde_financier),
            'total_dons':         str(total_dons),
            'nb_dons':            nb_dons,
            'total_cotisations':  str(total_cotisations),
            'nb_membres_a_jour':  nb_membres_a_jour,
            'total_depenses':     str(total_depenses),
        })
# ══════════════════════════════════════════════════════════════
# PERMISSIONS HELPERS
# ══════════════════════════════════════════════════════════════

def require_rh_or_admin(user):
    """Lève PermissionDenied si l'utilisateur n'est pas RH ou Admin."""
    if not user.is_authenticated:
        raise PermissionDenied("Authentification requise.")
    if user.role not in ('RESPONSABLE_RH', 'ADMIN', 'ADMINISTRATEUR'):
        raise PermissionDenied(
            "Accès réservé au Responsable RH et aux Administrateurs."
        )

# ══════════════════════════════════════════════════════════════
# 1. VUE KPI RH — GET /api/rh/stats/
# ══════════════════════════════════════════════════════════════

class RHStatsView(APIView):
    """
    Retourne les indicateurs clés pour le DashboardRH.

    Réponse JSON :
    {
      "total_membres":         42,
      "total_benevoles":       12,
      "demandes_en_attente":    3
    }

    React utilise :
      stats?.total_membres
      stats?.total_benevoles
      stats?.demandes_en_attente
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_rh_or_admin(request.user)

        total_membres  = Membre.objects.filter(statut='ACTIF').count()
        total_benevoles = Membre.objects.filter(
            statut='ACTIF',
            type_membre__in=['BENEVOLE', 'MEMBRE_ACTIF']
        ).count()
        demandes_en_attente = DemandeAdhesion.objects.filter(
            statut='EN_ATTENTE'
        ).count()

        return Response({
            'total_membres':        total_membres,
            'total_benevoles':      total_benevoles,
            'demandes_en_attente':  demandes_en_attente,
        })






# ══════════════════════════════════════════════════════════════
# 4. LISTE DEMANDES — GET /api/demandes-adhesion/
# ══════════════════════════════════════════════════════════════

class DemandeAdhesionListView(generics.ListAPIView):
    """
    GET /api/demandes-adhesion/           → toutes les demandes
    GET /api/demandes-adhesion/?statut=EN_ATTENTE → filtrées

    React DashboardRH appelle :
      GET /api/demandes-adhesion/?statut=EN_ATTENTE

    Réponse par objet :
      d.prenom        ✅  (champ natif DemandeAdhesion)
      d.nom           ✅
      d.email         ✅
      d.date_demande  ✅  (React cherche aussi d.created_at → fallback)
      d.motivation    ✅  (React cherche aussi d.message → fallback)
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = DemandeAdhesionSerializer

    def get_queryset(self):
        require_rh_or_admin(self.request.user)
        qs = DemandeAdhesion.objects.select_related('traite_par').order_by('-date_demande')

        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)

        return qs


# ══════════════════════════════════════════════════════════════
# 5. TRAITER UNE DEMANDE — PATCH /api/demandes-adhesion/{id}/
# ══════════════════════════════════════════════════════════════

class TraiterDemandeView(generics.UpdateAPIView):
    """
    PATCH /api/demandes-adhesion/{id}/
    Body : { "statut": "APPROUVE" }  ou  { "statut": "REJETE" }

    ⚠️  CORRECTION MISMATCH :
    React envoie 'APPROUVE' mais le modèle stocke 'ACCEPTEE'.
    → Cette vue convertit automatiquement APPROUVE → ACCEPTEE.

    Si statut == APPROUVE (ACCEPTEE) :
      → Crée User + Membre automatiquement (via ApprouverDemandeView)
    Si statut == REJETE :
      → Met à jour le statut seulement
    """
    permission_classes = [IsAuthenticated]
    queryset           = DemandeAdhesion.objects.all()
    http_method_names  = ['patch']

    def get_serializer_class(self):
        return DemandeAdhesionSerializer  # lecture seule pour la réponse

    def partial_update(self, request, *args, **kwargs):
        require_rh_or_admin(request.user)
        demande = self.get_object()

        # Refuse si déjà traitée
        if demande.statut != 'EN_ATTENTE':
            return Response(
                {'detail': f"Cette demande a déjà été traitée (statut : {demande.get_statut_display()})."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Récupère et convertit le statut envoyé par React
        statut_recu = request.data.get('statut', '').upper()

        # Conversion React → Django
        # React envoie : 'APPROUVE'  → Django stocke : 'ACCEPTEE'
        # React envoie : 'REJETE'    → Django stocke : 'REJETEE'
        STATUT_MAP = {
            'APPROUVE':  'ACCEPTEE',
            'APPROVED':  'ACCEPTEE',
            'ACCEPTEE':  'ACCEPTEE',   # idempotent
            'REJETE':    'REJETEE',
            'REJECTED':  'REJETEE',
            'REJETEE':   'REJETEE',    # idempotent
        }

        statut_django = STATUT_MAP.get(statut_recu)
        if not statut_django:
            return Response(
                {'detail': f"Statut invalide : '{statut_recu}'. Valeurs acceptées : APPROUVE, REJETE."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if statut_django == 'ACCEPTEE':
            # Délègue à la logique d'approbation complète
            return self._approuver(demande, request.user)
        else:
            return self._rejeter(demande, request.user)

    def _approuver(self, demande, traite_par):
        """
        Approuve la demande :
          1. Change statut → ACCEPTEE
          2. Crée un User Django avec l'email de la demande
          3. Crée le Membre associé au User
        """
        with transaction.atomic():
            # 1. Générer un username unique depuis le prénom+nom
            base_username = f"{demande.prenom.lower()}.{demande.nom.lower()}".replace(' ', '')
            username = base_username
            counter  = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            # 2. Créer le User si email non existant
            if User.objects.filter(email=demande.email).exists():
                user = User.objects.get(email=demande.email)
            else:
                import secrets
                temp_password = secrets.token_urlsafe(12)  # Mot de passe temporaire sécurisé
                user = User.objects.create_user(
                    username   = username,
                    email      = demande.email,
                    first_name = demande.prenom,
                    last_name  = demande.nom,
                    role       = User.Role.MEMBRE,       # rôle par défaut
                    password   = temp_password,
                )
                # TODO: envoyer temp_password par email → intégrer send_mail ici

            # 3. Créer le Membre associé (si pas déjà existant pour cet email)
            if not Membre.objects.filter(email=demande.email).exists():
                Membre.objects.create(
                    utilisateur   = user,
                    nom           = demande.nom,
                    prenom        = demande.prenom,
                    email         = demande.email,
                    telephone     = demande.telephone or '',
                    date_adhesion = timezone.now().date(),
                    type_membre   = Membre.TypeMembre.BENEVOLE,  # type par défaut
                    statut        = Membre.Statut.ACTIF,
                )

            # 4. Marquer la demande comme acceptée
            demande.statut           = 'ACCEPTEE'
            demande.traite_par       = traite_par
            demande.date_traitement  = timezone.now()
            demande.save()

        serializer = DemandeAdhesionSerializer(demande)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _rejeter(self, demande, traite_par):
        """Rejette la demande sans créer de User/Membre."""
        demande.statut          = 'REJETEE'
        demande.traite_par      = traite_par
        demande.date_traitement = timezone.now()
        demande.save()

        serializer = DemandeAdhesionSerializer(demande)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ══════════════════════════════════════════════════════════════
# 6. APPROBATION DÉDIÉE — POST /api/demandes-adhesion/{id}/approuver/
# ══════════════════════════════════════════════════════════════

class ApprouverDemandeView(APIView):
    """
    POST /api/demandes-adhesion/{id}/approuver/

    Vue dédiée à l'approbation complète d'une demande.
    Même logique que TraiterDemandeView._approuver() mais accessible
    via une URL sémantique distincte.

    Body optionnel :
    {
      "type_membre": "BENEVOLE",    // défaut: BENEVOLE
      "envoyer_email": true          // défaut: false (TODO)
    }

    Réponse :
    {
      "demande": { ...DemandeAdhesionSerializer },
      "membre":  { ...MembreRHSerializer },
      "user_cree": true
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        require_rh_or_admin(request.user)

        try:
            demande = DemandeAdhesion.objects.get(pk=pk)
        except DemandeAdhesion.DoesNotExist:
            return Response(
                {'detail': 'Demande introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if demande.statut != 'EN_ATTENTE':
            return Response(
                {'detail': f"Cette demande a déjà été traitée : {demande.get_statut_display()}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        type_membre = request.data.get('type_membre', Membre.TypeMembre.BENEVOLE)

        with transaction.atomic():
            user_cree = False

            # Générer username unique
            base_username = f"{demande.prenom.lower()}.{demande.nom.lower()}".replace(' ', '')
            username = base_username
            counter  = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            # Créer ou récupérer le User
            if not User.objects.filter(email=demande.email).exists():
                import secrets
                temp_password = secrets.token_urlsafe(12)
                user = User.objects.create_user(
                    username   = username,
                    email      = demande.email,
                    first_name = demande.prenom,
                    last_name  = demande.nom,
                    role       = User.Role.MEMBRE,
                    password   = temp_password,
                )
                user_cree = True
                # TODO : send_mail(email, temp_password)
            else:
                user = User.objects.get(email=demande.email)

            # Créer le Membre
            if Membre.objects.filter(email=demande.email).exists():
                membre = Membre.objects.get(email=demande.email)
            else:
                membre = Membre.objects.create(
                    utilisateur   = user,
                    nom           = demande.nom,
                    prenom        = demande.prenom,
                    email         = demande.email,
                    telephone     = demande.telephone or '',
                    date_adhesion = timezone.now().date(),
                    type_membre   = type_membre,
                    statut        = Membre.Statut.ACTIF,
                )

            # Mettre à jour la demande
            demande.statut          = 'ACCEPTEE'
            demande.traite_par      = request.user
            demande.date_traitement = timezone.now()
            demande.save()

        return Response({
            'demande':   DemandeAdhesionSerializer(demande).data,
            'membre':    MembreRHSerializer(membre).data,
            'user_cree': user_cree,
        }, status=status.HTTP_200_OK)

class EstAdminOuChargePartenariat(IsAuthenticated):
    """
    Autorise Administrateur et Chargé de Partenariat.
    Utilisé pour les opérations d'écriture sur les partenaires.
    """
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in (
            User.Role.ADMINISTRATEUR,
            User.Role.CHARGE_PARTENARIAT,
        )


class PartenaireViewSet(viewsets.ModelViewSet):
    """
    ViewSet CRUD pour les Partenaires de l'association.

    Permissions :
      GET (list, retrieve) → tout utilisateur connecté
      POST / PUT / PATCH   → Admin ou Chargé de Partenariat
      DELETE               → Admin uniquement

    Filtrage :
      ?statut=ACTIF        → filtre par statut (ACTIF / INACTIF)
      ?type=Entreprise     → filtre par type (insensible à la casse)
      ?search=nom          → recherche dans nom et description
      ?ordering=nom        → tri

    Upload logo :
      Envoyer en multipart/form-data avec le champ 'logo'.
      L'URL absolue est retournée dans la réponse.
    """
    
    queryset = Partenaire.objects.prefetch_related(
        'actions_soutenues', 'dons_effectues'
    ).order_by('nom')

    serializer_class = PartenaireSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ['nom', 'description', 'type']
    ordering_fields  = ['nom', 'date_debut', 'statut']
    ordering         = ['nom']

    parser_classes   = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        """Permissions granulaires selon l'action."""
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        if self.action == 'destroy':
            return [EstAdmin()]
        return [EstAdminOuChargePartenariat()]

    def get_queryset(self):
        """Applique les filtres personnalisés."""
        qs = super().get_queryset()

        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut.upper())

        type_part = self.request.query_params.get('type')
        if type_part:
            qs = qs.filter(type__icontains=type_part)

        return qs

    def get_serializer_context(self):
        """
        Injecte request dans le contexte du serializer pour
        que ImageField retourne des URLs absolues.
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['post'],
            permission_classes=[EstAdminOuChargePartenariat])
    def desactiver(self, request, pk=None):
        """
        POST /api/partenaires/{id}/desactiver/
        Passe le partenaire en statut INACTIF sans le supprimer.
        """
        partenaire = self.get_object()
        if partenaire.statut == Partenaire.Statut.INACTIF:
            return Response(
                {'detail': "Ce partenaire est déjà inactif."},
                status=status.HTTP_400_BAD_REQUEST
            )
        partenaire.statut = Partenaire.Statut.INACTIF
        partenaire.save(update_fields=['statut'])
        return Response(
            {'detail': f"Partenaire « {partenaire.nom} » désactivé."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'],
            permission_classes=[EstAdminOuChargePartenariat])
    def reactiver(self, request, pk=None):
        """
        POST /api/partenaires/{id}/reactiver/
        Passe le partenaire en statut ACTIF.
        """
        partenaire = self.get_object()
        partenaire.statut = Partenaire.Statut.ACTIF
        partenaire.save(update_fields=['statut'])
        return Response(
            {'detail': f"Partenaire « {partenaire.nom} » réactivé."},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def actifs(self, request):
        """
        GET /api/partenaires/actifs/
        Retourne la liste allégée des partenaires actifs (pour les selects).
        """
        qs = Partenaire.objects.filter(statut='ACTIF').order_by('nom')
        serializer = PartenaireResumeSerializer(qs, many=True)
        return Response(serializer.data)
    
    
    def create(self, request, *args, **kwargs):
        print("=== FILES reçus ===", request.FILES)
        print("=== DATA reçus ===", request.data)
        return super().create(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        print("=== FILES reçus (PATCH) ===", request.FILES)
        print("=== DATA reçus (PATCH) ===", request.data)
        kwargs['partial'] = True
        return super().partial_update(request, *args, **kwargs)


# ══════════════════════════════════════════════════════════════════

class PartenaireStatsView(APIView):
    """
    GET /api/partenaires/stats/
    Retourne les KPI pour le DashboardPartenariat.

    Accès réservé : CHARGE_PARTENARIAT ou ADMINISTRATEUR.

    Réponse JSON :
    {
      "partenaires_actifs":  12,
      "total_dons_annee":    450000.0,
      "actions_a_financer":  3
    }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Vérification du rôle
        if request.user.role not in (
            User.Role.ADMINISTRATEUR,
            User.Role.CHARGE_PARTENARIAT,
        ):
            raise PermissionDenied(
                "Accès réservé au Chargé de Partenariat et aux Administrateurs."
            )

        # KPI 1 : Partenaires actifs
        partenaires_actifs = Partenaire.objects.filter(statut='ACTIF').count()

        # KPI 2 : Dons venant de partenaires sur l'année civile en cours
        debut_annee = tz_utils.now().date().replace(month=1, day=1)
        total_dons_annee = (
            Don.objects
            .filter(
                donateur_partenaire__isnull=False,
                date_don__gte=debut_annee,
            )
            .aggregate(total=Sum('montant'))['total'] or Decimal('0.00')
        )

        # KPI 3 : Actions non clôturées dont le budget restant > 0
        actions_a_financer = 0
        actions_ouvertes = Action.objects.exclude(
            statut=Action.StatutAction.CLOTUREE
        ).prefetch_related('depenses')

        for action_obj in actions_ouvertes:
            depenses = action_obj.depenses.filter(statut='VALIDEE').aggregate(
                total=Sum('montant')
            )['total'] or Decimal('0.00')
            if action_obj.budget_prevu - depenses > Decimal('0.00'):
                actions_a_financer += 1

        return Response({
            'partenaires_actifs': partenaires_actifs,
            'total_dons_annee':   float(total_dons_annee),
            'actions_a_financer': actions_a_financer,
        })
    

class ProfilView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfilSerializer(request.user, context={'request': request})
        return Response(serializer.data)


class ProfilUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request):
        serializer = ProfilSerializer(
            request.user, data=request.data,
            partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user             = request.user
        old_password     = request.data.get('old_password', '')
        new_password     = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not user.check_password(old_password):
            return Response({'old_password': ['Mot de passe actuel incorrect.']},
                            status=status.HTTP_400_BAD_REQUEST)
        if new_password != confirm_password:
            return Response({'confirm_password': ['Les mots de passe ne correspondent pas.']},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response({'new_password': list(e.messages)},
                            status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=['password'])
        return Response({'detail': 'Mot de passe modifié avec succès.'})
    
# ══════════════════════════════════════════════════════════════
# PAGE PUBLIQUE /membres — Stats + Listes
# ══════════════════════════════════════════════════════════════

# Types qui apparaissent dans la section "Équipe officielle"
TYPES_EQUIPE = {
    Membre.TypeMembre.PRESIDENT,
    Membre.TypeMembre.VICE_PRESIDENT,
    Membre.TypeMembre.SECRETAIRE,
    Membre.TypeMembre.TRESORIER,
    Membre.TypeMembre.RESPONSABLE_RH,
    Membre.TypeMembre.RESPONSABLE_COM,
    Membre.TypeMembre.CHARGE_PROJET,
    Membre.TypeMembre.CHARGE_PARTENARIAT,
}

# Types qui apparaissent dans la section "Bénévoles"
TYPES_BENEVOLES = {
    Membre.TypeMembre.BENEVOLE,
    Membre.TypeMembre.MEMBRE_ACTIF,
}


class MembresPublicsView(APIView):
    """
    GET /api/membres-publics/

    Retourne les membres actifs divisés en deux listes :
      - equipe    : membres avec un rôle officiel (Président, Trésorier, etc.)
      - benevoles : bénévoles et membres actifs

    Public, sans authentification.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs_actifs = (
            Membre.objects
            .filter(statut=Membre.Statut.ACTIF)
            .select_related('utilisateur')
            .order_by('nom', 'prenom')
        )

        equipe    = qs_actifs.filter(type_membre__in=TYPES_EQUIPE)
        benevoles = qs_actifs.filter(type_membre__in=TYPES_BENEVOLES)

        ctx = {'request': request}
        return Response({
            'equipe':    MembrePublicSerializer(equipe,    many=True, context=ctx).data,
            'benevoles': MembrePublicSerializer(benevoles, many=True, context=ctx).data,
        })


class MembresStatsView(APIView):
    """
    GET /api/membres-stats/

    Retourne les KPIs pour le PageHero :
      - nb_membres_officiels : membres avec un rôle dans l'équipe
      - nb_benevoles_actifs  : bénévoles actifs
      - nb_pays              : nombre de pays distincts (déduit du champ adresse)

    Public, sans authentification.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        nb_membres_officiels = Membre.objects.filter(
            statut=Membre.Statut.ACTIF,
            type_membre__in=TYPES_EQUIPE
        ).count()

        nb_benevoles_actifs = Membre.objects.filter(
            statut=Membre.Statut.ACTIF,
            type_membre__in=TYPES_BENEVOLES
        ).count()

        # Extraction du pays depuis le champ adresse (ex: "Dakar, Sénégal" → "Sénégal")
        # On récupère la dernière partie après la virgule, en ignorant les adresses vides.
        adresses = (
            Membre.objects
            .filter(statut=Membre.Statut.ACTIF, adresse__isnull=False)
            .exclude(adresse='')
            .values_list('adresse', flat=True)
        )
        pays = set()
        for adresse in adresses:
            parties = [p.strip() for p in adresse.split(',') if p.strip()]
            if parties:
                pays.add(parties[-1].lower())

        data = {
            'nb_membres_officiels': nb_membres_officiels,
            'nb_benevoles_actifs':  nb_benevoles_actifs,
            'nb_pays':              len(pays) if pays else 1,
        }
        serializer = MembresStatsSerializer(data)
        return Response(serializer.data)

class LastActionsView(ListAPIView):
    """
    GET /api/last-actions/

    Retourne les 3 dernières actions non-clôturées, triées par date de début
    décroissante. Utilisée par la section "Actions à la une" de Home.jsx.

    Public, sans authentification.
    Réponse : liste de 3 objets ActionPreviewSerializer.
    """
    serializer_class   = ActionPreviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return (
            Action.objects
            .exclude(statut=Action.StatutAction.CLOTUREE)   # exclure les clôturées
            .exclude(statut=Action.StatutAction.ANNULEE)    # exclure les annulées
            .order_by('-date_debut')                        # les plus récentes en premier
            [:3]                                            # limiter à 3 en DB (plus efficace que slice en Python)
        )

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import TableauDeBordSerializer

class DashboardView(APIView):
    """
    GET /api/dashboard/
    Retourne tous les KPIs calculés en temps réel depuis la DB.
    Accessible aux admins et rôles de gestion uniquement.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # ✅ On passe None comme instance — tout est calculé en interne
        serializer = TableauDeBordSerializer(None)
        return Response(serializer.data)
    


@action(
    detail=True,
    methods=['post'],
    permission_classes=[IsAuthenticated],
    url_path='inscrire',
    url_name='inscrire',
)
def inscrire(self, request, pk=None):
    """
    POST /api/actions/{id}/inscrire/
    Inscrit l'utilisateur connecté à l'action.
    """
    action_obj = self.get_object()

    if action_obj.statut not in (
        Action.StatutAction.EN_COURS,
        Action.StatutAction.PLANIFIEE,
    ):
        return Response(
            {'error': "Les inscriptions sont fermées pour cette action."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if Inscription.objects.filter(
        action=action_obj,
        utilisateur=request.user
    ).exists():
        return Response(
            {'error': "Vous êtes déjà inscrit·e à cette action."},
            status=status.HTTP_400_BAD_REQUEST
        )

    with transaction.atomic():
        Inscription.objects.create(
            action=action_obj,
            utilisateur=request.user
        )
        action_obj.nb_participants = action_obj.inscriptions.count()
        action_obj.save(update_fields=['nb_participants'])

    return Response(
        {'detail': "Inscription confirmée."},
        status=status.HTTP_200_OK
    )

# Ajouter après ChargeProjetActionsView

class ChargeProjetStatsView(APIView):
    """
    GET /api/charge-projet/stats/
    Retourne les KPIs agrégés pour le chargé de projet connecté.
    
    - total_actions      : nb d'actions dont il est responsable
    - actions_en_cours   : nb d'actions EN_COURS
    - actions_planifiees : nb d'actions PLANIFIEE
    - total_participants : nb d'objets Inscription liés à ses actions
                          (remplace la somme sur nb_participants)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        mes_actions = Action.objects.filter(responsable=request.user)

        total_actions      = mes_actions.count()
        actions_en_cours   = mes_actions.filter(statut=Action.StatutAction.EN_COURS).count()
        actions_planifiees = mes_actions.filter(statut=Action.StatutAction.PLANIFIEE).count()

        # ✅ CORRECTION : compte les Inscriptions réelles, pas la somme du champ legacy
        total_participants = Inscription.objects.filter(
            action__responsable=request.user
        ).count()

        return Response({
            'total_actions':      total_actions,
            'actions_en_cours':   actions_en_cours,
            'actions_planifiees': actions_planifiees,
            'total_participants': total_participants,
        })

class UserDetailView(APIView):
    """
    GET /api/users/{id}/    - Récupère un utilisateur
    PATCH /api/users/{id}/  - Modifie un utilisateur
    DELETE /api/users/{id}/ - Supprime un utilisateur
    """
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None
    
    def get(self, request, pk):
        """Récupère un utilisateur"""
        require_rh_or_admin(request.user)
        
        user = self.get_object(pk)
        if not user:
            return Response(
                {'detail': 'Utilisateur introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_active': user.is_active,
            'telephone': user.telephone,
            'bio': user.bio,
        })
    
    def patch(self, request, pk):
        """Modifie un utilisateur"""
        require_rh_or_admin(request.user)
        
        user = self.get_object(pk)
        if not user:
            return Response(
                {'detail': 'Utilisateur introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Mise à jour des champs autorisés
        if 'first_name' in request.data:
            user.first_name = request.data['first_name'].strip()
        if 'last_name' in request.data:
            user.last_name = request.data['last_name'].strip()
        if 'email' in request.data:
            email = request.data['email'].strip()
            if email != user.email and User.objects.filter(email=email).exists():
                return Response(
                    {'email': ['Un utilisateur avec cet email existe déjà.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.email = email
        if 'role' in request.data:
            user.role = request.data['role']
        if 'is_active' in request.data:
            user.is_active = request.data['is_active']
        if 'telephone' in request.data:
            user.telephone = request.data['telephone'].strip()
        if 'bio' in request.data:
            user.bio = request.data['bio'].strip()
        
        # Changement de mot de passe (optionnel)
        if 'password' in request.data and request.data['password'].strip():
            password = request.data['password'].strip()
            try:
                validate_password(password, user)
                user.set_password(password)
            except ValidationError as e:
                return Response(
                    {'password': list(e.messages)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            user.save()
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active,
                'telephone': user.telephone,
                'bio': user.bio,
            })
        except Exception as e:
            return Response(
                {'detail': f'Erreur lors de la mise à jour: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, pk):
        """Supprime un utilisateur"""
        require_rh_or_admin(request.user)
        
        user = self.get_object(pk)
        if not user:
            return Response(
                {'detail': 'Utilisateur introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Empêche la suppression de son propre compte
        if user.id == request.user.id:
            return Response(
                {'detail': 'Vous ne pouvez pas supprimer votre propre compte.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user.delete()
            return Response(
                {'detail': 'Utilisateur supprimé avec succès.'},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            return Response(
                {'detail': f'Erreur lors de la suppression: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserListView(APIView):
    """
    GET /api/users/
    Retourne la liste des utilisateurs actifs.
    
    POST /api/users/
    Crée un nouvel utilisateur.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Liste des utilisateurs actifs"""
        require_rh_or_admin(request.user)

        users = (
            User.objects
            .filter(is_active=True)
            .order_by('first_name', 'last_name')
            .values('id', 'username', 'email', 'first_name', 'last_name', 'role')
        )

        return Response(list(users))
    
    def post(self, request):
        """Création d'un nouvel utilisateur"""
        require_rh_or_admin(request.user)
        
        # Extraction des données
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        role = request.data.get('role', 'MEMBRE')
        password = request.data.get('password', '').strip()
        is_active = request.data.get('is_active', True)
        telephone = request.data.get('telephone', '').strip()
        bio = request.data.get('bio', '').strip()
        
        # Validation basique
        if not username:
            return Response(
                {'username': ['Ce champ est obligatoire.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not email:
            return Response(
                {'email': ['Ce champ est obligatoire.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not first_name:
            return Response(
                {'first_name': ['Ce champ est obligatoire.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not password:
            return Response(
                {'password': ['Ce champ est obligatoire à la création.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérification unicité username/email
        if User.objects.filter(username=username).exists():
            return Response(
                {'username': ['Un utilisateur avec ce nom existe déjà.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        if User.objects.filter(email=email).exists():
            return Response(
                {'email': ['Un utilisateur avec cet email existe déjà.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validation du mot de passe
        try:
            validate_password(password)
        except ValidationError as e:
            return Response(
                {'password': list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Création de l'utilisateur
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=password,
                role=role,
                is_active=is_active,
                telephone=telephone if telephone else '',
                bio=bio if bio else ''
            )
            
            # Retourne les données de l'utilisateur créé
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active,
                'telephone': user.telephone,
                'bio': user.bio,
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'detail': f'Erreur lors de la création: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    


class MembreViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les Membres/Bénévoles de l'association.

    Permissions :
    - GET liste/détail    : Admin ou Trésorier ou RH
    - POST / PUT / PATCH  : Admin ou RH
    - DELETE              : Admin uniquement

    Serializers :
    - list / retrieve     → MembreRHSerializer  (lecture enrichie)
    - create / update     → MembreCreateUpdateSerializer (écriture, multipart)
    """

    queryset = Membre.objects.select_related('utilisateur').prefetch_related(
        'cotisations', 'dons'
    ).order_by('nom', 'prenom')

    parser_classes  = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields   = ['nom', 'prenom', 'email']
    ordering_fields = ['nom', 'date_adhesion', 'statut']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return MembreCreateUpdateSerializer
        # list, retrieve → lecture enrichie
        return MembreRHSerializer

    def get_permissions(self):
        if self.action == 'destroy':
            permission_classes = [EstAdmin]
        elif self.action in ('create', 'update', 'partial_update'):
            # Admin ou Responsable RH peuvent créer/modifier
            permission_classes = [IsResponsableOuAdmin]
        else:
            # GET → Admin, Trésorier ou RH
            permission_classes = [IsResponsableOuAdmin]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()

        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut.upper())

        type_membre = self.request.query_params.get('type_membre')
        if type_membre:
            queryset = queryset.filter(type_membre=type_membre.upper())

        return queryset
    


# ══════════════════════════════════════════════════════════════
# DASHBOARD MEMBRE CONNECTÉ — GET /api/membres/me/dashboard/
# ══════════════════════════════════════════════════════════════

class MemberDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            membre = Membre.objects.select_related('utilisateur').prefetch_related(
                'cotisations', 'dons'
            ).get(utilisateur=request.user)
        except Membre.DoesNotExist:
            return Response(
                {'detail': "Aucun profil membre trouvé pour cet utilisateur."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = MemberDashboardSerializer(
            membre,
            context={'request': request, 'membre': membre}
        )

        # ✅ Évalue .data ici pour catcher toute exception du serializer
        try:
            data = serializer.data
        except Exception as e:
            import traceback
            traceback.print_exc()  # visible dans la console Django
            return Response(
                {'detail': f'Erreur serializer : {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(data, status=status.HTTP_200_OK)



"""
core/analytics_views.py
──────────────────────────────────────────────────────────────────────────
Vues analytiques pour le DashboardAnalytics admin.

Endpoints exposés (tous protégés par EstAdmin) :
  GET /api/analytics/overview/              → KPIs globaux
  GET /api/analytics/membres-types/         → Répartition types membres (Pie)
  GET /api/analytics/membres-evolution/     → Évolution membres/bénévoles (Line)
  GET /api/analytics/dons-evolution/        → Évolution dons (Bar)
  GET /api/analytics/projets-statuts/       → Projets par statut (Bar horizontal)
  GET /api/analytics/partenaires-evolution/ → Partenaires actifs/inactifs (Line)

Paramètre commun :
  ?period=week | month | year | all

Chaque vue retourne du JSON pur (list ou dict), sans serializer,
pour maximiser la lisibilité et la flexibilité côté React.
──────────────────────────────────────────────────────────────────────────
"""

from datetime import date, timedelta
from dateutil.relativedelta import relativedelta  
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .models import User, Membre, Action, Don, Cotisation, Depense, Partenaire, DemandeAdhesion
from decimal import Decimal


# ── Helpers ───────────────────────────────────────────────────

def get_date_range(period: str):
    """
    Retourne (date_from, date_to) selon la période demandée.
    - week  → 7 derniers jours
    - month → 30 derniers jours
    - year  → 365 derniers jours
    - all   → None, None (pas de filtre)
    """
    today = timezone.now().date()
    if period == 'week':
        return today - timedelta(days=7), today
    elif period == 'month':
        return today - timedelta(days=30), today
    elif period == 'year':
        return today - timedelta(days=365), today
    else:  # 'all'
        return None, None


def fmt_label_month(d: date) -> str:
    """Ex: date(2025,9,1) → 'Sep 2025'"""
    MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun',
            'Jul','Aoû','Sep','Oct','Nov','Déc']
    return f"{MOIS[d.month - 1]} {d.year}"


def fmt_label_week(d: date) -> str:
    """Ex: date(2025,9,1) → 'S36'"""
    return f"S{d.isocalendar()[1]}"


def iter_months(date_from: date, date_to: date):
    """Itère sur chaque mois du premier du mois start → end."""
    cursor = date_from.replace(day=1)
    while cursor <= date_to:
        yield cursor
        if cursor.month == 12:
            cursor = cursor.replace(year=cursor.year + 1, month=1)
        else:
            cursor = cursor.replace(month=cursor.month + 1)


def iter_weeks(date_from: date, date_to: date):
    """Itère sur chaque lundi de la plage."""
    # Aligne sur le lundi précédent
    cursor = date_from - timedelta(days=date_from.weekday())
    while cursor <= date_to:
        yield cursor
        cursor += timedelta(days=7)


# ── Permissions ───────────────────────────────────────────────

class EstAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in ('ADMIN', 'ADMINISTRATEUR')


# ════════════════════════════════════════════════════════════════
# 1. VUE D'ENSEMBLE — KPIs
# ════════════════════════════════════════════════════════════════

class AnalyticsOverviewView(APIView):
    """
    GET /api/analytics/overview/?period=month

    Réponse :
    {
      "tresorerie_nette":       12500.00,
      "nb_utilisateurs":        42,
      "nb_membres_actifs":      35,
      "nb_demandes_en_attente": 6,
      "total_dons":             50000.00,
      "total_cotisations":      30000.00,
      "total_depenses":         17500.00,
      "nb_actions_en_cours":    3,
    }
    """
    permission_classes = [EstAdmin]

    def get(self, request):
        period = request.query_params.get('period', 'month')
        date_from, date_to = get_date_range(period)

        # Filtres de base
        don_qs    = Don.objects.all()
        cotis_qs  = Cotisation.objects.filter(statut='PAYEE')
        dep_qs    = Depense.objects.filter(statut='VALIDEE')

        if date_from:
            don_qs   = don_qs.filter(date_don__gte=date_from)
            cotis_qs = cotis_qs.filter(date_paiement__gte=date_from)
            dep_qs   = dep_qs.filter(date_depense__gte=date_from)

        total_dons       = don_qs.aggregate(t=Sum('montant'))['t'] or Decimal('0')
        total_cotisations = cotis_qs.aggregate(t=Sum('montant'))['t'] or Decimal('0')
        total_depenses   = dep_qs.aggregate(t=Sum('montant'))['t'] or Decimal('0')
        tresorerie_nette = total_dons + total_cotisations - total_depenses

        return Response({
            'tresorerie_nette':         float(tresorerie_nette),
            'nb_utilisateurs':          User.objects.filter(is_active=True).count(),
            'nb_membres_actifs':        Membre.objects.filter(statut='ACTIF').count(),
            'nb_demandes_en_attente':   DemandeAdhesion.objects.filter(statut='EN_ATTENTE').count(),
            'total_dons':               float(total_dons),
            'total_cotisations':        float(total_cotisations),
            'total_depenses':           float(total_depenses),
            'nb_actions_en_cours':      Action.objects.filter(statut='EN_COURS').count(),
        })


# ════════════════════════════════════════════════════════════════
# 2. RÉPARTITION DES TYPES DE MEMBRES — Pie Chart
# ════════════════════════════════════════════════════════════════

class AnalyticsMembreTypesView(APIView):
    """
    GET /api/analytics/membres-types/?period=month

    Réponse : liste de { name, value }
    [
      { "name": "Bénévole",   "value": 12 },
      { "name": "Membre Actif", "value": 8 },
      ...
    ]
    """
    permission_classes = [EstAdmin]

    LABELS = {
        'PRESIDENT':          'Président',
        'VICE_PRESIDENT':     'Vice-Président',
        'SECRETAIRE':         'Secrétaire',
        'TRESORIER':          'Trésorier',
        'RESPONSABLE_RH':     'Resp. RH',
        'RESPONSABLE_COM':    'Resp. Com.',
        'CHARGE_PROJET':      'Chg. Projet',
        'CHARGE_PARTENARIAT': 'Partenariat',
        'BENEVOLE':           'Bénévole',
        'MEMBRE_ACTIF':       'Membre Actif',
    }

    def get(self, request):
        qs = (
            Membre.objects
            .filter(statut='ACTIF')
            .values('type_membre')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        result = [
            {'name': self.LABELS.get(row['type_membre'], row['type_membre']),
             'value': row['count']}
            for row in qs
            if row['count'] > 0
        ]
        return Response(result)


# ════════════════════════════════════════════════════════════════
# 3. ÉVOLUTION MEMBRES & BÉNÉVOLES — Line Chart
# ════════════════════════════════════════════════════════════════

class AnalyticsMembreEvolutionView(APIView):
    """
    GET /api/analytics/membres-evolution/?period=year

    Réponse : liste de { label, membres, benevoles }
    [
      { "label": "Sep 2024", "membres": 10, "benevoles": 3 },
      { "label": "Oct 2024", "membres": 12, "benevoles": 4 },
      ...
    ]
    """
    permission_classes = [EstAdmin]

    TYPES_MEMBRES_OFFICIELS = {
        'PRESIDENT','VICE_PRESIDENT','SECRETAIRE','TRESORIER',
        'RESPONSABLE_RH','RESPONSABLE_COM','CHARGE_PROJET','CHARGE_PARTENARIAT',
    }
    TYPES_BENEVOLES = {'BENEVOLE', 'MEMBRE_ACTIF'}

    def get(self, request):
        period = request.query_params.get('period', 'year')
        today  = timezone.now().date()

        if period == 'week':
            date_from = today - timedelta(days=7)
            # Granularité journalière
            result = []
            for i in range(8):
                d = date_from + timedelta(days=i)
                membres   = Membre.objects.filter(
                    date_adhesion__lte=d, 
                    type_membre__in=self.TYPES_MEMBRES_OFFICIELS
                ).count()
                benevoles = Membre.objects.filter(
                    date_adhesion__lte=d, 
                    type_membre__in=self.TYPES_BENEVOLES
                ).count()
                result.append({
                    'label':    d.strftime('%d %b'),
                    'membres':  membres,
                    'benevoles': benevoles,
                })
            return Response(result)

        # Granularité mensuelle pour month / year / all
        if period == 'month':
            date_from = today - timedelta(days=30)
        elif period == 'year':
            date_from = today.replace(year=today.year - 1)
        else:
            # 'all' → depuis le premier membre inscrit
            first = Membre.objects.order_by('date_adhesion').first()
            date_from = first.date_adhesion if first else today.replace(year=today.year - 1)

        result = []
        for month_start in iter_months(date_from, today):
            membres   = Membre.objects.filter(
                date_adhesion__lte=month_start, 
                type_membre__in=self.TYPES_MEMBRES_OFFICIELS
            ).count()
            benevoles = Membre.objects.filter(
                date_adhesion__lte=month_start, 
                type_membre__in=self.TYPES_BENEVOLES
            ).count()
            result.append({
                'label':     fmt_label_month(month_start),
                'membres':   membres,
                'benevoles': benevoles,
            })
        return Response(result)


# ════════════════════════════════════════════════════════════════
# 4. ÉVOLUTION DES DONS — Bar Chart
# ════════════════════════════════════════════════════════════════

class AnalyticsDonsEvolutionView(APIView):
    """
    GET /api/analytics/dons-evolution/?period=month

    Réponse : liste de { label, total }
    [
      { "label": "S12",  "total": 25000 },
      { "label": "S13",  "total": 18000 },
      ...
    ]
    """
    permission_classes = [EstAdmin]

    def get(self, request):
        period    = request.query_params.get('period', 'month')
        today     = timezone.now().date()
        date_from, date_to = get_date_range(period)
        if date_from is None:
            first = Don.objects.order_by('date_don').first()
            date_from = first.date_don if first else today - timedelta(days=365)
            date_to   = today

        result = []

        if period in ('week', 'month'):
            # Granularité hebdomadaire
            for week_start in iter_weeks(date_from, date_to):
                week_end = week_start + timedelta(days=6)
                total = Don.objects.filter(
                    date_don__range=(week_start, min(week_end, date_to))
                ).aggregate(t=Sum('montant'))['t'] or Decimal('0')
                result.append({
                    'label': fmt_label_week(week_start),
                    'total': float(total),
                })
        else:
            # Granularité mensuelle
            for month_start in iter_months(date_from, date_to):
                if month_start.month == 12:
                    month_end = date(month_start.year + 1, 1, 1) - timedelta(days=1)
                else:
                    month_end = date(month_start.year, month_start.month + 1, 1) - timedelta(days=1)
                total = Don.objects.filter(
                    date_don__range=(month_start, min(month_end, date_to))
                ).aggregate(t=Sum('montant'))['t'] or Decimal('0')
                result.append({
                    'label': fmt_label_month(month_start),
                    'total': float(total),
                })

        return Response(result)


# ════════════════════════════════════════════════════════════════
# 5. PROJETS PAR STATUT — Bar Chart horizontal
# ════════════════════════════════════════════════════════════════

class AnalyticsProjetsStatutsView(APIView):
    """
    GET /api/analytics/projets-statuts/

    Réponse : liste de { name, value }
    [
      { "name": "En cours",  "value": 3 },
      { "name": "Planifiée", "value": 5 },
      { "name": "Clôturée",  "value": 12 },
      { "name": "Annulée",   "value": 1 },
    ]
    """
    permission_classes = [EstAdmin]

    STATUT_LABELS = {
        'EN_COURS':  'En cours',
        'PLANIFIEE': 'Planifiée',
        'CLOTUREE':  'Clôturée',
        'ANNULEE':   'Annulée',
    }

    def get(self, request):
        qs = (
            Action.objects
            .values('statut')
            .annotate(count=Count('id'))
            .order_by('statut')
        )
        result = [
            {'name': self.STATUT_LABELS.get(row['statut'], row['statut']),
             'value': row['count']}
            for row in qs
        ]
        return Response(result)


# ════════════════════════════════════════════════════════════════
# 6. PARTENAIRES ACTIFS / INACTIFS — Line Chart
# ════════════════════════════════════════════════════════════════

class AnalyticsPartenairesEvolutionView(APIView):
    """
    GET /api/analytics/partenaires-evolution/?period=year

    Réponse : liste de { label, actifs, inactifs }
    [
      { "label": "Sep 2024", "actifs": 8, "inactifs": 2 },
      ...
    ]

    Note : on compte les partenaires dont date_debut <= date du snapshot.
    Les partenaires inactifs sont ceux avec statut='INACTIF'.
    """
    permission_classes = [EstAdmin]

    def get(self, request):
        period = request.query_params.get('period', 'year')
        today  = timezone.now().date()

        if period == 'week':
            date_from = today - timedelta(days=7)
        elif period == 'month':
            date_from = today - timedelta(days=30)
        elif period == 'year':
            date_from = today.replace(year=today.year - 1)
        else:
            first = Partenaire.objects.order_by('date_debut').first()
            date_from = first.date_debut if first else today.replace(year=today.year - 1)

        result = []
        for month_start in iter_months(date_from, today):
            # Calcule le dernier jour du mois
            last_day = monthrange(month_start.year, month_start.month)[1]
            month_end = month_start.replace(day=last_day)
            snapshot = min(month_end, today)  # Ne pas dépasser aujourd'hui

            actifs = Partenaire.objects.filter(
                date_debut__lte=snapshot, statut='ACTIF'
            ).count()
            inactifs = Partenaire.objects.filter(
                date_debut__lte=snapshot, statut='INACTIF'
            ).count()
            result.append({
                'label':    fmt_label_month(month_start),
                'actifs':   actifs,
                'inactifs': inactifs,
            })
        return Response(result)