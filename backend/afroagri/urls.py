from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from users.views import DashboardMinisterView, DashboardAdminView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-tester/', TemplateView.as_view(template_name='api_tester.html')),
    path('api/type-users/', include('type_user.urls')),
    path('api/users/', include('users.urls')),
    path('api/DashboardMinister', DashboardMinisterView.as_view()),
    path('api/DashboardMinister/', DashboardMinisterView.as_view()),
    path('api/DashboardAdmin', DashboardAdminView.as_view()),
    path('api/DashboardAdmin/', DashboardAdminView.as_view()),
    path('api/champs/', include('champs.urls')),
    path('api/plantes/', include('plantes.urls')),
    path('api/journal/', include('journal.urls')),
    path('api/diagnostic/', include('diagnostic.urls')),
    path('api/localisation/', include('localisation.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/transactions/', include('transactions.urls')),
    path('diagnostic/', TemplateView.as_view(template_name='diagnostic.html')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
