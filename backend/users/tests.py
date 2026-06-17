from django.contrib.auth.hashers import make_password
from django.test import TestCase
from rest_framework.test import APIClient

from .models import User
from type_user.models import TypeUser


class AuthenticationDashboardTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin_type = TypeUser.objects.create(type='Admin')
        cls.minister_type = TypeUser.objects.create(type='Minister')

        cls.admin_user = User.objects.create(
            nom='Admin',
            prenom='User',
            email='admin@example.com',
            password=make_password('adminpass'),
            id_type=cls.admin_type,
        )
        cls.minister_user = User.objects.create(
            nom='Minister',
            prenom='User',
            email='minister@example.com',
            password=make_password('ministerpass'),
            id_type=cls.minister_type,
        )

    def setUp(self):
        self.client = APIClient()

    def test_login_sets_session_for_admin(self):
        response = self.client.post(
            '/api/users/auth/login/',
            {'email': 'admin@example.com', 'password': 'adminpass'},
            format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('user_id', response.data)
        self.assertEqual(response.data['id_type'], 'Admin')

    def test_admin_dashboard_access(self):
        self.client.post(
            '/api/users/auth/login/',
            {'email': 'admin@example.com', 'password': 'adminpass'},
            format='json'
        )
        response = self.client.get('/api/DashboardAdmin')
        self.assertEqual(response.status_code, 200)
        self.assertIn('counts', response.data)
        self.assertEqual(response.data['id_type'], 'Admin')

    def test_minister_dashboard_forbidden_on_admin_route(self):
        self.client.post(
            '/api/users/auth/login/',
            {'email': 'minister@example.com', 'password': 'ministerpass'},
            format='json'
        )
        response = self.client.get('/api/DashboardAdmin')
        self.assertEqual(response.status_code, 403)

    def test_minister_dashboard_access(self):
        self.client.post(
            '/api/users/auth/login/',
            {'email': 'minister@example.com', 'password': 'ministerpass'},
            format='json'
        )
        response = self.client.get('/api/DashboardMinister')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['id_type'], 'Minister')
