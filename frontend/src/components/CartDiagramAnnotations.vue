<template>
  <div 
    ref="cartDiagramContainer"
    class="cart-diagram-container"
  >
    <img 
      ref="cartImage"
      :src="cartImageSrc" 
      :alt="cartTypeLabel + ' Golf Cart'"
      class="cart-diagram"
      :class="{ 'six-seater': isCartSixSeater }"
      draggable="false"
    />
    
    <!-- Marcadores de daño -->
    <div 
      v-for="(damage, index) in damages" 
      :key="index"
      :ref="(ref: Element | ComponentPublicInstance | null) => setDamageMarkerRef(ref as HTMLDivElement | null, index)"
      class="damage-marker draggable"
      :data-index="index"
      :style="{ 
        left: `${damage.x}%`, 
        top: `${damage.y}%`
      }"
    >
      <span class="marker-icon">❌</span>
      <div class="marker-tooltip marker-tooltip-permanent">
        <span class="marker-part-name">{{ damage.part }}</span>
        <span class="marker-damage-type">({{ damage.type }})</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, ComponentPublicInstance } from 'vue'
import interact from 'interactjs'
import golfCart4Seater from '../assets/images/4seater.png'
import golfCart6Seater from '../assets/images/6seater.png'

// Definir interfaz para daños
interface Damage {
  x: number
  y: number
  part: string
  type: string
  quantity?: number
}

interface CartTypeOption {
  label: string
  value: string
  diagramPath: string
}

const props = defineProps({
  cartType: { 
    type: [Object, String], 
    required: true
  },
  damages: { 
    type: Array as () => Damage[], 
    default: () => [] 
  },
  diagramPath: {
    type: String,
    default: '../assets/images/4seater.png'
  },
  preserveDamagePositions: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update-damage-position'])

const cartDiagramContainer = ref<HTMLDivElement | null>(null)
const damageMarkerRefs = ref<Record<number, HTMLDivElement>>({})

const setDamageMarkerRef = (el: HTMLDivElement | null, index: number) => {
  if (el) {
    damageMarkerRefs.value[index] = el
  }
}

const cartTypeLabel = computed(() => {
  if (props.cartType === null || props.cartType === undefined) {
    return '4-Seater'  // Valor predeterminado
  }
  
  if (typeof props.cartType === 'object') {
    return (props.cartType as CartTypeOption)?.label || '4-Seater'
  }
  
  return props.cartType
})

const cartImageSrc = computed(() => {
  // Usar la ruta del diagrama si está disponible y es una ruta completa
  if (props.diagramPath && props.diagramPath.startsWith('http')) {
    return props.diagramPath
  }
  
  // Manejar caso nulo o undefined
  if (props.cartType === null || props.cartType === undefined) {
    return golfCart4Seater
  }
  
  // Lógica de respaldo para compatibilidad
  const cartTypeValue = typeof props.cartType === 'object' 
    ? (props.cartType as CartTypeOption)?.value 
    : props.cartType

  return cartTypeValue === '6_seaters' 
    ? golfCart6Seater 
    : golfCart4Seater
})

const isCartSixSeater = computed(() => {
  if (typeof props.cartType === 'object') {
    return (props.cartType as CartTypeOption)?.value === '6_seaters'
  }
  return props.cartType === '6_seaters'
})

const setupDraggableMarkers = () => {
  // Si preserveDamagePositions está desactivado, no hacer nada
  if (!props.preserveDamagePositions) return

  // Limpiar interacciones previas
  Object.values(damageMarkerRefs.value).forEach(marker => {
    const existingInteraction = interact(marker as unknown as HTMLElement)
    if (existingInteraction) {
      existingInteraction.unset()
    }
  })

  // Configurar nuevas interacciones
  interact('.draggable').draggable({
    inertia: true,
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: 'parent',
        elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
      })
    ],
    autoScroll: {
      container: cartDiagramContainer.value || document.body,
      margin: 50,
      speed: 300
    },
    listeners: {
      start(event) {
        const target = event.target as HTMLElement
        target.style.transition = 'none'
        target.style.cursor = 'grabbing'
      },
      move(event) {
        const target = event.target as HTMLElement
        const container = cartDiagramContainer.value
        if (!container) return

        const containerRect = container.getBoundingClientRect()

        // Calcular posición porcentual con mayor precisión
        const x = ((event.clientX - containerRect.left) / containerRect.width) * 100
        const y = ((event.clientY - containerRect.top) / containerRect.height) * 100

        // Limitar el movimiento dentro del contenedor con mayor suavidad
        const clampedX = Math.max(0, Math.min(100, x))
        const clampedY = Math.max(0, Math.min(100, y))

        // Actualizar posición visual con transformación
        target.style.transform = `translate(
          calc(${clampedX}% - 50%), 
          calc(${clampedY}% - 50%)
        )`

        // Emitir actualización de posición
        const index = parseInt(target.dataset.index || '0')
        emit('update-damage-position', {
          index,
          x: clampedX,
          y: clampedY
        })
      },
      end(event) {
        const target = event.target as HTMLElement
        target.style.cursor = 'move'
        target.style.transition = 'transform 0.2s ease-out'
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
onBeforeUnmount(() => {
  Object.values(damageMarkerRefs.value).forEach(marker => {
    const existingInteraction = interact(marker as unknown as HTMLElement)
    if (existingInteraction) {
      existingInteraction.unset()
    }
  })
})
</script>

<style scoped>
.cart-diagram-container {
  margin: 0 auto;
  position: relative;
  width: 100%;
  max-width: 800px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.cart-diagram {
  width: 100%;
  height: auto;
  pointer-events: none;
}

.damage-marker {
  position: absolute;
  width: 30px;
  height: 30px;
  background-color: rgba(255, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: move;
  touch-action: none;
  will-change: transform;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  z-index: 10;
  transition: transform 0.2s ease-out;
}

.marker-icon {
  font-size: 16px;
}

.marker-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: black !important;
  color: white !important;
  padding: 2px !important;
  border: none !important;
  white-space: nowrap;
  font-size: 10px !important;
  opacity: 1;
  font-weight: normal !important;
}

.marker-tooltip-permanent {
  opacity: 1;
}

.marker-part-name {
  font-weight: normal !important;
  color: white !important;
}

.marker-damage-type {
  font-size: 10px;
  color: white !important;  
}

.damage-marker:hover .marker-tooltip {
  opacity: 1;
}
</style>
