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

  // Método para detectar plataforma
  const detectPlatform = (): 'ios' | 'android' | 'desktop' => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios'
    if (/android/.test(userAgent)) return 'android'
    return 'desktop'
  }

  // Método para generar PDF con datos opcionales
  async function generatePDF(data?: PDFData): Promise<Blob> {
    try {
      const form = document.querySelector('.form-container') as HTMLElement
      
      if (!form) {
        throw new Error('Formulario no encontrado')
      }

      // Clonar formulario y preparar para PDF
      const clonedForm = prepareFormForPDF(form)

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
      document.body.removeChild(clonedForm.parentElement!)

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

      // Agregar imagen al PDF
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.8), 
        'JPEG', 
        10, 10, 
        imgWidth, imgHeight
      )

      // Generar Blob del PDF
      const pdfBlob = new Blob([pdf.output('blob')], { type: 'application/pdf' })

      // Emitir evento de PDF generado
      emit('pdf-generated')

      return pdfBlob
    } catch (error) {
      console.error('Error generando PDF:', error)
      emit('pdf-error', error as Error)
      throw error
    }
  }

  // Método para preparar formulario para PDF
  function prepareFormForPDF(form: HTMLElement): HTMLElement {
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

    // Reemplazar diagrama con imagen anotada si está disponible
    const diagramContainer = clonedForm.querySelector('.diagram-container')
    const annotatedImage = props.annotatedDiagramImage

    if (diagramContainer && annotatedImage) {
      const imgElement = document.createElement('img')
      imgElement.src = annotatedImage
      imgElement.style.maxWidth = '100%'
      imgElement.style.height = 'auto'
      diagramContainer.innerHTML = ''
      diagramContainer.appendChild(imgElement)
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

    return clonedForm
  }

  // Exponer métodos para uso externo
  defineExpose({
    generatePDF
  })
  </script>