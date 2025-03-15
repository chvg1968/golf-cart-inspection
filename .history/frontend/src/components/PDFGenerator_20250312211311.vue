<template>
    <div class="pdf-generator" style="display: none;">
      <!-- Componente invisible para generación de PDF -->
    </div>
  </template>
  
  <script setup lang="ts">
  import { defineProps, defineEmits } from 'vue'
  import { useQuasar } from 'quasar'
  import jsPDF from 'jspdf'
  import html2canvas from 'html2canvas'

  import type { 
    GuestInfo, 
    Properties, 
    CartTypeOption, 
    Damage 
  } from '@/types/base-types'

  // Definir un tipo para los datos del PDF
  interface PDFData {
    guestInfo?: GuestInfo
    selectedProperty?: Properties | null
    selectedCartType?: CartTypeOption | null
    damages?: Damage[]
  }

  const $q = useQuasar()

  const props = defineProps<{
    formContainer: HTMLElement
  }>()

  const emit = defineEmits<{
    (e: 'pdf-generated'): void
    (e: 'pdf-error', error: Error): void
  }>()

  // Método para generar PDF con datos opcionales
  async function generatePDF(data?: PDFData) {
    try {
      const form = props.formContainer
      
      // Verificar existencia del formulario
      if (!form) {
        throw new Error('Contenedor de formulario no encontrado')
      }
      
      // Elementos a ocultar durante la generación del PDF
      const elementsToHide = [
        '.damage-record-form',
        '.add-damage-btn', 
        '.signature-buttons',
        '.pdf-buttons',
        '.q-table__bottom'
      ]
      
      // Guardar estado original de elementos
      const hiddenElementsState: Array<{ 
        element: HTMLElement, 
        display: string, 
        visibility: string,
        opacity: string
      }> = []
      
      // Ocultar elementos temporalmente
      elementsToHide.forEach(selector => {
        const elements = form.querySelectorAll(selector)
        elements.forEach(el => {
          if (el instanceof HTMLElement) {
            hiddenElementsState.push({ 
              element: el, 
              display: el.style.display,
              visibility: el.style.visibility,
              opacity: el.style.opacity
            })
            el.style.display = 'none'
            el.style.visibility = 'hidden'
            el.style.opacity = '0'
          }
        })
      })
      
      // Crear un clon del formulario para manipulación
      const clonedForm = form.cloneNode(true) as HTMLElement
      
      // Configuración avanzada para renderizado
      const prepareElementForCapture = (element: HTMLElement) => {
        element.style.position = 'static'
        element.style.left = 'auto'
        element.style.top = 'auto'
        element.style.transform = 'none'
        element.style.opacity = '1'
        element.style.visibility = 'visible'
        element.style.display = 'block'
        
        // Configurar elementos hijos
        Array.from(element.children).forEach(child => {
          if (child instanceof HTMLElement) {
            prepareElementForCapture(child)
          }
        })
      }
      
      // Preparar clon para captura
      prepareElementForCapture(clonedForm)
      
      clonedForm.style.position = 'absolute'
      clonedForm.style.top = '0'
      clonedForm.style.left = '0'
      clonedForm.style.width = `${form.offsetWidth}px`
      clonedForm.style.height = `${form.offsetHeight}px`
      clonedForm.style.overflow = 'visible'
      clonedForm.style.backgroundColor = '#ffffff'
      clonedForm.style.transform = 'scale(1)'
      clonedForm.style.transformOrigin = 'top left'
      
      // Crear contenedor temporal
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'fixed'
      tempContainer.style.top = '0'
      tempContainer.style.left = '0'
      tempContainer.style.width = '100%'
      tempContainer.style.height = '100%'
      tempContainer.style.zIndex = '9999'
      tempContainer.style.opacity = '1'
      tempContainer.style.pointerEvents = 'none'
      tempContainer.style.overflow = 'visible'
      tempContainer.style.backgroundColor = 'transparent'
      
      tempContainer.appendChild(clonedForm)
      document.body.appendChild(tempContainer)
      
      // Esperar renderizado completo con estrategia múltiple
      await new Promise(resolve => {
        const startTime = Date.now()
        
        const checkRenderCompletion = () => {
          // Forzar reflow y visibilidad
          clonedForm.offsetHeight
          
          // Recorrer y forzar visibilidad de todos los elementos
          const allElements = clonedForm.querySelectorAll('*')
          allElements.forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.visibility = 'visible'
              el.style.display = 'block'
              el.style.opacity = '1'
            }
          })
          
          // Verificar dimensiones
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          
          if (context) {
            html2canvas(clonedForm, { 
              scale: 3,
              useCORS: true,
              allowTaint: true,
              logging: true,
              backgroundColor: '#ffffff',
            }).then(capturedCanvas => {
              console.log('Dimensiones del canvas:', capturedCanvas.width, capturedCanvas.height)
              
              if (capturedCanvas.width > 10 && capturedCanvas.height > 10) {
                resolve(capturedCanvas)
              } else if (Date.now() - startTime < 5000) {
                // Reintentar si no ha pasado más de 5 segundos
                requestAnimationFrame(checkRenderCompletion)
              } else {
                throw new Error('No se pudo generar canvas después de múltiples intentos')
              }
            }).catch(error => {
              console.error('Error en generación de canvas:', error)
              throw error
            })
          }
        }
        
        requestAnimationFrame(checkRenderCompletion)
      })
      
      // Capturar canvas con configuración detallada
      const canvas = await html2canvas(clonedForm, { 
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: true,
        backgroundColor: '#ffffff',
        proxy: undefined,
        removeContainer: true,
        windowWidth: clonedForm.offsetWidth,
        windowHeight: clonedForm.offsetHeight,
        onclone: (document, element) => {
          element.style.opacity = '1'
          element.style.visibility = 'visible'
          element.style.display = 'block'
          return document
        }
      })
      
      // Limpiar contenedor temporal
      document.body.removeChild(tempContainer)
      
      // Restaurar visibilidad de elementos
      hiddenElementsState.forEach(state => {
        state.element.style.display = state.display
        state.element.style.visibility = state.visibility
        state.element.style.opacity = state.opacity
      })
      
      // Validar dimensiones del canvas con registro detallado
      console.log('Dimensiones del canvas:', canvas.width, canvas.height)
      
      if (canvas.width < 10 || canvas.height < 10) {
        throw new Error(`Canvas generado con dimensiones insuficientes: ${canvas.width}x${canvas.height}`)
      }
      
      // Crear PDF
      const pdf = new jsPDF({ 
        orientation: 'portrait', 
        unit: 'mm', 
        format: 'a4' 
      })
      
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      // Calcular dimensiones para ajuste proporcional
      const imgWidth = pageWidth * 0.9
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // Centrar imagen en la página
      const xPosition = (pageWidth - imgWidth) / 2
      const yPosition = 10  // Margen superior
      
      // Añadir imagen al PDF
      pdf.addImage(
        canvas.toDataURL('image/png'), 
        'PNG', 
        xPosition, 
        yPosition, 
        imgWidth, 
        imgHeight
      )
      
      // Guardar PDF
      pdf.save('golf_cart_inspection.pdf')
      
      // Emitir evento de éxito
      emit('pdf-generated')
      
      $q.notify({
        type: 'positive',
        message: 'PDF generado exitosamente',
        position: 'top'
      })
      
    } catch (error) {
      console.error('Error generando PDF:', error)
      emit('pdf-error', error as Error)
      
      $q.notify({
        type: 'negative',
        message: 'Error al generar PDF: ' + (error as Error).message,
        position: 'top'
      })
    }
  }

  // Exponer método para ser llamado desde el padre
  defineExpose({ generatePDF })
  </script>