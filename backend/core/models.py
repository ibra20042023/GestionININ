from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
import os
from django.core.exceptions import ValidationError as DjangoValidationError

# ==============================================================================
# UTILISATEUR PERSONNALISÉ
# ==============================================================================

class User(AbstractUser):
    """
    Modèle utilisateur étendu avec AbstractUser pour gérer les rôles spécifiques
    à l'association ININ. Remplace le modèle User par défaut de Django.
    Tout utilisateur du site est forcément lié à un profil Membre.
    Un ADMINISTRATEUR correspond à un Président ou Vice-Président.
    """

    class Role(models.TextChoices):
        ADMINISTRATEUR     = 'ADMIN',              'Administrateur'
        TRESORIER          = 'TRESORIER',           'Trésorier'
        CHARGE_PROJET      = 'CHARGE_PROJET',       'Chargé de Projet'
        RESPONSABLE_RH     = 'RESPONSABLE_RH',      'Responsable RH'
        CHARGE_PARTENARIAT = 'CHARGE_PARTENARIAT',  'Chargé de Partenariat'
        MEMBRE             = 'MEMBRE',              'Membre / Bénévole'

    # Table de correspondance type_membre → rôle User
    # Centralise la règle métier en un seul endroit
    TYPE_MEMBRE_TO_ROLE = {
        'PRESIDENT':          'ADMIN',
        'VICE_PRESIDENT':     'ADMIN',
        'TRESORIER':          'TRESORIER',
        'CHARGE_PROJET':      'CHARGE_PROJET',
        'RESPONSABLE_RH':     'RESPONSABLE_RH',
        'CHARGE_PARTENARIAT': 'CHARGE_PARTENARIAT',
        'RESPONSABLE_COM':    'MEMBRE',
        'SECRETAIRE':         'MEMBRE',
        'BENEVOLE':           'MEMBRE',
        'MEMBRE_ACTIF':       'MEMBRE',
    }

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MEMBRE,
        verbose_name="Rôle"
    )

    telephone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    
    bio = models.TextField(
       blank=True, null=True,
       verbose_name="Bio / Description"
   )
    email = models.EmailField(unique=True, verbose_name="Email")
    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"

    # --- Propriétés de rôle ---

    @property
    def est_administrateur(self):
        return self.role == self.Role.ADMINISTRATEUR

    @property
    def est_tresorier(self):
        return self.role == self.Role.TRESORIER

    @property
    def est_charge_projet(self):
        return self.role == self.Role.CHARGE_PROJET

    @property
    def est_responsable_rh(self):
        return self.role == self.Role.RESPONSABLE_RH

    @property
    def est_charge_partenariat(self):
        return self.role == self.Role.CHARGE_PARTENARIAT

    @property
    def est_membre(self):
        return self.role == self.Role.MEMBRE

    @property
    def peut_modifier(self):
        """
        True pour tous les rôles ayant accès aux pages avancées et
        aux actions de modification (tout sauf Membre simple).
        Utiliser ce raccourci dans les views/decorators/permissions.
        """
        return self.role in (
            self.Role.ADMINISTRATEUR,
            self.Role.TRESORIER,
            self.Role.CHARGE_PROJET,
            self.Role.RESPONSABLE_RH,
            self.Role.CHARGE_PARTENARIAT,
        )

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"


# ==============================================================================
# MEMBRE / BÉNÉVOLE
# ==============================================================================

class Membre(models.Model):
    """
    Profil pour les membres et bénévoles de l'association.
    - Un membre peut ne pas avoir de compte User (bénévole sans accès au site).
    - Tout utilisateur du site est forcément lié à un Membre via profil_membre.
    - On utilise SET_NULL pour conserver l'historique si le compte User est supprimé.
    - La sauvegarde synchronise automatiquement le rôle User avec le type_membre.
    """

    class Statut(models.TextChoices):
        ACTIF      = 'ACTIF',      'Actif'
        INACTIF    = 'INACTIF',    'Inactif'
        EN_ATTENTE = 'EN_ATTENTE', 'En attente de validation'

    class TypeMembre(models.TextChoices):
        PRESIDENT          = 'PRESIDENT',          'Président'
        VICE_PRESIDENT     = 'VICE_PRESIDENT',      'Vice-Président'
        SECRETAIRE         = 'SECRETAIRE',          'Secrétaire'
        TRESORIER          = 'TRESORIER',           'Trésorier'
        RESPONSABLE_RH     = 'RESPONSABLE_RH',      'Responsable RH'
        RESPONSABLE_COM    = 'RESPONSABLE_COM',     'Responsable Communication'
        CHARGE_PROJET      = 'CHARGE_PROJET',       'Chargé de Projet'
        CHARGE_PARTENARIAT = 'CHARGE_PARTENARIAT',  'Chargé de Partenariat'
        BENEVOLE           = 'BENEVOLE',            'Bénévole'
        MEMBRE_ACTIF       = 'MEMBRE_ACTIF',        'Membre Actif'

    # Liaison vers le compte utilisateur (NULL si le compte est supprimé ou absent)
    utilisateur = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='profil_membre',
        verbose_name="Compte utilisateur"
    )

    nom = models.CharField(max_length=100, verbose_name="Nom")
    prenom = models.CharField(max_length=100, verbose_name="Prénom")
    email = models.EmailField(unique=True, verbose_name="Email")
    telephone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    date_adhesion = models.DateField(verbose_name="Date d'adhésion")
    type_membre = models.CharField(
        max_length=20,
        choices=TypeMembre.choices,
        default=TypeMembre.BENEVOLE,
        verbose_name="Type"
    )
    statut = models.CharField(
        max_length=15,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
        verbose_name="Statut"
    )
    adresse = models.TextField(blank=True, null=True, verbose_name="Adresse")
    photo_profil = models.ImageField(
        upload_to='membres/photos/',
        blank=True,
        null=True,
        verbose_name="Photo de profil"
    )
    class Sexe(models.TextChoices):
        HOMME  = 'HOMME',  'Homme'
        FEMME  = 'FEMME',  'Femme'
        AUTRE  = 'AUTRE',  'Autre / Non précisé'

    date_naissance = models.DateField(
        blank=True,
        null=True,
        verbose_name="Date de naissance"
    )
    sexe = models.CharField(
        max_length=10,
        choices=Sexe.choices,
        blank=True,
        null=True,
        verbose_name="Sexe"
    )

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.prenom} {self.nom} - {self.get_type_membre_display()}"

    def get_full_name(self):
        return f"{self.prenom} {self.nom}"

    def synchroniser_role_utilisateur(self):
        """
        Synchronise le rôle du compte User lié avec ce type_membre.
        Utilise .update() pour éviter tout signal récursif côté User.
        """
        if self.utilisateur_id:
            nouveau_role = User.TYPE_MEMBRE_TO_ROLE.get(self.type_membre, User.Role.MEMBRE)
            if self.utilisateur.role != nouveau_role:
                User.objects.filter(pk=self.utilisateur_id).update(role=nouveau_role)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.synchroniser_role_utilisateur()
    
    @property
    def age(self):
        """Calcule l'âge à partir de la date de naissance."""
        if not self.date_naissance:
            return None
        from datetime import date
        today = date.today()
        return today.year - self.date_naissance.year - (
            (today.month, today.day) < (self.date_naissance.month, self.date_naissance.day)
        )

    class Meta:
        verbose_name = "Membre"
        verbose_name_plural = "Membres"
        ordering = ['nom', 'prenom']


# ==============================================================================
# PARTENAIRE
# ==============================================================================

class Partenaire(models.Model):
    """
    Partenaire externe (organisation, entreprise, institution) qui peut
    soutenir ou co-financer des actions de l'association.
    """

    class Statut(models.TextChoices):
        ACTIF   = 'ACTIF',   'Actif'
        INACTIF = 'INACTIF', 'Inactif'

    nom = models.CharField(max_length=200, verbose_name="Nom du partenaire")
    type = models.CharField(max_length=100, blank=True, verbose_name="Type (ONG, Entreprise, etc.)")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    telephone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    statut = models.CharField(
        max_length=10,
        choices=Statut.choices,
        default=Statut.ACTIF,
        verbose_name="Statut"
    )
    description = models.TextField(blank=True, null=True, verbose_name="Description")

    logo = models.ImageField(
       upload_to='partenaires/logos/',
       blank=True,
       null=True,
       verbose_name="Logo"
    )


    date_debut = models.DateField(verbose_name="Date de début du partenariat")
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} ({self.get_statut_display()})"

    class Meta:
        verbose_name = "Partenaire"
        verbose_name_plural = "Partenaires"
        ordering = ['nom']


# ==============================================================================
# ACTION (PROJET)
# ==============================================================================

class Action(models.Model):
    """
    Représente une action ou un projet mené par l'association.
    Liée à un responsable (Chargé de projet) et potentiellement à des partenaires.
    Si le responsable est supprimé, on met NULL (SET_NULL) pour ne pas perdre l'action.
    """

    class TypeAction(models.TextChoices):
        SENSIBILISATION = 'SENSIBILISATION', 'Sensibilisation'
        EDUCATION       = 'EDUCATION',       'Éducation'
        ACCOMPAGNEMENT  = 'ACCOMPAGNEMENT',  'Accompagnement'
        SOLIDARITE      = 'SOLIDARITE',      'Action Solidaire'
        FORMATION       = 'FORMATION',       'Formation'
        AUTRE           = 'AUTRE',           'Autre'

    class StatutAction(models.TextChoices):
        EN_COURS  = 'EN_COURS',  'En cours'
        PLANIFIEE = 'PLANIFIEE', 'Planifiée'
        CLOTUREE  = 'CLOTUREE',  'Clôturée'
        ANNULEE   = 'ANNULEE',   'Annulée'

    titre = models.CharField(max_length=200, verbose_name="Titre de l'action")
    type = models.CharField(
        max_length=20,
        choices=TypeAction.choices,
        default=TypeAction.SENSIBILISATION,
        verbose_name="Type d'action"
    )
    description = models.TextField(verbose_name="Description")
    date_debut = models.DateField(verbose_name="Date de début")
    date_cloture = models.DateField(blank=True, null=True, verbose_name="Date de clôture")
    lieu = models.CharField(max_length=200, blank=True, null=True, verbose_name="Lieu")
    budget_prevu = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Budget prévu (FCFA)"
    )
    statut = models.CharField(
        max_length=15,
        choices=StatutAction.choices,
        default=StatutAction.PLANIFIEE,
        verbose_name="Statut"
    )
    compte_rendu = models.TextField(blank=True, null=True, verbose_name="Compte rendu")

    nb_participants = models.PositiveIntegerField(
        default=0,
        verbose_name="Nombre de participants (legacy/manuel)"
    )

    # Si null → inscriptions illimitées
    nb_participants_max = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Capacité maximale",
        help_text="Laisser vide pour des inscriptions illimitées."
    )

    # ... reste de vos champs ...

    # ✅ Point 1 — Compte dynamique depuis la table Inscription
    @property
    def nb_inscrits(self):
        """
        Retourne le nombre d'inscrits calculé dynamiquement
        depuis la table Inscription. Ne lit jamais nb_participants.
        """
        return self.inscriptions.count()

    # ✅ BONUS — Booléen calculé : action complète ?
    @property
    def is_full(self):
        """
        True si la capacité maximale est définie ET atteinte.
        False si nb_participants_max est null (illimité).
        """
        if self.nb_participants_max is None:
            return False
        return self.inscriptions.count() >= self.nb_participants_max

    # Responsable : Chargé de projet. SET_NULL pour ne pas supprimer l'action si l'utilisateur part.
    responsable = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='actions_responsable',
        verbose_name="Responsable"
    )

    # Partenaires : relation ManyToMany, une action peut avoir plusieurs partenaires
    partenaires = models.ManyToManyField(
        Partenaire,
        blank=True,
        related_name='actions_soutenues',
        verbose_name="Partenaires"
    )

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.titre} ({self.get_statut_display()})"

    def calcule_depenses_reelles(self):
        """Calcule le total des dépenses réelles associées à cette action."""
        return self.depenses.aggregate(
            total=models.Sum('montant')
        )['total'] or Decimal('0.00')

    def genere_rapport(self):
        """Retourne un résumé financier de l'action."""
        return {
            'titre': self.titre,
            'budget_prevu': self.budget_prevu,
            'depenses_reelles': self.calcule_depenses_reelles(),
            'nb_participants': self.nb_participants,
        }

    class Meta:
        verbose_name = "Action"
        verbose_name_plural = "Actions"
        ordering = ['-date_debut']


# ==============================================================================
# PHOTO D'ACTION
# ==============================================================================

class PhotoAction(models.Model):
    """
    Photos associées à une action. CASCADE : si l'action est supprimée,
    les photos le sont aussi (elles n'ont pas de sens sans l'action).
    """
    action = models.ForeignKey(
        Action,
        on_delete=models.CASCADE,
        related_name='photos',
        verbose_name="Action"
    )
    image = models.ImageField(upload_to='actions/photos/', verbose_name="Photo")
    legende = models.CharField(max_length=200, blank=True, null=True, verbose_name="Légende")
    date_ajout = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo de {self.action.titre} ({self.date_ajout.date()})"

    class Meta:
        verbose_name = "Photo d'action"
        verbose_name_plural = "Photos d'actions"


# ==============================================================================
# DÉPENSE
# ==============================================================================

class Depense(models.Model):
    """
    Enregistre une dépense de l'association.
    Peut être liée à une action (SET_NULL : la dépense reste si l'action est supprimée).
    Enregistre obligatoirement l'auteur de la saisie et la date.
    """

    class Categorie(models.TextChoices):
        COMMUNICATION = 'COMMUNICATION', 'Communication'
        LOCATION      = 'LOCATION',      'Location de salle'
        INTERVENANT   = 'INTERVENANT',   'Rémunération intervenant'
        MATERIEL      = 'MATERIEL',      'Matériel pédagogique'
        TRANSPORT     = 'TRANSPORT',     'Transport'
        RESTAURATION  = 'RESTAURATION',  'Restauration'
        ADMINISTRATIF = 'ADMINISTRATIF', 'Frais administratifs'
        AUTRE         = 'AUTRE',         'Autre'

    class Statut(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente de validation'
        VALIDEE    = 'VALIDEE',    'Validée'
        REJETEE    = 'REJETEE',    'Rejetée'

    montant = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Montant (FCFA)"
    )
    date_depense = models.DateField(verbose_name="Date de la dépense")
    categorie = models.CharField(
        max_length=20,
        choices=Categorie.choices,
        verbose_name="Catégorie"
    )
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    statut = models.CharField(
        max_length=15,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
        verbose_name="Statut"
    )

    # Justificatif : PDF ou image
    justificatif = models.FileField(
        upload_to='depenses/justificatifs/',
        blank=True,
        null=True,
        verbose_name="Justificatif (PDF/Image)"
    )

    # Action associée : SET_NULL pour conserver la dépense si l'action est archivée/supprimée
    action = models.ForeignKey(
        Action,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='depenses',
        verbose_name="Action associée"
    )

    # Auteur de la saisie : SET_NULL pour conserver la trace si l'utilisateur est supprimé
    saisi_par = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='depenses_saisies',
        verbose_name="Saisi par"
    )

    # Validateur de la dépense (Trésorier)
    valide_par = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='depenses_validees',
        verbose_name="Validé par"
    )

    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dépense {self.montant} FCFA - {self.get_categorie_display()} ({self.date_depense})"

    class Meta:
        verbose_name = "Dépense"
        verbose_name_plural = "Dépenses"
        ordering = ['-date_depense']


# ==============================================================================
# DON
# ==============================================================================

class Don(models.Model):
    """
    Enregistre un don reçu par l'association.
    Un don peut être lié à un donateur identifié (Membre ou externe) ou rester anonyme.
    Il peut aussi être fléché vers une action spécifique.
    """

    class ModePaiement(models.TextChoices):
        ESPECES      = 'ESPECES',      'Espèces'
        VIREMENT     = 'VIREMENT',     'Virement bancaire'
        MOBILE_MONEY = 'MOBILE_MONEY', 'Mobile Money'
        CHEQUE       = 'CHEQUE',       'Chèque'
        EN_LIGNE     = 'EN_LIGNE',     'Paiement en ligne'
        AUTRE        = 'AUTRE',        'Autre'

    montant = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Montant (FCFA)"
    )
    date_don = models.DateField(verbose_name="Date du don")
    mode_paiement = models.CharField(
        max_length=20,
        choices=ModePaiement.choices,
        default=ModePaiement.ESPECES,
        verbose_name="Mode de paiement"
    )
    anonyme = models.BooleanField(default=False, verbose_name="Don anonyme")

    # Donateur identifié (peut être NULL si anonyme ou si donateur externe non-membre)
    donateur_membre = models.ForeignKey(
        Membre,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dons',
        verbose_name="Donateur (membre)"
    )

    # Nom du donateur si externe et non anonyme
    nom_donateur_externe = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Nom du donateur (externe)"
    )

    # Partenaire donateur
    donateur_partenaire = models.ForeignKey(
        Partenaire,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dons_effectues',
        verbose_name="Partenaire donateur"
    )

    # Action financée par ce don (facultatif)
    action = models.ForeignKey(
        Action,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dons',
        verbose_name="Action financée"
    )

    # Trésorier ayant validé le don
    valide_par = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dons_valides',
        verbose_name="Validé par"
    )

    recu_genere = models.BooleanField(default=False, verbose_name="Reçu généré")
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        donateur = "Anonyme" if self.anonyme else (
            self.nom_donateur_externe or
            (str(self.donateur_membre) if self.donateur_membre else "Inconnu")
        )
        return f"Don de {self.montant} FCFA par {donateur} le {self.date_don}"

    def get_donateur_display(self):
        """Retourne le nom du donateur selon le type."""
        if self.anonyme:
            return "Anonyme"
        if self.donateur_membre:
            return self.donateur_membre.get_full_name()
        if self.donateur_partenaire:
            return self.donateur_partenaire.nom
        return self.nom_donateur_externe or "Non renseigné"

    class Meta:
        verbose_name = "Don"
        verbose_name_plural = "Dons"
        ordering = ['-date_don']


# ==============================================================================
# COTISATION
# ==============================================================================

class Cotisation(models.Model):
    """
    Enregistre le paiement d'une cotisation d'un membre.
    CASCADE : si le membre est supprimé, ses cotisations sont supprimées aussi
    (pas de sens de conserver des cotisations sans membre lié).
    """

    class Statut(models.TextChoices):
        PAYEE      = 'PAYEE',      'Payée'
        IMPAYEE    = 'IMPAYEE',    'Impayée'
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'

    class Periodicite(models.TextChoices):
        MENSUELLE      = 'MENSUELLE',      'Mensuelle'
        TRIMESTRIELLE  = 'TRIMESTRIELLE',  'Trimestrielle'
        ANNUELLE       = 'ANNUELLE',       'Annuelle'

    # CASCADE : la cotisation est supprimée si le membre est supprimé
    membre = models.ForeignKey(
        Membre,
        on_delete=models.CASCADE,
        related_name='cotisations',
        verbose_name="Membre"
    )

    montant = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Montant (FCFA)"
    )
    date_paiement = models.DateField(
        blank=True,
        null=True,
        verbose_name="Date de paiement"
    )
    statut = models.CharField(
        max_length=15,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
        verbose_name="Statut"
    )
    periodicite = models.CharField(
        max_length=15,
        choices=Periodicite.choices,
        default=Periodicite.ANNUELLE,
        verbose_name="Périodicité"
    )
    periode_concernee = models.CharField(
        max_length=50,
        verbose_name="Période concernée",
        help_text="Ex: 2024, T1-2024, Janvier 2024"
    )

    # Trésorier ayant enregistré/validé la cotisation
    enregistre_par = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cotisations_enregistrees',
        verbose_name="Enregistré par"
    )

    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cotisation {self.membre} - {self.periode_concernee} ({self.get_statut_display()})"

    class Meta:
        verbose_name = "Cotisation"
        verbose_name_plural = "Cotisations"
        ordering = ['-date_paiement']
        # Un membre ne peut pas avoir deux cotisations pour la même période
        unique_together = ('membre', 'periode_concernee', 'periodicite')


# ==============================================================================
# DEMANDE D'ADHÉSION (Visiteur public)
# ==============================================================================



def valider_document_adhesion(value):
    """
    Valide le document joint à une demande d'adhésion.
    Rejette :
      - les fichiers > 5 Mo
      - les extensions autres que .jpg, .jpeg, .png, .pdf
    """
    ext = os.path.splitext(value.name)[1].lower()
    extensions_autorisees = ['.jpg', '.jpeg', '.png', '.pdf']

    if ext not in extensions_autorisees:
        raise DjangoValidationError(
            f"Extension « {ext} » non autorisée. "
            f"Formats acceptés : {', '.join(extensions_autorisees)}."
        )
    if value.size > 5 * 1024 * 1024:
        raise DjangoValidationError(
            "Fichier trop volumineux. Taille maximale : 5 Mo."
        )


class DemandeAdhesion(models.Model):
    """
    Formulaire de demande d'adhésion soumis par un visiteur public.
    Permet au futur membre de manifester son intérêt avant validation par un admin.
    Une fois acceptée, un Membre (et optionnellement un User) sera créé par l'admin.
    """

    class Statut(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'
        ACCEPTEE   = 'ACCEPTEE',   'Acceptée'
        REJETEE    = 'REJETEE',    'Rejetée'

    class TypeMembreSouhaite(models.TextChoices):
        MEMBRE     = 'MEMBRE',     'Membre'
        BENEVOLE   = 'BENEVOLE',   'Bénévole'
        PARTENAIRE = 'PARTENAIRE', 'Partenaire'

    class DomaineExpertise(models.TextChoices):
        SANTE_MENTALE  = 'SANTE_MENTALE',  'Santé mentale & psychologie'
        SANTE_PHYSIQUE = 'SANTE_PHYSIQUE', 'Santé physique & sport'
        EDUCATION      = 'EDUCATION',      'Éducation & pédagogie'
        COMMUNICATION  = 'COMMUNICATION',  'Communication & médias'
        TECHNOLOGIE    = 'TECHNOLOGIE',    'Technologie & numérique'
        DROIT          = 'DROIT',          'Droit & plaidoyer'
        FINANCE        = 'FINANCE',        'Finance & gestion'
        LOGISTIQUE     = 'LOGISTIQUE',     'Logistique & coordination'
        ART_CULTURE    = 'ART_CULTURE',    'Art & culture'
        AUTRE          = 'AUTRE',          'Autre'

    # ── Champs d'identité (existants) ─────────────────────────
    nom       = models.CharField(max_length=100, verbose_name="Nom")
    prenom    = models.CharField(max_length=100, verbose_name="Prénom")
    email     = models.EmailField(verbose_name="Email")
    telephone = models.CharField(
        max_length=20, blank=True, null=True, verbose_name="Téléphone"
    )
    motivation = models.TextField(verbose_name="Motivation / Message")

    # ── Nouveaux champs personnels ─────────────────────────────
    type_membre_souhaite = models.CharField(
        max_length=15,
        choices=TypeMembreSouhaite.choices,
        default=TypeMembreSouhaite.MEMBRE,
        verbose_name="Type de membre souhaité"
    )
    date_naissance = models.DateField(
        blank=True, null=True, verbose_name="Date de naissance"
    )
    adresse = models.TextField(
        blank=True, null=True, verbose_name="Adresse"
    )
    domaine_expertise = models.CharField(
        max_length=20,
        choices=DomaineExpertise.choices,
        blank=True, null=True,
        verbose_name="Domaine d'expertise"
    )
    profil_linkedin = models.URLField(
        blank=True, null=True, verbose_name="Profil LinkedIn"
    )
    # Remplace CV + photo en un seul champ — validé par valider_document_adhesion
    document = models.FileField(
        upload_to='demandes/documents/',
        blank=True, null=True,
        validators=[valider_document_adhesion],
        verbose_name="Document joint (CV, photo — JPG/PNG/PDF, max 5 Mo)"
    )

    # ── Statut & workflow (existants) ──────────────────────────
    statut = models.CharField(
        max_length=15,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
        verbose_name="Statut"
    )
    traite_par = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='demandes_traitees',
        verbose_name="Traité par"
    )
    date_demande    = models.DateTimeField(auto_now_add=True)
    date_traitement = models.DateTimeField(
        blank=True, null=True, verbose_name="Date de traitement"
    )

    def __str__(self):
        return f"Demande de {self.prenom} {self.nom} ({self.get_statut_display()})"

    def clean(self):
        if self.traite_par and self.traite_par.role not in (
            User.Role.ADMINISTRATEUR,
            User.Role.RESPONSABLE_RH,
        ):
            raise ValidationError(
                "Seul un Administrateur ou un Responsable RH peut traiter "
                "une demande d'adhésion."
            )

    class Meta:
        verbose_name        = "Demande d'adhésion"
        verbose_name_plural = "Demandes d'adhésion"
        ordering            = ['-date_demande']

class Inscription(models.Model):
    """
    Représente l'inscription d'un utilisateur à une action.
    La contrainte unique_together empêche les doublons.
    """
    action      = models.ForeignKey(
        Action,
        on_delete=models.CASCADE,
        related_name='inscriptions'
    )
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='inscriptions_actions'
    )
    date_inscription = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('action', 'utilisateur')
        ordering        = ['-date_inscription']
        verbose_name    = "Inscription"
        verbose_name_plural = "Inscriptions"

    def __str__(self):
        return f"{self.utilisateur} → {self.action.titre}"