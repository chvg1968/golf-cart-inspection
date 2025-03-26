import { supabase } from '@/lib/supabaseClient'
import { FormData } from '@/types'

interface EmailInvitationRequest {
  email: string
  link: string
  formData: FormData
}

export const sendInvitationEmail = async (request: EmailInvitationRequest) => {
  try {
    // Validar datos de entrada
    if (!request.email || !request.link || !request.formData) {
      return {
        success: false,
        message: 'Datos de invitación incompletos'
      }
    }

    // Llamar a la función de Supabase para enviar correo
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: JSON.stringify({
        to: request.email,
        subject: 'Invitación para completar inspección de carrito de golf',
        formData: request.formData,
        link: request.link
      })
    })

    if (error) {
      console.error('Error enviando correo:', error)
      return {
        success: false,
        message: error.message
      }
    }

    return {
      success: true,
      message: 'Correo de invitación enviado exitosamente',
      data
    }
  } catch (error) {
    console.error('Error en sendInvitationEmail:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}
