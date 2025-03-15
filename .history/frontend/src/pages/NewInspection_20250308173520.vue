<template>
  <q-page class="q-pa-md flex justify-center">
    <div class="form-container">
      <!-- 1. Header Section -->
      <div class="header-section q-mb-lg">
        <div class="row items-center justify-between">
          <div class="col-auto">
            <q-img
              src="/frontend/src/assets/images/logo.png"
              width="150px"
              class="q-mr-md"
            />
          </div>
          <div class="col text-h4 text-primary text-center">
            Golf Cart Inspection
          </div>
        </div>
      </div>

      <!-- 2. Guest Information Section -->
      <GuestInfoForm
        v-model="guestInfo"
        :property-options="propertyOptions"
      />

      <!-- 3. Damage Records Section -->
      <div class="damages-section q-mb-lg">
        <div class="text-h6 q-mb-md">Damage Records</div>
        
        <!-- Tabla de registros existentes -->
        <DamageRecordList
          v-model="damages"
        />

        <!-- Formulario para agregar nuevo daño -->
        <DamageRecordForm
          :cart-parts="cartParts"
          :damage-types="damageTypes"
          @add="addDamage"
        />
      </div>

      <!-- Guest Observations -->
      <GuestObservations
        v-model="guestObservations"
      />

      <!-- Terms and Signature -->
      <SignatureCanvas
        v-model:terms-accepted="termsAccepted"
        @signature-change="updateSignature"
        ref="signatureComponent"
      />
      
      <!-- Buttons Row -->
      <div class="q-mt-md text-center">
        <div class="row justify-center q-gutter-md">
          <q-btn
            flat
            label="Clear Signature"
            @click="clearSignature"
            class="q-mt-md"
          />
          <q-btn
            type="submit"
            color="primary"
            :disable="!isFormValid"
            label="Send to Guest"
            class="q-mt-md"
            @click="submitInspection"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

// Importar componentes
import GuestInfoForm from '../components/GuestInfoForm.vue'
import DamageRecordList from '../components/DamageRecordList.vue'
import DamageRecordForm from '../components/DamageRecordForm.vue'
import GuestObservations from '../components/GuestObservations.vue'
import SignatureCanvas from '../components/SignatureCanvas.vue'

export default {
  name: 'NewInspection',
  
  components: {
    GuestInfoForm,
    DamageRecordList,
    DamageRecordForm,
    GuestObservations,
    SignatureCanvas
  },
  
  setup() {
    const q = useQuasar()
    const router = useRouter()
    const signatureComponent = ref(null)
    
    // Datos del formulario
    const guestInfo = ref({
      name: '',
      email: '',
      phone: '',
      property: null,
      date: new Date().toISOString().substr(0, 10)
    })
    const damages = ref([])
    const termsAccepted = ref(false)
    const guestObservations = ref('')
    const signatureData = ref(null)

    // Opciones para los selectores
    const propertyOptions = [
      'Villa 1', 'Villa 2', 'Villa 3',
      'Villa 4', 'Villa 5', 'Villa 6'
    ]

    const cartParts = [
      { label: '1. Front Bumper', value: 'front_bumper' },
      { label: '2. Rear Bumper', value: 'rear_bumper' },
      { label: '3. Left Front Fender', value: 'left_front_fender' },
      { label: '4. Right Front Fender', value: 'right_front_fender' },
      { label: '5. Left Rear Fender', value: 'left_rear_fender' },
      { label: '6. Right Rear Fender', value: 'right_rear_fender' },
      { label: '7. Left Side Panel', value: 'left_side_panel' },
      { label: '8. Right Side Panel', value: 'right_side_panel' },
      { label: '9. Roof', value: 'roof' },
      { label: '10. Windshield', value: 'windshield' },
      { label: '11. Left Mirror', value: 'left_mirror' },
      { label: '12. Right Mirror', value: 'right_mirror' },
      { label: '13. Front Lights', value: 'front_lights' },
      { label: '14. Rear Lights', value: 'rear_lights' },
      { label: '15. Left Door', value: 'left_door' },
      { label: '16. Right Door', value: 'right_door' },
      { label: '17. Front Row - Driver Seat Cushion', value: 'front_driver_seat_cushion' },
      { label: '18. Front Row - Driver Seat Backrest', value: 'front_driver_seat_backrest' },
      { label: '19. Front Row - Passenger Seat Cushion', value: 'front_passenger_seat_cushion' },
      { label: '20. Front Row - Passenger Seat Backrest', value: 'front_passenger_seat_backrest' },
      { label: '21. Middle Row - Left Seat Cushion', value: 'middle_left_seat_cushion' },
      { label: '22. Middle Row - Left Seat Backrest', value: 'middle_left_seat_backrest' },
      { label: '23. Middle Row - Right Seat Cushion', value: 'middle_right_seat_cushion' },
      { label: '24. Middle Row - Right Seat Backrest', value: 'middle_right_seat_backrest' },
      { label: '25. Rear Row - Left Seat Cushion', value: 'rear_left_seat_cushion' },
      { label: '26. Rear Row - Left Seat Backrest', value: 'rear_left_seat_backrest' },
      { label: '27. Rear Row - Right Seat Cushion', value: 'rear_right_seat_cushion' },
      { label: '28. Rear Row - Right Seat Backrest', value: 'rear_right_seat_backrest' },
      { label: '29. Steering Wheel', value: 'steering_wheel' },
      { label: '30. Dashboard', value: 'dashboard' },
      { label: '31. Pedals', value: 'pedals' },
      { label: '32. Left Front Wheel Rim', value: 'left_front_wheel_rim' },
      { label: '33. Right Front Wheel Rim', value: 'right_front_wheel_rim' },
      { label: '34. Left Rear Wheel Rim', value: 'left_rear_wheel_rim' },
      { label: '35. Right Rear Wheel Rim', value: 'right_rear_wheel_rim' },
      { label: '36. Left Front Tire', value: 'left_front_tire' },
      { label: '37. Right Front Tire', value: 'right_front_tire' },
      { label: '38. Left Rear Tire', value: 'left_rear_tire' },
      { label: '39. Right Rear Tire', value: 'right_rear_tire' },
      { label: '40. Tubular Bars (Steel/Aluminum)', value: 'tubular_bars' }
    ]

    const damageTypes = [
      { label: 'Scratches', value: 'scratches' },
      { label: 'Missing Parts', value: 'missing_parts' },
      { label: 'Damages/Bumps', value: 'damages' }
    ]

    // Validación del formulario
    const isFormValid = computed(() => {
      const basicInfoValid = guestInfo.value.name && 
                           guestInfo.value.email && 
                           guestInfo.value.property
      const damagesValid = damages.value.length > 0
      
      
      // Solo requerimos la información básica y los registros de daños para habilitar el envío
      return basicInfoValid && damagesValid
    })
    
    // Funciones para manejar eventos de los componentes
    const updateSignature = (data) => {
      signatureData.value = data
    }
    
    const clearSignature = () => {
      if (signatureComponent.value) {
        signatureComponent.value.clearSignature()
        signatureData.value = null
      }
    }

    const submitInspection = async () => {
      try {
        // Convertir los daños al formato esperado por el backend
        const damagesByPart = damages.value.reduce((acc, damage) => {
          const description = `${damage.type} (${damage.quantity})`
          acc[`${damage.part}_damage`] = acc[`${damage.part}_damage`] 
            ? `${acc[`${damage.part}_damage`]}; ${description}`
            : description
          return acc
        }, {})

        // Preparar los datos para enviar
        const inspectionData = {
          cart_id: guestInfo.value.property || 'Unknown',
          property_name: guestInfo.value.property ? guestInfo.value.property.split(' ')[0] : 'Default',
          guest_name: guestInfo.value.name,
          guest_email: guestInfo.value.email,
          guest_phone: guestInfo.value.phone || '',
          inspection_date: guestInfo.value.date,
          inspector_name: 'Inspector Name',
          ...damagesByPart,
          additional_notes: guestObservations.value || '',
          inspector_signature: signatureData.value || '',
          terms_accepted: termsAccepted.value
        }

        // Enviar la inspección al backend
        const response = await fetch('http://localhost:8000/api/inspections/create/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          credentials: 'include',
          body: JSON.stringify(inspectionData)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`)
        }

        const result = await response.json()
        
        // Notificar al usuario que la inspección se creó correctamente
        q.notify({
          type: 'positive',
          message: 'Inspección creada exitosamente. Enviando al huésped...',
          position: 'top',
          timeout: 2000
        })
        
        // Enviar correo electrónico al huésped
        await sendInspectionEmail(result.id, guestInfo.value.email)
        
      } catch (error) {
        console.error('Error submitting inspection:', error)
        q.notify({
          type: 'negative',
          message: 'Error al enviar la inspección. Por favor, intente nuevamente.',
          position: 'top'
        })
      }
    }
    
    // Función para enviar el correo electrónico
    const sendInspectionEmail = async (inspectionId, email) => {
      try {
        // Notificar al usuario que se está enviando el correo
        q.notify({
          type: 'info',
          message: `Enviando correo a ${email}...`,
          position: 'top',
          timeout: 2000
        })
        
        const sendResponse = await fetch(`http://localhost:8000/api/inspections/${inspectionId}/send/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          credentials: 'include',
        })
        
        // Verificar si la respuesta es OK antes de intentar parsear el JSON
        if (!sendResponse.ok) {
          const errorText = await sendResponse.text()
          throw new Error(`Error del servidor: ${sendResponse.status} - ${errorText}`)
        }
        
        const sendResult = await sendResponse.json()
        
        // Obtener la información necesaria
        const reviewUrl = sendResult.review_url
        const token = reviewUrl.split('/').pop() // Extraer el token del final de la URL
        
        // Obtener la URL de Django
        const djangoReviewUrl = sendResult.django_review_url || `http://localhost:8000/review/${token}/`
        
        // Mostrar un diálogo con las opciones
        q.dialog({
          title: 'Información de revisión',
          message: `
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
              <h4 style="margin-top: 0;">Correo simulado para ${email}</h4>
              <p>Para revisar la inspección, tienes las siguientes opciones:</p>
              
              <p><strong>OPCIÓN 1 (RECOMENDADA): Usar la página web de Django</strong></p>
              <p><a href="${djangoReviewUrl}" target="_blank" class="btn btn-primary">Abrir página de revisión</a></p>
              <p><small>Esta opción abre una página web servida directamente por Django.</small></p>
              
              <p><strong>OPCIÓN 2: Ver datos JSON directamente</strong></p>
              <p><a href="http://localhost:8000/api/inspections/review/${token}/" target="_blank">Ver datos JSON de la inspección</a></p>
              
              <p><strong>OPCIÓN 3: URL original (frontend Vue)</strong></p>
              <p><a href="${reviewUrl}" target="_blank">${reviewUrl}</a></p>
              <p><small>Nota: Esta opción puede no funcionar correctamente si hay problemas con la configuración del frontend.</small></p>
            </div>
          `,
          html: true,
          ok: 'Copiar token',
          cancel: 'Continuar',
          persistent: true
        }).onOk(() => {
          // Copiar el token al portapapeles
          navigator.clipboard.writeText(token)
            .then(() => {
              q.notify({
                type: 'positive',
                message: 'Token copiado al portapapeles',
                position: 'top'
              })
            })
        })
        
        // Notificar éxito
        q.notify({
          type: 'positive',
          message: `Simulación de correo para ${email} completada`,
          position: 'top',
          timeout: 3000
        })
        
        // Redirigir a la página de éxito
        setTimeout(() => router.push('/success'), 3000)
        return true
      } catch (emailError) {
        console.error('Error sending email:', emailError)
        
        // Mostrar notificación de error
        q.notify({
          type: 'warning',
          message: `La inspección se creó pero hubo un error al enviar el correo: ${emailError.message}`,
          position: 'top',
          timeout: 5000
        })
        
        // Aún así redirigimos, ya que la inspección se creó correctamente
        setTimeout(() => router.push('/success'), 3000)
        return false
      }
    }

    // Función para agregar daños
    const addDamage = (newDamage) => {
      damages.value.push(newDamage)
    }

    return {
      guestInfo,
      propertyOptions,
      cartParts,
      damageTypes,
      damages,
      termsAccepted,
      signatureComponent,
      guestObservations,
      isFormValid,
      updateSignature,
      clearSignature,
      submitInspection,
      addDamage
    }
  }
}

// Función auxiliar para obtener el token CSRF
function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
}
</script>

<style scoped>
.form-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .form-container {
    max-width: 100%;
  }
}
</style>
