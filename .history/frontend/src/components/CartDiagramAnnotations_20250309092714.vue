<template>
  <div 
    ref="cartDiagramContainer"
    class="cart-diagram-container"
  >
    <img 
      ref="cartImage"
      :src="cartImageSrc" 
      :alt="cartType + ' Golf Cart'"
      class="cart-diagram"
      draggable="false"
    />
    
    <!-- Marcadores de daño -->
    <div 
      v-for="(damage, index) in damages" 
      :key="index"
      :ref="(el) => setDamageMarkerRef(el, index)"
      class="damage-marker draggable"
      :data-index="index"
      :style="{ 
        left: `${damage.x}%`, 
        top: `${damage.y}%`
      }"
    >
      <span class="marker-icon">❌</span>
      <div class="marker-tooltip">{{ damage.part }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import interact from 'interactjs'
import golfCart4Seater from '../assets/images/golfcart4seater.png'
import golfCart6Seater from '../assets/images/golfcart6seater.png'

const props = defineProps({
  cartType: { 
    type: String, 
    required: true,
    validator: (value) => ['4-seater', '6-seater'].includes(value)
  },
  damages: { 
    type: Array, 
    default: () => [] 
  }
})

const emit = defineEmits(['update-damage-position'])

const cartDiagramContainer = ref(null)
const damageMarkerRefs = ref({})

const setDamageMarkerRef = (el, index) => {
  if (el) {
    damageMarkerRefs.value[index] = el
  }
}

const cartImageSrc = computed(() => {
  return props.cartType === '4-seater' 
    ? golfCart4Seater 
    : golfCart6Seater
})

const setupDraggableMarkers = () => {
  // Limpiar interacciones previas
  Object.values(damageMarkerRefs.value).forEach(marker => {
    const existingInteraction = interact(marker)
    if (existingInteraction) {
      existingInteraction.unset()
    }
  })

  // Configurar nuevas interacciones
  interact('.draggable').draggable({
    inertia: true,
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: cartDiagramContainer.value,
        endOnly: true
      })
    ],
    listeners: {
      move(event) {
        const target = event.target
        const container = cartDiagramContainer.value
        const containerRect = container.getBoundingClientRect()

        // Calcular posición porcentual
        const x = ((event.clientX - containerRect.left) / containerRect.width) * 100
        const y = ((event.clientY - containerRect.top) / containerRect.height) * 100

        // Limitar el movimiento dentro del contenedor
        const clampedX = Math.max(0, Math.min(100, x))
        const clampedY = Math.max(0, Math.min(100, y))

        // Actualizar posición visual
        target.style.left = `${clampedX}%`
        target.style.top = `${clampedY}%`

        // Emitir actualización de posición
        const index = parseInt(target.dataset.index)
        emit('update-damage-position', {
          index,
          x: clampedX,
          y: clampedY
        })
      }
    },
    cursorChecker: () => 'move'
  })
}

// Configurar interacciones después de montar el componente
onMounted(async () => {
  // Esperar a que se renderice el DOM
  await nextTick()
  
  // Configurar marcadores
  setupDraggableMarkers()
})

// Limpiar interacciones al desmontar
onUnmounted(() => {
  Object.values(damageMarkerRefs.value).forEach(marker => {
    const existingInteraction = interact(marker)
    if (existingInteraction) {
      existingInteraction.unset()
    }
  })
})
</script>

<style scoped>
.cart-diagram-container {
  position: relative;
  width: 100%;
  height: 500px;
  user-select: none;
  cursor: default;
}

.cart-diagram {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.damage-marker {
  position: absolute;
  cursor: move;
  transition: transform 0.1s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transform: translate(-50%, -50%); /* Centrar el marcador */
  touch-action: none;
}

.damage-marker:hover {
  transform: translate(-50%, -50%) scale(1.1);
}

.marker-icon {
  font-size: 24px;
  text-shadow: 0 0 5px rgba(0,0,0,0.5);
}

.marker-tooltip {
  background-color: rgba(0,0,0,0.7);
  color: white;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 10px;
  margin-top: 5px;
}
</style>
