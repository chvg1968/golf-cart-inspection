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
              <div class="column q-col-gutter-md">
                <div class="col-12">
                  <q-input 
                    v-model="guestInfo.name" 
                    label="Guest Name" 
                    outlined 
                    required
                    style="width: 100%;"
                    input-class="custom-input-text"
                  />
                </div>
                <div class="col-12">
                  <q-input 
                    v-model="guestInfo.email" 
                    label="Guest Email" 
                    type="email" 
                    outlined 
                    required
                    style="width: 100%;"
                    input-class="custom-input-text"
                    :rules="[val => val && val.includes('@') || 'Invalid email']"
                  />
                </div>
                <div class="col-12">
                  <q-input 
                    v-model="guestInfo.phone" 
                    label="Guest Phone" 
                    outlined 
                    required
                    style="width: 100%;"
                    input-class="custom-input-text"
                    :rules="[
                      val => val && val.length >= 10 || 'Please enter a valid phone number'
                    ]"
                  />
                </div>
                <div class="col-12">
                  <q-input 
                    v-model="guestInfo.date" 
                    label="Inspection Date" 
                    type="date" 
                    outlined 
                    required
                    style="width: 100%;"
                    input-class="custom-input-text"
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
              <div class="text-h6">Property and Cart Type</div>
              <div class="column q-col-gutter-md">
                <div class="col-12">
                  <q-select 
                    v-model="selectedProperty"
                    :options="propertyOptions"
                    option-label="name"
                    option-value="id"
                    label="Property *"
                    outlined
                    dense
                    required
                    input-class="custom-input-text"
                  />
                </div>
                <div class="col-12">
                  <q-select 
                    v-model="selectedCartType.value" 
                    :options="cartTypeOptions" 
                    label="Cart Type" 
                    outlined 
                    input-class="custom-input-text"
                    @update:model-value="onCartTypeSelect"
                  />
                </div>
                <div class="col-12">
                  <q-input 
                    v-model="cartNumber" 
                    label="Cart Number" 
                    outlined 
                    readonly
                    style="width: 100%;"
                    input-class="custom-input-text"
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
              :cart-type="cartTypeForDiagram"
              :damages="damages"
              @update-damage-position="updateDamagePosition"
            />
          </div>
        </div>

        <!-- Damage Records Table -->
        <div class="column q-mt-md">
          <div class="col-12">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-h6">Damage Records</div>
                <div class="column q-col-gutter-md">
                  <div class="col-12">
                    <q-table 
                      :rows="damages" 
                      :columns="damageColumns"
                      row-key="id"
                      flat 
                      bordered
                      title-class="q-table__title"
                    >
                      <template v-slot:body-cell-actions="props">
                        <q-td :props="props">
                          <q-btn 
                            flat 
                            round 
                            color="negative" 
                            icon="delete" 
                            @click="removeDamage(props.rowIndex)"
                            class="pdf-buttons"
                          />
                        </q-td>
                      </template>
                    </q-table>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Damage Record Form Section -->
        <div class="col-12 damage-record-form">
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
            input-class="custom-input-text"
          />
        </div>

        <!-- Terms and Signature Section -->
        <div class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6">Terms and Signature</div>
              <SignatureCanvas 
                v-model:terms-accepted="termsAccepted"
                @signature-change="signature = $event"
              />
            </q-card-section>
          </q-card>
        </div>

        <!-- PDF Generator -->
        <PDFGenerator 
          ref="pdfGeneratorRef" 
          :form-container="formContainerRef" 
          @pdf-generated="onPDFGenerated"
          @pdf-error="onPDFError"
        />

        <!-- PDF Download Button (Single Button) -->
        <div class="col-12 text-center pdf-buttons" >
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
import SignatureCanvas from '@/components/SignatureCanvas.vue'
import DamageRecordForm from '@/components/DamageRecordForm.vue'
import CartDiagramAnnotations from '@/components/CartDiagramAnnotations.vue'
import PDFGenerator from '@/components/PDFGenerator.vue'

import { CART_PARTS, PROPERTIES, GOLF_CART_TYPES, DAMAGE_TYPES } from '@/constants'
import { 
  Damage, 
  CartTypeOption, 
  DamageType,
  CartPart,
  Properties
} from '@/types/base-types'

// Configuración de Quasar
const quasar = useQuasar()

// Convertir CART_PARTS a CartPart[]
const cartParts = ref<CartPart[]>(CART_PARTS)

// Convertir PROPERTIES a un formato adecuado para el selector
const propertyOptions = ref<Properties[]>(PROPERTIES.map(prop => ({
  ...prop,
  label: prop.name,
  value: prop.id
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

// Definir una interfaz para el tipo de carrito con valores por defecto
interface CartType {
  id: string | number;
  name: string;
  label: string;
  diagramPath: string;
  value: string;
}

// Definir un valor por defecto para el tipo de carrito
const defaultCartType: CartType = {
  id: 'default',
  name: 'Default Cart',
  label: 'Default Cart',
  diagramPath: '/default-diagram.svg',
  value: 'default'
}

// Definir una interfaz para las opciones de tipo de carrito
interface CartTypeOption {
  id?: string | number;
  name?: string;
  label: string;
  diagramPath?: string;
  value: string;
}

// Usar la interfaz definida para el ref con un valor inicial
const selectedCartType = ref<CartType>(defaultCartType)

const damages = ref<Damage[]>([])
const guestObservations = ref<string>('')
const signature = ref<string | null>(null)
const termsAccepted = ref<boolean>(false)

const cartNumber = ref<string>('')
const cartType = ref<string>('')

// Observador para actualizar Cart Number, Cart Type y Diagrama cuando se selecciona una propiedad
watch(selectedProperty, (newProperty) => {
  if (newProperty) {
    const selectedProp = propertyOptions.value.find(prop => prop.id === newProperty.id)
    if (selectedProp) {
      cartNumber.value = selectedProp.cartNumber ?? ''
      
      // Determinar el tipo de carrito basado en el número de pasajeros en el cartNumber
      const cartTypeMatch = cartTypeOptions.value.find(type => 
        selectedProp.cartNumber?.includes(type.label.replace(' passenger', ''))
      )
      
      // Usar el tipo de carrito encontrado o el valor por defecto
      selectedCartType.value = cartTypeMatch 
        ? { 
            id: cartTypeMatch.id || 'default', 
            name: cartTypeMatch.name || 'Default Cart', 
            label: cartTypeMatch.label, 
            diagramPath: cartTypeMatch.diagramPath || '/default-diagram.svg', 
            value: cartTypeMatch.value 
          } 
        : defaultCartType
    }
  }
})

// Método para manejar la selección de Cart Type
const onCartTypeSelect = (value: CartTypeOption | null) => {
  if (value) {
    selectedCartType.value = {
      id: value.id || 'default',
      name: value.name || 'Default Cart',
      label: value.label,
      diagramPath: value.diagramPath || '/default-diagram.svg',
      value: value.value
    }
  } else {
    selectedCartType.value = defaultCartType
  }
}

// Asegurar que cart-type siempre tenga un valor de cadena
const cartTypeForDiagram = computed(() => {
  return selectedCartType.value?.value || ''
})

// Definir columnas para la tabla de daños
const damageColumns = [
  { 
    name: 'part', 
    label: 'Part', 
    field: (row: Damage) => row.part,
    align: 'left' as const
  },
  { 
    name: 'type', 
    label: 'Damage Type', 
    field: (row: Damage) => row.type,
    align: 'left' as const
  },
  { 
    name: 'quantity', 
    label: 'Quantity', 
    field: (row: Damage) => row.quantity || 1,
    align: 'left' as const
  },
  { 
    name: 'actions', 
    label: 'Actions', 
    field: 'actions',
    align: 'center' as const
  }
]

// Validación de formulario
const isFormValid = computed(() => {
  // Validar campos de información básica del invitado
  const hasValidGuestInfo = 
    guestInfo.name.trim() !== '' &&
    guestInfo.email.trim() !== '' &&
    guestInfo.phone.trim() !== '' &&
    guestInfo.date.trim() !== ''

  // Validar selección de propiedad
  const hasValidProperty = selectedProperty.value !== null

  // Validar tipo de carrito y número de carrito
  const hasValidCartInfo = 
    selectedCartType.value !== null &&
    cartNumber.value.trim() !== ''

  // Validar daños
  const hasValidDamages = damages.value.length > 0

  // Todas las condiciones deben cumplirse
  return hasValidGuestInfo && 
         hasValidProperty && 
         hasValidCartInfo && 
         hasValidDamages
})

// Función para añadir daño
function addDamage(damage: Damage) {
  damages.value.push(damage)
}

// Función para remover daño por índice
function removeDamage(index: number) {
  damages.value.splice(index, 1)
}

// Función para actualizar posición de daño
function updateDamagePosition({ index, x, y }: { index: number, x: number, y: number }) {
  if (damages.value[index]) {
    damages.value[index].x = x
    damages.value[index].y = y
  }
}

// Referencia al contenedor del formulario
const formContainerRef = ref<HTMLElement>(document.createElement('div'))

// Referencia al componente PDFGenerator
const pdfGeneratorRef = ref(null)

// Método para generar PDF
function generatePDF(event: Event) {
  event.preventDefault()

  // Validar el formulario
  const formValid = validateForm()
  if (!formValid) {
    quasar.notify({
      type: 'negative',
      message: 'Por favor, complete todos los campos requeridos',
      position: 'top'
    })
    return
  }

  // Preparar datos para PDF
  const pdfData = {
    guestInfo,
    selectedProperty: {
      ...selectedProperty.value,
      name: selectedProperty.value?.name || 'Unknown Property'
    },
    selectedCartType: selectedCartType.value,
    cartNumber: cartNumber.value,
    damages: damages.value,
    guestObservations: guestObservations.value,
    signature: signature.value
  }

  // Llamar al método de generación de PDF
  if (pdfGeneratorRef.value) {
    (pdfGeneratorRef.value as any).generatePDF(pdfData)
  }
}

// Función para validar el formulario
function validateForm(): boolean {
  const { name, email, phone, date } = guestInfo
  const hasValidGuestInfo = name && email && phone && date
  const hasValidProperty = selectedProperty.value !== null
  const hasValidCartType = selectedCartType.value !== null

  return !!(hasValidGuestInfo && hasValidProperty && hasValidCartType)
}

// Método cuando se genera el PDF
function onPDFGenerated() {
  quasar.notify({
    type: 'positive',
    message: 'PDF generado exitosamente',
    position: 'top'
  })
}

// Método cuando hay un error en la generación del PDF
function onPDFError(error: Error) {
  quasar.notify({
    type: 'negative',
    message: 'Error al generar PDF: ' + error.message,
    position: 'top'
  })
}
</script>

<style scoped>
.page-title, .custom-input-text {
  font-family: 'Arial', sans-serif;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.q-table__title {
  font-family: 'Arial', sans-serif;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

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
