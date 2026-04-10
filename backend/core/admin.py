# core/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Membre, Partenaire,
    Action, PhotoAction,
    Don, Cotisation, Depense,
    DemandeAdhesion, Inscription,
)


# ==============================================================================
# USER
# ==============================================================================

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['email', 'first_name', 'last_name', 'role', 'is_active']
    list_filter   = ['role', 'is_active', 'is_staff']
    search_fields = ['email', 'first_name', 'last_name']
    ordering      = ['email']

    fieldsets = (
        (None,           {'fields': ('email', 'username', 'password')}),
        ('Informations', {'fields': ('first_name', 'last_name', 'telephone', 'bio')}),
        ('Rôle',         {'fields': ('role',)}),
        ('Permissions',  {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates',        {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )


# ==============================================================================
# MEMBRE
# ==============================================================================

@admin.register(Membre)
class MembreAdmin(admin.ModelAdmin):
    list_display  = ['nom', 'prenom', 'email', 'type_membre', 'statut', 'date_adhesion']
    list_filter   = ['type_membre', 'statut', 'sexe']
    search_fields = ['nom', 'prenom', 'email', 'telephone']
    ordering      = ['nom', 'prenom']
    readonly_fields = ['date_creation', 'date_modification']

    fieldsets = (
        ('Identité',      {'fields': ('nom', 'prenom', 'email', 'telephone', 'adresse', 'sexe', 'date_naissance', 'photo_profil')}),
        ('Adhésion',      {'fields': ('type_membre', 'statut', 'date_adhesion')}),
        ('Compte',        {'fields': ('utilisateur',)}),
        ('Dates système', {'fields': ('date_creation', 'date_modification')}),
    )


# ==============================================================================
# PARTENAIRE
# ==============================================================================

@admin.register(Partenaire)
class PartenaireAdmin(admin.ModelAdmin):
    list_display  = ['nom', 'type', 'email', 'statut', 'date_debut']
    list_filter   = ['statut']
    search_fields = ['nom', 'type', 'email']
    ordering      = ['nom']
    readonly_fields = ['date_creation']

    fieldsets = (
        ('Informations', {'fields': ('nom', 'type', 'email', 'telephone', 'description', 'logo')}),
        ('Partenariat',  {'fields': ('statut', 'date_debut')}),
        ('Dates',        {'fields': ('date_creation',)}),
    )


# ==============================================================================
# ACTION
# ==============================================================================

class PhotoActionInline(admin.TabularInline):
    model  = PhotoAction
    extra  = 1
    fields = ['image', 'legende']


class DepenseInline(admin.TabularInline):
    model  = Depense
    extra  = 0
    fields = ['montant', 'date_depense', 'categorie', 'statut']
    readonly_fields = ['date_creation']
    show_change_link = True


@admin.register(Action)
class ActionAdmin(admin.ModelAdmin):

    # ✅ Point 3 — nb_inscrits remplace nb_participants dans list_display
    list_display    = [
        'titre', 'type', 'statut', 'responsable',
        'date_debut', 'get_nb_inscrits',     # ← dynamique
        'nb_participants_max', 'get_is_full', # ← bonus
    ]
    list_filter     = ['type', 'statut']
    search_fields   = ['titre', 'lieu', 'description']
    ordering        = ['-date_debut']
    readonly_fields = ['date_creation', 'date_modification', 'get_nb_inscrits', 'get_is_full']
    filter_horizontal = ['partenaires']
    inlines         = [PhotoActionInline, DepenseInline]

    fieldsets = (
        ('Général',       {'fields': ('titre', 'type', 'description', 'lieu')}),
        ('Planification', {'fields': ('statut', 'date_debut', 'date_cloture', 'responsable')}),
        ('Budget',        {'fields': ('budget_prevu',)}),
        ('Participants',  {'fields': ('nb_participants_max', 'get_nb_inscrits', 'get_is_full', 'compte_rendu')}),
        ('Partenaires',   {'fields': ('partenaires',)}),
        ('Dates',         {'fields': ('date_creation', 'date_modification')}),
    )

    # ✅ Méthode admin pour afficher nb_inscrits (avec tri désactivé car @property)
    @admin.display(description='Inscrits', ordering=None)
    def get_nb_inscrits(self, obj):
        return obj.nb_inscrits

    # ✅ Méthode admin pour afficher is_full avec icône ✅/❌
    @admin.display(description='Complet ?', boolean=True)
    def get_is_full(self, obj):
        return obj.is_full


# ==============================================================================
# PHOTO ACTION (accès direct si besoin)
# ==============================================================================

@admin.register(PhotoAction)
class PhotoActionAdmin(admin.ModelAdmin):
    list_display  = ['action', 'legende', 'date_ajout']
    search_fields = ['action__titre', 'legende']
    ordering      = ['-date_ajout']
    readonly_fields = ['date_ajout']


# ==============================================================================
# DÉPENSE
# ==============================================================================

@admin.register(Depense)
class DepenseAdmin(admin.ModelAdmin):
    list_display  = ['montant', 'categorie', 'statut', 'action', 'saisi_par', 'date_depense']
    list_filter   = ['categorie', 'statut']
    search_fields = ['description', 'action__titre']
    ordering      = ['-date_depense']
    readonly_fields = ['date_creation']

    fieldsets = (
        ('Dépense',    {'fields': ('montant', 'date_depense', 'categorie', 'description', 'justificatif')}),
        ('Validation', {'fields': ('statut', 'saisi_par', 'valide_par')}),
        ('Liaison',    {'fields': ('action',)}),
        ('Dates',      {'fields': ('date_creation',)}),
    )


# ==============================================================================
# DON
# ==============================================================================

@admin.register(Don)
class DonAdmin(admin.ModelAdmin):
    list_display  = ['montant', 'date_don', 'mode_paiement', 'anonyme', 'valide_par', 'recu_genere']
    list_filter   = ['mode_paiement', 'anonyme', 'recu_genere']
    search_fields = ['nom_donateur_externe', 'donateur_membre__nom', 'donateur_partenaire__nom']
    ordering      = ['-date_don']
    readonly_fields = ['date_creation']

    fieldsets = (
        ('Don',       {'fields': ('montant', 'date_don', 'mode_paiement', 'anonyme', 'notes')}),
        ('Donateur',  {'fields': ('donateur_membre', 'nom_donateur_externe', 'donateur_partenaire')}),
        ('Liaison',   {'fields': ('action', 'valide_par', 'recu_genere')}),
        ('Dates',     {'fields': ('date_creation',)}),
    )


# ==============================================================================
# COTISATION
# ==============================================================================

@admin.register(Cotisation)
class CotisationAdmin(admin.ModelAdmin):
    list_display  = ['membre', 'montant', 'statut', 'periodicite', 'periode_concernee', 'date_paiement']
    list_filter   = ['statut', 'periodicite']
    search_fields = ['membre__nom', 'membre__prenom', 'periode_concernee']
    ordering      = ['-date_paiement']
    readonly_fields = ['date_creation']

    fieldsets = (
        ('Cotisation', {'fields': ('membre', 'montant', 'date_paiement', 'statut')}),
        ('Période',    {'fields': ('periodicite', 'periode_concernee')}),
        ('Suivi',      {'fields': ('enregistre_par', 'notes')}),
        ('Dates',      {'fields': ('date_creation',)}),
    )


# ==============================================================================
# DEMANDE D'ADHÉSION
# ==============================================================================
@admin.register(DemandeAdhesion)
class DemandeAdhesionAdmin(admin.ModelAdmin):

    list_display = [
        'prenom', 'nom', 'email', 'telephone',
        'type_membre_souhaite', 'domaine_expertise',
        'statut', 'date_demande', 'traite_par',
    ]

    list_filter  = ['statut', 'type_membre_souhaite', 'domaine_expertise', 'date_demande']
    search_fields = ['nom', 'prenom', 'email', 'telephone']
    ordering      = ['-date_demande']
    readonly_fields = ['date_demande', 'date_traitement', 'traite_par']

    fieldsets = (
        ('Identité', {
            'fields': ('prenom', 'nom', 'email', 'telephone', 'date_naissance', 'adresse')
        }),
        ('Adhésion', {
            'fields': ('type_membre_souhaite', 'domaine_expertise', 'motivation')
        }),
        ('Documents & Liens', {
            'fields': ('profil_linkedin', 'document')
        }),
        ('Traitement', {
            'fields': ('statut', 'traite_par', 'date_demande', 'date_traitement')
        }),
    )

# ==============================================================================
# INSCRIPTION
# ==============================================================================

@admin.register(Inscription)
class InscriptionAdmin(admin.ModelAdmin):
    list_display  = ['utilisateur', 'action', 'date_inscription']
    list_filter   = ['action__statut']
    search_fields = ['utilisateur__email', 'action__titre']
    ordering      = ['-date_inscription']
    readonly_fields = ['date_inscription']