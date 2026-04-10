"""
core/urls.py - Routes de l'application core (association ININ)
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ActionViewSet,
    DonViewSet,
    CotisationViewSet,
    DepenseViewSet,
    MembreViewSet,
    DemandeAdhesionViewSet,
    TableauDeBordView,
    ChargeProjetActionsView,
    FinanceStatsView,
    RHStatsView,
    DemandeAdhesionListView,
    TraiterDemandeView,
    ApprouverDemandeView,
    PartenaireViewSet,
    PartenaireStatsView,
    ProfilView,
    ProfilUpdateView,
    ChangePasswordView,
    MembresPublicsView,
    MembresStatsView,
    LastActionsView,
    MemberDashboardView,
    ChargeProjetStatsView,
    UserListView,
    UserDetailView,
    AnalyticsOverviewView,
    AnalyticsMembreTypesView,
    AnalyticsMembreEvolutionView,
    AnalyticsDonsEvolutionView,
    AnalyticsProjetsStatutsView,
    AnalyticsPartenairesEvolutionView,
)

router = DefaultRouter()
router.register(r'actions',     ActionViewSet,          basename='action')
router.register(r'dons',        DonViewSet,             basename='don')
router.register(r'cotisations', CotisationViewSet,      basename='cotisation')
router.register(r'depenses',    DepenseViewSet,         basename='depense')
router.register(r'membres',     MembreViewSet,          basename='membre')
router.register(r'demandes',    DemandeAdhesionViewSet, basename='demande')
router.register(r'dashboard',   TableauDeBordView,      basename='dashboard')
router.register(r'partenaires', PartenaireViewSet,      basename='partenaire')

urlpatterns = [
    # ── RH ──────────────────────────────────────────────────────────
    path('rh/stats/',                             RHStatsView.as_view(),             name='rh-stats'),
    path('demandes-adhesion/',                    DemandeAdhesionListView.as_view(), name='demande-adhesion-list'),
    path('demandes-adhesion/<int:pk>/',           TraiterDemandeView.as_view(),      name='demande-adhesion-traiter'),
    path('demandes-adhesion/<int:pk>/approuver/', ApprouverDemandeView.as_view(),    name='demande-adhesion-approuver'),

    # ── Partenaires ──────────────────────────────────────────────────
    path('partenaires/stats/',                    PartenaireStatsView.as_view(),     name='partenaire-stats'),

    # ── Actions publiques ─────────────────────────────────────────────
    path('last-actions/',                         LastActionsView.as_view(),         name='last-actions'),

    # ── Membre connecté ───────────────────────────────────────────────
    path('membres/me/dashboard/',                 MemberDashboardView.as_view(),     name='member-dashboard'),

    # ── Chargé de projet / Finance ────────────────────────────────────
    path('charge-projet/actions/',                ChargeProjetActionsView.as_view(), name='cp-actions'),
    path('finance/stats/',                        FinanceStatsView.as_view(),        name='finance-stats'),
    path('charge-projet/stats/',                  ChargeProjetStatsView.as_view(),   name='cp-stats'),

    # ── Profil utilisateur ────────────────────────────────────────────
    path('user/profile/',                         ProfilView.as_view(),              name='user-profile'),
    path('user/profile/update/',                  ProfilUpdateView.as_view(),        name='user-profile-update'),
    path('user/change-password/',                 ChangePasswordView.as_view(),      name='user-change-password'),

    # ── Page publique membres ─────────────────────────────────────────
    path('liste-membres/',                        MembresPublicsView.as_view(),      name='liste-membres'),
    path('stats-membres/',                        MembresStatsView.as_view(),        name='stats-membres'),

    path('users/',                                UserListView.as_view(),            name='user-list'),
    path('users/<int:pk>/',                       UserDetailView.as_view(),          name='user-detail'),

    path('analytics/overview/',              AnalyticsOverviewView.as_view(),              name='analytics-overview'),
    path('analytics/membres-types/',         AnalyticsMembreTypesView.as_view(),           name='analytics-membres-types'),
    path('analytics/membres-evolution/',     AnalyticsMembreEvolutionView.as_view(),       name='analytics-membres-evolution'),
    path('analytics/dons-evolution/',        AnalyticsDonsEvolutionView.as_view(),         name='analytics-dons-evolution'),
    path('analytics/projets-statuts/',       AnalyticsProjetsStatutsView.as_view(),        name='analytics-projets-statuts'),
    path('analytics/partenaires-evolution/', AnalyticsPartenairesEvolutionView.as_view(),  name='analytics-partenaires-evolution'),

    # ── Router DRF (toujours en dernier) ──────────────────────────────
    path('', include(router.urls)),
]