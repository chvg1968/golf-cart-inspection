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
                    @update:model-value="onPropertySelect"
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
        <div class="row q-mt-md">
          <div class="col-12">
            <div v-if="selectedCartType.value === '4_seaters'" class="text-center">
              <img 
                src="assets/images/4seater.png" 
                alt="4 Seaters Golf Cart Diagram" 
                class="img-fluid"
              />
            </div>
            <div v-else-if="selectedCartType.value === '6_seaters'" class="text-center">
              <img 
                src="assets/images/6seater.png" 
                alt="6 Seaters Golf Cart Diagram" 
                class="img-fluid"
              />
            </div>
          </div>
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

import SignatureCanvas from '@/components/SignatureCanvas.vue'
import DamageRecordList from '@/components/DamageRecordList.vue'
import DamageRecordForm from '@/components/DamageRecordForm.vue'

import { CART_PARTS, PROPERTIES, GOLF_CART_TYPES, DAMAGE_TYPES } from '@/constants'
import { 
  Damage, 
  CartTypeOption, 
  DamageType,
  CartPart
} from '../types/base-types'
import type { Properties } from '@/types/base-types'

// Configuración de Quasar
const quasar = useQuasar()

// Convertir CART_PARTS a CartPart[]
const cartParts = ref<CartPart[]>(CART_PARTS)

// Convertir PROPERTIES a un formato adecuado para el selector
const propertyOptions = ref(PROPERTIES.map(prop => ({
  label: prop.name,
  value: prop.id
})))

const selectedProperty = ref<Properties | null>(null)

// Método para manejar la selección de propiedad
const onPropertySelect = (value: string) => {
  selectedProperty.value = PROPERTIES.find(prop => prop.id === value) || null
}

const cartTypeOptions = ref<CartTypeOption[]>(GOLF_CART_TYPES)

// Convertir DAMAGE_TYPES a DamageType[]
const damageTypes = ref<DamageType[]>(DAMAGE_TYPES)

const guestInfo = ref({
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
    guestInfo.value.name.trim() !== '' &&
    guestInfo.value.email.trim() !== '' &&
    guestInfo.value.phone.trim() !== '' &&
    guestInfo.value.date.trim() !== '' &&
    selectedProperty.value !== null &&
    selectedCartType.value !== null &&
    termsAccepted.value

  return basicInfoComplete
})

// Método para manejar la selección de Cart Type
const onCartTypeSelect = (value: string) => {
  const selectedType = cartTypeOptions.value.find(type => type.value === value)
  if (selectedType) {
    selectedCartType.value = selectedType
  }
}

// Función para añadir daño
function addDamage(damage: Damage) {
  // Verificar que no haya daños duplicados
  const isDuplicateDamage = damages.value.some(
    existingDamage => 
      existingDamage.part === damage.part && 
      existingDamage.type === damage.type
  )

  if (!isDuplicateDamage) {
    damages.value.push(damage)
  } else {
    quasar.notify({
      type: 'warning',
      message: 'Este daño ya ha sido registrado.'
    })
  }
}

// Función para remover daño
function removeDamage(index: number) {
  damages.value.splice(index, 1)
}

// Función para generar PDF
async function generatePDF() {
  // Validar que todos los campos estén llenos
  if (!isFormValid.value) {
    quasar.notify({
      type: 'warning',
      message: 'Please complete all fields and accept the terms',
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
