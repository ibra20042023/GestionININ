from rest_framework.permissions import BasePermission, SAFE_METHODS

class EstAdminOuTresorier(BasePermission):
    """
    Autorise uniquement les utilisateurs avec le rôle
    ADMINISTRATEUR ou TRESORIER.
    Utilisé pour protéger tous les endpoints financiers.
    """
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('ADMINISTRATEUR', 'TRESORIER', 'CHARGE_PARTENARIAT')
        )



# ─────────────────────────────────────────────────────────────
# Elle est utilisée par ActionViewSet pour les méthodes
# d'écriture (POST, PATCH, PUT, DELETE).
# ─────────────────────────────────────────────────────────────



class IsResponsableOuAdmin(BasePermission):
    """
    Permission au niveau de l'objet.

    Autorise la modification uniquement si :
    - l'utilisateur est staff/admin (is_staff), OU
    - l'utilisateur est le responsable de l'action.

    Utilisée en combinaison avec EstAdminOuChargeProjet :
        permission_classes = [EstAdminOuChargeProjet, IsResponsableOuAdmin]

    EstAdminOuChargeProjet filtre au niveau de la vue (rôle),
    IsResponsableOuAdmin filtre au niveau de l'objet (propriété).
    Les deux doivent passer pour autoriser la requête.
    """

    def has_permission(self, request, view):
        # Lecture toujours autorisée (le filtre de rôle est géré par l'autre permission)
        if request.method in SAFE_METHODS:
            return True
        # Pour l'écriture : doit être authentifié au minimum
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Lecture toujours autorisée
        if request.method in SAFE_METHODS:
            return True
        # Modification : admin ou responsable de l'action
        return request.user.is_staff or obj.responsable == request.user


class EstAdminTresorierOuPartenariat(BasePermission):
    """
    Accès autorisé pour : Admin, Trésorier, Chargé de Partenariat.
    Utilisé pour les dons et cotisations (lecture + enregistrement perso).
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'TRESORIER', 'CHARGE_PARTENARIAT']
        )