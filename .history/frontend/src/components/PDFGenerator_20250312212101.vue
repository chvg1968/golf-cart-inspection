<template>
    <div class="pdf-generator" style="display: none;">
      <!-- Componente invisible para generación de PDF -->
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, defineProps, defineEmits, defineExpose } from 'vue'
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
      const form = document.querySelector('.form-container') as HTMLElement
      
      if (!form) {
        throw new Error('Formulario no encontrado')
      }

      // Clonar formulario
      const clonedForm = form.cloneNode(true) as HTMLElement
      
      // Elementos a ocultar
      const elementsToHide = [
        '.damage-record-form', 
        '.signature-buttons', 
        '.pdf-buttons',
        '.q-table__bottom',
        '.damage-record-list',
        '.add-damage-btn'
      ]

      // Ocultar elementos específicos
      elementsToHide.forEach(selector => {
        const element = clonedForm.querySelector(selector) as HTMLElement
        if (element) {
          element.style.display = 'none'
        }
      })

      // Contenedor temporal para renderizado
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '210mm'
      tempDiv.style.minHeight = '297mm'
      tempDiv.style.padding = '10mm'
      tempDiv.style.boxSizing = 'border-box'
      tempDiv.appendChild(clonedForm)
      document.body.appendChild(tempDiv)

      // Capturar canvas
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

      // Remover contenedor temporal
      document.body.removeChild(tempDiv)

      // Crear PDF
      const pdf = new jsPDF('p', 'mm', 'letter')
      
      const pageWidth = pdf.internal.pageSize.getWidth() - 20
      const pageHeight = pdf.internal.pageSize.getHeight() - 20

      // Calcular dimensiones
      const imgRatio = canvas.width / canvas.height
      let imgWidth = pageWidth
      let imgHeight = imgWidth / imgRatio

      // Ajustar altura si excede
      if (imgHeight > pageHeight) {
        imgHeight = pageHeight
        imgWidth = imgHeight * imgRatio
      }

      // Centrar imagen
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

      // Notificación
      $q.notify({
        type: 'positive',
        message: 'PDF generado exitosamente',
        position: 'top'
      })

      // Emitir evento de éxito
      emit('pdf-generated')

    } catch (error) {
      console.error('Error generando PDF:', error)
      
      // Emitir evento de error
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