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
                    :rules="[val => val && val.includes('@') || 'Invalid email']"
                  />
                </div>
                <div class="col-12">
                  <q-input 
                    v-model="guestInfo.phone" 
                    label="Guest Phone" 
                    outlined 
                    required
                    hint="Please enter your phone number"
                    style="width: 100%;"
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
                  />
                </div>
                <div class="col-12">
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
          />
        </div>

        <!-- Terms and Signature Section -->
        <!-- <div class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6">Terms and Signature</div>
              <SignatureCanvas 
                v-model:terms-accepted="termsAccepted"
                @signature-change="signature = $event"
              />
            </q-card-section>
          </q-card>
        </div> -->

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
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

import SignatureCanvas from '@/components/SignatureCanvas.vue'
import DamageRecordList from '@/components/DamageRecordList.vue'
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

// Referencia al contenedor del formulario
const formContainerRef = ref<HTMLElement>(document.createElement('div'))

// Referencia al componente PDFGenerator
const pdfGeneratorRef = ref<InstanceType<typeof PDFGenerator> | null>(null)

// Método para generar PDF
async function generatePDF(event: Event) {
  event.preventDefault()

  // Validación explícita de campos
  const invalidFields = []
  
  if (!guestInfo.name) invalidFields.push('Nombre')
  if (!guestInfo.email) invalidFields.push('Email')
  if (!guestInfo.phone) invalidFields.push('Teléfono')
  if (!guestInfo.date) invalidFields.push('Fecha')
  if (!selectedProperty.value) invalidFields.push('Propiedad')
  if (damages.value.length === 0) invalidFields.push('Daños')

  if (invalidFields.length > 0) {
    quasar.notify({
      type: 'warning',
      message: `Por favor complete los siguientes campos: ${invalidFields.join(', ')}`,
      position: 'top'
    })
    return
  }

  // Llamar al método de generación de PDF del componente PDFGenerator
  if (pdfGeneratorRef.value) {
    try {
      await pdfGeneratorRef.value.generatePDF({
        guestInfo,
        selectedProperty: selectedProperty.value,
        selectedCartType: selectedCartType.value,
        damages: damages.value
      })
    } catch (error) {
      console.error('Error al generar PDF:', error)
      quasar.notify({
        type: 'negative',
        message: 'Error al generar PDF',
        position: 'top'
      })
    }
  }
}

function onPDFGenerated() {
  quasar.notify({
    type: 'positive',
    message: 'PDF generado exitosamente',
    position: 'top'
  })
}

function onPDFError(error: Error) {
  console.error('Error en generación de PDF:', error)
  quasar.notify({
    type: 'negative',
    message: 'Error al generar PDF: ' + error.message,
    position: 'top'
  })
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
