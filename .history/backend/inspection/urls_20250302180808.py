from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    # path('api/', include('inspection.urls')),
    path('api/inspections/create/', views.api_create_inspection, name='api_create_inspection'),
    path('api/inspections/<int:inspection_id>/send/', views.api_send_inspection, name='api_send_inspection'),
    path('api/guest/<str:token>/', views.api_guest_sign, name='api_guest_sign'),
    path('api/pdf/<str:token>/', views.generate_pdf, name='generate_pdf'),
]