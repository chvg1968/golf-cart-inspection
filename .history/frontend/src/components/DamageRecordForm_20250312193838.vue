<template>
  <q-form @submit.prevent="addDamage">
    <div class="row q-col-gutter-md">
      <!-- Category Selection -->
      <div class="col-12 col-sm-3">
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
      <div class="col-12 col-sm-3">
        <q-select
          v-model="selectedDamageType"
          :options="DAMAGE_TYPES"
          option-label="name"
          option-value="name"
          label="Damage Type *"
          outlined
          dense
          required
        />
      </div>

      <!-- Quantity -->
      <div class="col-12 col-sm-1">
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
      <div class="col-12 col-sm-1">
        <q-btn 
          type="submit" 
          color="primary" 
          label="+" 
          class="full-width"
          :disable="!selectedPart || !selectedDamageType || quantity <= 0"
        />
      </div>
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
import { useQuasar } from 'quasar'
import { CART_PARTS, DAMAGE_TYPES } from '@/constants'
import type { 
  Damage, 
  CartPartCategoryType,
  CartPart,
  DamageType
} from '@/types/base-types'

const $q = useQuasar()

const props = defineProps<{
  cartParts?: CartPart[];
  damageTypes?: DamageType[];
}>()

const emit = defineEmits<{
  (e: 'add', damage: Damage): void;
}>()

const selectedPart = ref<CartPart | null>(null)
const selectedDamageType = ref<DamageType | null>(null)
const quantity = ref(1)
const selectedCategory = ref<CartPartCategoryType>('Exterior')

const categories: CartPartCategoryType[] = [
  'Exterior',
  'Interior',
  'Seats',
  'Mechanical'
]

const addDamage = () => {
  if (selectedPart.value && 
      selectedDamageType.value && 
      quantity.value > 0) {
    
    const newDamage: Damage = {
      part: selectedPart.value.name,
      type: selectedDamageType.value.name,
      quantity: quantity.value,
      description: '',
      category: selectedCategory.value,
      x: 50,
      y: 50
    }

    emit('add', newDamage)
    
    // Reset form
    selectedPart.value = null
    selectedDamageType.value = null
    quantity.value = 1
  } else {
    $q.notify({
      type: 'negative',
      message: 'Please fill in all required fields'
    })
  }
}
</script>

<style scoped>
.q-input, .q-select {
  min-height: 56px;
}
</style>
