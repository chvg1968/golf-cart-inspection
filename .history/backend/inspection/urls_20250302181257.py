from django.urls import path  # No necesitas `include` aquí
from . import views

urlpatterns = [
    path('inspections/create/', views.api_create_inspection, name='api_create_inspection'),
    path('inspections/<int:inspection_id>/send/', views.api_send_inspection, name='api_send_inspection'),
    path('guest/<str:token>/', views.api_guest_sign, name='api_guest_sign'),
    path('pdf/<str:token>/', views.generate_pdf, name='generate_pdf'),
]