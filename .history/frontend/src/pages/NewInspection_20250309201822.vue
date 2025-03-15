<template>
  <q-page class="q-pa-md">
    <q-form 
      @submit.prevent="generatePDF" 
      class="form-container"
    >
      <div class="row q-col-gutter-md">
        <div class="col-12">
          <h5 class="text-center q-mb-md">Golf Cart Inspection</h5>
        </div>
        
        <div class="col-12 col-md-6 offset-md-3">
          <q-input 
            v-model="guestInfo.name" 
            label="Guest Name" 
            outlined
            required 
          />
        </div>
        
        <div class="col-12 col-md-6 offset-md-3">
          <q-input 
            v-model="guestInfo.email" 
            label="Guest Email" 
            type="email"
            outlined
            required 
            :rules="[val => val && val.includes('@') || 'Email inválido']"
          />
        </div>
        
        <div class="col-12 col-md-6 offset-md-3">
          <q-input 
            v-model="guestInfo.phone" 
            label="Guest Phone" 
            outlined
            required 
          />
        </div>
        
        <div class="col-12 col-md-6 offset-md-3">
          <q-select
            v-model="guestInfo.property"
            :options="propertyOptions"
            label="Property"
            outlined
            required
          />
        </div>
        
        <div class="col-12 col-md-6 offset-md-3">
          <q-select 
            v-model="selectedCartType" 
            :options="cartTypes" 
            label="Tipo de Carrito" 
            outlined
            required
          />
        </div>
        
        <div class="col-12 col-md-6 offset-md-3">
          <q-input 
            v-model="guestInfo.date" 
            type="date" 
            label="Fecha de Inspección" 
            outlined
            required 
          />
        </div>
        
        <div class="col-12 col-md-6 offset-md-3">
          <q-input 
            v-model="guestObservations" 
            label="Observaciones Adicionales" 
            type="textarea" 
            outlined
            :maxlength="200"
            hint="Máximo 200 caracteres"
            rows="3"
          />
        </div>
        
        <!-- Diagrama del Carrito -->
        <div class="col-12">
          <CartDiagramAnnotations 
            :cart-type="selectedCartType" 
            :damages="damages" 
            @update:damage-position="updateDamagePosition"
          />
        </div>
        
        <!-- Lista de Daños -->
        <div class="col-12">
          <DamageRecordList 
            :damages="damages" 
            :cart-parts="CART_PARTS"
            :damage-types="damageTypes"
            @remove="removeDamage"
          />
        </div>
        
        <!-- Formulario de Registro de Daños -->
        <div class="col-12 damage-record-form">
          <DamageRecordForm 
            :cart-parts="CART_PARTS"
            :damage-types="damageTypes"
            @add="addDamage"
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
                    label="Generar PDF" 
                    type="submit"
                    :disable="!isFormValid"
                    class="q-mt-md"
                  />
                </template>
                <template #clear-signature-button>
                  <q-btn 
                    color="negative" 
                    label="Limpiar Firma" 
                    @click="signature = null"
                    class="q-mt-md"
                  />
                </template>
                <template #download-pdf-button>
                  <q-btn 
                    color="secondary" 
                    label="Download PDF" 
                    @click="generatePDF"
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
    guestInfo.phone.length >= 10 &&
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
      message: 'No se encontró el formulario para generar el PDF',
      position: 'top'
    })
    return
  }

  try {
    q.notify({
      type: 'info',
      message: 'Generando PDF, por favor espere...',
      position: 'top'
    })

    // Crear un div temporal para contener el contenido del PDF
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    document.body.appendChild(tempDiv)

    // Clonar el contenido del formulario sin el formulario de daños
    const formContainer = document.querySelector('.form-container')
    const clonedContent = formContainer.cloneNode(true)

    // Eliminar el formulario de registro de daños
    const damageRecordForm = clonedContent.querySelector('.damage-record-form')
    if (damageRecordForm) {
      damageRecordForm.remove()
    }

    // Agregar contenido clonado al div temporal
    tempDiv.appendChild(clonedContent)

    // Capturar el HTML en imagen
    const canvas = await html2canvas(tempDiv, { 
      scale: 1.5,
      logging: false,  
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    })

    // Eliminar el div temporal
    document.body.removeChild(tempDiv)

    // Crear el PDF
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    // Configuraciones de página
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10

    // Convertir imagen a base64 con compresión
    const imgData = canvas.toDataURL('image/jpeg', 0.7)

    // Calcular dimensiones de imagen
    const imgWidth = pageWidth - (2 * margin)
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Calcular número de páginas necesarias
    const totalPages = Math.ceil(imgHeight / pageHeight)

    // Agregar imagen con paginación
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage()
      }

      const sourceY = page * pageHeight
      const remainingHeight = imgHeight - sourceY

      // Recortar imagen para cada página
      pdf.addImage(
        imgData, 
        'JPEG', 
        margin,   // X
        -sourceY, // Y (desplazamiento negativo para mostrar diferentes partes)
        imgWidth, 
        imgHeight, 
        undefined, 
        'FAST'  // Optimización de velocidad
      )
    }

    // Generar nombre de archivo descriptivo
    const fileName = `Inspeccion_Carrito_${guestInfo.name.replace(/\s+/g, '_')}_${guestInfo.date}.pdf`

    // Descargar PDF
    pdf.save(fileName)

    q.notify({
      type: 'positive',
      message: 'PDF generado con éxito',
      position: 'top'
    })

    // Log de depuración
    console.group('Generación de PDF')
    console.log('Nombre de archivo:', fileName)
    console.log('Número de páginas:', totalPages)
    console.log('Tamaño de imagen:', imgWidth, 'x', imgHeight)
    console.groupEnd()

  } catch (error) {
    console.error('Error al generar PDF:', error)
    q.notify({
      type: 'negative',
      message: 'Error al generar PDF: ' + error.message,
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
</style>
