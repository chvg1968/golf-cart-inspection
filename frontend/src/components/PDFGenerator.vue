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
        document.querySelector('.form-container') || 
        document.querySelector('form') as HTMLElement
      
      if (!form) {
        throw new Error('No se encontró ningún formulario para generar PDF')
      }

      // Clonar formulario de manera segura
      const clonedForm = form.cloneNode(true) as HTMLElement
      
      // Limpiar elementos que pueden causar problemas
      const elementsToRemove = clonedForm.querySelectorAll([
        'script', 
        'style', 
        '.hidden', 
        '[hidden]', 
        '.q-dialog',
        '.q-tooltip'
      ].join(','))
      
      elementsToRemove.forEach(el => el.remove())

      // Añadir estilos de fuente al clon
      const styleElement = document.createElement('style')
      styleElement.textContent = `
        body, html, * {
          font-family: Arial, sans-serif !important;
          line-height: 1.5 !important;
          color: #333 !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: static !important;
        }
        .text-h6, .page-title {
          font-size: 24px !important;
          font-weight: bold !important;
          text-transform: uppercase !important;
        }
        input, select, textarea, div, span, 
        .q-table, .q-table__container, 
        .signature-container {
          font-size: 14px !important;
        }
      `
      clonedForm.appendChild(styleElement)

      // Añadir clon al body para renderizado
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.width = '100%'
      tempContainer.appendChild(clonedForm)
      document.body.appendChild(tempContainer)

      // Pequeño retraso para asegurar renderizado
      await new Promise(resolve => setTimeout(resolve, 300))

      // Renderizar HTML a canvas
      const canvas = await html2canvas(clonedForm, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      // Remover contenedor temporal
      document.body.removeChild(tempContainer)

      // Generar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Añadir imagen al PDF - Manejar conversión de imagen
      const imgData = canvas.toDataURL('image/png')
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

      // Generar nombre de archivo descriptivo
      const fileName = generateFileName(props.selectedProperty, props.guestInformation)

      // Método de descarga específico para iOS
      if (navigator.userAgent.match(/iPad|iPhone|iPod/)) {
        // Método de descarga para iOS
        const pdfBlob = pdf.output('blob')
        const pdfUrl = URL.createObjectURL(pdfBlob)
        
        // Crear enlace temporal para descarga
        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = fileName
        
        // Simular clic para descargar
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Liberar recursos
        URL.revokeObjectURL(pdfUrl)
      } else {
        // Método de descarga estándar para otros navegadores
        pdf.save(fileName)
      }

      // Emitir evento de éxito
      emit('pdf-generated')

    } catch (error) {
      console.error('Error generando PDF:', error)
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