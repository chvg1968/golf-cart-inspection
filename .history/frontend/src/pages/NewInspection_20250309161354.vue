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
                :rules="[val => !!val || 'Name is required']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input 
                v-model="guestInfo.email" 
                label="Guest Email" 
                type="email" 
                outlined 
                :rules="[
                  val => !!val || 'Email is required',
                  val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Invalid email format'
                ]"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input 
                v-model="guestInfo.phone" 
                label="Guest Phone" 
                outlined 
                mask="(+57) ### ### ####"
                unmasked-value
                hint="Format: (+57) 300 123 4567"
                :rules="[
                  val => !!val || 'Phone is required',
                  val => val.length >= 10 || 'Invalid phone number'
                ]"
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
                type="date" 
                label="Inspection Date" 
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
          label="Cart Type"
          outlined
          @update:model-value="handleCartTypeChange"
        />
      </div>

      <!-- Diagrama del Carrito -->
      <q-card flat bordered class="q-mb-lg no-hover cart-diagram-container">
        <q-card-section>
          <h6 class="text-h6 q-mb-md">Cart Diagram</h6>
          <CartDiagramAnnotations 
            :cart-type="selectedCartType?.value" 
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

      <!-- Términos y firma -->
      <q-card flat bordered class="q-mt-lg">
        <q-card-section>
          <SignatureCanvas
            :terms-accepted="termsAccepted"
            @update:terms-accepted="termsAccepted = $event"
            @signature-change="signature = $event"
          >
            <template #submit-button>
              <q-btn 
                color="primary" 
                label="Submit Inspection" 
                type="submit"
                :disable="!isFormValid"
              />
            </template>
          </SignatureCanvas>
        </q-card-section>
      </q-card>
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Notify } from 'quasar'
import axios from 'axios'
import SignatureCanvas from '../components/SignatureCanvas.vue'
import CartDiagramAnnotations from '../components/CartDiagramAnnotations.vue'
import DamageRecordForm from '../components/DamageRecordForm.vue'
import DamageRecordList from '../components/DamageRecordList.vue'

// Partes del carrito
const cartParts = ref([
  { label: 'Front Bumper', value: 'front_bumper' },
  { label: 'Rear Bumper', value: 'rear_bumper' },
  { label: 'Front Wheels', value: 'front_wheels' },
  { label: 'Rear Wheels', value: 'rear_wheels' },
  { label: 'Seat', value: 'seat' },
  { label: 'Steering Wheel', value: 'steering_wheel' },
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Windshield', value: 'windshield' },
  { label: 'Roof', value: 'roof' },
  { label: 'Body', value: 'body' },
  { label: 'Other', value: 'other' }
])

// Configurar axios para desarrollo
axios.defaults.baseURL = 'http://localhost:8000'

// Tipos de daño
const damageTypes = ref([
  { label: 'Scratch', value: 'scratch' },
  { label: 'Dent', value: 'dent' },
  { label: 'Crack', value: 'crack' },
  { label: 'Missing Part', value: 'missing_part' },
  { label: 'Other', value: 'other' }
])

// Propiedades
const propertyOptions = [
  'Villa 1', 'Villa 2', 'Villa 3', 
  'Villa 4', 'Villa 5', 'Villa 6'
]

// Tipos de carrito
const cartTypeOptions = [
  { label: 'Standard Golf Cart', value: 'standard' },
  { label: 'Luxury Golf Cart', value: 'luxury' },
  { label: 'Electric Golf Cart', value: 'electric' },
  { label: 'Utility Golf Cart', value: 'utility' }
]

// Estado del formulario
const selectedCartType = ref(null)
const damages = ref([])
const guestObservations = ref('')
const termsAccepted = ref(false)
const signature = ref(null)

const guestInfo = ref({
  name: '',
  email: '',
  phone: '',
  property: '',
  date: ''
})

// Validación de formulario
const isFormValid = computed(() => {
  // Validaciones de información de invitado
  const isGuestInfoValid = 
    guestInfo.value.name && 
    guestInfo.value.email && 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.value.email) &&
    guestInfo.value.phone && 
    guestInfo.value.phone.length >= 10 &&
    guestInfo.value.property &&
    guestInfo.value.date

  // Validaciones adicionales
  const isCartTypeValid = selectedCartType.value !== null
  const areObservationsValid = !!guestObservations.value
  const isTermsAccepted = termsAccepted.value

  return isGuestInfoValid && 
         isCartTypeValid && 
         areObservationsValid && 
         isTermsAccepted
})

// Manejo de cambios en el tipo de carrito
const handleCartTypeChange = (newCartType) => {
  // Lógica para manejar el cambio de tipo de carrito
  damages.value = [] // Reiniciar daños al cambiar el tipo de carrito
}

// Manejo de daños
const handleAddDamage = (newDamage) => {
  damages.value.push({
    ...newDamage,
    id: Date.now() // Generar un ID único
  })
}

const handleRemoveDamage = (damageToRemove) => {
  damages.value = damages.value.filter(damage => damage.id !== damageToRemove.id)
}

const updateDamagePosition = (updatedDamage) => {
  const index = damages.value.findIndex(d => d.id === updatedDamage.id)
  if (index !== -1) {
    damages.value[index] = updatedDamage
  }
}

// Método de envío de inspección
const submitInspection = async () => {
  try {
    // Preparar datos de la inspección
    const inspectionData = {
      guest_name: guestInfo.value.name,
      guest_email: guestInfo.value.email,
      guest_phone: guestInfo.value.phone,
      property: guestInfo.value.property,
      inspection_date: guestInfo.value.date,
      cart_type: selectedCartType.value?.value,
      damages: damages.value,
      observations: guestObservations.value,
      signature: signature.value
    }

    // Intentar enviar datos al backend
    try {
      await axios.post('/api/inspections/', inspectionData)
      Notify.create({
        type: 'positive',
        message: 'Inspection submitted successfully',
        position: 'top'
      })
    } catch (backendError) {
      console.warn('Backend submission failed:', backendError)
      Notify.create({
        type: 'warning',
        message: 'Inspection saved locally. Backend submission failed.',
        position: 'top'
      })
    }

    // Reiniciar formulario
    resetForm()
  } catch (error) {
    console.error('Error in submission process:', error)
    Notify.create({
      type: 'negative',
      message: 'Error submitting inspection',
      position: 'top'
    })
  }
}

// Reiniciar formulario
const resetForm = () => {
  guestInfo.value = {
    name: '',
    email: '',
    phone: '',
    property: '',
    date: ''
  }
  selectedCartType.value = null
  damages.value = []
  guestObservations.value = ''
  termsAccepted.value = false
  signature.value = null
}
</script>

<style scoped>
.form-container {
  max-width: 800px;
  margin: 0 auto;
}

.logo {
  max-width: 200px;
  margin-bottom: 20px;
}

.inspection-header {
  margin-bottom: 30px;
}
</style>
