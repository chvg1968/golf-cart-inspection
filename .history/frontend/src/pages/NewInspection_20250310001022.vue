<template>
  <q-page class="q-pa-md">
    <q-form 
      @submit.prevent="generatePDF" 
      class="form-container"
    >
      <div class="row q-col-gutter-md">
        <div class="col-12 text-center q-mb-md">
          <img 
            src="~assets/images/logo.png" 
            alt="Company Logo" 
            class="company-logo q-mb-sm"
          />
        </div>

        <div class="col-12 text-center q-mb-md">
          <h3 class="text-h3">Golf Cart Inspection</h3>
        </div>
        
        <!-- Guest Information Grid (2x3) -->
        <div class="col-12">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input 
                v-model="guestInfo.name" 
                label="Guest Name" 
                outlined
                required 
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input 
                v-model="guestInfo.email" 
                label="Guest Email" 
                type="email"
                outlined
                required 
                :rules="[val => val && val.includes('@') || 'Email inválido']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input 
                v-model="guestInfo.phone" 
                label="Guest Phone" 
                outlined
                required
                mask="(+1) ### ###-####"
                unmasked-value
                hint="Format: (+1) 123 456-7890"
                :rules="[val => val && val.length === 10 || 'Please enter a valid phone number']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                v-model="guestInfo.property"
                :options="propertyOptions"
                label="Property"
                outlined
                required
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select 
                v-model="selectedCartType" 
                :options="cartTypes" 
                label="Cart Type" 
                outlined
                required
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input 
                v-model="guestInfo.date" 
                type="date" 
                label="Inspection Date" 
                outlined
                required 
              />
            </div>
          </div>
        </div>
        
        <!-- Diagrama del Carrito -->
        <div class="col-12">
          <CartDiagramAnnotations 
            :cart-type="selectedCartType" 
            :damages="damages" 
            @update:damage-position="updateDamagePosition"
          />
        </div>
        
        <!-- Damage Records (Single Row) -->
        <div class="col-12">
          <div class="row q-col-gutter-sm items-center">
            <div class="col-12">
              <h6 class="text-h6 q-mb-md">Damage Records</h6>
            </div>
            <div class="col-12 damage-record-list">
              <DamageRecordList 
                :damages="damages" 
                :cart-parts="CART_PARTS"
                :damage-types="damageTypes"
                @add="addDamage"
                @remove="removeDamage"
              />
            </div>
            <div class="col-12">
              <DamageRecordForm 
                :cart-parts="CART_PARTS"
                :damage-types="damageTypes"
                @add="addDamage"
              />
            </div>
          </div>
        </div>
        
        <!-- Guest Observations -->
        <div class="col-12 col-md-6 offset-md-3">
          <q-input 
            v-model="guestObservations" 
            label="Guest Observations" 
            type="textarea" 
            outlined
            :maxlength="200"
            hint="Maximum 200 characters"
            rows="3"
          />
        </div>
        
        <!-- Firma -->
        <div class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <SignatureCanvas 
                v-model:terms-accepted="termsAccepted"
                @signature-change="signature = $event"
                @download-pdf="generatePDF"
              >
                <template #submit-button>
                  <q-btn 
                    color="primary" 
                    label="Generate PDF" 
                    type="submit"
                    :disable="!isFormValid"
                    class="q-mt-md"
                  />
                </template>
              </SignatureCanvas>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useQuasar } from 'quasar'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { api } from '../boot/axios'
import DamageRecordList from '../components/DamageRecordList.vue'
import { CART_PARTS } from '../components/DamageRecordList.vue'
import DamageRecordForm from '../components/DamageRecordForm.vue'
import SignatureCanvas from '../components/SignatureCanvas.vue'
import CartDiagramAnnotations from '../components/CartDiagramAnnotations.vue'

// Inicializar Quasar
const q = useQuasar()

// Propiedades disponibles
const propertyOptions = [
  'Villa 1', 'Villa 2', 'Villa 3',
  'Villa 4', 'Villa 5', 'Villa 6'
]

// Tipos de daño
const damageTypes = [
  { label: 'Scratches', value: 'scratches' },
  { label: 'Missing Parts', value: 'missing_parts' },
  { label: 'Damages/Bumps', value: 'damages' }
]

// Información del huésped
const guestInfo = reactive({
  name: '',
  email: '',
  phone: '',
  property: null,
  date: new Date().toISOString().split('T')[0]
})

// Tipo de carrito
const selectedCartType = ref('4-seater')
const cartTypes = ['4-seater', '6-seater']

// Daños
const damages = ref([])
const guestObservations = ref('')
const signature = ref(null)
const termsAccepted = ref(false)

// Añadir daño
const addDamage = (damage) => {
  damages.value.push(damage)
}

// Eliminar daño
const removeDamage = (index) => {
  damages.value.splice(index, 1)
}

// Validación de formulario
const isFormValid = computed(() => {
  const guestInfoValid = 
    guestInfo.name && 
    guestInfo.email &&
    guestInfo.phone && 
    guestInfo.phone.length === 10 &&
    guestInfo.date &&
    guestInfo.property &&
    termsAccepted.value

  const hasDamageRecords = damages.value.length > 0

  return guestInfoValid && hasDamageRecords
})

// Generar PDF
const generatePDF = async () => {
  const element = document.querySelector('.form-container')
  if (!element) {
    q.notify({
      type: 'negative',
      message: 'Form not found for PDF generation',
      position: 'top'
    })
    return
  }

  try {
    q.notify({
      type: 'info',
      message: 'Generating PDF, please wait...',
      position: 'top'
    })

    // Añadir clase temporal para ocultar elementos en PDF
    element.classList.add('pdf-export')

    // Capturar el HTML directamente como imagen
    const canvas = await html2canvas(element, { 
      scale: 1.5,  // Resolución más natural
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    })

    // Eliminar clase temporal
    element.classList.remove('pdf-export')

    // Convertir imagen a base64
    const imgData = canvas.toDataURL('image/jpeg', 0.9)

    // Crear el PDF
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    })

    // Obtener dimensiones de página A4
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // Calcular dimensiones con márgenes más grandes
    const marginHorizontal = 25 // Márgenes laterales más grandes
    const marginVertical = 10 // Margen superior/inferior
    const imgWidth = pageWidth - (2 * marginHorizontal)
    const imgHeight = pageHeight - (2 * marginVertical)

    // Agregar imagen con márgenes
    pdf.addImage(
      imgData, 
      'JPEG', 
      marginHorizontal,   // X centrado con márgenes más grandes
      marginVertical,     // Y centrado
      imgWidth, 
      imgHeight, 
      undefined, 
      'FAST'
    )

    // Generar nombre de archivo descriptivo
    const fileName = `Inspection_${guestInfo.name.replace(/\s+/g, '_')}_${guestInfo.date}.pdf`

    // Descargar PDF
    pdf.save(fileName)

    q.notify({
      type: 'positive',
      message: 'PDF generated successfully',
      position: 'top'
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    q.notify({
      type: 'negative',
      message: 'Error generating PDF: ' + error.message,
      position: 'top'
    })
  }
}

// Manejo de actualización de daños
const updateDamagePosition = (damageData) => {
  console.log('Damage Position Updated:', damageData)
}
</script>

<style scoped>
.form-container {
  max-width: 800px;
  margin: 0 auto;
}

.company-logo {
  max-width: 500px;
  max-height: 250px;
  object-fit: contain;
  margin: 0 auto;
}

.pdf-export .add-damage-form,
.pdf-export .signature-buttons,
.pdf-export .download-pdf-button {
  display: none;
}
</style>
