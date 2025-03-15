<template>
    <div class="pdf-generator" style="display: none;">
      <!-- Componente invisible para generación de PDF -->
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, defineProps, defineEmits, defineExpose } from 'vue'
  import { useQuasar } from 'quasar'
  import html2canvas from 'html2canvas'
  import jsPDF from 'jspdf'

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
      
      // Añadir estilos de fuente al clon
      const styleElement = document.createElement('style')
      styleElement.textContent = `
        body, html, * {
          font-family: Arial, sans-serif !important;
          line-height: 1.5 !important;
          color: #333 !important;
        }
        .text-h6, .page-title {
          font-size: 24px !important;
          font-weight: bold !important;
          text-transform: uppercase !important;
        }
        input, select, textarea, div, span, 
        .q-table, .q-table__container, 
        .q-table__top, .q-table__bottom, 
        .q-table thead, .q-table tbody, 
        .q-table tr, .q-table th, .q-table td {
          font-size: 24px !important;
          font-weight: bold !important;
        }
        label {
          font-size: 16px !important;
          font-weight: normal !important;
        }
        .q-checkbox__label {
          font-size: 16px !important;
          font-weight: normal !important;
        }
      `
      clonedForm.appendChild(styleElement)
      
      // Elementos a ocultar
      const elementsToHide = [
        '.damage-record-form', 
        '.pdf-buttons',
        '.q-table__bottom',
        '.q-field__append', // Ocultar iconos de dropdown
        '.q-icon' // Ocultar todos los iconos de Quasar
      ]

      // Ocultar elementos específicos
      elementsToHide.forEach(selector => {
        const elements = clonedForm.querySelectorAll(selector)
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.style.display = 'none'
            element.style.visibility = 'hidden'
            element.style.position = 'absolute'
            element.style.opacity = '0'
            element.style.height = '0'
            element.style.width = '0'
          }
        })
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
        scale: 1,  // Reducir resolución
        useCORS: true,
        allowTaint: true,
        logging: false,  // Desactivar logging
        backgroundColor: '#ffffff'
      })

      // Remover contenedor temporal
      document.body.removeChild(tempDiv)

      // Crear PDF
      const pdf = new jsPDF('p', 'mm', 'letter')
      
      // Obtener dimensiones de página
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Calcular dimensiones de imagen
      const imgRatio = canvas.width / canvas.height
      let imgWidth = pageWidth - 20  // Dejar márgenes
      let imgHeight = imgWidth / imgRatio

      // Ajustar altura si excede
      if (imgHeight > pageHeight - 20) {
        imgHeight = pageHeight - 20
        imgWidth = imgHeight * imgRatio
      }

      // Calcular posición centrada
      const xPosition = (pageWidth - imgWidth) / 2
      const yPosition = (pageHeight - imgHeight) / 2

      // Agregar imagen centrada con compresión JPEG
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.5),  // Reducir calidad de imagen
        'JPEG', 
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

      throw error;
    }
  }

  // Exponer método para ser llamado desde el padre
  defineExpose({ generatePDF })
  </script>