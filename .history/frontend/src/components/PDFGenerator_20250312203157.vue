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
  
  const $q = useQuasar()
  
  const props = defineProps<{
    formContainer: HTMLElement
    guestInfo: GuestInfo
    selectedProperty: Properties | null
    selectedCartType: CartTypeOption | null
    damages: Damage[]
  }>()
  
  const emit = defineEmits<{
    (e: 'pdf-generated'): void
    (e: 'pdf-error', error: Error): void
  }>()
  
  async function generatePDF() {
    try {
      // Clonar el contenedor del formulario
      const clonedForm = props.formContainer.cloneNode(true) as HTMLElement
      
      // Ocultar elementos no deseados
      const elementsToHide = [
        '.damage-record-form',
        '.add-damage-btn',
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
  
      // Fijar marcas de daño
      const originalMarkers = props.formContainer.querySelectorAll('.damage-marker')
      const clonedMarkers = clonedForm.querySelectorAll('.damage-marker')
  
      originalMarkers.forEach((originalMarker, index) => {
        const clonedMarker = clonedMarkers[index] as HTMLElement
        const originalRect = originalMarker.getBoundingClientRect()
        const formRect = props.formContainer.getBoundingClientRect()
  
        const left = originalRect.left - formRect.left
        const top = originalRect.top - formRect.top
  
        clonedMarker.style.position = 'absolute'
        clonedMarker.style.left = `${left}px`
        clonedMarker.style.top = `${top}px`
        clonedMarker.style.zIndex = '10'
      })
  
      // Crear div temporal para renderizar
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '210mm'
      tempDiv.style.minHeight = '297mm'
      tempDiv.style.padding = '5mm'
      tempDiv.style.boxSizing = 'border-box'
      tempDiv.appendChild(clonedForm)
      document.body.appendChild(tempDiv)
  
      // Capturar imagen
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
  
      // Remover div temporal
      document.body.removeChild(tempDiv)
  
      // Crear PDF
      const pdf = new jsPDF('p', 'mm', 'letter')
      
      // Dimensiones de la página
      const pageWidth = pdf.internal.pageSize.getWidth() - 10
      const pageHeight = pdf.internal.pageSize.getHeight() - 10
  
      // Calcular dimensiones
      const imgRatio = canvas.width / canvas.height
      let imgWidth = pageWidth
      let imgHeight = imgWidth / imgRatio
  
      if (imgHeight > pageHeight) {
        imgHeight = pageHeight
        imgWidth = imgHeight * imgRatio
      }
  
      // Calcular posición central
      const xPosition = (pdf.internal.pageSize.getWidth() - imgWidth) / 2
      const yPosition = (pdf.internal.pageSize.getHeight() - imgHeight) / 2
  
      // Agregar imagen
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