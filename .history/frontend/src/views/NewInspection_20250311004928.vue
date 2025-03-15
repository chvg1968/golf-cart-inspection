<template>
  <q-page class="q-pa-md">
    <q-form 
      ref="inspectionForm" 
      @submit.prevent="generatePDF"
      class="form-container"
    >
      <div class="row q-col-gutter-md">
        <!-- Logo y Título -->
        <div class="col-12 text-center q-mb-md">
          <img 
            src="../assets/images/logo.png" 
            alt="Company Logo" 
            class="company-logo q-mb-sm"
          />
          <h3 class="text-h3">Golf Cart Inspection</h3>
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
                    label="Property" 
                    outlined 
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
                    @update:model-value="updateCartDiagram"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Cart Diagram Section -->
        <div class="col-12 cart-diagram-section">
          <CartDiagramAnnotations 
            :cart-type="selectedCartType?.value ?? '4_seater'" 
            :damages="damages" 
            @update:damage-position="updateDamagePosition"
            :diagram-path="currentDiagramPath"
          />
        </div>

        <!-- Damage Records Section -->
        <div class="col-12">
          <div class="row q-col-gutter-sm items-center">
            <div class="col-12">
              <h6 class="text-h6 q-mb-md">Damage Records</h6>
            </div>
            <div class="col-12 damage-record-list">
              <DamageRecordList 
                :damages="damages" 
                :cart-parts="cartParts"
                :damage-types="damageTypes"
                @add="addDamage"
                @remove="removeDamage"
              />
            </div>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

import SignatureCanvas from '@/components/SignatureCanvas.vue'
import CartDiagramAnnotations from '@/components/CartDiagramAnnotations.vue'
import DamageRecordList from '@/components/DamageRecordList.vue'
import DamageRecordForm from '@/components/DamageRecordForm.vue'

import { CART_PARTS, PROPERTIES, GOLF_CART_TYPES, DAMAGE_TYPES } from '@/constants'
import { 
  Damage, 
  CartTypeOption, 
  DamageType,
  CartPart
} from '@/types'

// Configuración de Quasar
const quasar = useQuasar()

// Convertir CART_PARTS a CartPart[]
const cartParts = ref<CartPart[]>(CART_PARTS)

const propertyOptions = ref(PROPERTIES)
const cartTypeOptions = ref<CartTypeOption[]>(GOLF_CART_TYPES)

// Convertir DAMAGE_TYPES a string[]
const damageTypes = ref<string[]>(DAMAGE_TYPES.map(dt => dt.value))

const guestInfo = ref({
  name: '',
  email: '',
  phone: '',
  date: ''
})

const selectedProperty = ref(null)
const selectedCartType = ref<CartTypeOption>({
  label: '4 Puestos',
  value: '4_seater',
  diagramPath: 'assets/images/golfcart4seater.png'
})
const currentDiagramPath = ref<string>('assets/images/golfcart4seater.png')
const damages = ref<Damage[]>([])
const guestObservations = ref<string>('')
const signature = ref<string | null>(null)
const termsAccepted = ref<boolean>(false)

// Validación de formulario
const isFormValid = computed(() => {
  // Validar campos de información básica
  const basicInfoComplete = 
    guestInfo.value.name.trim() !== '' &&
    guestInfo.value.email.trim() !== '' &&
    guestInfo.value.phone.trim() !== '' &&
    guestInfo.value.date.trim() !== '' &&
    selectedProperty.value !== null &&
    selectedCartType.value !== null &&
    termsAccepted.value

  // Validar que haya exactamente una falla registrada
  const hasSingleDamage = damages.value.length === 1

  return basicInfoComplete && hasSingleDamage
})

// Función para añadir daño
function addDamage(damage: Damage) {
  damages.value.push(damage)
}

// Función para remover daño
function removeDamage(index: number) {
  damages.value.splice(index, 1)
}

// Función para actualizar posición de daño
function updateDamagePosition(event: { index: number, x: number, y: number }) {
  if (damages.value[event.index]) {
    damages.value[event.index].x = event.x
    damages.value[event.index].y = event.y
  }
}

// Función para generar PDF
async function generatePDF() {
  // Validar que todos los campos estén llenos y haya exactamente una falla
  if (!isFormValid.value) {
    quasar.notify({
      type: 'warning',
      message: 'Please complete all fields, accept the terms, and record exactly one damage',
      position: 'top'
    })
    return
  }

  try {
    // Capturar todo el formulario
    const form = document.querySelector('.form-container') as HTMLElement
    if (!form) {
      throw new Error('Form not found')
    }

    // Crear un clon del formulario para manipular sin afectar el original
    const clonedForm = form.cloneNode(true) as HTMLElement
    
    // Ocultar elementos que no deben aparecer en el PDF
    const elementsToHide = [
      '.damage-record-form', 
      '.signature-buttons', 
      '.pdf-buttons'
    ]

    elementsToHide.forEach(selector => {
      const element = clonedForm.querySelector(selector) as HTMLElement
      if (element) element.style.display = 'none'
    })

    // Crear un div temporal para renderizar el clon
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.appendChild(clonedForm)
    document.body.appendChild(tempDiv)

    // Capturar imagen del formulario
    const canvas = await html2canvas(clonedForm, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false
    })

    // Remover el div temporal
    document.body.removeChild(tempDiv)

    // Crear PDF
    const pdf = new jsPDF('p', 'mm', 'letter')
    const imgWidth = pdf.internal.pageSize.getWidth()
    const imgHeight = canvas.height * imgWidth / canvas.width

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight)
    pdf.save('golf_cart_inspection.pdf')

    quasar.notify({
      type: 'positive',
      message: 'PDF generated successfully',
      position: 'top'
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    quasar.notify({
      type: 'negative',
      message: 'Error generating PDF',
      position: 'top'
    })
  }
}

// Actualizar diagrama al cambiar el tipo de carrito
function updateCartDiagram() {
  if (selectedCartType.value) {
    currentDiagramPath.value = selectedCartType.value.diagramPath
  } else {
    currentDiagramPath.value = 'assets/images/golfcart4seater.png'
  }
}

// Observar cambios en el tipo de carrito
onMounted(() => {
  updateCartDiagram()
})
</script>

<style scoped>
.company-logo {
  max-width: 200px;
  max-height: 100px;
}

.form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.cart-diagram-section {
  margin-top: 20px;
  margin-bottom: 20px;
}

.q-card {
  margin-bottom: 20px;
}

.q-input, .q-select {
  margin-bottom: 15px;
}
</style>
