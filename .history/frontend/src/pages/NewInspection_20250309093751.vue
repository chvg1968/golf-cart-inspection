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
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import axios from 'axios'

import CartDiagramAnnotations from '../components/CartDiagramAnnotations.vue'
import DamageRecordForm from '../components/DamageRecordForm.vue'
import DamageRecordList from '../components/DamageRecordList.vue'
import SignatureCanvas from '../components/SignatureCanvas.vue'
import { CART_PARTS } from '../components/DamageRecordList.vue'

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

// Método de envío de inspección
const submitInspection = async () => {
  try {
    // Validación de campos obligatorios
    if (!guestInfo.value.name || !guestInfo.value.email || !guestInfo.value.phone || !guestInfo.value.property) {
      q.notify({
        type: 'warning',
        message: 'Por favor complete todos los campos obligatorios',
        position: 'top'
      })
      return
    }

    // Construir datos de inspección
    const inspectionData = {
      cart_id: selectedCartType.value.value,
      guest_name: guestInfo.value.name,
      guest_email: guestInfo.value.email,
      guest_phone: guestInfo.value.phone,
      property_name: guestInfo.value.property,
      additional_notes: guestObservations.value,
      damages: damages.value.map(damage => ({
        part: damage.part,
        type: damage.type,
        description: damage.description
      }))
    }

    console.group('🔍 Datos de Inspección')
    console.log('Datos a enviar:', JSON.stringify(inspectionData, null, 2))
    console.groupEnd()

    // Enviar solicitud con axios
    const response = await axios.post('/inspections/create/', inspectionData)
    
    console.log('✅ Inspección creada:', response.data)
    
    // Enviar correo electrónico
    await axios.post(`/inspections/${response.data.inspection_id}/send/`, {
      email: guestInfo.value.email
    })
    
    q.notify({
      type: 'positive',
      message: 'Inspección enviada exitosamente',
      position: 'top'
    })

    // Resetear formulario
    resetForm()
    
  } catch (error) {
    console.error('❌ Error completo:', error)
    
    const errorMessage = error.response 
      ? error.response.data.message || 'Error al enviar la inspección'
      : 'Error de conexión con el servidor'
    
    q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top'
    })
  }
}

// Método para resetear el formulario
const resetForm = () => {
  guestInfo.value = {
    name: '',
    email: '',
    phone: '',
    property: null,
    date: new Date().toISOString().substr(0, 10)
  }
  damages.value = []
  guestObservations.value = ''
  termsAccepted.value = false
  signature.value = null
}

// Tipos de daño
const damageTypes = [
  { label: 'Scratches', value: 'scratches' },
  { label: 'Missing Parts', value: 'missing_parts' },
  { label: 'Damage/Bump', value: 'damage_bump' }
]

// Partes del carrito
const cartParts = ref([
  { label: 'Front Bumper', value: 'front_bumper' },
  { label: 'Rear Bumper', value: 'rear_bumper' },
  { label: 'Wheels', value: 'wheels' },
  { label: 'Seats', value: 'seats' },
  { label: 'Steering Wheel', value: 'steering_wheel' },
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Body', value: 'body' }
])

// Opciones para los selectores
const propertyOptions = [
  'Villa 1', 'Villa 2', 'Villa 3',
  'Villa 4', 'Villa 5', 'Villa 6'
]

// Método para manejar cambio de tipo de carrito
const handleCartTypeChange = (newCartType) => {
  // Resetear daños al cambiar el tipo de carrito
  damages.value = []
  console.log('Cart type changed:', newCartType.value)
}

// Validación del formulario
const isFormValid = computed(() => {
  const validationResult = {
    name: !!guestInfo.value.name,
    email: !!guestInfo.value.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.value.email),
    phone: !!guestInfo.value.phone,
    property: !!guestInfo.value.property,
    date: !!guestInfo.value.date,
    damages: damages.value.length > 0 || true  // Opcional: permitir 0 daños
  }

  const isValid = Object.values(validationResult).every(Boolean)

  // Logging detallado para depuración
  if (!isValid) {
    console.group('Validación del Formulario')
    Object.entries(validationResult).forEach(([key, value]) => {
      console.log(`${key}: ${value ? '✓' : '✗'}`)
    })
    console.groupEnd()
  }

  return isValid
})

// Métodos para manejar daños
const handleAddDamage = (damage) => {
  damages.value.push({
    ...damage,
    id: Math.random().toString(36).substr(2, 9)
  })
}

const handleRemoveDamage = (damageId) => {
  damages.value = damages.value.filter(d => d.id !== damageId)
}

const updateDamagePosition = (damageData) => {
  const index = damages.value.findIndex(d => d.id === damageData.id)
  if (index !== -1) {
    damages.value[index] = { ...damages.value[index], ...damageData }
  }
}

const updateSignature = (signatureData) => {
  // Manejar la firma del invitado
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
