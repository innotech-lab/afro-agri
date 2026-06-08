from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/type-users/', include('type_user.urls')),
    path('api/users/', include('users.urls')),
    path('api/champs/', include('champs.urls')),
    path('api/plantes/', include('plantes.urls')),
    path('api/journal/', include('journal.urls')),
    path('api/etude-sol/', include('etude_sol.urls')),
]
