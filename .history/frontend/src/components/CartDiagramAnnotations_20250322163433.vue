<template>
  <div class="cart-diagram-annotations-container">
    <!-- Convención de colores -->
    <div class="color-convention">
      <h3 class="text-h6">Color Reference:</h3>
      <div class="convention-item">
        <span class="color-dot" style="background-color: red;"></span>
        <span>Scratches</span>
      </div>
      <div class="convention-item">
        <span class="color-dot" style="background-color: green;"></span>
        <span>Missing parts</span>
      </div>
      <div class="convention-item">
        <span class="color-dot" style="background-color: yellow;"></span>
        <span>Damage/Bumps</span>
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
  { color: 'green' },
  { color: 'yellow' }
]

// Grosores de línea
const lineWidths = [8]
const currentLineWidth = ref(lineWidths[0])

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

// Método para guardar dibujo como base64
const saveDrawing = () => {
  if (!drawingCanvas.value || !cartImage.value) return null

  // Crear un nuevo canvas con alta resolución
  const tempCanvas = document.createElement('canvas')
  const maxWidth = 2000  // Límite de ancho para evitar problemas de rendimiento
  const scaleFactor = Math.min(maxWidth / cartImage.value.naturalWidth, 1)
  
  tempCanvas.width = Math.floor(cartImage.value.naturalWidth * scaleFactor)
  tempCanvas.height = Math.floor(cartImage.value.naturalHeight * scaleFactor)
  
  const tempContext = tempCanvas.getContext('2d')
  if (!tempContext) return null

  // Dibujar la imagen original escalada
  tempContext.drawImage(
    cartImage.value, 
    0, 
    0, 
    tempCanvas.width, 
    tempCanvas.height
  )

  // Dibujar el canvas de dibujo escalado
  if (drawingCanvas.value) {
    // Configurar estilo de dibujo
    tempContext.strokeStyle = currentColor.value
    tempContext.lineWidth = currentLineWidth.value
    tempContext.lineCap = 'round'
    tempContext.lineJoin = 'round'

    // Copiar los trazos del canvas de dibujo
    const sourceContext = drawingCanvas.value.getContext('2d')
    if (sourceContext) {
      const imageData = sourceContext.getImageData(
        0, 
        0, 
        drawingCanvas.value.width, 
        drawingCanvas.value.height
      )
      
      // Dibujar cada trazo manualmente para mayor control
      for (let x = 0; x < drawingCanvas.value.width; x++) {
        for (let y = 0; y < drawingCanvas.value.height; y++) {
          const index = (y * drawingCanvas.value.width + x) * 4
          if (imageData.data[index + 3] > 0) {  // Si el pixel no es transparente
            tempContext.fillStyle = `rgba(${imageData.data[index]}, ${imageData.data[index+1]}, ${imageData.data[index+2]}, 0.7)`
            tempContext.fillRect(
              x * (tempCanvas.width / drawingCanvas.value.width), 
              y * (tempCanvas.height / drawingCanvas.value.height), 
              tempCanvas.width / drawingCanvas.value.width, 
              tempCanvas.height / drawingCanvas.value.height
            )
          }
        }
      }
    }
  }

  // Convertir a base64 con alta calidad
  const base64Drawing = tempCanvas.toDataURL('image/png', 1.0)
  emit('drawing-created', base64Drawing)
  return base64Drawing
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
  drawingHistory.value.push(imageData)
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

// Configurar canvas de dibujo
const setupDrawingCanvas = () => {
  if (!drawingCanvas.value || !cartImage.value) return

  // Ajustar dimensiones del canvas al tamaño de la imagen
  canvasWidth.value = cartImage.value.offsetWidth
  canvasHeight.value = cartImage.value.offsetHeight

  drawingContext.value = drawingCanvas.value.getContext('2d')
  if (!drawingContext.value) return

  drawingContext.value.lineCap = 'round'
  drawingContext.value.lineJoin = 'round'
  drawingContext.value.lineWidth = currentLineWidth.value
  drawingContext.value.strokeStyle = currentColor.value

  let isDrawing = false
  let lastX = 0
  let lastY = 0

  const drawPoint = (x: number, y: number) => {
    if (!drawingContext.value) return

    drawingContext.value.beginPath()
    drawingContext.value.arc(x, y, currentLineWidth.value / 2, 0, Math.PI * 2)
    drawingContext.value.fillStyle = currentColor.value
    drawingContext.value.fill()
  }

  const drawLine = (fromX: number, fromY: number, toX: number, toY: number) => {
    if (!drawingContext.value) return

    drawingContext.value.beginPath()
    drawingContext.value.moveTo(fromX, fromY)
    drawingContext.value.lineTo(toX, toY)
    drawingContext.value.stroke()
  }

  drawingCanvas.value.addEventListener('mousedown', (event) => {
    // Prevenir propagación para evitar efectos no deseados
    event.stopPropagation()
    
    isDrawing = true
    const rect = drawingCanvas.value?.getBoundingClientRect()
    if (!rect) return

    lastX = event.clientX - rect.left
    lastY = event.clientY - rect.top

    // Dibujar punto inicial
    drawPoint(lastX, lastY)
    saveCanvasState()
    saveDrawing()
  })

  drawingCanvas.value.addEventListener('mousemove', (event) => {
    if (!isDrawing) return

    const rect = drawingCanvas.value?.getBoundingClientRect()
    if (!rect) return

    const currentX = event.clientX - rect.left
    const currentY = event.clientY - rect.top

    // Dibujar línea
    drawLine(lastX, lastY, currentX, currentY)

    lastX = currentX
    lastY = currentY
  })

  drawingCanvas.value.addEventListener('mouseup', () => {
    isDrawing = false
    saveDrawing()
  })

  drawingCanvas.value.addEventListener('mouseout', () => {
    isDrawing = false
    saveDrawing()
  })
}

// Configurar dimensiones y canvas al montar
onMounted(async () => {
  // Esperar a que la imagen se cargue completamente
  await nextTick()

  if (cartImage.value) {
    // Asegurar que la imagen esté completamente cargada
    if (cartImage.value.complete) {
      setupDrawingCanvas()
    } else {
      cartImage.value.onload = setupDrawingCanvas
    }
  }

  // Renderizar referencia de colores
  renderColorReference()
})

// Colores con referencias
const colorReferences = [
  { color: 'red', description: 'Scratches' },
  { color: 'green', description: 'Missing Parts' },
  { color: 'yellow', description: 'Damage/Bumps' }
]

// Método para renderizar referencia de colores
const renderColorReference = () => {
  if (!cartDiagramContainer.value) return

  // Verificar si ya existe una referencia de color
  const existingReference = cartDiagramContainer.value.querySelector('.color-reference')
  if (existingReference) {
    existingReference.remove()
  }

  // Crear contenedor de referencia de colores
  const referenceContainer = document.createElement('div')
  referenceContainer.className = 'color-reference'
  referenceContainer.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    font-size: 12px;
    font-weight: bold;
  `

  // Título de referencia
  

 

    const colorBox = document.createElement('div')
    colorBox.style.cssText = `
      width: 15px;
      height: 15px;
      background-color: ${ref.color};
      border: 1px solid black;
      margin-right: 5px;
    `

    const colorText = document.createElement('span')
    colorText.textContent = ref.description
    colorText.style.fontSize = '10px'

    colorElement.appendChild(colorBox)
    colorElement.appendChild(colorText)
    referenceContainer.appendChild(colorElement)
  })

  // Insertar referencia antes del contenedor del diagrama
  // Usar método más seguro de inserción
  if (cartDiagramContainer.value.firstChild) {
    cartDiagramContainer.value.insertBefore(referenceContainer, cartDiagramContainer.value.firstChild)
  } else {
    cartDiagramContainer.value.appendChild(referenceContainer)
  }
}
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
  justify-content: center;
  align-items: center;
  gap: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
}

.convention-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-block;
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
