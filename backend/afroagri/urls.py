from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from users.views import DashboardMinisterView, DashboardAdminView

urlpatterns = [
    path('', RedirectView.as_view(url='/api/users/users/', permanent=False)),
    path('admin/', admin.site.urls),
    path('api/type-users/', include('type_user.urls')),
    path('api/users/', include('users.urls')),
    path('api/DashboardMinister', DashboardMinisterView.as_view()),
    path('api/DashboardMinister/', DashboardMinisterView.as_view()),
    path('api/DashboardAdmin', DashboardAdminView.as_view()),
    path('api/DashboardAdmin/', DashboardAdminView.as_view()),
    path('api/champs/', include('champs.urls')),
    path('api/plantes/', include('plantes.urls')),
    path('api/journal/', include('journal.urls')),
    path('api/etude-sol/', include('etude_sol.urls')),
]
