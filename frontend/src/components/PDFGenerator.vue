<template>
    <div class="pdf-generator" style="display: none;">
      <!-- Componente invisible para generación de PDF -->
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, defineProps, defineEmits, defineExpose, computed } from 'vue'
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
    cartNumber?: string
    damages?: Damage[]
    annotatedDiagramImage?: string
    cartDiagramDrawing?: string
  }

  const $q = useQuasar()

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

      // Función para esperar la carga de imagen
      const waitForImageLoad = (imgElement: HTMLImageElement): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (imgElement.complete) {
            resolve()
          } else {
            imgElement.onload = () => resolve()
            imgElement.onerror = () => reject(new Error('Error cargando imagen'))
          }
        })
      }

      // Reemplazar diagrama con imagen anotada si está disponible
      const diagramContainer = clonedForm.querySelector('.diagram-container')
      let annotatedImageLoaded = false
      
      // Verificar si hay imagen anotada en props o en data
      const annotatedImage = props.annotatedDiagramImage || 
                             (data && (data.annotatedDiagramImage || data.cartDiagramDrawing))

      if (diagramContainer && annotatedImage) {
        const imgElement = document.createElement('img')
        imgElement.src = annotatedImage
        imgElement.style.maxWidth = '100%'
        imgElement.style.height = 'auto'
        diagramContainer.innerHTML = ''
        diagramContainer.appendChild(imgElement)

        try {
          await waitForImageLoad(imgElement)
          annotatedImageLoaded = true
        } catch (error) {
          console.error('Error cargando imagen anotada:', error)
        }
      } else {
      }

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

      // Añadir un pequeño retraso para asegurar renderizado
      await new Promise(resolve => setTimeout(resolve, 500))

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
      
      // Generar Blob para descarga
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)

      // Detección de dispositivos móviles
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

      // Generar nombre de archivo descriptivo
      const sanitizeFileName = (input: string) => 
        input.replace(/[^a-z0-9]/gi, '_').toLowerCase()

      const fileName = data 
        ? `Inspection/${sanitizeFileName(data.cartNumber || 'unknown')}/${sanitizeFileName(data.selectedProperty?.name || 'unknown')}/${sanitizeFileName(data.guestInfo?.name || 'unknown')}.pdf`
        : 'golf_cart_inspection.pdf'

      if (isMobile) {
        // Estrategia para dispositivos móviles
        const link = document.createElement('a')
        link.href = pdfUrl
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        
        // Intentar diferentes métodos de descarga
        try {
          // Método 1: Abrir en nueva pestaña
          window.open(pdfUrl, '_blank')
          
          // Método 2: Intentar descarga directa
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } catch (error) {
          // Notificación de problema de descarga
          $q.notify({
            type: 'warning',
            message: 'No se pudo descargar automáticamente. Por favor, intenta descargar manualmente.',
            position: 'top'
          })
        }
      } else {
        // Método de descarga para escritorio
        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      // Liberar recursos
      URL.revokeObjectURL(pdfUrl)

      // Emitir evento de PDF generado
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
      await generatePDF(pdfData)
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