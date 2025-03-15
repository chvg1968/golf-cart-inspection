<template>
  <q-page class="q-pa-md flex justify-center">
    <div class="form-container">
      <!-- 1. Header Section -->
      <div class="header-section q-mb-lg">
        <div class="row items-center justify-between">
          <div class="col-auto">
            <q-img
              src="/images/company-logo.png"
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
          @remove="removeDamage"
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
      
      <!-- Submit Button -->
      <div class="q-mt-md text-center">
        <q-btn
          type="submit"
          color="primary"
          :disable="!isFormValid"
          label="Submit Inspection"
          class="q-mt-md"
          @click="submitInspection"
        />
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
      { label: 'Front', value: 'front' },
      { label: 'Back', value: 'back' },
      { label: 'Left Side', value: 'left_side' },
      { label: 'Right Side', value: 'right_side' },
      { label: 'Interior', value: 'interior' },
      { label: 'Wheels', value: 'wheels' }
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
      const signatureValid = signatureData.value !== null
      const termsValid = termsAccepted.value
      
      return basicInfoValid && damagesValid && signatureValid && termsValid
    })
    
    // Funciones para manejar eventos de los componentes
    const updateSignature = (data) => {
      signatureData.value = data
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
          cart_id: guestInfo.value.property,
          guest_name: guestInfo.value.name,
          guest_email: guestInfo.value.email,
          inspection_date: guestInfo.value.date,
          inspector_name: 'Inspector Name',
          ...damagesByPart,
          additional_notes: guestObservations.value || '',
          inspector_signature: signatureData.value || ''
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
          message: 'Inspección creada exitosamente',
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
        const sendResponse = await fetch(`http://localhost:8000/api/inspections/${inspectionId}/send/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          credentials: 'include',
        })
        
        const sendResult = await sendResponse.json()
        
        if (sendResponse.ok) {
          q.notify({
            type: 'positive',
            message: `Correo enviado exitosamente a ${email}`,
            position: 'top',
            timeout: 3000
          })
          
          // Redirigir a la página de éxito
          setTimeout(() => router.push('/success'), 1500)
          return true
        } else {
          throw new Error(sendResult.error || 'Error al enviar el correo')
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError)
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

    // Funciones para manejar los daños
    const addDamage = (newDamage) => damages.value.push(newDamage)
    const removeDamage = (index) => damages.value.splice(index, 1)

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
      submitInspection,
      addDamage,
      removeDamage
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
