<template>
  <div class="add-damage-form q-pa-md bg-grey-2 rounded-borders">
    <div class="row q-col-gutter-sm items-center">
      <div class="col-12">
        <div class="row q-col-gutter-sm">
          <!-- Selector de Categoría -->
          <div class="col-12 col-sm-6">
            <q-select
              v-model="selectedCategory"
              :options="categories"
              label="Category *"
              outlined
              dense
              emit-value
              map-options
            />
          </div>
          
          <!-- Selector de Parte -->
          <div class="col-12 col-sm-6">
            <q-select
              v-model="damage.part"
              :options="filteredParts"
              label="Cart Part *"
              outlined
              dense
              emit-value
              map-options
              :rules="[val => !!val || 'Part is required']"
            />
          </div>
        </div>
      </div>
      
      <!-- Selector de Tipo de Daño -->
      <div class="col-12 col-sm">
        <q-select
          v-model="damage.type"
          :options="damageTypes"
          label="Damage Type *"
          outlined
          dense
          emit-value
          map-options
          :rules="[val => !!val || 'Type is required']"
        />
      </div>
      
      <!-- Cantidad de Daño -->
      <div class="col-12 col-sm-2">
        <q-input
          v-model="damage.quantity"
          type="number"
          label="Quantity *"
          outlined
          dense
          min="1"
          :rules="[val => val > 0 || 'Quantity must be greater than 0']"
        />
      </div>
      
      <!-- Botón de Añadir -->
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Add Damage"
          @click="addDamage"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, computed } from 'vue'

export default {
  name: 'DamageRecordForm',
  
  props: {
    cartParts: {
      type: Array,
      default: () => []
    },
    damageTypes: {
      type: Array,
      default: () => [
        { label: 'Scratches', value: 'scratches' },
        { label: 'Missing Parts', value: 'missing_parts' },
        { label: 'Damages/Bumps', value: 'damages' }
      ]
    }
  },
  
  emits: ['add'],
  
  setup(props, { emit }) {
    // Currently selected category
    const selectedCategory = ref('exterior')
    
    const damage = ref({
      part: null,
      type: null,
      quantity: 1,
      notes: ''
    })
    
    // Define available categories
    const categories = [
      { label: 'Exterior', value: 'exterior' },
      { label: 'Interior', value: 'interior' },
      { label: 'Seats', value: 'seats' },
      { label: 'Wheels & Tires', value: 'wheels' },
      { label: 'Accessories', value: 'accessories' },
      { label: 'Others', value: 'others' }
    ]
    
    // Assign categories to parts
    const allParts = computed(() => {
      return props.cartParts.map(part => {
        // Assign category based on value or label
        let category = 'others'
        
        // Exterior
        if (['bumper', 'fender', 'panel', 'roof', 'windshield', 'chassis', 'suspension'].some(term => 
          part.value.toLowerCase().includes(term) || part.label.toLowerCase().includes(term))) {
          category = 'exterior'
        }
        // Interior
        else if (['steering', 'dashboard', 'pedal', 'speedometer', 'ignition', 'horn'].some(term => 
          part.value.toLowerCase().includes(term) || part.label.toLowerCase().includes(term))) {
          category = 'interior'
        }
        // Seats
        else if (['seat', 'cushion', 'backrest'].some(term => 
          part.value.toLowerCase().includes(term) || part.label.toLowerCase().includes(term))) {
          category = 'seats'
        }
        // Wheels & Tires
        else if (['wheel', 'tire', 'rim'].some(term => 
          part.value.toLowerCase().includes(term) || part.label.toLowerCase().includes(term))) {
          category = 'wheels'
        }
        // Accessories
        else if (['mirror', 'light', 'door', 'handle', 'grab', 'bar', 'battery', 'charging'].some(term => 
          part.value.toLowerCase().includes(term) || part.label.toLowerCase().includes(term))) {
          category = 'accessories'
        }
        
        return { ...part, category }
      })
    })
    
    // Filter parts by selected category
    const filteredParts = computed(() => {
      return allParts.value.filter(part => part.category === selectedCategory.value)
    })
    
    // When category changes, reset the selected part
    watch(selectedCategory, () => {
      damage.value.part = null
    })
    
    const addDamage = () => {
      if (damage.value.part && 
          damage.value.type && 
          damage.value.quantity > 0) {
        
        const newDamage = {
          ...damage.value,
          category: selectedCategory.value
        }
        
        emit('add', newDamage)
        
        // Reset the form but keep the category
        const currentCategory = selectedCategory.value
        damage.value = {
          part: null,
          type: null,
          quantity: 1,
          notes: ''
        }
        selectedCategory.value = currentCategory
      } else {
        // Optional: Show error message
        console.warn('Invalid damage data:', damage.value)
      }
    }
    
    return {
      damage,
      addDamage,
      selectedCategory,
      categories,
      filteredParts
    }
  }
}
</script>

<style scoped>
.add-damage-form {
  border: 1px solid #e0e0e0;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
}
</style>
