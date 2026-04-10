"""
core/serializers.py - Application de gestion de l'association ININ
Sérialise les modèles pour l'API REST via Django REST Framework.
"""

from rest_framework import serializers
from rest_framework import serializers as drf_serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.db.models import Sum
from decimal import Decimal
from django.utils import timezone as tz_utils
from django.contrib.auth import get_user_model
    
from django.utils import timezone as _tz
from datetime import date as _date

from .models import (
    Inscription, User, Membre, Partenaire,
    Action, PhotoAction,
    Don, Cotisation, Depense,
    DemandeAdhesion,
)


# ==============================================================================
# UTILITAIRES PARTAGÉS
# ==============================================================================

def validate_montant_positif(value):
    if value <= Decimal('0.00'):
        raise serializers.ValidationError(
            "Le montant doit être strictement supérieur à zéro."
        )
    return value


# ==============================================================================
# JWT PERSONNALISÉ — enrichit la réponse /api/auth/token/
# ==============================================================================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Surcharge de TokenObtainPairSerializer pour enrichir la réponse JWT.

    En plus des tokens standard (access, refresh), retourne :
      - email        → identifiant de connexion
      - first_name   → prénom
      - last_name    → nom de famille
      - role         → rôle interne (ADMIN, TRESORIER, MEMBRE…)
      - role_label   → libellé lisible du rôle
      - photo_profil → URL absolue de la photo (depuis Membre) ou null

    ✅ CORRECTION : photo_profil lu depuis user.profil_membre.photo_profil
       (modèle Membre) et non plus depuis user.photo_profil (modèle User).
       Sécurisé contre l'absence de profil membre (admin sans Membre lié).
    """

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        # ── Photo de profil : récupération depuis Membre ──────
        # user.profil_membre est la related_name OneToOneField
        # définie dans Membre.utilisateur → related_name='profil_membre'
        photo_url = None
        try:
            membre = user.profil_membre          # peut lever RelatedObjectDoesNotExist
            if membre and membre.photo_profil:   # le champ peut être vide/null
                request = self.context.get('request')
                if request:
                    photo_url = request.build_absolute_uri(membre.photo_profil.url)
                else:
                    # Fallback sans request (tests unitaires, CI, etc.)
                    from django.conf import settings
                    site_url = getattr(settings, 'SITE_URL', 'http://127.0.0.1:8000')
                    photo_url = f"{site_url}{membre.photo_profil.url}"
        except Exception:
            # Cas couverts :
            #   - Admin ou superuser sans Membre associé → RelatedObjectDoesNotExist
            #   - Membre.photo_profil inexistant en DB   → AttributeError
            #   - Tout autre accès inattendu             → silencieux, photo = null
            photo_url = None

        # ── Enrichissement de la réponse JWT ─────────────────
        data['email']        = user.email
        data['first_name']   = user.first_name
        data['last_name']    = user.last_name
        data['role']         = user.role
        data['role_label']   = user.get_role_display()
        data['photo_profil'] = photo_url   # null si pas de membre ou pas de photo

        return data


# ==============================================================================
# USER / AUTHENTIFICATION
# ==============================================================================

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer complet pour l'utilisateur.
    """

    role_display = serializers.CharField(source='get_role_display', read_only=True)

    password = serializers.CharField(
        write_only=True,
        required=False,
        validators=[validate_password],
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email',
            'first_name', 'last_name',
            'role', 'role_display',
            'telephone', 'bio',
            'is_active', 'date_joined',
            'password',
        ]
        read_only_fields = ['date_joined']
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class UserResumeSerializer(serializers.ModelSerializer):
    """Serializer allégé pour les relations imbriquées."""

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'role']
        read_only_fields = fields


# ==============================================================================
# MEMBRE
# ==============================================================================

class MembreSerializer(serializers.ModelSerializer):

    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    type_membre_display = serializers.CharField(source='get_type_membre_display', read_only=True)
    nb_cotisations_payees = serializers.SerializerMethodField()
    photo_profil = serializers.ImageField(
        required=False,
        allow_null=True,
        use_url=True
    )

    class Meta:
        model = Membre
        fields = [
            'id', 'nom', 'prenom', 'email', 'telephone', 'adresse',
            'date_adhesion', 'type_membre', 'type_membre_display',
            'statut', 'statut_display',
            'photo_profil', 'sexe', 'date_naissance',
            'nb_cotisations_payees',
            'date_creation', 'date_modification',
        ]
        read_only_fields = ['date_creation', 'date_modification']

    def get_nb_cotisations_payees(self, obj):
        return obj.cotisations.filter(statut='PAYEE').count()


# ==============================================================================
# PARTENAIRE
# ==============================================================================

class PartenaireSerializer(serializers.ModelSerializer):

    statut_display = serializers.CharField(
        source='get_statut_display', read_only=True
    )
    nb_actions = serializers.SerializerMethodField()
    total_dons = serializers.SerializerMethodField()
    logo       = serializers.ImageField(
        required=False,
        allow_null=True,
        use_url=True
    )

    class Meta:
        model  = Partenaire
        fields = [
            'id',
            'nom', 'type', 'email', 'telephone',
            'statut', 'statut_display',
            'description',
            'logo',
            'date_debut', 'date_creation',
            'nb_actions', 'total_dons',
        ]
        read_only_fields = ['date_creation']

    def to_internal_value(self, data):
        """
        Nettoie le champ 'logo' avant validation :
        - Si logo est absent → DRF l'ignore naturellement (partial=True)
        - Si logo est une string vide ou non-fichier → on le retire
          pour éviter "La donnée soumise n'est pas un fichier"
        - Si logo est un vrai File → on le laisse passer normalement
        """
        if hasattr(data, 'copy'):
            data = data.copy()

        logo_val = data.get('logo', None)
        if logo_val is not None and not hasattr(logo_val, 'read'):
            data.pop('logo', None)

        return super().to_internal_value(data)

    def get_nb_actions(self, obj):
        return obj.actions_soutenues.count()

    def get_total_dons(self, obj):
        from django.db.models import Sum as _Sum
        result = obj.dons_effectues.aggregate(total=_Sum('montant'))['total']
        return float(result) if result else 0.0

    def validate_date_debut(self, value):
        limite = tz_utils.now().date().replace(year=tz_utils.now().year + 5)
        if value > limite:
            raise serializers.ValidationError(
                "La date de début semble incorrecte (plus de 5 ans dans le futur)."
            )
        return value
    
class PartenaireStatsSerializer(serializers.Serializer):
    """
    Serializer de lecture seule pour les KPI du DashboardPartenariat.

    Réponse JSON :
    {
      "partenaires_actifs":  12,
      "total_dons_annee":    450000.0,
      "actions_a_financer":  3
    }
    """
    partenaires_actifs = serializers.IntegerField(read_only=True)
    total_dons_annee   = serializers.FloatField(read_only=True)
    actions_a_financer = serializers.IntegerField(read_only=True)


class PartenaireResumeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Partenaire
        fields = ['id', 'nom', 'type']
        read_only_fields = fields


# ==============================================================================
# PHOTO D'ACTION
# ==============================================================================

class PhotoActionSerializer(serializers.ModelSerializer):

    class Meta:
        model = PhotoAction
        fields = ['id', 'image', 'legende', 'date_ajout']
        read_only_fields = ['date_ajout']


# ==============================================================================
# ACTION
# ==============================================================================

class InscriptionResumeSerializer(serializers.ModelSerializer):
    utilisateur = UserResumeSerializer(read_only=True)

    class Meta:
        model = Inscription
        fields = ['id', 'utilisateur', 'date_inscription']

class ActionSerializer(serializers.ModelSerializer):

    responsable            = UserResumeSerializer(read_only=True)
    responsable_id         = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__in=['CHARGE_PROJET', 'ADMIN']),
        source='responsable',
        write_only=True,
        required=False,
        allow_null=True,
        label="ID du responsable"
    )
    partenaires            = PartenaireResumeSerializer(many=True, read_only=True)
    partenaires_ids        = serializers.PrimaryKeyRelatedField(
        queryset=Partenaire.objects.all(),
        source='partenaires',
        many=True,
        write_only=True,
        required=False,
        label="IDs des partenaires"
    )
    photos                 = PhotoActionSerializer(many=True, read_only=True)
    type_display           = serializers.CharField(source='get_type_display',   read_only=True)
    statut_display         = serializers.CharField(source='get_statut_display', read_only=True)
    budget_restant         = serializers.SerializerMethodField()
    total_depenses_reelles = serializers.SerializerMethodField()
    total_dons_flechés     = serializers.SerializerMethodField()
    is_inscrit             = serializers.SerializerMethodField()

    # ✅ Déclarés explicitement pour éviter ImproperlyConfigured sur POST/PATCH
    # (ces champs n'existent pas directement sur le modèle Action)
    participants_count     = serializers.SerializerMethodField()
    is_full                = serializers.SerializerMethodField()

    inscriptions = InscriptionResumeSerializer(many=True, read_only=True)  # ✅ AJOUTER
    class Meta:
        model = Action
        fields = [
            'id', 'titre', 'type', 'type_display',
            'description', 'date_debut', 'date_cloture',
            'lieu', 'budget_prevu',
            'statut', 'statut_display',
            'nb_participants',
            'nb_participants_max',
            'participants_count',
            'is_full',
            'is_inscrit',
            'inscriptions',
            'compte_rendu',
            'responsable',
            'responsable_id',
            'partenaires', 'partenaires_ids',
            'photos',
            'budget_restant',
            'total_depenses_reelles',
            'total_dons_flechés',
            'date_creation', 'date_modification',
        ]
        read_only_fields = ['date_creation', 'date_modification']

    def get_participants_count(self, obj):
        # ✅ Lit inscrits_count (annotation) ou tombe sur la @property nb_inscrits
        annotated = getattr(obj, 'inscrits_count', None)
        if annotated is not None:
            return annotated
        return getattr(obj, 'nb_inscrits', None) or obj.inscriptions.count()

    def get_is_full(self, obj):
        max_p = obj.nb_participants_max
        if not max_p:
            return False
        count = getattr(obj, 'inscrits_count', None)
        if count is None:
            count = getattr(obj, 'nb_inscrits', None) or obj.inscriptions.count()
        return count >= max_p

    def get_is_inscrit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.inscriptions.filter(utilisateur=request.user).exists()

    def get_budget_restant(self, obj):
        total_depenses = obj.depenses.filter(statut='VALIDEE').aggregate(
            total=Sum('montant')
        )['total'] or Decimal('0.00')
        return float(obj.budget_prevu - total_depenses)

    def get_total_depenses_reelles(self, obj):
        total = obj.depenses.filter(statut='VALIDEE').aggregate(
            total=Sum('montant')
        )['total'] or Decimal('0.00')
        return float(total)

    def get_total_dons_flechés(self, obj):
        total = obj.dons.aggregate(
            total=Sum('montant')
        )['total'] or Decimal('0.00')
        return float(total)

    def validate(self, attrs):
        date_debut   = attrs.get('date_debut')
        date_cloture = attrs.get('date_cloture')
        if date_debut and date_cloture and date_cloture < date_debut:
            raise serializers.ValidationError({
                'date_cloture': "La date de clôture ne peut pas être antérieure à la date de début."
            })
        return attrs

class ActionListSerializer(serializers.ModelSerializer):

    responsable_nom    = serializers.SerializerMethodField()
    statut_display     = serializers.CharField(source='get_statut_display', read_only=True)
    type_display       = serializers.CharField(source='get_type_display',   read_only=True)
    budget_restant     = serializers.SerializerMethodField()

    # ✅ SerializerMethodField uniquement — supprime les doublons
    participants_count = serializers.SerializerMethodField()
    is_full            = serializers.SerializerMethodField()
    is_inscrit         = serializers.SerializerMethodField()

    class Meta:
        model  = Action
        fields = [
            'id', 'titre', 'type', 'type_display',
            'date_debut', 'lieu', 'statut', 'statut_display',
            'budget_prevu', 'budget_restant',
            'nb_participants',
            'participants_count',
            'nb_participants_max',
            'is_full',
            'is_inscrit',
            'responsable_nom',
        ]

    def get_responsable_nom(self, obj):
        if obj.responsable:
            return f"{obj.responsable.first_name} {obj.responsable.last_name}".strip()
        return None

    def get_budget_restant(self, obj):
        from decimal import Decimal
        total = obj.depenses.filter(statut='VALIDEE').aggregate(
            total=Sum('montant')
        )['total'] or Decimal('0.00')
        return float(obj.budget_prevu - total)

    def get_participants_count(self, obj):
        annotated = getattr(obj, 'inscrits_count', None)
        if annotated is not None:
            return annotated
        return getattr(obj, 'nb_inscrits', None) or obj.inscriptions.count()

    def get_is_full(self, obj):
        max_p = obj.nb_participants_max
        if not max_p:
            return False
        count = getattr(obj, 'inscrits_count', None)
        if count is None:
            count = getattr(obj, 'nb_inscrits', None) or obj.inscriptions.count()
        return count >= max_p

    def get_is_inscrit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.inscriptions.filter(utilisateur=request.user).exists()
# ==============================================================================
# DON
# ==============================================================================

class DonSerializer(serializers.ModelSerializer):

    donateur_membre = MembreSerializer(read_only=True)
    donateur_membre_id = serializers.PrimaryKeyRelatedField(
        queryset=Membre.objects.filter(statut='ACTIF'),
        source='donateur_membre',
        write_only=True,
        required=False,
        allow_null=True,
        label="ID du membre donateur"
    )
    donateur_partenaire = PartenaireResumeSerializer(read_only=True)
    donateur_partenaire_id = serializers.PrimaryKeyRelatedField(
        queryset=Partenaire.objects.filter(statut='ACTIF'),
        source='donateur_partenaire',
        write_only=True,
        required=False,
        allow_null=True,
        label="ID du partenaire donateur"
    )
    action_titre = serializers.CharField(source='action.titre', read_only=True)
    action_id = serializers.PrimaryKeyRelatedField(
        queryset=Action.objects.exclude(statut='CLOTUREE'),
        source='action',
        write_only=True,
        required=False,
        allow_null=True,
        label="ID de l'action financée"
    )
    montant = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[validate_montant_positif]
    )
    mode_paiement_display = serializers.CharField(
        source='get_mode_paiement_display', read_only=True
    )
    donateur_display = serializers.SerializerMethodField()

    class Meta:
        model = Don
        fields = [
            'id', 'montant', 'date_don',
            'mode_paiement', 'mode_paiement_display',
            'anonyme',
            'donateur_membre', 'donateur_membre_id',
            'nom_donateur_externe',
            'donateur_partenaire', 'donateur_partenaire_id',
            'donateur_display',
            'action_titre', 'action_id',
            'recu_genere', 'notes',
            'date_creation',
        ]
        read_only_fields = ['date_creation', 'recu_genere']

    def get_donateur_display(self, obj):
        return obj.get_donateur_display()

    def validate(self, attrs):
        anonyme = attrs.get('anonyme', False)
        donateur_membre = attrs.get('donateur_membre')
        donateur_partenaire = attrs.get('donateur_partenaire')
        nom_donateur_externe = attrs.get('nom_donateur_externe')
        if not anonyme and not any([donateur_membre, donateur_partenaire, nom_donateur_externe]):
            raise serializers.ValidationError(
                "Pour un don non anonyme, veuillez renseigner au moins un donateur "
                "(membre, partenaire, ou nom externe)."
            )
        return attrs


# ==============================================================================
# COTISATION
# ==============================================================================

class CotisationSerializer(serializers.ModelSerializer):

    membre = MembreSerializer(read_only=True)
    membre_id = serializers.PrimaryKeyRelatedField(
        queryset=Membre.objects.filter(statut='ACTIF'),
        source='membre',
        write_only=True,
        label="ID du membre"
    )
    montant = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[validate_montant_positif]
    )
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    periodicite_display = serializers.CharField(source='get_periodicite_display', read_only=True)
    enregistre_par = UserResumeSerializer(read_only=True)

    class Meta:
        model = Cotisation
        fields = [
            'id',
            'membre', 'membre_id',
            'montant', 'date_paiement',
            'statut', 'statut_display',
            'periodicite', 'periodicite_display',
            'periode_concernee',
            'enregistre_par',
            'notes', 'date_creation',
        ]
        read_only_fields = ['date_creation', 'enregistre_par']

    def validate_periode_concernee(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(
                "La période concernée ne peut pas être vide (ex: '2024', 'T1-2024')."
            )
        return value.strip()


# ==============================================================================
# DÉPENSE
# ==============================================================================

class DepenseSerializer(serializers.ModelSerializer):

    action_titre      = serializers.CharField(source='action.titre', read_only=True, default=None)
    # ✅ write_only : reçoit l'entier envoyé par le frontend (fd.append('action_id', id))
    action_id         = serializers.PrimaryKeyRelatedField(
        queryset=Action.objects.all(),
        source='action',
        write_only=True,
        required=False,
        allow_null=True,
        label="ID de l'action associée"
    )
    saisi_par         = UserResumeSerializer(read_only=True)
    valide_par        = UserResumeSerializer(read_only=True)
    categorie_display = serializers.CharField(source='get_categorie_display', read_only=True)
    statut_display    = serializers.CharField(source='get_statut_display',    read_only=True)
    justificatif      = serializers.FileField(use_url=True, required=False, allow_null=True)

    class Meta:
        model  = Depense
        fields = [
            'id', 'montant', 'date_depense',
            'categorie', 'categorie_display',
            'description', 'statut', 'statut_display',
            'justificatif',
            'action_titre', 'action_id',
            'saisi_par', 'valide_par',
            'date_creation',
        ]
        # ✅ statut ajouté en read_only : forcé à VALIDEE par perform_create,
        #    jamais accepté depuis le frontend
        read_only_fields = ['date_creation', 'saisi_par', 'valide_par', 'statut']

    def validate_montant(self, value):
        if value <= Decimal('0.00'):
            raise serializers.ValidationError(
                "Le montant de la dépense doit être supérieur à zéro."
            )
        return value

    def validate_justificatif(self, value):
        if value:
            import os
            ext = os.path.splitext(value.name)[1].lower()
            extensions_autorisees = ['.pdf', '.jpg', '.jpeg', '.png', '.webp']
            if ext not in extensions_autorisees:
                raise serializers.ValidationError(
                    f"Format non supporté. Formats acceptés : {', '.join(extensions_autorisees)}"
                )
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(
                    "Le fichier est trop volumineux. Taille maximale : 5 Mo."
                )
        return value
# ==============================================================================
# DEMANDE D'ADHÉSION
# ==============================================================================

class DemandeAdhesionSerializer(serializers.ModelSerializer):

    statut_display               = serializers.CharField(
        source='get_statut_display', read_only=True
    )
    type_membre_souhaite_display = serializers.CharField(
        source='get_type_membre_souhaite_display', read_only=True
    )
    domaine_expertise_display    = serializers.CharField(
        source='get_domaine_expertise_display', read_only=True
    )
    traite_par = UserResumeSerializer(read_only=True)

    # Fichier accepté en multipart — use_url retourne l'URL absolue
    document   = serializers.FileField(
        required=False, allow_null=True, use_url=True
    )

    class Meta:
        model  = DemandeAdhesion
        fields = [
            # Identité
            'id', 'nom', 'prenom', 'email', 'telephone',
            # Nouveaux champs personnels
            'type_membre_souhaite', 'type_membre_souhaite_display',
            'date_naissance', 'adresse',
            'domaine_expertise', 'domaine_expertise_display',
            'profil_linkedin', 'document',
            # Motivation & workflow
            'motivation',
            'statut', 'statut_display',
            'traite_par', 'date_demande', 'date_traitement',
        ]
        read_only_fields = [
            'statut', 'traite_par',
            'date_demande', 'date_traitement',
        ]

    def validate_email(self, value):
        if DemandeAdhesion.objects.filter(email=value, statut='EN_ATTENTE').exists():
            raise serializers.ValidationError(
                "Une demande d'adhésion est déjà en cours pour cet email."
            )
        return value

    def validate_document(self, value):
        """
        Double validation DRF (le validateur modèle s'applique aussi en BDD,
        mais on veut une erreur 400 propre avant même de toucher la BDD).
        """
        if value:
            import os
            ext  = os.path.splitext(value.name)[1].lower()
            exts = ['.jpg', '.jpeg', '.png', '.pdf']
            if ext not in exts:
                raise serializers.ValidationError(
                    f"Extension non autorisée. Formats acceptés : {', '.join(exts)}."
                )
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(
                    "Fichier trop volumineux. Taille maximale : 5 Mo."
                )
        return value

# ==============================================================================
# TABLEAU DE BORD (DASHBOARD)
# ==============================================================================

class TableauDeBordSerializer(serializers.Serializer):

    total_dons = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_cotisations = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_depenses = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    solde_financier = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    nb_actions_realisees = serializers.IntegerField(read_only=True)
    nb_total_beneficiaires = serializers.IntegerField(read_only=True)
    nb_membres_actifs = serializers.IntegerField(read_only=True)
    nb_demandes_en_attente = serializers.IntegerField(read_only=True)


# ══════════════════════════════════════════════════════════════
# NOUVEAU — RHStatsSerializer (optionnel, vue directe suffit)
# ══════════════════════════════════════════════════════════════

class RHStatsSerializer(serializers.Serializer):
    """
    Serializer de validation pour les stats RH.
    Utilisé pour documenter la réponse de RHStatsView.
    """
    total_membres        = serializers.IntegerField(read_only=True)
    total_benevoles      = serializers.IntegerField(read_only=True)
    demandes_en_attente  = serializers.IntegerField(read_only=True)

class ProfilSerializer(serializers.ModelSerializer):
    role_label   = serializers.CharField(source='get_role_display', read_only=True)
    photo_profil = serializers.ImageField(use_url=True, required=False, allow_null=True)
    bio          = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model  = User
        fields = [
            'id', 'first_name', 'last_name',
            'email', 'role', 'role_label',
            'telephone', 'adresse', 'bio',
            'photo_profil', 'date_joined', 'is_active',
        ]
        read_only_fields = ['email', 'role', 'role_label', 'date_joined', 'is_active']

# ══════════════════════════════════════════════════════════════
# MEMBRES PAGE PUBLIQUE
# ══════════════════════════════════════════════════════════════

class MembrePublicSerializer(serializers.ModelSerializer):
    """
    Serializer pour la page publique /membres.
    Expose uniquement les données affichables sans authentification.
    photo_profil : URL absolue via le User lié (si existant).
    """
    # On expose le nom/prénom depuis le User lié si disponible,
    # sinon depuis les champs natifs du Membre.
    nom_affiche    = serializers.SerializerMethodField()
    prenom_affiche = serializers.SerializerMethodField()
    photo_url      = serializers.SerializerMethodField()
    role_display   = serializers.SerializerMethodField()
    linkedin       = serializers.SerializerMethodField()
    instagram      = serializers.SerializerMethodField()

    class Meta:
        model  = Membre
        fields = [
            'id',
            'nom_affiche', 'prenom_affiche',
            'type_membre',
            'role_display',   # libellé du type (ex: "Président")
            'statut',
            'adresse',        # utilisé pour extraire le pays/ville
            'photo_url',
            'linkedin',
            'instagram',
        ]

    def get_nom_affiche(self, obj):
        return obj.nom

    def get_prenom_affiche(self, obj):
        return obj.prenom

    def get_photo_url(self, obj):
        """
        ✅ MODIFIÉ : pointe vers obj.photo_profil (Membre)
        au lieu de obj.utilisateur.photo_profil (User).
        Fonctionne même si le membre n'a pas de compte User.
        """
        request = self.context.get('request')
        # Photo directement sur le Membre
        if obj.photo_profil:
            if request:
                return request.build_absolute_uri(obj.photo_profil.url)
            # Fallback sans request (tests unitaires, etc.)
            from django.conf import settings
            return f"{getattr(settings, 'SITE_URL', 'http://127.0.0.1:8000')}{obj.photo_profil.url}"
        return None  # React affiche le fallback Unsplash si null

    def get_role_display(self, obj):
        return obj.get_type_membre_display()

    def get_linkedin(self, obj):
        # Champ optionnel : retourne None si pas encore sur le modèle
        return getattr(obj, 'linkedin', None)

    def get_instagram(self, obj):
        return getattr(obj, 'instagram', None)


class MembresStatsSerializer(serializers.Serializer):
    """
    Statistiques globales pour le PageHero de Membres.jsx.
    """
    nb_membres_officiels = serializers.IntegerField()
    nb_benevoles_actifs  = serializers.IntegerField()
    nb_pays              = serializers.IntegerField()

class ActionPreviewSerializer(serializers.ModelSerializer):
    """
    Serializer allégé pour la section "Actions à la une" de Home.jsx.
    Identique à ActionListSerializer + description.
    Utilisé exclusivement par LastActionsView.
    """
    type_display   = serializers.CharField(source='get_type_display',   read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    budget_restant = serializers.SerializerMethodField()

    class Meta:
        model  = Action
        fields = [
            'id', 'titre',
            'type', 'type_display',
            'statut', 'statut_display',
            'date_debut', 'lieu',
            'description',            # ← champ supplémentaire vs ActionListSerializer
            'budget_prevu', 'budget_restant',
            'nb_participants',
        ]

    def get_budget_restant(self, obj):
        from django.db.models import Sum
        from decimal import Decimal
        total = obj.depenses.filter(statut='VALIDEE').aggregate(
            total=Sum('montant')
        )['total'] or Decimal('0.00')
        return float(obj.budget_prevu - total)


class CotisationMensuelleSerializer(serializers.Serializer):
    """
    Représente le statut de cotisation pour un mois donné.

    Réponse JSON par objet :
      {
        "mois":  "Janvier 2026",       ← label affiché côté React
        "paye":  true | false,          ← calculé depuis Cotisation en DB
        "date":  "2026-01-01" | null    ← date_paiement si payée, sinon null
      }

    Ce serializer est en lecture seule — il ne sert qu'à documenter la
    structure retournée par MemberDashboardSerializer.get_cotisations().
    """
    mois  = serializers.CharField(read_only=True)
    paye  = serializers.BooleanField(read_only=True)
    date  = serializers.DateField(allow_null=True, read_only=True)


class MemberDashboardSerializer(serializers.Serializer):
    """
    Serializer principal du dashboard membre.

    Agrège en une seule réponse :
      - nb_actions      : actions dont l'utilisateur est responsable (EN_COURS ou PLANIFIEE)
      - total_dons      : somme des dons versés par ce membre
      - nb_projets_actifs : actions EN_COURS au niveau global (contexte associatif)
      - taux_engagement   : engagement du membre (cotisations payées / total attendu)
      - nb_membres_actifs : nb total de membres ACTIF (contexte global)
      - cotisations       : liste mois par mois depuis septembre 2025

    Le contexte doit contenir :
      - 'membre'  : instance Membre liée à request.user
      - 'request' : objet request DRF
    """

    nb_actions        = serializers.SerializerMethodField()
    total_dons        = serializers.SerializerMethodField()
    nb_projets_actifs = serializers.SerializerMethodField()
    taux_engagement   = serializers.SerializerMethodField()
    nb_membres_actifs = serializers.SerializerMethodField()
    cotisations       = serializers.SerializerMethodField()

    # ── Helpers internes ──────────────────────────────────────────────────────

    def _get_membre(self):
        """Retourne le Membre depuis le contexte (injecté par la vue)."""
        return self.context.get('membre')

    @staticmethod
    def _generer_mois_depuis_debut():
        """
        Génère tous les mois de septembre 2025 jusqu'au mois actuel inclus.
        Retourne une liste de tuples (label_fr, date_debut_mois).

        Exemple :
          [
            ("Septembre 2025", date(2025, 9, 1)),
            ("Octobre 2025",   date(2025, 10, 1)),
            ...
          ]

        Le label correspond exactement au format utilisé dans
        Cotisation.periode_concernee stocké en base (ex: "Janvier 2026").
        """
        MOIS_FR = [
            "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
            "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        ]

        debut  = _date(2025, 9, 1)    # septembre 2025 — date de lancement
        now    = _tz.now().date()
        fin    = _date(now.year, now.month, 1)  # 1er du mois actuel

        mois_list = []
        cursor    = _date(debut.year, debut.month, 1)

        while cursor <= fin:
            label = f"{MOIS_FR[cursor.month - 1]} {cursor.year}"
            mois_list.append((label, cursor))
            # Avancer d'un mois
            if cursor.month == 12:
                cursor = _date(cursor.year + 1, 1, 1)
            else:
                cursor = _date(cursor.year, cursor.month + 1, 1)

        return mois_list
    
    # Dans MemberDashboardSerializer

    def get_nb_actions(self, obj):
        """
        Nombre d'actions auxquelles l'utilisateur est inscrit
        via la table Inscription (et non les actions dont il est responsable).
        """
        user = self.context.get('request').user
        return Inscription.objects.filter(utilisateur=user).count()

    def get_total_dons(self, obj):
        """
        Somme totale (float, FCFA) des dons enregistrés par ce membre.
        Retourne 0.0 si le membre n'a jamais fait de don.
        """
        membre = self._get_membre()
        if not membre:
            return 0.0

        total = (
            Don.objects
            .filter(donateur_membre=membre)
            .aggregate(total=Sum('montant'))['total']
        )
        return float(total) if total else 0.0

    def get_nb_projets_actifs(self, obj):
        """
        Nombre d'actions EN_COURS au niveau global de l'association.
        Permet au membre de voir l'activité globale de l'asso.
        """
        return Action.objects.filter(statut=Action.StatutAction.EN_COURS).count()

    def get_taux_engagement(self, obj):
        """
        Taux d'engagement du membre exprimé en pourcentage (string "X%").

        Calcul : (cotisations PAYEES du membre) / (total mois attendus depuis sep 2025)
        Retourne "0%" si aucun mois attendu ou aucune cotisation payée.
        """
        membre = self._get_membre()
        if not membre:
            return "0%"

        total_mois = len(self._generer_mois_depuis_debut())
        if total_mois == 0:
            return "0%"

        nb_payes = (
            Cotisation.objects
            .filter(
                membre=membre,
                statut=Cotisation.Statut.PAYEE,
            )
            .count()
        )

        pct = round((nb_payes / total_mois) * 100)
        return f"{pct}%"

    def get_nb_membres_actifs(self, obj):
        """
        Nombre total de membres avec le statut ACTIF dans l'association.
        KPI contextuel affiché dans les stats du dashboard.
        """
        return Membre.objects.filter(statut=Membre.Statut.ACTIF).count()

    def get_cotisations(self, obj):
        """
        Liste complète des cotisations mois par mois depuis septembre 2025.

        Pour chaque mois généré :
          1. On cherche en DB une Cotisation de ce membre dont :
             - periode_concernee = label du mois (ex: "Janvier 2026")
             - statut = PAYEE
          2. On retourne {"mois": ..., "paye": bool, "date": date | null}

        Accepte aussi les cotisations de périodicité MENSUELLE ou ANNUELLE
        (l'année est couverte si au moins une cotisation PAYEE existe pour ce
        membre sur l'année concernée — le champ periode_concernee peut être
        "2026" pour une cotisation annuelle ou "Janvier 2026" pour mensuelle).
        On cherche d'abord le match exact, puis le match sur l'année seule.
        """
        membre = self._get_membre()
        if not membre:
            return []

        # Pré-charger toutes les cotisations PAYEES du membre en une seule requête
        cotisations_payees = (
            Cotisation.objects
            .filter(
                membre=membre,
                statut=Cotisation.Statut.PAYEE,
            )
            .values('periode_concernee', 'date_paiement', 'periodicite')
        )

        # Construire des index pour éviter des boucles O(n²)
        # Index exact : {"Janvier 2026": date_paiement}
        index_exact = {}
        # Index annuel : {"2026": date_paiement}  (cotisation annuelle)
        index_annuel = {}

        for cotis in cotisations_payees:
            periode = str(cotis['periode_concernee']).strip()
            dp      = cotis['date_paiement']
            if cotis['periodicite'] == Cotisation.Periodicite.ANNUELLE:
                # Clé = "2026", "2025", etc.
                index_annuel[periode] = dp
            else:
                # Clé = "Janvier 2026", "Septembre 2025", etc.
                index_exact[periode] = dp

        result = []
        for label, date_debut in self._generer_mois_depuis_debut():
            annee_str = str(date_debut.year)

            # 1. Correspondance mensuelle exacte
            if label in index_exact:
                dp = index_exact[label]
                result.append({
                    "mois": label,
                    "paye": True,
                    "date": dp.isoformat() if dp else None,
                })
            # 2. Correspondance cotisation annuelle (ex: periode = "2025")
            elif annee_str in index_annuel:
                dp = index_annuel[annee_str]
                result.append({
                    "mois": label,
                    "paye": True,
                    "date": dp.isoformat() if dp else None,
                })
            # 3. Pas de cotisation trouvée → impayé
            else:
                result.append({
                    "mois": label,
                    "paye": False,
                    "date": None,
                })

        return result
    
# ══════════════════════════════════════════════════════════════
# SERIALIZER ENRICHI — compatibilité React DashboardRH
# ══════════════════════════════════════════════════════════════

class MembreRHSerializer(drf_serializers.ModelSerializer):
    """
    Serializer Membre adapté pour le DashboardRH.

    Problème résolu :
      Le modèle Membre stocke 'prenom' et 'nom'.
      React DashboardRH lit 'm.first_name' et 'm.last_name'.
      → On expose les deux paires de champs pour compatibilité totale.

    Structure renvoyée :
      {
        "id": 1,
        "nom": "Diallo",          // champ natif Membre
        "prenom": "Aminata",      // champ natif Membre
        "first_name": "Aminata",  // alias → lu par React
        "last_name": "Diallo",    // alias → lu par React
        "email": "...",
        "telephone": "...",
        "role": "MEMBRE",         // depuis User lié
        "statut": "ACTIF",
        "date_adhesion": "...",
        "type_membre": "MEMBRE_ACTIF",
        "adresse": "..."
      }
    """

    # Alias pour React : first_name = prenom, last_name = nom
    first_name = drf_serializers.CharField(source='prenom', read_only=True)
    last_name  = drf_serializers.CharField(source='nom',    read_only=True)

    # Rôle depuis le User lié (null si Membre sans compte)
    role       = drf_serializers.SerializerMethodField()

    # Statut display pour affichage
    statut_display     = drf_serializers.CharField(source='get_statut_display',     read_only=True)
    type_membre_display = drf_serializers.CharField(source='get_type_membre_display', read_only=True)

    class Meta:
        model  = Membre
        fields = [
            'id',
            # Champs natifs Membre
            'nom', 'prenom', 'email', 'telephone', 'adresse',
            'date_adhesion', 'type_membre', 'type_membre_display',
            'statut', 'statut_display',
            # Alias compatibilité React
            'first_name', 'last_name', 'role',
            # Dates
            'date_creation', 'date_modification',
        ]
        read_only_fields = ['date_creation', 'date_modification']

    def get_role(self, obj):
        """Retourne le rôle du User lié, ou 'MEMBRE' par défaut."""
        if obj.utilisateur:
            return obj.utilisateur.role
        # Correspondance type_membre → rôle pour affichage même sans User
        mapping = {
            'TRESORIER':          'TRESORIER',
            'RESPONSABLE_RH':     'RESPONSABLE_RH',
            'CHARGE_PROJET':      'CHARGE_PROJET',
            'CHARGE_PARTENARIAT': 'CHARGE_PARTENARIAT',
            'PRESIDENT':          'ADMINISTRATEUR',
            'VICE_PRESIDENT':     'ADMINISTRATEUR',
        }
        return mapping.get(obj.type_membre, 'MEMBRE')

# ==============================================================================
# MEMBRE — CRÉATION / MISE À JOUR (Dashboard RH)
# ==============================================================================

class MembreCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer dédié à la création et la modification d'un Membre depuis le DashboardRH.
    - Champs natifs uniquement (pas d'alias first_name/last_name)
    - Accepte multipart/form-data pour l'upload de photo
    - Validation email unique en excluant l'instance courante (PATCH)
    """

    photo_profil = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model  = Membre
        fields = [
            'id',
            'nom', 'prenom', 'email', 'telephone', 'adresse',
            'date_adhesion', 'type_membre', 'statut',
            'sexe', 'date_naissance', 'photo_profil',
        ]
        extra_kwargs = {
            'date_adhesion':  {'required': False},
            'telephone':      {'required': False, 'allow_blank': True},
            'adresse':        {'required': False, 'allow_blank': True},
            'sexe':           {'required': False, 'allow_null': True},
            'date_naissance': {'required': False, 'allow_null': True},
        }

    def validate_email(self, value):
        qs = Membre.objects.filter(email=value)
        # En modification (PATCH/PUT), on exclut l'instance courante
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "Un membre avec cet email existe déjà."
            )
        return value

    def create(self, validated_data):
        # date_adhesion par défaut = aujourd'hui si non fournie
        from datetime import date
        if 'date_adhesion' not in validated_data:
            validated_data['date_adhesion'] = date.today()
        return super().create(validated_data)
