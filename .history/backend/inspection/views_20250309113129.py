import uuid
import json
import os
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.core.mail import EmailMessage
from email.header import Header
from django.template.loader import render_to_string, get_template
from django.conf import settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import TemplateHTMLRenderer, JSONRenderer
from rest_framework.response import Response

from .models import GolfCartInspection, DamageRecord, CartPart, DamageType, Property
from django.core.serializers.json import DjangoJSONEncoder
from django.forms.models import model_to_dict
from .utils import render_to_pdf
from .supabase_utils import upload_base64_image, upload_pdf_file

@csrf_exempt
def api_get_inspection_by_token(request, token):
    """
    Obtiene los datos de una inspección por su token de acceso
    """
    # Manejar solicitudes OPTIONS para CORS
    if request.method == 'OPTIONS':
        response = HttpResponse()
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, X-Requested-With'
        return response
    
    try:
        # Buscar la inspección por el token de acceso
        inspection = get_object_or_404(GolfCartInspection, access_token=token)
        
        # Obtener los registros de daños relacionados
        damages = DamageRecord.objects.filter(inspection=inspection)
        
        # Convertir la inspección a un diccionario
        inspection_data = model_to_dict(inspection, exclude=['inspector_signature', 'guest_signature'])
        
        # Agregar la propiedad como un objeto anidado
        if inspection.property:
            inspection_data['property'] = model_to_dict(inspection.property)
        
        # Convertir los daños a una lista de diccionarios
        damages_data = []
        for damage in damages:
            damage_dict = {
                'id': damage.id,
                'type': damage.damage_type.name,
                'part': damage.part.name,
                'location': damage.part.category,
                'description': damage.description,
                'photo_url': damage.photo_url
            }
            damages_data.append(damage_dict)
        
        # Agregar los daños a la respuesta
        inspection_data['damages'] = damages_data
        
        # Crear respuesta con cabeceras CORS
        response = JsonResponse(inspection_data)
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, X-Requested-With'
        return response
    
    except GolfCartInspection.DoesNotExist:
        response = JsonResponse({'error': 'Inspección no encontrada'}, status=404)
        response['Access-Control-Allow-Origin'] = '*'
        return response
    except Exception as e:
        response = JsonResponse({'error': str(e)}, status=500)
        response['Access-Control-Allow-Origin'] = '*'
        return response

@csrf_exempt
def api_create_inspection(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Obtener o crear la propiedad si no existe
            property_name = data.get('property_name', 'Default Property')
            property_obj, created = Property.objects.get_or_create(
                name=property_name,
                defaults={'location': 'Default Location', 'active': True}
            )
            
            # Crear inspección con datos básicos
            inspection = GolfCartInspection(
                cart_number=data.get('cart_id', 'Unknown'),
                property=property_obj,
                guest_name=data.get('guest_name'),
                guest_email=data.get('guest_email'),
                guest_phone=data.get('guest_phone', ''),
                guest_room=data.get('guest_room', ''),
                status='pending',
                # Guardar datos de daños por sección
                front_damage=data.get('front', ''),
                back_damage=data.get('back', ''),
                left_damage=data.get('left', ''),
                right_damage=data.get('right', ''),
                interior_damage=data.get('interior', ''),
                additional_notes=data.get('additional_notes', ''),
                inspector_name=data.get('inspector_name', '')
            )
            
            # Generar token único para acceso del huésped
            inspection.access_token = str(uuid.uuid4())
            inspection.save()
            
            # Procesar los daños registrados por sección
            damage_sections = ['front', 'back', 'left', 'right', 'interior']
            
            for section in damage_sections:
                damage_text = data.get(section, '')
                if damage_text:
                    # Crear o obtener la parte del carro
                    part, _ = CartPart.objects.get_or_create(
                        name=section.capitalize(),
                        defaults={'description': f'Sección {section} del carro', 'category': 'Exterior', 'active': True}
                    )
                    
                    # Crear o obtener el tipo de daño
                    damage_type, _ = DamageType.objects.get_or_create(
                        name='General',
                        defaults={'description': 'Daño general', 'severity_level': 1, 'active': True}
                    )
                    
                    # Crear registro de daño
                    damage_record = DamageRecord(
                        inspection=inspection,
                        part=part,
                        damage_type=damage_type,
                        description=damage_text
                    )
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

import threading
import time

import json
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def inspection_review_page(request, token):
    """
    Renderiza la página HTML para que el huésped revise la inspección
    """
    try:
        # Verificar que la inspección exista
        inspection = get_object_or_404(GolfCartInspection, access_token=token)
        
        # Obtener los datos de la inspección para pasarlos a la plantilla
        inspection_data = {
            'id': inspection.id,
            'cart_number': inspection.cart_number,
            'property': {
                'id': inspection.property.id,
                'name': inspection.property.name,
                'location': inspection.property.location,
                'active': inspection.property.active
            } if inspection.property else None,
            'status': inspection.status,
            'guest_name': inspection.guest_name,
            'guest_email': inspection.guest_email,
            'guest_phone': inspection.guest_phone,
            'guest_room': inspection.guest_room,
            'front_damage': inspection.front_damage,
            'back_damage': inspection.back_damage,
            'left_damage': inspection.left_damage,
            'right_damage': inspection.right_damage,
            'interior_damage': inspection.interior_damage,
            'additional_notes': inspection.additional_notes,
            'inspector_name': inspection.inspector_name,
            'access_token': inspection.access_token,
            'damages': [],  # Agregamos un array vacío para mantener la estructura
        }
        
        # Serializar los datos a JSON para pasarlos a la plantilla
        inspection_json = json.dumps(inspection_data)
        
        # Renderizar la plantilla con el token y los datos
        return render(request, 'inspection/review.html', {
            'token': token,
            'inspection_json': inspection_json
        })
    
    except Exception as e:
        # En caso de error, mostrar mensaje
        return render(request, 'inspection/error.html', {
            'error': str(e)
        }, status=404)

@csrf_exempt
def api_send_inspection(request, inspection_id):
    inspection = get_object_or_404(GolfCartInspection, id=inspection_id)
    
    if request.method == 'POST':
        try:
            # Actualizar estado
            inspection.status = 'sent'
            inspection.save()
            
            # Generar URL para el huésped (frontend Vue)
            review_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:9000')}/review/{inspection.access_token}"
            
            # Crear una URL para la nueva página HTML servida por Django
            django_review_url = f"http://localhost:8000/review/{inspection.access_token}/"
            
            # Imprimir la URL de revisión en la consola (para desarrollo)
            print(f"\n\n==== ENLACE DE REVISIÓN ====\n{review_url}\n==========================\n\n")
            print(f"\n\nURL DJANGO (RECOMENDADA):\n{django_review_url}\n==========================\n\n")
            
            # Crear una función para enviar el correo electrónico
            # Esta función se ejecutará en un hilo separado para no bloquear la respuesta
            def send_inspection_email():
                try:
                    # Preparar el contexto para la plantilla del correo
                    context = {
                        'inspection': inspection,
                        'review_url': django_review_url,  # Usamos la URL de Django para la revisión
                    }
                    
                    # Renderizar el contenido HTML del correo
                    email_template = get_template('emails/inspection_review.html')
                    email_content = email_template.render(context)
                    
                    # Configurar el correo
                    subject = f"Inspección de Golf Cart #{inspection.cart_number}"
                    from_email = settings.DEFAULT_FROM_EMAIL
                    recipient_list = [inspection.guest_email]
                    
                    # Crear el mensaje de correo
                    email = EmailMessage(
                        subject,
                        email_content,
                        from_email,
                        recipient_list
                    )
                    email.content_subtype = "html"
                    
                    # Enviar el correo
                    email.send()
                    
                    # Registrar información del correo enviado
                    print(f"[CORREO ENVIADO] Para: {inspection.guest_email}")
                    print(f"[CORREO ENVIADO] Asunto: {subject}")
                    print(f"[CORREO ENVIADO] URL de revisión: {django_review_url}")
                    print(f"[CORREO ENVIADO] Completado con éxito")
                    
                except Exception as e:
                    print(f"[ERROR DE CORREO] Error al enviar correo: {str(e)}")
                    import traceback
                    print(f"Detalles del error:\n{traceback.format_exc()}")
            
            # Iniciar el hilo para enviar el correo
            email_thread = threading.Thread(target=send_inspection_email)
            email_thread.daemon = True  # El hilo se cerrará cuando el programa principal termine
            email_thread.start()
            
            # Devolver una respuesta exitosa con las URLs
            return JsonResponse({
                'status': 'sent',
                'message': f'Correo enviado a {inspection.guest_email}',
                'review_url': review_url,  # URL principal (frontend Vue)
                'django_review_url': django_review_url  # URL de la página HTML servida por Django
            })
            
        except Exception as e:
            # Capturar cualquier error en el proceso
            print(f"Error en api_send_inspection: {str(e)}")
            return JsonResponse({
                'error': f'Error al procesar la inspección: {str(e)}'
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
            # Procesar la firma (guardar como imagen si es base64)
            signature_data = data['guest_signature']
            if signature_data and signature_data.startswith('data:image'):
                # Guardar la firma como imagen
                signature_url = upload_base64_image(signature_data, folder=f'signatures/{inspection.id}')
                if signature_url:
                    inspection.guest_signature_url = signature_url
            
            inspection.guest_signature = data['guest_signature']
            inspection.guest_confirms_damages = data['guest_confirms_damages']
            inspection.guest_accepts_terms = data['guest_accepts_terms']
            inspection.guest_comments = data.get('guest_comments', '')
            inspection.guest_signature_date = timezone.now()
            inspection.status = 'signed'
            inspection.signed_at = timezone.now()
            inspection.save()
            
            print(f"Inspección actualizada: {inspection.id} - {inspection.guest_name}")
            
            # Generar PDF
            print(f"Generando PDF para la inspección {inspection.id}")
            context = {
                'inspection': inspection,
                'date': timezone.now().strftime("%d/%m/%Y"),
            }
            pdf_file = render_to_pdf('pdf/inspection_report.html', context)
            
            if pdf_file:
                print(f"PDF generado correctamente para la inspección {inspection.id}")
            else:
                print(f"Error al generar PDF para la inspección {inspection.id}")
            
            # Enviar correo al encargado con el PDF adjunto
            if pdf_file:
                # Variables para el correo
                subject = None
                message = None
                
                # Preparar el contenido del correo
                try:
                    # Preparar el asunto
                    subject = f"Inspección firmada - Golf Cart {inspection.cart_number}"
                    
                    # Contexto para la plantilla de correo
                    context = {
                        'inspection': inspection,
                        'date': timezone.now().strftime("%d/%m/%Y"),
                        'time': timezone.now().strftime("%H:%M"),
                    }
                    
                    # Si existe una plantilla HTML para el correo, usarla
                    try:
                        email_template = get_template('emails/inspection_signed.html')
                        message = email_template.render(context)
                    except Exception as template_error:
                        print(f"Error al cargar plantilla de correo: {str(template_error)}")
                        # Usar mensaje HTML simple como respaldo
                        message = f"""<html>
                        <body>
                            <h2>Inspección firmada por el huésped</h2>
                            <p>El huésped <strong>{inspection.guest_name}</strong> ha firmado la inspección del Golf Cart {inspection.cart_number}.</p>
                            <p>Fecha de firma: {timezone.now().strftime("%d/%m/%Y %H:%M")}</p>
                            <p>Se adjunta el PDF con todos los detalles de la inspección y las firmas correspondientes.</p>
                            <p>Comentarios del huésped: {inspection.guest_comments or 'Ninguno'}</p>
                        </body>
                        </html>"""
                except Exception as e:
                    print(f"Error al preparar el mensaje de correo: {str(e)}")
                    # No continuamos si no pudimos preparar el mensaje
                    return JsonResponse({
                        'status': 'signed',
                        'message': 'Inspección firmada exitosamente, pero hubo un error al enviar el correo'
                    })
                
                # Usar el correo del encargado como destinatario
                # Aquí podrías usar una configuración o el correo del inspector
                inspector_email = os.getenv('EMAIL_HOST_USER')  # O inspection.inspector_email si lo tienes
                
                # Si no hay correo configurado, usar uno de prueba
                if not inspector_email:
                    inspector_email = 'admin@example.com'
                    print(f"ADVERTENCIA: No se encontró EMAIL_HOST_USER, usando correo de prueba: {inspector_email}")
                
                # Enviar el correo con el PDF adjunto
                try:
                    # Crear el mensaje de correo
                    email = EmailMessage(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL,
                        [inspector_email]
                    )
                    email.content_subtype = "html"
                    
                    # Adjuntar el PDF
                    filename = f"inspeccion_golfcart_{inspection.cart_number}_{timezone.now().strftime('%Y%m%d')}.pdf"
                    email.attach(
                        filename,
                        pdf_file,
                        'application/pdf'
                    )
                    
                    # Enviar el correo
                    email.send()
                    print(f"Correo con PDF enviado al encargado: {inspector_email}")
                except Exception as email_error:
                    print(f"Error al enviar el correo: {str(email_error)}")
                    import traceback
                    print(f"Detalles del error de correo:\n{traceback.format_exc()}")
            
            return JsonResponse({
                'status': 'signed',
                'message': 'Inspección firmada exitosamente'
            })
            
        except Exception as e:
            error_message = f"Error al procesar la firma: {str(e)}"
            print(error_message)
            # Registrar el error con más detalles para depuración
            import traceback
            print(f"Detalles del error:\n{traceback.format_exc()}")
            
            return JsonResponse({
                'error': error_message,
                'details': str(e)
            }, status=500)

@csrf_exempt
def generate_pdf(request, token):
    """
    Genera un PDF de la inspección y lo devuelve para descarga
    """
    try:
        inspection = get_object_or_404(GolfCartInspection, access_token=token)
        
        print(f"Generando PDF para descarga, inspección: {inspection.id}")
        
        # Generar PDF
        context = {
            'inspection': inspection,
            'date': timezone.now().strftime("%d/%m/%Y"),
        }
        pdf = render_to_pdf('pdf/inspection_report.html', context)
        
        if not pdf:
            print(f"Error al generar PDF para la inspección {inspection.id}")
            return HttpResponse("Error al generar el PDF", status=500)
        
        # Devolver como respuesta para descarga
        response = HttpResponse(pdf, content_type='application/pdf')
        try:
            filename = f"inspeccion_golfcart_{inspection.cart_number}_{inspection.inspection_date.strftime('%Y%m%d')}.pdf"
        except Exception as e:
            print(f"Error al generar nombre de archivo: {str(e)}")
            filename = f"inspeccion_golfcart_{inspection.id}_{timezone.now().strftime('%Y%m%d')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        print(f"PDF generado correctamente para descarga: {filename}")
        return response
    except Exception as e:
        error_message = f"Error al generar PDF para descarga: {str(e)}"
        print(error_message)
        import traceback
        print(f"Detalles del error:\n{traceback.format_exc()}")
        return HttpResponse(error_message, status=500)

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
