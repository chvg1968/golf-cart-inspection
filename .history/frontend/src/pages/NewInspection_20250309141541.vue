<template>
  <q-page class="q-pa-md">
    <q-form @submit.prevent="submitInspection" class="form-container">
      <!-- Título de la Inspección -->
      <div class="inspection-header text-center q-mb-lg">
        <img src="../assets/images/logo.png" alt="Golf Cart Inspection Logo" class="logo q-mb-md">
        <h4 class="text-h4">Golf Cart Inspection</h4>
      </div>

      <!-- Sección de Información del Invitado -->
      <q-card flat bordered class="q-mb-lg no-hover">
        <q-card-section>
          <h6 class="text-h6 q-mb-md">Guest Information</h6>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input 
                v-model="guestInfo.name" 
                label="Guest Name" 
                outlined 
                :rules="[val => !!val || 'Guest name is required']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input 
                v-model="guestInfo.email" 
                label="Guest Email" 
                type="email" 
                outlined 
                :rules="[val => !!val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Invalid email']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input 
                v-model="guestInfo.phone" 
                label="Guest Phone" 
                type="tel" 
                outlined 
                :rules="[val => !!val || 'Guest phone is required']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                v-model="guestInfo.property"
                :options="propertyOptions"
                label="Property"
                outlined
                :rules="[val => !!val || 'Property is required']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input 
                v-model="guestInfo.date" 
                label="Inspection Date" 
                type="date" 
                outlined 
                :rules="[val => !!val || 'Date is required']"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Selector de Tipo de Carrito -->
      <div class="q-mb-md">
        <q-select
          v-model="selectedCartType"
          :options="cartTypeOptions"
          label="Selecciona Tipo de Carrito"
          @update:model-value="handleCartTypeChange"
        />
      </div>

      <!-- Diagrama del Carrito -->
      <q-card flat bordered class="q-mb-lg no-hover">
        <q-card-section>
          <h6 class="text-h6 q-mb-md">Cart Diagram</h6>
          <CartDiagramAnnotations 
            :cart-type="selectedCartType.value" 
            :damages="damages" 
            @update:damage-position="updateDamagePosition"
          />
        </q-card-section>
      </q-card>

      <!-- Registro de Daños -->
      <q-card flat bordered class="q-mb-lg no-hover">
        <q-card-section>
          <h6 class="text-h6 q-mb-md">Damage Records</h6>
          <DamageRecordList
            v-model="damages"
            :cart-parts="cartParts"
            :damage-types="damageTypes"
            @remove="handleRemoveDamage"
          />
          
          <!-- Formulario de Registro de Daños -->
          <div class="q-mt-md">
            <DamageRecordForm
              :cart-parts="cartParts"
              :damage-types="damageTypes"
              @add="handleAddDamage"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Observaciones de Invitado -->
      <q-card flat bordered class="q-mb-lg no-hover">
        <q-card-section>
          <h6 class="text-h6 q-mb-md">Guest Observations</h6>
          <q-input
            v-model="guestObservations"
            label="Additional Notes"
            outlined
            type="textarea"
            :rules="[val => !!val || 'Observations are required']"
          />
        </q-card-section>
      </q-card>

      <!-- Términos y Firma -->
      <q-card flat bordered class="q-mb-lg no-hover">
        <q-card-section>
          <SignatureCanvas
            v-model:terms-accepted="termsAccepted"
            ref="signatureComponent"
            @update:signature="updateSignature"
          />
        </q-card-section>
      </q-card>

      <!-- Botón de Envío -->
      <div class="text-center q-mt-lg">
        <q-btn 
          color="primary" 
          label="Submit Inspection" 
          type="submit" 
          size="lg"
          :disable="!isFormValid"
        />
      </div>
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import axios from 'axios'

import CartDiagramAnnotations from '../components/CartDiagramAnnotations.vue'
import DamageRecordForm from '../components/DamageRecordForm.vue'
import DamageRecordList from '../components/DamageRecordList.vue'
import SignatureCanvas from '../components/SignatureCanvas.vue'
import { CART_PARTS } from '../components/DamageRecordList.vue'

console.error('NewInspection Component: Initializing')
console.log('Imported Components:', {
  CartDiagramAnnotations: !!CartDiagramAnnotations,
  DamageRecordForm: !!DamageRecordForm,
  DamageRecordList: !!DamageRecordList,
  SignatureCanvas: !!SignatureCanvas
})

// Partes del carrito
const cartParts = ref(CART_PARTS)

// Configurar axios para desarrollo
axios.defaults.baseURL = 'http://localhost:8000'
axios.defaults.withCredentials = true

const q = useQuasar()

// Función para obtener el token CSRF
const getCsrfToken = () => {
  const csrfTokenElement = document.querySelector('meta[name="csrf-token"]')
  const token = csrfTokenElement ? csrfTokenElement.getAttribute('content') : ''
  console.log('Token CSRF obtenido:', token)
  return token
}

// Tipos de carrito
const cartTypeOptions = [
  { label: '4-Seater', value: '4-seater' },
  { label: '6-Seater', value: '6-seater' }
]

// Estado del formulario
const selectedCartType = ref({ label: '4-Seater', value: '4-seater' })
const damages = ref([])
const guestObservations = ref('')
const termsAccepted = ref(false)
const signature = ref(null)

// Datos del formulario
const guestInfo = ref({
  name: '',
  email: '',
  phone: '',
  property: null,
  date: new Date().toISOString().substr(0, 10)
})

// Tipos de daño
const damageTypes = ref([
  { label: 'Scratch', value: 'scratch' },
  { label: 'Missing parts', value: 'missing_parts' },
  { label: 'Damage/Bumps', value: 'damages' }
])

// Propiedades
const propertyOptions = [
  'Villa 1', 'Villa 2', 'Villa 3',
  'Villa 4', 'Villa 5', 'Villa 6'
]

// Validación del formulario
const isFormValid = computed(() => {
  return guestInfo.value.name &&
         guestInfo.value.email &&
         guestInfo.value.phone &&
         guestInfo.value.property &&
         damages.value.length > 0
})

// Método de envío de inspección
const submitInspection = async () => {
  try {
    // Validar que todos los campos obligatorios estén presentes
    if (!isFormValid.value) {
      // Mensajes específicos de validación
      if (damages.value.length === 0) {
        q.notify({
          type: 'warning',
          message: 'Debe registrar al menos un daño en el carrito',
          position: 'top'
        })
      } else {
        q.notify({
          type: 'warning',
          message: 'Por favor complete todos los campos requeridos',
          position: 'top'
        })
      }
      return
    }

    // Preparar datos para enviar
    const inspectionData = {
      guest_name: guestInfo.value.name,
      guest_email: guestInfo.value.email,
      guest_phone: guestInfo.value.phone,
      property_name: guestInfo.value.property,
      cart_type: selectedCartType.value.value,
      inspection_date: guestInfo.value.date,
      
      // Datos de daños
      damage_records: damages.value.map(damage => ({
        part: damage.part,
        type: damage.type,
        description: damage.description || '',
        location: damage.location || ''
      })),
      
      // Observaciones adicionales
      additional_notes: guestObservations.value,
      
      // Datos de firma
      guest_signature: signature.value,
      terms_accepted: termsAccepted.value
    }

    console.log('Sending Inspection Data:', inspectionData)

    // Enviar datos al backend
    const response = await axios.post('/inspections/create/', inspectionData, {
      headers: {
        'X-CSRFToken': getCsrfToken(),
        'Content-Type': 'application/json'
      }
    })

    // Manejar respuesta exitosa
    if (response.data && response.data.id) {
      q.notify({
        type: 'positive',
        message: `Inspección creada exitosamente. ID: ${response.data.id}`,
        position: 'top'
      })

      // Resetear formulario después del envío
      resetForm()
    } else {
      throw new Error('No se recibió un ID de inspección válido')
    }
  } catch (error) {
    console.error('Error submitting inspection:', error)
    
    // Manejar diferentes tipos de errores
    const errorMessage = error.response?.data?.error || 
                         error.response?.data?.message || 
                         error.message || 
                         'Error desconocido al enviar la inspección'
    
    q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
      timeout: 5000
    })
  }
}

// Manejo de cambios en el tipo de carrito
const handleCartTypeChange = (newCartType) => {
  console.log('Cart Type Changed:', newCartType)
}

// Manejo de daños
const handleAddDamage = (damage) => {
  damages.value.push(damage)
}

const handleRemoveDamage = (index) => {
  damages.value.splice(index, 1)
}

const updateDamagePosition = (damageData) => {
  console.log('Damage Position Updated:', damageData)
}

const resetForm = () => {
  guestInfo.value = {
    name: '',
    email: '',
    phone: '',
    property: null,
    date: new Date().toISOString().substr(0, 10)
  }
  damages.value = []
  termsAccepted.value = false
  signature.value = null
}

const updateSignature = (signatureData) => {
  console.log('Signature updated:', signatureData)
}
</script>

<style scoped>
.form-container {
  max-width: 800px;
  margin: 0 auto;
}

.inspection-header .logo {
  max-width: 200px;
  height: auto;
}

/* Eliminar efecto hover y sombras de las tarjetas */
.no-hover {
  box-shadow: none !important;
  transition: none !important;
}

.no-hover:hover {
  box-shadow: none !important;
}
</style>
