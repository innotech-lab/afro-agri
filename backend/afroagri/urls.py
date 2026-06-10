from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/type-users/', include('type_user.urls')),
    path('api/users/', include('users.urls')),
    path('api/champs/', include('champs.urls')),
    path('api/plantes/', include('plantes.urls')),
    path('api/journal/', include('journal.urls')),
    path('api/etude-sol/', include('etude_sol.urls')),
    path('api/diagnostic/', include('diagnostic.urls')),
    path('diagnostic/', TemplateView.as_view(template_name='diagnostic.html')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
