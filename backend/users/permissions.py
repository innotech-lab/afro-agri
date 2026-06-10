from rest_framework.permissions import BasePermission, SAFE_METHODS

from users.models import User


class MinisterCannotModify(BasePermission):
    """Deny non-safe methods (PUT/PATCH/DELETE/POST when appropriate)
    for users whose type is 'Minister'.

    Expected client to provide a user identifier in one of:
    - Header: 'X-User-Id'
    - Query param: 'user_id'
    - Request body field: 'user_id'
    If no user identifier is found, the permission denies unsafe methods.
    """

    def has_permission(self, request, view):
        # Always allow safe (read-only) methods
        if request.method in SAFE_METHODS:
            return True

        # Try to obtain a user id from headers, query params, or request body
        # First check session for authenticated user info
        user_id = request.session.get('user_id') if hasattr(request, 'session') else None
        user_type_from_session = request.session.get('id_type') if hasattr(request, 'session') else None

        if not user_id:
            user_id = (
                request.headers.get('X-User-Id')
                or request.query_params.get('user_id')
                or (request.data.get('user_id') if hasattr(request, 'data') else None)
            )

        if not user_id:
            return False

        # If id_type is already in session, use it directly
        if user_type_from_session:
            user_type = user_type_from_session
        else:
            try:
                user = User.objects.get(id_user=user_id)
                user_type = getattr(user.id_type, 'type', '') or ''
            except Exception:
                return False

        if str(user_type).strip().lower() == 'minister':
            return False

        return True


class IsAdminOnly(BasePermission):
    """Allow only users whose session id_type is Admin."""

    def has_permission(self, request, view):
        if not hasattr(request, 'session'):
            return False

        id_type = request.session.get('id_type')
        return str(id_type).strip().lower() == 'admin'
