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
  
  const $q = useQuasar()
  
  const props = defineProps<{
    formContainer: HTMLElement
  }>()
  
  const emit = defineEmits<{
    (e: 'pdf-generated'): void
    (e: 'pdf-error', error: Error): void
  }>()
  
  // Método para generar PDF con enfoque alternativo
  async function generatePDF() {
    try {
      const form = props.formContainer
      
      // En lugar de clonar el formulario, trabajamos directamente con el original
      // Guardamos el estado original para restaurarlo después
      const elementsToHide = [
        '.damage-record-form',
        '.add-damage-btn',
        '.signature-buttons',
        '.pdf-buttons',
        '.q-table__bottom'
      ]
      
      // Guardar estado original de elementos a ocultar
      const hiddenElementsState: Array<{ element: HTMLElement, display: string }> = []
      
      // Ocultar elementos temporalmente
      elementsToHide.forEach(selector => {
        const elements = form.querySelectorAll(selector)
        elements.forEach(el => {
          if (el instanceof HTMLElement) {
            hiddenElementsState.push({ 
              element: el, 
              display: el.style.display 
            })
            el.style.display = 'none'
          }
        })
      })
      
      // Capturar dimensiones originales
      const originalWidth = form.offsetWidth
      const originalHeight = form.offsetHeight
      
      // Asegurar que el elemento tenga dimensiones explícitas
      const originalStyles = {
        width: form.style.width,
        height: form.style.height,
        position: form.style.position,
        overflow: form.style.overflow
      }
      
      // Aplicar estilos para la captura
      form.style.width = `${originalWidth}px`
      form.style.height = `${originalHeight}px`
      form.style.position = 'relative'  // Asegurar posicionamiento correcto
      form.style.overflow = 'visible'   // Evitar recortes
      
      // Dar tiempo al navegador para aplicar cambios
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Usar una configuración más básica de html2canvas
      const canvas = await html2canvas(form, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        // Eliminar opciones problemáticas
        removeContainer: false,
        // Configuración específica para evitar document.write
        onclone: (document) => {
          // No hacemos nada aquí, solo para prevenir comportamiento por defecto
          return document
        }
      })
      
      // Restaurar estilos originales
      form.style.width = originalStyles.width
      form.style.height = originalStyles.height
      form.style.position = originalStyles.position
      form.style.overflow = originalStyles.overflow
      
      // Restaurar visibilidad de elementos
      hiddenElementsState.forEach(state => {
        state.element.style.display = state.display
      })
      
      // Verificar dimensiones del canvas
      console.log(`Canvas generado: ${canvas.width}x${canvas.height}`)
      
      if (canvas.width < 10 || canvas.height < 10) {
        throw new Error(`Canvas generado con dimensiones insuficientes: ${canvas.width}x${canvas.height}`)
      }
      
      // Crear PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })
      
      // Dimensiones de la página
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      // Calcular dimensiones para mantener proporción
      const ratio = canvas.width / canvas.height
      let imgWidth = pageWidth - 20  // Margen de 10mm en cada lado
      let imgHeight = imgWidth / ratio
      
      // Si la altura calculada excede la página, ajustar por altura
      if (imgHeight > pageHeight - 20) {
        imgHeight = pageHeight - 20
        imgWidth = imgHeight * ratio
      }
      
      // Calcular posición para centrar en la página
      const x = (pageWidth - imgWidth) / 2
      const y = (pageHeight - imgHeight) / 2
      
      // Añadir imagen al PDF con calidad moderada
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.9),
        'JPEG',
        x, 
        y, 
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
        message: 'Error al generar PDF: ' + (error as Error).message,
        position: 'top'
      })
    }
  }
  
  // Exponer método para ser llamado desde el padre
  defineExpose({ generatePDF })
  </script>