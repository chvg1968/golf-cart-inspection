<template>
    <div class="pdf-generator" style="display: none;">
      <!-- Componente invisible para generación de PDF -->
    </div>
  </template>
  
  <script setup lang="ts">
  import { defineProps, defineEmits, defineExpose } from 'vue'
  import { useQuasar } from 'quasar'
  import html2canvas from 'html2canvas'
  import jsPDF from 'jspdf'

  import type { 
    Properties 
  } from '@/types/base-types'

  const $q = useQuasar()

  // Definir tipos para props y emits
  const props = defineProps<{
    formContainer: HTMLElement
    guestInformation: any
    selectedProperty: Properties | null
    annotatedDiagramImage: any
  }>()

  const emit = defineEmits<{
    (e: 'pdf-generated'): void
    (e: 'pdf-error', error: Error): void
  }>()

  // Método para generar nombre de archivo descriptivo
  function generateFileName(
    selectedProperty?: Properties | null, 
    guestInfo?: { name?: string }
  ): string {
    // Sanitizar nombres para usar en archivo
    const sanitizeName = (input?: string): string => 
      input 
        ? input.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 20) 
        : 'unknown'

    const propertyName = sanitizeName(selectedProperty?.name)
    const guestName = sanitizeName(guestInfo?.name)
    const timestamp = new Date().toISOString().split('T')[0]

    return `golf-cart-inspection-${propertyName}-${guestName}-${timestamp}.pdf`
  }

  // Método para generar PDF con datos opcionales
  async function generatePDF() {
    try {
      // Buscar formulario de manera más robusta
      const form = props.formContainer || 
        document.querySelector('.form-container') as HTMLElement
      
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
          visibility: visible !important;
          opacity: 1 !important;
        }
        .text-h6, .page-title {
          font-size: 24px !important;
          font-weight: bold !important;
          text-transform: uppercase !important;
        }
      `
      clonedForm.appendChild(styleElement)
      
      // Elementos a ocultar
      const elementsToHide = [
        '.damage-record-form', 
        '.pdf-buttons',
        '.q-table__bottom',
        '.q-field__append',
        '.q-icon',
        'script', 
        'style', 
        '.hidden', 
        '[hidden]', 
        '.q-dialog',
        '.q-tooltip'
      ]

      // Ocultar elementos específicos
      elementsToHide.forEach(selector => {
        const elements = clonedForm.querySelectorAll(selector)
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.style.display = 'none'
          }
        })
      })

      // Contenedor temporal para renderizado
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '100%'
      tempDiv.appendChild(clonedForm)
      document.body.appendChild(tempDiv)

      // Capturar canvas
      const canvas = await html2canvas(clonedForm, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      // Remover contenedor temporal
      document.body.removeChild(tempDiv)

      // Convertir canvas a imagen JPEG
      const imageData = canvas.toDataURL('image/jpeg', 0.5)

      // Generar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      })

      // Obtener dimensiones del PDF
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // Calcular dimensiones de imagen
      const imgRatio = canvas.width / canvas.height
      let imgWidth = pdfWidth - 20  // Márgenes
      let imgHeight = imgWidth / imgRatio

      // Ajustar altura si excede
      if (imgHeight > pdfHeight - 20) {
        imgHeight = pdfHeight - 20
        imgWidth = imgHeight * imgRatio
      }

      // Añadir imagen al PDF
      pdf.addImage({
        imageData: imageData,
        format: 'JPEG',
        x: 10,
        y: 10,
        width: imgWidth,
        height: imgHeight
      })

      // Generar nombre de archivo descriptivo
      const fileName = generateFileName(props.selectedProperty, props.guestInformation)

      // Método de descarga
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = fileName
      link.click()

      // Notificación de éxito
      $q.notify({
        type: 'positive',
        message: 'PDF generado exitosamente',
        position: 'top'
      })

      // Emitir evento de éxito
      emit('pdf-generated')

    } catch (error) {
      console.error('Error generando PDF:', error)
      
      // Notificación de error
      $q.notify({
        type: 'negative',
        message: 'Error al generar PDF: ' + (error instanceof Error ? error.message : 'Error desconocido'),
        position: 'top'
      })

      // Emitir evento de error
      emit('pdf-error', error instanceof Error ? error : new Error('Error desconocido'))
    }
  }

  // Método para descargar PDF
  const downloadPDF = async (pdfData: any) => {
    try {
      // Validar datos de entrada
      if (!pdfData) {
        throw new Error('Datos de PDF no proporcionados')
      }

      // Validar campos requeridos
      const requiredFields = [
        'guestInfo', 
        'selectedProperty', 
        'selectedCartType', 
        'cartNumber'
      ]
      
      for (const field of requiredFields) {
        if (!pdfData[field]) {
          throw new Error(`Campo requerido faltante: ${field}`)
        }
      }

      // Generar PDF
      await generatePDF()
    } catch (error) {
      console.error('Error al generar PDF:', error)
      $q.notify({
        type: 'negative',
        message: 'No se pudo generar el PDF',
        caption: error instanceof Error ? error.message : 'Error desconocido',
        position: 'top'
      })
    }
  }

  // Exponer método para ser llamado desde el padre
  defineExpose({ 
    downloadPDF,
    generatePDF  // Mantener generatePDF por compatibilidad
  })
  </script>