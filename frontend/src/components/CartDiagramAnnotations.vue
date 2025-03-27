<template>
  <div class="cart-diagram-annotations-container">
    <!-- Convención de colores -->
    <div class="color-convention">
      <h3 class="text-subtitle1">Color Reference:</h3>
      <div class="convention-item">
        <span class="color-dot" style="background-color: red;"></span>
        <span class="text-caption">Scratches</span>
      </div>
      <div class="convention-item">
        <span class="color-dot" style="background-color: #00FF7F;"></span>
        <span class="text-caption">Missing parts</span>
      </div>
      <div class="convention-item">
        <span class="color-dot" style="background-color: #BF40BF;"></span>
        <span class="text-caption">Damage/Bumps</span>
      </div>
    </div>

    <div class="diagram-container" ref="cartDiagramContainer">
      <!-- Herramientas de dibujo -->
      <div class="drawing-tools">
        <!-- Selector de color -->
        <div class="color-picker">
          <button 
            v-for="option in colorOptions" 
            :key="option.color"
            :style="{ backgroundColor: option.color }"
            @click.prevent="selectColor(option.color)"
            :class="{ active: currentColor === option.color }"
          ></button>
        </div>
        
        <!-- Botones de acción -->
        <div class="action-buttons">
          <button @click.prevent="undo" title="Deshacer último trazo">↩️</button>
          <button @click.prevent="clearCanvas" title="Borrar todo">🗑️</button>
        </div>
      </div>

      <!-- Imagen del diagrama -->
      <img 
        ref="cartImage"
        :src="currentDiagramPath" 
        :alt="cartTypeLabel || 'Golf Cart Diagram'" 
        class="cart-diagram"
        draggable="false"
      />

      <!-- Canvas de dibujo superpuesto -->
      <canvas 
        ref="drawingCanvas"
        class="drawing-canvas"
        :width="canvasWidth"
        :height="canvasHeight"
        role="graphics-document"
        aria-label="Cart Diagram Drawing Canvas"
        tabindex="0"
        aria-roledescription="Diagrama interactivo para marcar daños"
      ></canvas>

      <!-- Marcadores de daños existentes -->
      <div 
        v-for="(damage, index) in damages" 
        :key="`damage-${index}`"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import golfCart4Seater from '../assets/images/4seater.jpg'
import golfCart6Seater from '../assets/images/6seater.png'

// Definir interfaz para daños
interface Damage {
  x: number
  y: number
  part: string
  type: string
  quantity?: number
}

// Definir interfaz para CartTypeOption
interface CartTypeOption {
  label: string
  value: string
  diagramPath: string
}

// Colores predefinidos sin etiquetas
const colorOptions = [
  { color: 'red' },
  { color: '#00FF7F' },  // Spring Green
  { color: '#BF40BF' }   // Bright Magenta
]

const currentColor = ref(colorOptions[0].color)

const props = defineProps({
  cartType: { 
    type: [Object as () => CartTypeOption, String], 
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
  previousDrawing: {
    type: String,
    default: null
  }
})

const emit = defineEmits([
  'update-damage-position', 
  'drawing-created'
])

const cartDiagramContainer = ref<HTMLDivElement | null>(null)
const cartImage = ref<HTMLImageElement | null>(null)
const drawingCanvas = ref<HTMLCanvasElement | null>(null)
const drawingContext = ref<CanvasRenderingContext2D | null>(null)

// Dimensiones del canvas
const canvasWidth = ref(0)
const canvasHeight = ref(0)

// Estado para almacenar historial de dibujo
const drawingHistory = ref<ImageData[]>([])

// Calcular la ruta del diagrama actual
const currentDiagramPath = computed(() => {
  if (typeof props.cartType === 'string') {
    return props.cartType.includes('4') ? golfCart4Seater : golfCart6Seater
  }
  return props.cartType?.diagramPath || golfCart4Seater
})

// Obtener label del tipo de carrito
const cartTypeLabel = computed(() => {
  if (typeof props.cartType === 'string') {
    return props.cartType.includes('4') ? '4 Seater' : '6 Seater'
  }
  return props.cartType?.label || '4 Seater'
})

// Selección de color
const selectColor = (color: string) => {
  currentColor.value = color
  if (drawingContext.value) {
    drawingContext.value.strokeStyle = color
  }
}

// Método para sobrescribir imagen base con marcas
const overwriteBaseImageWithMarks = (baseImagePath: string, newMarking: string): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    // Crear imagen base
    const baseImage = new Image()
    
    // Crear imagen de marcas
    const markingsImage = new Image()
    
    // Configurar manejadores de errores más robustos
    const handleError = (source: string) => (event: Event | string) => {
      console.error(`Error cargando ${source}:`, event)
      reject(new Error(`No se pudo cargar ${source}`))
    }

    baseImage.onerror = handleError('imagen base') as OnErrorEventHandler
    markingsImage.onerror = handleError('imagen de marcas') as OnErrorEventHandler

    // Configurar manejador de carga de imagen base
    baseImage.onload = () => {
      // Verificar que la imagen de marcas esté definida
      if (!newMarking) {
        resolve(baseImagePath)
        return
      }

      // Cargar imagen de marcas
      markingsImage.src = newMarking
    }

    // Configurar manejador de carga de imagen de marcas
    markingsImage.onload = () => {
      // Crear canvas temporal para combinar imágenes
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = baseImage.width
      tempCanvas.height = baseImage.height

      const ctx = tempCanvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo obtener contexto del canvas'))
        return
      }

      // Dibujar imagen base
      ctx.drawImage(baseImage, 0, 0, baseImage.width, baseImage.height)
      
      // Dibujar imagen de marcas con transparencia
      ctx.globalAlpha = 0.7  // Ajustar opacidad de marcas
      ctx.drawImage(markingsImage, 0, 0, baseImage.width, baseImage.height)

      // Convertir canvas a imagen base64
      const combinedImageUrl = tempCanvas.toDataURL('image/png')
      
      resolve(combinedImageUrl)
    }

    // Iniciar carga de imagen base
    baseImage.src = baseImagePath
  })
}

// Método para guardar dibujo
const saveDrawing = (): string | null => {
  if (!drawingCanvas.value) return null

  // Convertir canvas a imagen base64
  const drawingDataUrl = drawingCanvas.value.toDataURL('image/png')
  
  // Almacenar en localStorage
  localStorage.setItem(
    `drawing_${props.diagramPath}`, 
    drawingDataUrl
  )

  return drawingDataUrl
}

// Método para cargar estado previo del canvas
const loadPreviousCanvasState = () => {
  if (!drawingCanvas.value || !drawingContext.value) return

  const savedStateJson = localStorage.getItem(
    `canvas_state_${props.diagramPath}`
  )

  if (savedStateJson) {
    try {
      const savedState = JSON.parse(savedStateJson)
      drawingContext.value.putImageData(savedState, 0, 0)
    } catch (error) {
      console.error('Error al cargar estado del canvas:', error)
    }
  }
}

// Método para cargar dibujo previo
const loadPreviousDrawing = () => {
  if (!drawingCanvas.value || !drawingContext.value) return

  const savedDrawing = localStorage.getItem(
    `drawing_${props.diagramPath}`
  )

  if (savedDrawing) {
    const img = new Image()
    img.onload = () => {
      drawingContext.value?.clearRect(
        0, 
        0, 
        drawingCanvas.value?.width || 0, 
        drawingCanvas.value?.height || 0
      )
      
      drawingContext.value?.drawImage(
        img, 
        0, 
        0, 
        drawingCanvas.value?.width || 0, 
        drawingCanvas.value?.height || 0
      )
    }
    img.src = savedDrawing
  }
}

// Configurar canvas de dibujo
const setupDrawingCanvas = () => {
  const canvas = drawingCanvas.value
  const cartImage = cartImage.value

  if (!canvas || !cartImage) {
    console.error('Canvas o imagen no encontrados')
    return
  }

  // Ajustar dimensiones del canvas al tamaño de la imagen
  canvasWidth.value = cartImage.offsetWidth
  canvasHeight.value = cartImage.offsetHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.error('No se pudo obtener el contexto del canvas')
    return
  }

  drawingContext.value = ctx
  drawingContext.value.lineCap = 'round'
  drawingContext.value.lineJoin = 'round'
  drawingContext.value.lineWidth = 3
  drawingContext.value.strokeStyle = currentColor.value

  // Configuración de atributos de accesibilidad
  canvas.setAttribute('role', 'graphics-document')
  canvas.setAttribute('aria-label', 'Cart Diagram Drawing Canvas')
  canvas.setAttribute('tabindex', '0')
  canvas.setAttribute('aria-roledescription', 'Diagrama interactivo para marcar daños')

  // Gestión de foco
  canvas.addEventListener('focus', () => {
    canvas.style.outline = '2px solid blue'
  })

  canvas.addEventListener('blur', () => {
    canvas.style.outline = 'none'
  })

  let isDrawing = false
  let lastX = 0
  let lastY = 0

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    isDrawing = true
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e 
      ? (e as TouchEvent).touches[0].clientX 
      : (e as MouseEvent).clientX
    const clientY = 'touches' in e 
      ? (e as TouchEvent).touches[0].clientY 
      : (e as MouseEvent).clientY

    lastX = clientX - rect.left
    lastY = clientY - rect.top
  }

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing || !drawingContext.value) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e 
      ? (e as TouchEvent).touches[0].clientX 
      : (e as MouseEvent).clientX
    const clientY = 'touches' in e 
      ? (e as TouchEvent).touches[0].clientY 
      : (e as MouseEvent).clientY

    const x = clientX - rect.left
    const y = clientY - rect.top

    drawingContext.value.beginPath()
    drawingContext.value.moveTo(lastX, lastY)
    drawingContext.value.lineTo(x, y)
    drawingContext.value.strokeStyle = currentColor.value
    drawingContext.value.lineWidth = 3
    drawingContext.value.lineCap = 'round'
    drawingContext.value.stroke()

    lastX = x
    lastY = y
  }

  const stopDrawing = () => {
    isDrawing = false
    saveDrawing()
    saveCanvasState()
  }

  // Eventos para mouse
  canvas.addEventListener('mousedown', startDrawing)
  canvas.addEventListener('mousemove', draw)
  canvas.addEventListener('mouseup', stopDrawing)
  canvas.addEventListener('mouseout', stopDrawing)

  // Eventos para touch
  canvas.addEventListener('touchstart', startDrawing)
  canvas.addEventListener('touchmove', draw)
  canvas.addEventListener('touchend', stopDrawing)
  canvas.addEventListener('touchcancel', stopDrawing)
}

// Método para guardar estado del canvas
const saveCanvasState = () => {
  if (!drawingCanvas.value || !drawingContext.value) return
  
  const imageData = drawingContext.value.getImageData(
    0, 
    0, 
    drawingCanvas.value.width, 
    drawingCanvas.value.height
  )
  
  // Almacenar estado en localStorage
  localStorage.setItem(
    `canvas_state_${props.diagramPath}`, 
    JSON.stringify(imageData)
  )
}

// Deshacer último trazo
const undo = () => {
  if (!drawingCanvas.value || !drawingContext.value) return

  // Eliminar último estado
  if (drawingHistory.value.length > 0) {
    drawingHistory.value.pop()

    // Restaurar último estado guardado
    if (drawingHistory.value.length > 0) {
      const lastState = drawingHistory.value[drawingHistory.value.length - 1]
      drawingContext.value.putImageData(lastState, 0, 0)
    } else {
      // Si no hay estados, limpiar canvas
      drawingContext.value.clearRect(0, 0, drawingCanvas.value.width, drawingCanvas.value.height)
    }

    // Guardar nuevo estado
    saveDrawing()
  }
}

// Borrar todo el canvas
const clearCanvas = () => {
  if (!drawingCanvas.value || !drawingContext.value) return

  drawingContext.value.clearRect(0, 0, drawingCanvas.value.width, drawingCanvas.value.height)
  saveDrawing()
}

// Configurar dimensiones y canvas al montar
onMounted(() => {
  // Usar nextTick para asegurar renderizado
  nextTick(() => {
    if (cartImage.value) {
      // Asegurar que la imagen esté completamente cargada
      if (cartImage.value.complete) {
        setupDrawingCanvas()
        loadPreviousCanvasState()
      } else {
        cartImage.value.onload = () => {
          setupDrawingCanvas()
          loadPreviousCanvasState()
        }
      }
    }
  })
})
</script>

<style scoped>
.cart-diagram-annotations-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.color-convention {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 10px;
}

.color-convention h3 {
  margin-right: 15px;
  font-size: 14px;
  font-weight: bold;
}

.convention-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-dot {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  display: inline-block;
}

.convention-item .text-caption {
  font-size: 12px;
  white-space: nowrap;
}

.diagram-container {
  position: relative;
  width: 100%;
}

.cart-diagram {
  width: 100%;
  height: auto;
  z-index: 1;
  position: relative;
}

.drawing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto;
  z-index: 10;
}

.drawing-tools {
  position: absolute;
  top: 10px;
  left: -70px;  /* Mover a la izquierda */
  display: flex;
  flex-direction: column;  /* Cambiar a vertical */
  gap: 10px;
  background: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 5px;
  z-index: 20;
}

.color-picker {
  display: flex;
  flex-direction: column;  /* Cambiar a vertical */
  gap: 10px;
}

.color-picker button {
  width: 50px;
  height: 30px;
  border-radius: 5px;
  border: 2px solid transparent;
  cursor: pointer;
}

.color-picker button.active {
  border-color: black;
}

.action-buttons {
  display: flex;
  flex-direction: column;  /* Cambiar a vertical */
  gap: 10px;
}

.action-buttons button {
  font-size: 20px;
  background: none;
  border: none;
  cursor: pointer;
}

.damage-marker {
  position: absolute;
  cursor: move;
  transform: translate(-50%, -50%);
  z-index: 15;
}

.marker-icon {
  font-size: 20px;
}

.marker-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px;
  border-radius: 3px;
  font-size: 12px;
  white-space: nowrap;
}

.color-reference {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 10px;
}
</style>
