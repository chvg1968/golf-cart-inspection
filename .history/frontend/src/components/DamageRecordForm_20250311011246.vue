<template>
  <q-form @submit.prevent="addDamage">
    <div class="row q-col-gutter-md">
      <!-- Category Selection -->
      <div class="col-12 col-sm-2">
        <q-select
          v-model="selectedCategory"
          :options="categories"
          label="Part Category *"
          outlined
          dense
          required
        />
      </div>

      <!-- Part Selection -->
      <div class="col-12 col-sm-4">
        <q-select
          v-model="selectedPart"
          :options="CART_PARTS.filter(p => p.category === selectedCategory)"
          option-label="name"
          option-value="id"
          label="Part *"
          outlined
          dense
          :disable="!selectedCategory"
          required
        />
      </div>

      <!-- Damage Type Selection -->
      <div class="col-12 col-sm-2">
        <q-select
          v-model="selectedDamageType"
          :options="DAMAGE_TYPES"
          option-label="label"
          option-value="value"
          label="Damage Type *"
          outlined
          dense
          required
        />
      </div>

      <!-- Quantity -->
      <div class="col-12 col-sm-2">
        <q-input
          v-model.number="quantity"
          type="number"
          label="Quantity *"
          outlined
          dense
          min="1"
          required
        />
      </div>

      <!-- Submit Button -->
      <div class="col-12 col-sm-2">
        <q-btn 
          type="submit" 
          color="primary" 
          label="Add Damage" 
          class="full-width"
          :disable="!selectedPart || !selectedDamageType || quantity <= 0"
        />
      </div>
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue'
import { useQuasar } from 'quasar'
import { CART_PARTS, DAMAGE_TYPES } from '@/constants'
import { 
  Damage, 
  DamageType,
  CartPart
} from '@/types'

const $q = useQuasar()

const props = defineProps<{
  cartParts: CartPart[];
  damageTypes: number[];
}>()

const emit = defineEmits<{
  (e: 'add', damage: Damage): void;
}>()

const selectedPart = ref<CartPart | null>(null)
const selectedDamageType = ref<DamageType | null>(null)
const quantity = ref(1)
const selectedCategory = ref<string>('Exterior')

const categories = [
  { label: 'Exterior', value: 'Exterior' },
  { label: 'Interior', value: 'Interior' },
  { label: 'Seats', value: 'Seats' },
  { label: 'Mechanical', value: 'Mechanical' },
  { label: 'Other', value: 'Other' }
]

const addDamage = () => {
  if (selectedPart.value && 
      selectedDamageType.value && 
      quantity.value && 
      quantity.value > 0) {
    
    const newDamage: Damage = {
      part: selectedPart.name,
      type: selectedDamageType.name,
      quantity: quantity.value,
      description: '',
      category: selectedCategory.value,
      x: 50, 
      y: 50  
    }
    
    emit('add', newDamage)
    
    // Reset the form but keep the category
    const currentCategory = selectedCategory.value
    selectedPart.value = null
    selectedDamageType.value = null
    quantity.value = 1
    selectedCategory.value = currentCategory
  } else {
    // Optional: Show error message
    console.warn('Invalid damage data:', {
      selectedPart: selectedPart.value,
      selectedDamageType: selectedDamageType.value,
      quantity: quantity.value
    })
  }
}
</script>

<style scoped>
.q-input, .q-select {
  min-height: 56px;
}
</style>
