# core/admin.py
# ══════════════════════════════════════════════════════════════════════════════
# Administration Django — Association ININ
#
# Modèles enregistrés :
#   ✅ User          — UserAdmin avec email, pastilles rôle/statut
#   ✅ Don           — filtres date/statut/mode, recherche, action "valider"
#   ✅ Cotisation     — filtres date/statut/mode, recherche
#   ✅ Action         — participants, budget, filtre statut
#   ✅ Depense        — montant, catégorie, indicateur justificatif
#   ✅ Membre         — profil complet, recherche étendue
#   ✅ DemandeAdhesion — suivi des candidatures
# ══════════════════════════════════════════════════════════════════════════════

from django.contrib              import admin
from django.contrib.auth.admin   import UserAdmin as BaseUserAdmin
from django.utils.html           import format_html
from django.utils.translation    import gettext_lazy as _
from django.db.models            import Sum, Count

from .models import (
    User,
    Membre,
    Action,
    Don,
    Cotisation,
    Depense,
    DemandeAdhesion,
)


# ──────────────────────────────────────────────────────────────────────────────
# Personnalisation du site admin
# ──────────────────────────────────────────────────────────────────────────────
admin.site.site_header  = "Association ININ — Administration"
admin.site.site_title   = "ININ Admin"
admin.site.index_title  = "Tableau de bord administratif"


# ══════════════════════════════════════════════════════════════════════════════
# Helpers visuels (pastilles HTML)
# ══════════════════════════════════════════════════════════════════════════════

# Palette par rôle
ROLE_COLORS = {
    'ADMINISTRATEUR':   ('#dc2626', '#fef2f2'),   # rouge
    'TRESORIER':        ('#d97706', '#fffbeb'),   # orange
    'CHARGE_PROJET':    ('#1640c8', '#eef5ff'),   # bleu azur
    'RESPONSABLE_RH':   ('#7c3aed', '#f5f3ff'),   # violet
    'CHARGE_PARTENARIAT':('#059669','#ecfdf5'),   # vert
    'MEMBRE':           ('#64748b', '#f1f5f9'),   # gris
}

# Palette par statut (Don / Cotisation)
STATUT_COLORS = {
    # Dons
    'RECU':     ('#1640c8', '#eef5ff'),
    'VALIDE':   ('#059669', '#ecfdf5'),
    'ANNULE':   ('#dc2626', '#fef2f2'),
    # Cotisations
    'EN_ATTENTE': ('#d97706', '#fffbeb'),
    'PAYE':       ('#059669', '#ecfdf5'),
    'RETARD':     ('#dc2626', '#fef2f2'),
    'EXONERE':    ('#7c3aed', '#f5f3ff'),
    # Actions
    'PLANIFIEE':  ('#1640c8', '#eef5ff'),
    'EN_COURS':   ('#059669', '#ecfdf5'),
    'CLOTUREE':   ('#64748b', '#f1f5f9'),
    'ANNULEE':    ('#dc2626', '#fef2f2'),
    # Dépenses
    'EN_ATTENTE_VALID': ('#d97706', '#fffbeb'),
    'VALIDE_DEP':       ('#059669', '#ecfdf5'),
    'REJETE':           ('#dc2626', '#fef2f2'),
}


def pastille(texte, couleur_texte, couleur_fond):
    """Renvoie une pastille HTML colorée inline."""
    return format_html(
        '<span style="'
        'display:inline-block;padding:3px 10px;border-radius:100px;'
        'font-size:11px;font-weight:700;letter-spacing:.04em;'
        'color:{};background:{};white-space:nowrap;">'
        '{}</span>',
        couleur_texte, couleur_fond, texte,
    )


def pastille_role(role, label=None):
    fg, bg = ROLE_COLORS.get(role, ('#64748b', '#f1f5f9'))
    return pastille(label or role, fg, bg)


def pastille_statut(statut, label=None):
    fg, bg = STATUT_COLORS.get(statut, ('#64748b', '#f1f5f9'))
    return pastille(label or statut, fg, bg)


# ══════════════════════════════════════════════════════════════════════════════
# 1. USER — identifiant email, pastilles rôle & statut
# ══════════════════════════════════════════════════════════════════════════════

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # ── Identifiant principal = email ──────────────────────────
    ordering          = ('-date_joined',)
    list_per_page     = 25

    # ── Liste principale ───────────────────────────────────────
    list_display = (
        'email', 'full_name_display', 'role_badge',
        'statut_actif_badge', 'date_joined',
    )
    list_filter  = ('role', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name', 'username')
    readonly_fields = ('date_joined', 'last_login')

    # ── Formulaire d'édition (utilisateur existant) ────────────
    fieldsets = (
        (None, {
            'fields': ('username', 'email', 'password'),
        }),
        (_('Informations personnelles'), {
            'fields': ('first_name', 'last_name', 'photo_profil'),
        }),
        (_('Rôle & permissions'), {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser',
                       'groups', 'user_permissions'),
        }),
        (_('Dates importantes'), {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',),
        }),
    )

    # ── Formulaire de CRÉATION (add_fieldsets) ─────────────────
    # Inclut email, mot de passe haché, prénom, nom et rôle — obligatoires
    add_fieldsets = (
        (None, { # On peut mettre None si on ne veut pas de titre au premier bloc
            "classes": ("wide",),
            "fields": ("email", "username", "password"), # Utilise 'password' ou ('password1', 'password2') selon ton formulaire
            "description": (
                "L'email sert d'identifiant principal. "
                "Le mot de passe sera automatiquement haché par Django."
            ),
        }),
        ("Identité", {
            "classes": ("wide",),
            "fields": ("first_name", "last_name", "photo_profil"),
        }),
        ("Rôle dans l'association", {
            "classes": ("wide",),
            "fields": ("role", "is_active", "is_staff"),
        }),
    )

    # ── Méthodes d'affichage ───────────────────────────────────
    @admin.display(description='Nom complet', ordering='last_name')
    def full_name_display(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or format_html('<em style="color:#94a3b8">—</em>')

    @admin.display(description='Rôle', ordering='role')
    def role_badge(self, obj):
        label = obj.get_role_display() if hasattr(obj, 'get_role_display') else obj.role
        return pastille_role(obj.role, label)

    @admin.display(description='Statut', boolean=False, ordering='is_active')
    def statut_actif_badge(self, obj):
        if obj.is_active:
            return pastille('✓ Actif', '#059669', '#ecfdf5')
        return pastille('✗ Inactif', '#dc2626', '#fef2f2')


# ══════════════════════════════════════════════════════════════════════════════
# 2. MEMBRE — profil associatif complet
# ══════════════════════════════════════════════════════════════════════════════

@admin.register(Membre)
class MembreAdmin(admin.ModelAdmin):
    ordering       = ('-date_adhesion',)
    list_per_page  = 25
    list_display   = ('user_email', 'user_nom', 'telephone', 'ville', 'date_adhesion')
    list_filter    = ('date_adhesion', 'ville')
    search_fields  = (
        'user__email', 'user__first_name', 'user__last_name',
        'telephone', 'ville',
    )
    readonly_fields = ('date_adhesion',)
    raw_id_fields   = ('user',)

    @admin.display(description='Email', ordering='user__email')
    def user_email(self, obj):
        return obj.user.email

    @admin.display(description='Nom complet', ordering='user__last_name')
    def user_nom(self, obj):
        name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return name or format_html('<em style="color:#94a3b8">—</em>')


# ══════════════════════════════════════════════════════════════════════════════
# 3. DON — filtres, recherche, action "valider en masse"
# ══════════════════════════════════════════════════════════════════════════════

@admin.action(description='✅ Marquer les dons sélectionnés comme Validés')
def valider_dons(modeladmin, request, queryset):
    nb = queryset.update(statut='VALIDE')
    modeladmin.message_user(
        request,
        f'{nb} don(s) marqué(s) comme Validé(s) avec succès.',
        level='success',
    )


@admin.action(description='↩️ Remettre les dons sélectionnés en Reçu (non validé)')
def annuler_validation_dons(modeladmin, request, queryset):
    nb = queryset.update(statut='RECU')
    modeladmin.message_user(
        request,
        f'{nb} don(s) remis au statut Reçu.',
        level='warning',
    )


@admin.register(Don)
class DonAdmin(admin.ModelAdmin):
    ordering      = ('-date_don',)
    list_per_page = 25
    actions       = [valider_dons, annuler_validation_dons]

    # ── Liste ─────────────────────────────────────────────────
    list_display = (
        'donateur_display', 'montant_affiche', 'mode_paiement',
        'statut_badge', 'recu_badge', 'date_don',
    )
    list_filter  = (
        'statut',
        'mode_paiement',
        ('date_don', admin.DateFieldListFilter),
        'recu_genere',
    )
    # Recherche par nom ou email du donateur
    search_fields = (
        'membre__user__email',
        'membre__user__first_name',
        'membre__user__last_name',
        'donateur_nom',       # si champ texte libre pour donateurs externes
    )
    readonly_fields = ('date_don',)
    date_hierarchy  = 'date_don'

    # ── Méthodes d'affichage ───────────────────────────────────
    @admin.display(description='Donateur', ordering='membre__user__last_name')
    def donateur_display(self, obj):
        if hasattr(obj, 'membre') and obj.membre:
            return f"{obj.membre.user.first_name} {obj.membre.user.last_name}".strip() \
                   or obj.membre.user.email
        return getattr(obj, 'donateur_nom', None) or format_html('<em style="color:#94a3b8">Anonyme</em>')

    @admin.display(description='Montant', ordering='montant')
    def montant_affiche(self, obj):
        return format_html(
            '<strong style="color:#059669">{} FCFA</strong>',
            f"{obj.montant:,.0f}".replace(',', '\u202f'),
        )

    @admin.display(description='Statut', ordering='statut')
    def statut_badge(self, obj):
        labels = {'RECU': 'Reçu', 'VALIDE': 'Validé', 'ANNULE': 'Annulé'}
        return pastille_statut(obj.statut, labels.get(obj.statut, obj.statut))

    @admin.display(description='Reçu fiscal', boolean=False)
    def recu_badge(self, obj):
        if getattr(obj, 'recu_genere', False):
            return format_html('<span style="color:#059669;font-weight:700">✓ Émis</span>')
        return format_html('<span style="color:#94a3b8">— Non émis</span>')


# ══════════════════════════════════════════════════════════════════════════════
# 4. COTISATION — filtres complets, recherche par membre
# ══════════════════════════════════════════════════════════════════════════════

@admin.action(description='✅ Marquer les cotisations sélectionnées comme Payées')
def marquer_cotisations_payees(modeladmin, request, queryset):
    nb = queryset.update(statut='PAYE')
    modeladmin.message_user(
        request,
        f'{nb} cotisation(s) marquée(s) comme Payée(s).',
        level='success',
    )


@admin.register(Cotisation)
class CotisationAdmin(admin.ModelAdmin):
    ordering      = ('-date_paiement',)
    list_per_page = 25
    actions       = [marquer_cotisations_payees]

    list_display = (
        'membre_display', 'montant_affiche', 'mode_paiement',
        'statut_badge', 'annee', 'date_paiement',
    )
    list_filter  = (
        'statut',
        'mode_paiement',
        'annee',
        ('date_paiement', admin.DateFieldListFilter),
    )
    search_fields = (
        'membre__user__email',
        'membre__user__first_name',
        'membre__user__last_name',
    )
    readonly_fields = ('date_paiement',)
    date_hierarchy  = 'date_paiement'

    @admin.display(description='Membre', ordering='membre__user__last_name')
    def membre_display(self, obj):
        if obj.membre:
            return f"{obj.membre.user.first_name} {obj.membre.user.last_name}".strip() \
                   or obj.membre.user.email
        return format_html('<em style="color:#94a3b8">—</em>')

    @admin.display(description='Montant', ordering='montant')
    def montant_affiche(self, obj):
        return format_html(
            '<strong style="color:#1640c8">{} FCFA</strong>',
            f"{obj.montant:,.0f}".replace(',', '\u202f'),
        )

    @admin.display(description='Statut', ordering='statut')
    def statut_badge(self, obj):
        labels = {
            'EN_ATTENTE': 'En attente',
            'PAYE':       'Payée',
            'RETARD':     'En retard',
            'EXONERE':    'Exonéré',
        }
        return pastille_statut(obj.statut, labels.get(obj.statut, obj.statut))


# ══════════════════════════════════════════════════════════════════════════════
# 5. ACTION (Projets) — participants, budget, filtre statut
# ══════════════════════════════════════════════════════════════════════════════

class DepenseInline(admin.TabularInline):
    """Dépenses rattachées à une action — vue inline."""
    model          = Depense
    extra          = 0
    fields         = ('description', 'montant', 'categorie', 'date_depense', 'statut')
    readonly_fields = ('date_depense',)
    show_change_link = True


@admin.register(Action)
class ActionAdmin(admin.ModelAdmin):
    ordering      = ('-date_debut',)
    list_per_page = 25
    inlines       = [DepenseInline]

    list_display = (
        'titre', 'type_display', 'statut_badge',
        'responsable_display', 'nb_participants_display',
        'budget_display', 'date_debut',
    )
    list_filter  = (
        'statut',
        'type',
        ('date_debut', admin.DateFieldListFilter),
        'responsable',
    )
    search_fields  = ('titre', 'description', 'lieu', 'responsable__email')
    readonly_fields = ('date_creation',) if True else ()   # adapte selon ton modèle
    date_hierarchy  = 'date_debut'
    raw_id_fields   = ('responsable',)

    # Champs éditables directement dans la liste
    list_editable  = ('statut',) if False else ()   # activer si tu veux l'édition inline

    @admin.display(description='Type')
    def type_display(self, obj):
        return obj.get_type_display() if hasattr(obj, 'get_type_display') else obj.type

    @admin.display(description='Statut', ordering='statut')
    def statut_badge(self, obj):
        labels = {
            'PLANIFIEE': 'Planifiée',
            'EN_COURS':  'En cours',
            'CLOTUREE':  'Clôturée',
            'ANNULEE':   'Annulée',
        }
        return pastille_statut(obj.statut, labels.get(obj.statut, obj.statut))

    @admin.display(description='Responsable', ordering='responsable__last_name')
    def responsable_display(self, obj):
        if obj.responsable:
            name = f"{obj.responsable.first_name} {obj.responsable.last_name}".strip()
            return name or obj.responsable.email
        return format_html('<em style="color:#94a3b8">—</em>')

    @admin.display(description='Participants')
    def nb_participants_display(self, obj):
        # Si ton modèle a une relation ManyToMany "participants"
        count = getattr(obj, 'participants', None)
        if count is not None:
            nb = count.count() if hasattr(count, 'count') else count
            return format_html(
                '<span style="font-weight:700;color:#1640c8">{}</span>',
                nb,
            )
        # Fallback : nombre de dépenses si pas de relation participants
        return format_html('<em style="color:#94a3b8">—</em>')

    @admin.display(description='Budget engagé', ordering='budget_prevu')
    def budget_display(self, obj):
        # Calcule le total des dépenses validées liées à cette action
        total = Depense.objects.filter(
            action=obj, statut='VALIDE'
        ).aggregate(total=Sum('montant'))['total'] or 0

        budget_prevu = getattr(obj, 'budget_prevu', None)
        if budget_prevu:
            pct = (total / float(budget_prevu) * 100) if float(budget_prevu) > 0 else 0
            couleur = '#059669' if pct <= 80 else '#d97706' if pct <= 100 else '#dc2626'
            return format_html(
                '<span style="color:{}">{} FCFA</span>'
                ' <small style="color:#94a3b8">/ {} FCFA ({:.0f}%)</small>',
                couleur,
                f"{total:,.0f}".replace(',', '\u202f'),
                f"{float(budget_prevu):,.0f}".replace(',', '\u202f'),
                pct,
            )
        return format_html(
            '<strong>{} FCFA</strong>',
            f"{total:,.0f}".replace(',', '\u202f'),
        )


# ══════════════════════════════════════════════════════════════════════════════
# 6. DÉPENSE — montant, catégorie, indicateur justificatif
# ══════════════════════════════════════════════════════════════════════════════

@admin.register(Depense)
class DepenseAdmin(admin.ModelAdmin):
    ordering      = ('-date_depense',)
    list_per_page = 25

    list_display = (
        'description_courte', 'montant_affiche', 'categorie_badge',
        'action_display', 'statut_badge', 'justificatif_badge',
        'date_depense',
    )
    list_filter  = (
        'statut',
        'categorie',
        ('date_depense', admin.DateFieldListFilter),
        'action',
    )
    search_fields  = ('description', 'action__titre')
    readonly_fields = ('date_depense',)
    date_hierarchy  = 'date_depense'
    raw_id_fields   = ('action',)

    @admin.display(description='Description')
    def description_courte(self, obj):
        desc = obj.description or ''
        return desc[:60] + '…' if len(desc) > 60 else desc

    @admin.display(description='Montant', ordering='montant')
    def montant_affiche(self, obj):
        return format_html(
            '<strong style="color:#dc2626">{} FCFA</strong>',
            f"{obj.montant:,.0f}".replace(',', '\u202f'),
        )

    @admin.display(description='Catégorie', ordering='categorie')
    def categorie_badge(self, obj):
        CATS = {
            'COMMUNICATION':  ('#1640c8', '#eef5ff'),
            'LOCATION':       ('#7c3aed', '#f5f3ff'),
            'INTERVENANT':    ('#d97706', '#fffbeb'),
            'MATERIEL':       ('#059669', '#ecfdf5'),
            'TRANSPORT':      ('#17a8b5', '#ecfeff'),
            'RESTAURATION':   ('#dc2626', '#fef2f2'),
            'ADMINISTRATIF':  ('#64748b', '#f1f5f9'),
            'AUTRE':          ('#64748b', '#f1f5f9'),
        }
        label = obj.get_categorie_display() if hasattr(obj, 'get_categorie_display') else obj.categorie
        fg, bg = CATS.get(obj.categorie, ('#64748b', '#f1f5f9'))
        return pastille(label, fg, bg)

    @admin.display(description='Statut', ordering='statut')
    def statut_badge(self, obj):
        labels = {
            'EN_ATTENTE': 'En attente',
            'VALIDE':     'Validée',
            'REJETE':     'Rejetée',
        }
        # On réutilise le mapping de couleurs avec des clés adaptées
        statut_map = {
            'EN_ATTENTE': ('#d97706', '#fffbeb'),
            'VALIDE':     ('#059669', '#ecfdf5'),
            'REJETE':     ('#dc2626', '#fef2f2'),
        }
        fg, bg = statut_map.get(obj.statut, ('#64748b', '#f1f5f9'))
        return pastille(labels.get(obj.statut, obj.statut), fg, bg)

    @admin.display(description='Action', ordering='action__titre')
    def action_display(self, obj):
        if obj.action:
            return format_html(
                '<a href="/admin/core/action/{}/change/" '
                'style="color:#1640c8;text-decoration:none">{}</a>',
                obj.action.pk,
                obj.action.titre[:40],
            )
        return format_html('<em style="color:#94a3b8">—</em>')

    @admin.display(description='Justificatif')
    def justificatif_badge(self, obj):
        """
        Affiche une icône verte si un fichier justificatif est joint,
        une croix rouge sinon.
        """
        fichier = getattr(obj, 'justificatif', None)
        if fichier and fichier.name:
            return format_html(
                '<a href="{}" target="_blank" '
                'style="color:#059669;font-weight:700;text-decoration:none" '
                'title="Voir le justificatif">📎 Oui</a>',
                fichier.url,
            )
        return format_html(
            '<span style="color:#dc2626;font-weight:700" title="Aucun fichier joint">✗ Non</span>'
        )


# ══════════════════════════════════════════════════════════════════════════════
# 7. DEMANDE D'ADHÉSION — suivi des candidatures
# ══════════════════════════════════════════════════════════════════════════════

@admin.action(description='✅ Accepter les demandes sélectionnées')
def accepter_demandes(modeladmin, request, queryset):
    nb = queryset.update(statut='ACCEPTEE')
    modeladmin.message_user(request, f'{nb} demande(s) acceptée(s).', level='success')


@admin.action(description='❌ Refuser les demandes sélectionnées')
def refuser_demandes(modeladmin, request, queryset):
    nb = queryset.update(statut='REFUSEE')
    modeladmin.message_user(request, f'{nb} demande(s) refusée(s).', level='warning')


@admin.register(DemandeAdhesion)
class DemandeAdhesionAdmin(admin.ModelAdmin):
    ordering      = ('-date_soumission',)
    list_per_page = 25
    actions       = [accepter_demandes, refuser_demandes]

    list_display  = (
        'nom_complet', 'email_display', 'statut_badge',
        'date_soumission',
    )
    list_filter   = (
        'statut',
        ('date_soumission', admin.DateFieldListFilter),
    )
    search_fields = ('nom', 'prenom', 'email')
    readonly_fields = ('date_soumission',)
    date_hierarchy  = 'date_soumission'

    @admin.display(description='Candidat', ordering='nom')
    def nom_complet(self, obj):
        prenom = getattr(obj, 'prenom', '') or ''
        nom    = getattr(obj, 'nom',    '') or ''
        return f"{prenom} {nom}".strip() or format_html('<em style="color:#94a3b8">—</em>')

    @admin.display(description='Email')
    def email_display(self, obj):
        email = getattr(obj, 'email', '')
        if email:
            return format_html(
                '<a href="mailto:{}" style="color:#1640c8">{}</a>',
                email, email,
            )
        return format_html('<em style="color:#94a3b8">—</em>')

    @admin.display(description='Statut', ordering='statut')
    def statut_badge(self, obj):
        cfg = {
            'EN_ATTENTE': ('#d97706', '#fffbeb', 'En attente'),
            'ACCEPTEE':   ('#059669', '#ecfdf5', 'Acceptée'),
            'REFUSEE':    ('#dc2626', '#fef2f2', 'Refusée'),
        }
        fg, bg, label = cfg.get(obj.statut, ('#64748b', '#f1f5f9', obj.statut))
        return pastille(label, fg, bg)