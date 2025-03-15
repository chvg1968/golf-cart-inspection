from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

# Vista de prueba para ver si funciona
def home(request):
    return HttpResponse("¡Hola, Django está funcionando!")

urlpatterns = [
    path('admin/', admin.site.urls),
    path("", home),  # Ruta principal
    path('api/', include('inspection.urls')),
]