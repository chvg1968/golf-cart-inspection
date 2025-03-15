import uuid
import json
import os
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from .models import GolfCartInspection, DamageRecord, CartPart, DamageType, Property
from .utils import render_to_pdf
from .supabase_utils import upload_base64_image, upload_pdf_file

@csrf_exempt
def api_create_inspection(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Obtener la propiedad
            property_id = data.get('property_id')
            property_obj = get_object_or_404(Property, id=property_id)
            
            # Crear inspección con datos básicos
            inspection = GolfCartInspection(
                cart_number=data.get('cart_number'),
                property=property_obj,
                guest_name=data.get('guest_name'),
                guest_email=data.get('guest_email'),
                guest_phone=data.get('guest_phone', ''),
                guest_room=data.get('guest_room', ''),
                status='pending'
            )
            
            # Generar token único para acceso del huésped
            inspection.access_token = str(uuid.uuid4())
            inspection.save()
            
            # Procesar los daños registrados
            damages = data.get('damages', [])
            for damage_data in damages:
                part = get_object_or_404(CartPart, id=damage_data.get('part_id'))
                damage_type = get_object_or_404(DamageType, id=damage_data.get('damage_type_id'))
                
                damage_record = DamageRecord(
                    inspection=inspection,
                    part=part,
                    damage_type=damage_type,
                    description=damage_data.get('description', '')
                )
                
                # Si hay foto en base64, guardarla en Supabase
                photo_base64 = damage_data.get('photo')
                if photo_base64:
                    photo_url = upload_base64_image(photo_base64, folder=f'damages/{inspection.id}')
                    if photo_url:
                        damage_record.photo = photo_base64
                        damage_record.photo_url = photo_url
                
                damage_record.save()
            
            # Procesar firma del inspector si existe
            inspector_signature = data.get('inspector_signature')
            if inspector_signature:
                signature_url = upload_base64_image(inspector_signature, folder=f'signatures/{inspection.id}')
                if signature_url:
                    inspection.inspector_signature = inspector_signature
                    inspection.inspector_signature_url = signature_url
                    inspection.save()
            
            return JsonResponse({
                'id': inspection.id,
                'access_token': inspection.access_token,
                'status': 'success',
                'message': 'Inspección creada exitosamente'
            })
        
        except Exception as e:
            return JsonResponse({
                'error': f'Error al crear la inspección: {str(e)}'
            }, status=500)
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)

@csrf_exempt
def api_send_inspection(request, inspection_id):
    inspection = get_object_or_404(GolfCartInspection, id=inspection_id)
    
    if request.method == 'POST':
        try:
            # Actualizar estado
            inspection.status = 'sent'
            inspection.save()
            
            # Generar URL para el huésped
            review_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:8080')}/review/{inspection.access_token}"
            
            # Obtener los daños relacionados con esta inspección
            damages = DamageRecord.objects.filter(inspection=inspection)
            
            # Preparar contexto para la plantilla
            context = {
                'inspection': inspection,
                'damages': damages,
                'review_url': review_url,
                'date': timezone.now().strftime("%d/%m/%Y"),
                'property': inspection.property,
            }
            
            # Enviar correo electrónico al huésped
            subject = f"Inspección de Golf Cart #{inspection.cart_number} - {inspection.property.name}"
            message = render_to_string('emails/inspection_review.html', context)
            
            email = EmailMessage(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [inspection.guest_email]
            )
            email.content_subtype = "html"
            email.send()
            
            # Registrar en el log
            print(f"Correo enviado a {inspection.guest_email} para la inspección {inspection_id}")
            
            return JsonResponse({
                'status': 'sent',
                'message': f'Correo enviado exitosamente a {inspection.guest_email}',
                'review_url': review_url  # Útil para pruebas
            })
            
        except Exception as e:
            # Capturar cualquier error en el envío
            print(f"Error al enviar correo: {str(e)}")
            return JsonResponse({
                'error': f'Error al enviar correo: {str(e)}'
            }, status=500)
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)

@csrf_exempt
def api_guest_sign(request, token):
    inspection = get_object_or_404(GolfCartInspection, access_token=token)
    
    if request.method == 'GET':
        # Datos que el guest VE
        return JsonResponse({
            'readonly_data': {
                'cart_id': inspection.cart_id,
                'guest_name': inspection.guest_name,
                'inspection_date': inspection.inspection_date,
                'damages': {
                    'front': inspection.front_damage,
                    'back': inspection.back_damage,
                    'left': inspection.left_damage,
                    'right': inspection.right_damage,
                    'interior': inspection.interior_damage,
                },
                'inspector_notes': inspection.additional_notes,
                'inspector_name': inspection.inspector_name,
            },
            'required_fields': {
                'guest_signature': None,  # Campo requerido
                'guest_confirms_damages': False,  # Campo requerido
                'guest_accepts_terms': False,  # Campo requerido
            },
            'optional_fields': {
                'guest_comments': '',  # Campo opcional
            }
        })
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Validar campos requeridos
            required_fields = ['guest_signature', 'guest_confirms_damages', 'guest_accepts_terms']
            for field in required_fields:
                if not data.get(field):
                    return JsonResponse({
                        'error': f'El campo {field} es requerido'
                    }, status=400)
            
            # Actualizar la inspección
            inspection.guest_signature = data['guest_signature']
            inspection.guest_confirms_damages = data['guest_confirms_damages']
            inspection.guest_accepts_terms = data['guest_accepts_terms']
            inspection.guest_comments = data.get('guest_comments', '')
            inspection.guest_signature_date = timezone.now()
            inspection.status = 'signed'
            inspection.signed_at = timezone.now()
            inspection.save()
            
            # Generar PDF
            pdf_file = render_to_pdf('pdf/inspection_report.html', {
                'inspection': inspection,
                'date': timezone.now().strftime("%d/%m/%Y"),
            })
            
            # Enviar correo al encargado con el PDF adjunto
            if pdf_file:
                subject = f"Inspección firmada - Golf Cart {inspection.cart_id}"
                message = f"""<html>
                <body>
                    <h2>Inspección firmada por el huésped</h2>
                    <p>El huésped <strong>{inspection.guest_name}</strong> ha firmado la inspección del Golf Cart {inspection.cart_id}.</p>
                    <p>Fecha de firma: {timezone.now().strftime("%d/%m/%Y %H:%M")}</p>
                    <p>Se adjunta el PDF con todos los detalles de la inspección y las firmas correspondientes.</p>
                    <p>Comentarios del huésped: {inspection.guest_comments or 'Ninguno'}</p>
                </body>
                </html>"""
                
                # Usar el correo del encargado como destinatario
                # Aquí podrías usar una configuración o el correo del inspector
                inspector_email = os.getenv('EMAIL_HOST_USER')  # O inspection.inspector_email si lo tienes
                
                email = EmailMessage(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [inspector_email]
                )
                email.content_subtype = "html"
                
                # Adjuntar el PDF
                email.attach(
                    f"inspeccion_golfcart_{inspection.cart_id}.pdf",
                    pdf_file,
                    'application/pdf'
                )
                
                email.send()
                print(f"Correo con PDF enviado al encargado: {inspector_email}")
            
            return JsonResponse({
                'status': 'signed',
                'message': 'Inspección firmada exitosamente'
            })
            
        except Exception as e:
            print(f"Error al procesar la firma: {str(e)}")
            return JsonResponse({
                'error': f'Error al procesar la firma: {str(e)}'
            }, status=500)

def generate_pdf(request, token):
    inspection = get_object_or_404(GolfCartInspection, access_token=token)
    
    # Generar PDF
    pdf = render_to_pdf('pdf/inspection_report.html', {
        'inspection': inspection,
        'date': timezone.now().strftime("%d/%m/%Y"),
    })
    
    # Devolver como respuesta para descarga
    response = HttpResponse(pdf, content_type='application/pdf')
    filename = f"inspeccion_golfcart_{inspection.cart_id}_{inspection.inspection_date}.pdf"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import CartPart, DamageType, Property
from .serializers import CartPartSerializer, DamageTypeSerializer, PropertySerializer

class CatalogViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['get'])
    def cart_parts(self, request):
        parts = CartPart.objects.filter(active=True)
        serializer = CartPartSerializer(parts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def damage_types(self, request):
        types = DamageType.objects.filter(active=True)
        serializer = DamageTypeSerializer(types, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def properties(self, request):
        properties = Property.objects.filter(active=True)
        serializer = PropertySerializer(properties, many=True)
        return Response(serializer.data)
