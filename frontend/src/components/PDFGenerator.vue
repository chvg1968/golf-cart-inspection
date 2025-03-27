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

  // Método para generar nombre de archivo descriptivo
  function generateFileName(selectedProperty?: Properties | null): string {
    if (!selectedProperty) return 'golf-cart-inspection.pdf'
    
    const propertyName = selectedProperty.name 
      ? selectedProperty.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      : 'unknown-property'
    
    const timestamp = new Date().toISOString().split('T')[0]
    return `golf-cart-inspection-${propertyName}-${timestamp}.pdf`
  }

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
        .signature-container {
          font-size: 14px !important;
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

      // Renderizar HTML a canvas
      const canvas = await html2canvas(clonedForm, {
        scale: 2,
        useCORS: true,
        logging: false
      })

      // Generar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Añadir imagen al PDF
      const imgData = canvas.toDataURL('image/jpeg', 1.0)
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)

      // Generar nombre de archivo descriptivo
      const fileName = generateFileName(props.selectedProperty)

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