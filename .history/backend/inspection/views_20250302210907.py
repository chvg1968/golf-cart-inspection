import uuid
import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from .models import GolfCartInspection
from .utils import render_to_pdf

@csrf_exempt
def api_create_inspection(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        
        # Crear inspección con datos básicos
        inspection = GolfCartInspection(
            cart_id=data.get('cart_id'),
            guest_name=data.get('guest_name'),
            guest_email=data.get('guest_email'),
            inspector_name=data.get('inspector_name'),
            inspection_date=data.get('inspection_date'),
            front_damage=data.get('front_damage', ''),
            back_damage=data.get('back_damage', ''),
            left_damage=data.get('left_damage', ''),
            right_damage=data.get('right_damage', ''),
            interior_damage=data.get('interior_damage', ''),
            additional_notes=data.get('additional_notes', ''),
            inspector_signature=data.get('inspector_signature', '')
        )
        
        # Generar token único para acceso del huésped
        inspection.access_token = str(uuid.uuid4())
        inspection.save()
        
        return JsonResponse({
            'id': inspection.id,
            'access_token': inspection.access_token
        })
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)

@csrf_exempt
def api_send_inspection(request, inspection_id):
    inspection = get_object_or_404(GolfCartInspection, id=inspection_id)
    
    if request.method == 'POST':
        # Actualizar estado
        inspection.status = 'sent'
        inspection.sent_at = timezone.now()
        inspection.save()
        
        # Generar URL para el huésped
        review_url = f"{settings.FRONTEND_URL}/review/{inspection.access_token}"
        
        # Enviar correo electrónico
        subject = f"Inspección de Golf Cart - {inspection.cart_id}"
        message = render_to_string('emails/inspection_review.html', {
            'inspection': inspection,
            'review_url': review_url,
        })
        
        email = EmailMessage(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [inspection.guest_email]
        )
        email.content_subtype = "html"
        email.send()
        
        return JsonResponse({'status': 'sent'})
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)

@csrf_exempt
def api_guest_sign(request, token):
    inspection = get_object_or_404(GolfCartInspection, access_token=token)
    
    if request.method == 'POST':
        data = json.loads(request.body)
        
        # Actualizar con la firma del huésped
        inspection.guest_signature = data.get('guest_signature')
        inspection.status = 'signed'
        inspection.signed_at = timezone.now()
        inspection.save()
        
        return JsonResponse({'status': 'signed'})
    
    # Si es GET, devolver datos para mostrar
    if request.method == 'GET':
        return JsonResponse({
            'id': inspection.id,
            'cart_id': inspection.cart_id,
            'guest_name': inspection.guest_name,
            'inspection_date': inspection.inspection_date,
            'front_damage': inspection.front_damage,
            'back_damage': inspection.back_damage,
            'left_damage': inspection.left_damage,
            'right_damage': inspection.right_damage,
            'interior_damage': inspection.interior_damage,
            'additional_notes': inspection.additional_notes,
            'status': inspection.status,
        })
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)

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