from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth.hashers import make_password
from .models import User
from .serializers import UserSerializer
from rest_framework.views import APIView
from django.contrib.auth.hashers import check_password
from django.db.models import Count, Avg


class RegisterView(APIView):
    """Register a new particulier account."""

    def post(self, request):
        nom = request.data.get('nom', '')
        prenom = request.data.get('prenom', '')
        email = request.data.get('email', '')
        password = request.data.get('password', '')

        if not prenom or not email or not password:
            return Response({'error': 'prenom, email et password requis'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Un compte existe déjà avec cet email'}, status=status.HTTP_409_CONFLICT)

        try:
            from type_user.models import TypeUser
            type_particulier = TypeUser.objects.get(type='particulier')
        except TypeUser.DoesNotExist:
            return Response({'error': 'Type particulier non configuré'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        user = User.objects.create(
            nom=nom,
            prenom=prenom,
            email=email,
            password=make_password(password),
            id_type=type_particulier,
        )

        if hasattr(request, 'session'):
            request.session['user_id'] = user.id_user
            request.session['id_type'] = 'particulier'

        return Response(
            {'message': 'Compte créé', 'user_id': user.id_user, 'id_type': 'particulier', 'prenom': user.prenom or '', 'nom': user.nom or ''},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """Authenticate a user and store `user_id` and `id_type` in session."""

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'email and password required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        if not check_password(password, user.password):
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        # Set session values so permissions can read them
        if hasattr(request, 'session'):
            request.session['user_id'] = user.id_user
            request.session['id_type'] = getattr(user.id_type, 'type', '')

        return Response({'message': 'Authenticated', 'user_id': user.id_user, 'id_type': getattr(user.id_type, 'type', ''), 'prenom': user.prenom or '', 'nom': user.nom or ''})


class LogoutView(APIView):
    def post(self, request):
        if hasattr(request, 'session'):
            request.session.flush()
        return Response({'message': 'Logged out'})


class DashboardParticulierView(APIView):
    """Dashboard for particulier users — their own diagnostic history."""

    def get(self, request):
        id_type = request.session.get('id_type') if hasattr(request, 'session') else None
        user_id = request.session.get('user_id') if hasattr(request, 'session') else None

        if not id_type or str(id_type).strip().lower() != 'particulier':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        from django.db import connection

        with connection.cursor() as cur:
            cur.execute(
                '''SELECT dr.id_diagnostic, dr.image, dr.maladie_detectee, dr.confiance,
                          dr.traitement_suggere, dr.source_github, dr.created_at,
                          jp.stade_croissance, jp.date_observation
                   FROM diagnostic_result dr
                   JOIN journal_plante jp ON jp.id_journal = dr.id_journal
                   WHERE jp.id_user = %s
                   ORDER BY dr.created_at DESC
                   LIMIT 50''',
                [user_id],
            )
            cols = [c[0] for c in cur.description]
            history = [dict(zip(cols, row)) for row in cur.fetchall()]

        for entry in history:
            if entry.get('created_at'):
                entry['created_at'] = str(entry['created_at'])
            if entry.get('date_observation'):
                entry['date_observation'] = str(entry['date_observation'])
            if entry.get('image'):
                entry['image'] = f"/media/{entry['image']}" if not str(entry['image']).startswith('/') else entry['image']

        return Response({
            'id_type': 'particulier',
            'user_id': user_id,
            'total_analyses': len(history),
            'history': history,
        })


class DashboardMinisterView(APIView):
    """Read-only dashboard for Minister users. Requires session login.

    Returns basic counts for key models.
    """

    def get(self, request):
        id_type = request.session.get('id_type') if hasattr(request, 'session') else None
        if not id_type or str(id_type).strip().lower() != 'minister':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        # Import models lazily to avoid circular imports at module load
        from champs.models import Champ
        from plantes.models import Plante
        from journal.models import JournalPlante
        from etude_sol.models import EtudeSol
        from users.models import User

        # Basic counts
        champs_qs = Champ.objects.all()
        plantes_qs = Plante.objects.all()
        journal_qs = JournalPlante.objects.all()
        etude_qs = EtudeSol.objects.all()
        users_qs = User.objects.all()

        # Aggregated stats
        champs_by_source = list(champs_qs.values('source_eau').annotate(count=Count('id_champ')))
        avg_superficie = champs_qs.aggregate(avg_superficie=Avg('superficie'))['avg_superficie']

        plantes_by_variete = list(plantes_qs.values('variete').annotate(count=Count('id_plante')))
        plantes_by_nom = list(plantes_qs.values('nom_plante').annotate(count=Count('id_plante')))

        journal_by_stade = list(journal_qs.values('stade_croissance').annotate(count=Count('id_journal')))
        recent_journal = list(journal_qs.order_by('-date_observation')[:5].values('id_journal','id_plante_id','date_observation','stade_croissance','symptomes'))

        etude_by_type = list(etude_qs.values('type_sol').annotate(count=Count('id_etude_sol')))
        etude_by_fert = list(etude_qs.values('fertilite').annotate(count=Count('id_etude_sol')))

        users_by_type = list(users_qs.values('id_type__type').annotate(count=Count('id_user')))

        data = {
            'id_type': id_type,
            'counts': {
                'champs': champs_qs.count(),
                'plantes': plantes_qs.count(),
                'journal': journal_qs.count(),
                'etude_sol': etude_qs.count(),
                'users': users_qs.count(),
            },
            'champs': {
                'by_source_eau': champs_by_source,
                'avg_superficie': avg_superficie,
            },
            'plantes': {
                'by_variete': plantes_by_variete,
                'by_nom': plantes_by_nom,
            },
            'journal': {
                'by_stade': journal_by_stade,
                'recent': recent_journal,
            },
            'etude_sol': {
                'by_type_sol': etude_by_type,
                'by_fertilite': etude_by_fert,
            },
            'users': {
                'by_type': users_by_type,
            }
        }

        return Response(data)


class DashboardAdminView(APIView):
    """Full admin dashboard with modification access in the backend."""

    def get(self, request):
        id_type = request.session.get('id_type') if hasattr(request, 'session') else None
        if not id_type or str(id_type).strip().lower() != 'admin':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        from champs.models import Champ
        from plantes.models import Plante
        from journal.models import JournalPlante
        from etude_sol.models import EtudeSol
        from users.models import User

        champs_qs = Champ.objects.all()
        plantes_qs = Plante.objects.all()
        journal_qs = JournalPlante.objects.all()
        etude_qs = EtudeSol.objects.all()
        users_qs = User.objects.all()

        champs_by_source = list(champs_qs.values('source_eau').annotate(count=Count('id_champ')))
        avg_superficie = champs_qs.aggregate(avg_superficie=Avg('superficie'))['avg_superficie']

        plantes_by_variete = list(plantes_qs.values('variete').annotate(count=Count('id_plante')))
        plantes_by_nom = list(plantes_qs.values('nom_plante').annotate(count=Count('id_plante')))

        journal_by_stade = list(journal_qs.values('stade_croissance').annotate(count=Count('id_journal')))
        recent_journal = list(journal_qs.order_by('-date_observation')[:10].values('id_journal','id_plante_id','date_observation','stade_croissance','symptomes'))

        etude_by_type = list(etude_qs.values('type_sol').annotate(count=Count('id_etude_sol')))
        etude_by_fert = list(etude_qs.values('fertilite').annotate(count=Count('id_etude_sol')))

        users_by_type = list(users_qs.values('id_type__type').annotate(count=Count('id_user')))

        data = {
            'id_type': id_type,
            'counts': {
                'champs': champs_qs.count(),
                'plantes': plantes_qs.count(),
                'journal': journal_qs.count(),
                'etude_sol': etude_qs.count(),
                'users': users_qs.count(),
            },
            'champs': {
                'by_source_eau': champs_by_source,
                'avg_superficie': avg_superficie,
            },
            'plantes': {
                'by_variete': plantes_by_variete,
                'by_nom': plantes_by_nom,
            },
            'journal': {
                'by_stade': journal_by_stade,
                'recent': recent_journal,
            },
            'etude_sol': {
                'by_type_sol': etude_by_type,
                'by_fertilite': etude_by_fert,
            },
            'users': {
                'by_type': users_by_type,
            }
        }

        return Response(data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'id_user'

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Endpoint pour changer le mot de passe d'un utilisateur"""
        user_id = request.data.get('user_id')
        new_password = request.data.get('new_password')
        
        if not user_id or not new_password:
            return Response(
                {'error': 'user_id et new_password requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id_user=user_id)
            user.password = make_password(new_password)
            user.save()
            return Response({'message': 'Mot de passe mis à jour avec succès'})
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
