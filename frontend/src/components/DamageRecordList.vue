<template>
  <div class="damage-record-list">
    <q-list bordered separator>
      <q-item 
        v-for="(partDamages, part) in groupedDamages" 
        :key="part"
        clickable 
        class="damage-item"
      >
        <q-item-section avatar>
          <q-icon 
            :name="getPartCategoryIcon(part)"
          />
        </q-item-section>
        
        <q-item-section>
          <q-item-label>{{ part }}</q-item-label>
          <q-item-label caption>
            Category: {{ getPartCategory(part) }}
          </q-item-label>
        </q-item-section>
        
        <q-item-section side>
          <q-chip 
            color="primary" 
            text-color="white"
            square
          >
            Total Damage: {{ totalDamageByPart[part] }}
          </q-chip>
        </q-item-section>
        
        <q-item-section side>
          <q-expansion-item
            expand-separator
            icon="list"
            label="Damage Details"
          >
            <q-card>
              <q-card-section>
                <q-list>
                  <q-item 
                    v-for="(damage, index) in partDamages" 
                    :key="index"
                    dense
                  >
                    <q-item-section>
                      <q-item-label>
                        Damage Type: {{ damage.type }}
                      </q-item-label>
                      <q-item-label caption>
                        Damage Quantity: {{ damage.quantity }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue'
import { 
  Damage, 
  CartPart 
} from '@/types'
import { CART_PARTS } from '@/constants'

const props = defineProps<{
  damages: Damage[];
  cartParts?: CartPart[];
}>()

// Find category for a specific part
const getPartCategory = (part: string | number): string => {
  const partName = typeof part === 'number' 
    ? CART_PARTS.find(p => p.id === part.toString())?.name 
    : part

  const foundPart = CART_PARTS.find((cartPart) => 
    cartPart.name.toLowerCase() === partName?.toLowerCase()
  )
  return foundPart ? foundPart.category : 'Other'
}

// Get icon based on part category
const getPartCategoryIcon = (part: string | number): string => {
  const category = getPartCategory(part)
  switch (category) {
    case 'Exterior': return 'mdi-car-outline'
    case 'Interior': return 'mdi-car-seat'
    case 'Seats': return 'mdi-seat'
    case 'Mechanical': return 'mdi-engine'
    default: return 'mdi-help-circle'
  }
}

// Group damages by part
const groupedDamages = computed(() => {
  const grouped: { [key: string]: Damage[] } = {}
  props.damages.forEach(damage => {
    const partName = typeof damage.part === 'number' 
      ? CART_PARTS.find(p => p.id === damage.part.toString())?.name 
      : damage.part

    if (partName) {
      if (!grouped[partName]) {
        grouped[partName] = []
      }
      grouped[partName].push(damage)
    }
  })
  return grouped
})

// Calculate total damage by part
const totalDamageByPart = computed(() => {
  const totals: { [key: string]: number } = {}
  Object.entries(groupedDamages.value).forEach(([part, damages]) => {
    totals[part] = damages.reduce((sum, damage) => sum + damage.quantity, 0)
  })
  return totals
})
</script>

<style scoped>
.damage-record-list {
  width: 100%;
}
.damage-item {
  cursor: pointer;
}
</style>
