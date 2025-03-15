<template>
  <q-page class="q-pa-md">
    <q-form 
      ref="inspectionForm" 
      @submit.prevent="generatePDF"
      class="form-container"
    >
      <div class="row q-col-gutter-md">
        <!-- Logo y Título -->
        <div class="col-12 text-center q-mb-md header-section">
          <img 
            src="../assets/images/logo.png" 
            alt="Company Logo" 
            class="company-logo"
          />
          <h1 class="page-title">Golf Cart Inspection</h1>
        </div>

        <!-- Guest Information Section -->
        <div class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6">Guest Information</div>
              <div class="row q-col-gutter-md">
                <div class="col-md-3 col-sm-6 col-xs-12">
                  <q-input 
                    v-model="guestInfo.name" 
                    label="Guest Name" 
                    outlined 
                    required
                  />
                </div>
                <div class="col-md-3 col-sm-6 col-xs-12">
                  <q-input 
                    v-model="guestInfo.email" 
                    label="Guest Email" 
                    type="email" 
                    outlined 
                    required
                    :rules="[val => val && val.includes('@') || 'Invalid email']"
                  />
                </div>
                <div class="col-md-3 col-sm-6 col-xs-12">
                  <q-input 
                    v-model="guestInfo.phone" 
                    label="Guest Phone" 
                    outlined 
                    required
                    mask="(+1) ### ###-####"
                    unmasked-value
                    hint="Format: (+1) 123 456-7890"
                    :rules="[
                      val => val && val.length === 10 || 'Please enter a valid phone number'
                    ]"
                  />
                </div>
                <div class="col-md-3 col-sm-6 col-xs-12">
                  <q-input 
                    v-model="guestInfo.date" 
                    label="Inspection Date" 
                    type="date" 
                    outlined 
                    required
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Property and Cart Type Section -->
        <div class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <div class="row q-col-gutter-md">
                <div class="col-md-6 col-sm-12">
                  <q-select 
                    v-model="selectedProperty"
                    :options="propertyOptions"
                    option-label="name"
                    option-value="id"
                    label="Property *"
                    outlined
                    dense
                    required
                  />
                </div>
                <div class="col-md-6 col-sm-12">
                  <q-select 
                    v-model="selectedCartType" 
                    :options="cartTypeOptions" 
                    label="Cart Type" 
                    outlined 
                    required
                    @update:model-value="onCartTypeSelect"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Sección de diagrama con selección condicional -->
        <div class="row justify-center q-mt-md">
          <div class="col-12 text-center">
            <CartDiagramAnnotations 
              :cart-type="selectedCartType"
              :damages="damages"
              @update-damage-position="updateDamagePosition"
            />
          </div>
        </div>

        <!-- Damage Records Table -->
        <div class="row q-mt-md">
          <div class="col-12">
            <q-table 
              :rows="damages" 
              :columns="damageColumns"
              row-key="id"
              flat 
              bordered
            >
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn 
                    flat 
                    round 
                    color="negative" 
                    icon="delete" 
                    @click="removeDamage(props.rowIndex)"
                  />
                </q-td>
              </template>
            </q-table>
          </div>
        </div>

        <!-- Damage Record Form Section -->
        <div class="col-12">
          <DamageRecordForm 
            :cart-parts="cartParts"
            :damage-types="damageTypes"
            @add="addDamage"
          />
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

        <!-- Terms and Signature Section -->
        <div class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <SignatureCanvas 
                v-model:terms-accepted="termsAccepted"
                @signature-change="signature = $event"
              />
            </q-card-section>
          </q-card>
        </div>

        <!-- PDF Download Button (Single Button) -->
        <div class="col-12 text-center">
          <q-btn 
            label="Download PDF" 
            color="primary" 
            type="submit"
            :disable="!isFormValid"
          />
        </div>
      </div>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

import SignatureCanvas from '@/components/SignatureCanvas.vue'
import DamageRecordList from '@/components/DamageRecordList.vue'
import DamageRecordForm from '@/components/DamageRecordForm.vue'
import CartDiagramAnnotations from '@/components/CartDiagramAnnotations.vue'

import { CART_PARTS, PROPERTIES, GOLF_CART_TYPES, DAMAGE_TYPES } from '@/constants'
import { 
  Damage, 
  CartTypeOption, 
  DamageType,
  CartPart,
  Properties
} from '../types/base-types'

// Configuración de Quasar
const quasar = useQuasar()

// Convertir CART_PARTS a CartPart[]
const cartParts = ref<CartPart[]>(CART_PARTS)

// Convertir PROPERTIES a un formato adecuado para el selector
const propertyOptions = ref(PROPERTIES.map(prop => ({
  label: prop.name,
  value: prop.id,
  ...prop
})))

const selectedProperty = ref<Properties | null>(null)

// Convertir PROPERTIES a un formato adecuado para el selector
const cartTypeOptions = ref<CartTypeOption[]>(GOLF_CART_TYPES)

// Convertir DAMAGE_TYPES a DamageType[]
const damageTypes = ref<DamageType[]>(DAMAGE_TYPES)

const guestInfo = reactive({
  name: '',
  email: '',
  phone: '',
  date: ''
})

const selectedCartType = ref<CartTypeOption>(cartTypeOptions.value[0])

const damages = ref<Damage[]>([])
const guestObservations = ref<string>('')
const signature = ref<string | null>(null)
const termsAccepted = ref<boolean>(false)

// Validación de formulario
const isFormValid = computed(() => {
  // Validar campos de información básica
  const basicInfoComplete = 
    guestInfo.name.trim() !== '' &&
    guestInfo.email.trim() !== '' &&
    guestInfo.phone.trim() !== '' &&
    guestInfo.date.trim() !== '' &&
    selectedProperty !== null &&
    damages.value.length > 0  // Al menos una falla registrada

  return basicInfoComplete
})

// Método para manejar la selección de Cart Type
const onCartTypeSelect = (value: string) => {
  const selectedType = cartTypeOptions.value.find(type => type.value === value)
  if (selectedType) {
    selectedCartType.value = selectedType
  }
}

// Definir columnas para la tabla de daños
const damageColumns = [
  { 
    name: 'part', 
    required: true, 
    label: 'Part', 
    align: 'left' as const, 
    field: 'part' 
  },
  { 
    name: 'type', 
    required: true, 
    label: 'Damage Type', 
    align: 'left' as const, 
    field: 'type' 
  },
  { 
    name: 'quantity', 
    required: true, 
    label: 'Quantity', 
    align: 'left' as const, 
    field: 'quantity' 
  },
  { 
    name: 'actions', 
    required: true, 
    label: 'Action', 
    align: 'center' as const, 
    field: (row: Damage) => row 
  }
]

// Función para añadir daño
function addDamage(damage: Damage) {
  // Verificar que no haya daños duplicados
  const isDuplicateDamage = damages.value.some(
    existingDamage => 
      existingDamage.part === damage.part && 
      existingDamage.type === damage.type
  )

  if (!isDuplicateDamage) {
    // Añadir un ID único si no existe
    const damageWithId = {
      ...damage,
      id: `${damage.part}-${damage.type}-${Date.now()}`
    }
    damages.value.push(damageWithId)
  } else {
    quasar.notify({
      type: 'warning',
      message: 'Este daño ya ha sido registrado.'
    })
  }
}

// Función para remover daño por índice
function removeDamage(index: number) {
  damages.value.splice(index, 1)
}

// Función para actualizar posición de daño
const updateDamagePosition = ({ index, x, y }: { index: number, x: number, y: number }) => {
  if (damages.value[index]) {
    damages.value[index].x = x
    damages.value[index].y = y
  }
}

// Función para generar PDF
async function generatePDF(event: Event) {
  // Prevenir comportamiento por defecto del formulario
  event.preventDefault()

  try {
    // Capturar todo el formulario
    const form = document.querySelector('.form-container') as HTMLElement
    if (!form) {
      console.error('Formulario no encontrado')
      throw new Error('Formulario no encontrado')
    }

    // Crear un clon del formulario para manipular sin afectar el original
    const clonedForm = form.cloneNode(true) as HTMLElement
    
    // Ocultar elementos que no deben aparecer en el PDF
    const elementsToHide = [
      '.damage-record-form',  // Formulario de daños
      '.add-damage-btn',      // Botón para añadir daños
      '.signature-buttons', 
      '.pdf-buttons',
      '.q-table__bottom'
    ]

    elementsToHide.forEach(selector => {
      const elements = clonedForm.querySelectorAll(selector)
      elements.forEach(element => {
        const el = element as HTMLElement
        el.style.display = 'none'
        el.style.visibility = 'hidden'
      })
    })

    // Asegurar que las marcas de daño estén fijas
    const originalMarkers = document.querySelectorAll('.damage-marker')
    const clonedMarkers = clonedForm.querySelectorAll('.damage-marker')

    originalMarkers.forEach((originalMarker, index) => {
      const clonedMarker = clonedMarkers[index] as HTMLElement
      const originalRect = originalMarker.getBoundingClientRect()
      const formRect = form.getBoundingClientRect()

      // Calcular posición relativa al formulario
      const left = originalRect.left - formRect.left
      const top = originalRect.top - formRect.top

      clonedMarker.style.position = 'absolute'
      clonedMarker.style.left = `${left}px`
      clonedMarker.style.top = `${top}px`
      clonedMarker.style.zIndex = '10'
    })

    // Crear un div temporal para renderizar el clon
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '210mm'  // Ancho de página A4
    tempDiv.style.minHeight = '297mm'  // Altura de página A4
    tempDiv.style.padding = '5mm'  // Reducir márgenes
    tempDiv.style.boxSizing = 'border-box'
    tempDiv.appendChild(clonedForm)
    document.body.appendChild(tempDiv)

    // Capturar imagen del formulario
    const canvas = await html2canvas(clonedForm, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: true,
      backgroundColor: '#ffffff',
      width: clonedForm.scrollWidth,
      height: clonedForm.scrollHeight,
      windowWidth: clonedForm.scrollWidth,
      windowHeight: clonedForm.scrollHeight,
      scrollX: 0,
      scrollY: -window.scrollY
    })

    // Remover el div temporal
    document.body.removeChild(tempDiv)

    // Crear PDF
    const pdf = new jsPDF('p', 'mm', 'letter')
    
    // Dimensiones de la página con márgenes reducidos
    const pageWidth = pdf.internal.pageSize.getWidth() - 10  // Reducir márgenes
    const pageHeight = pdf.internal.pageSize.getHeight() - 10  // Reducir márgenes

    // Calcular dimensiones para ajustar la imagen
    const imgRatio = canvas.width / canvas.height
    let imgWidth, imgHeight

    // Ajustar al ancho de página
    imgWidth = pageWidth
    imgHeight = imgWidth / imgRatio

    // Si la altura es mayor que la página, ajustar por altura
    if (imgHeight > pageHeight) {
      imgHeight = pageHeight
      imgWidth = imgHeight * imgRatio
    }

    // Calcular posición para centrar
    const xPosition = (pdf.internal.pageSize.getWidth() - imgWidth) / 2
    const yPosition = (pdf.internal.pageSize.getHeight() - imgHeight) / 2

    // Agregar imagen al PDF
    pdf.addImage(
      canvas.toDataURL('image/png'), 
      'PNG', 
      xPosition, 
      yPosition, 
      imgWidth, 
      imgHeight
    )
    
    // Guardar PDF
    pdf.save('golf_cart_inspection.pdf')

    quasar.notify({
      type: 'positive',
      message: 'PDF generado exitosamente',
      position: 'top'
    })
  } catch (error) {
    console.error('Error generando PDF:', error)
    quasar.notify({
      type: 'negative',
      message: 'Error al generar PDF. Detalles en consola.',
      position: 'top'
    })
  }
}
</script>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  text-align: center;
}

.company-logo {
  max-width: 250px;
  margin-bottom: 15px;
}

.page-title {
  font-size: 2.5rem;
  color: #333;
  font-weight: bold;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.q-card {
  width: 100%;
  margin-bottom: 20px;
}

.row {
  width: 100%;
  justify-content: center;
}

.col-12 {
  display: flex;
  justify-content: center;
}

.damage-record-list {
  width: 100%;
  max-width: 800px;
}

.q-table {
  width: 100%;
}

.q-btn {
  margin-top: 20px;
}
</style>
