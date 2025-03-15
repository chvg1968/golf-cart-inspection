<template>
    <div class="pdf-generator" style="display: none;">
      <!-- Componente invisible para generación de PDF -->
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, defineProps, defineEmits } from 'vue'
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
    guestInfo: GuestInfo
    selectedProperty: Properties | null
    selectedCartType: CartTypeOption | null
    damages: Damage[]
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
      // Capturar todo el formulario
      const form = props.formContainer

      // Crear un clon del formulario para manipular sin afectar el original
      const clonedForm = form.cloneNode(true) as HTMLElement
      
      // Ocultar elementos que no deben aparecer en el PDF
      const elementsToHide = [
        '.damage-record-form',  // Formulario de daños
        '.add-damage-btn',      // Botón para añadir daños
        '.signature-buttons', 
        '.pdf-buttons',
        '.q-table__bottom'
      ]

      elementsToHide.forEach(selector => {
        const elements = clonedForm.querySelectorAll(selector)
        elements.forEach(element => {
          const el = element as HTMLElement
          el.style.display = 'none'
          el.style.visibility = 'hidden'
        })
      })

      // Asegurar que las marcas de daño estén fijas
      const originalMarkers = form.querySelectorAll('.damage-marker')
      const clonedMarkers = clonedForm.querySelectorAll('.damage-marker')

      originalMarkers.forEach((originalMarker, index) => {
        const clonedMarker = clonedMarkers[index] as HTMLElement
        const originalRect = originalMarker.getBoundingClientRect()
        const formRect = form.getBoundingClientRect()

        // Calcular posición relativa al formulario
        const left = originalRect.left - formRect.left
        const top = originalRect.top - formRect.top

        clonedMarker.style.position = 'absolute'
        clonedMarker.style.left = `${left}px`
        clonedMarker.style.top = `${top}px`
        clonedMarker.style.zIndex = '10'
      })

      // Crear un div temporal para renderizar el clon
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '210mm'  // Ancho de página A4
      tempDiv.style.minHeight = '297mm'  // Altura de página A4
      tempDiv.style.padding = '5mm'  // Reducir márgenes
      tempDiv.style.boxSizing = 'border-box'
      tempDiv.appendChild(clonedForm)
      document.body.appendChild(tempDiv)

      // Capturar imagen del formulario
      const canvas = await html2canvas(clonedForm, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        backgroundColor: '#ffffff',
        width: clonedForm.scrollWidth,
        height: clonedForm.scrollHeight,
        windowWidth: clonedForm.scrollWidth,
        windowHeight: clonedForm.scrollHeight,
        scrollX: 0,
        scrollY: -window.scrollY
      })

      // Remover el div temporal
      document.body.removeChild(tempDiv)

      // Crear PDF
      const pdf = new jsPDF('p', 'mm', 'letter')
      
      // Dimensiones de la página con márgenes reducidos
      const pageWidth = pdf.internal.pageSize.getWidth() - 10  // Reducir márgenes
      const pageHeight = pdf.internal.pageSize.getHeight() - 10  // Reducir márgenes

      // Calcular dimensiones para ajustar la imagen
      const imgRatio = canvas.width / canvas.height
      let imgWidth = pageWidth
      let imgHeight = imgWidth / imgRatio

      // Si la altura es mayor que la página, ajustar por altura
      if (imgHeight > pageHeight) {
        imgHeight = pageHeight
        imgWidth = imgHeight * imgRatio
      }

      // Calcular posición para centrar
      const xPosition = (pdf.internal.pageSize.getWidth() - imgWidth) / 2
      const yPosition = (pdf.internal.pageSize.getHeight() - imgHeight) / 2

      // Agregar imagen al PDF
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
        message: 'Error al generar PDF. Detalles en consola.',
        position: 'top'
      })
    }
  }

  // Exponer método para ser llamado desde el padre
  defineExpose({ generatePDF })
  </script>