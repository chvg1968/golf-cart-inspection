from django.db import models
from django.utils import timezone

class GolfCartInspection(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Borrador'),
        ('sent', 'Enviado'),
        ('signed', 'Firmado'),
    )
    
    # Información básica
    cart_id = models.CharField(max_length=50, verbose_name="ID del Golf Cart")
    guest_name = models.CharField(max_length=100, verbose_name="Nombre del Huésped")
    guest_email = models.EmailField(verbose_name="Correo del Huésped")
    inspector_name = models.CharField(max_length=100, verbose_name="Nombre del Inspector")
    inspection_date = models.DateField(default=timezone.now, verbose_name="Fecha de Inspección")
    
    # Campos de daños
    front_damage = models.TextField(blank=True, null=True, verbose_name="Daños Frontales")
    back_damage = models.TextField(blank=True, null=True, verbose_name="Daños Traseros")
    left_damage = models.TextField(blank=True, null=True, verbose_name="Daños Lado Izquierdo")
    right_damage = models.TextField(blank=True, null=True, verbose_name="Daños Lado Derecho")
    interior_damage = models.TextField(blank=True, null=True, verbose_name="Daños Interiores")
    additional_notes = models.TextField(blank=True, null=True, verbose_name="Notas Adicionales")
    
    # Imágenes de daños
    front_image = models.ImageField(upload_to='inspections/images/', blank=True, null=True)
    back_image = models.ImageField(upload_to='inspections/images/', blank=True, null=True)
    left_image = models.ImageField(upload_to='inspections/images/', blank=True, null=True)
    right_image = models.ImageField(upload_to='inspections/images/', blank=True, null=True)
    interior_image = models.ImageField(upload_to='inspections/images/', blank=True, null=True)
    
    # Firmas (almacenadas como imágenes base64)
    inspector_signature = models.TextField(blank=True, null=True, verbose_name="Firma del Inspector")
    guest_signature = models.TextField(blank=True, null=True, verbose_name="Firma del Huésped")
    
    # Estado y fechas de control
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sent_at = models.DateTimeField(blank=True, null=True)
    signed_at = models.DateTimeField(blank=True, null=True)
    
    # Token único para acceso del huésped
    access_token = models.CharField(max_length=100, blank=True, null=True, unique=True)
    
    def __str__(self):
        return f"Inspección {self.cart_id} - {self.guest_name} - {self.inspection_date}"