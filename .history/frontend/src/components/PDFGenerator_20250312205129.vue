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
  
  // Método simplificado para generar PDF
  async function generatePDF() {
    try {
      const form = props.formContainer
      
      // Crear una copia DOM del formulario para manipularlo
      const clonedForm = form.cloneNode(true) as HTMLElement
      
      // Crear un contenedor temporal en el DOM
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '0'
      tempContainer.style.width = `${form.offsetWidth}px`
      tempContainer.style.backgroundColor = '#fff'
      
      // Ocultar elementos que no deben aparecer en el PDF
      const elementsToHide = [
        '.damage-record-form',
        '.add-damage-btn',
        '.signature-buttons',
        '.pdf-buttons',
        '.q-table__bottom'
      ]
      
      // Hacer que los selectores trabajen con una variable auxiliar
      const hideElements = (parent: HTMLElement) => {
        elementsToHide.forEach(selector => {
          const elements = parent.querySelectorAll(selector)
          elements.forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.display = 'none'
            }
          })
        })
      }
      
      // Aplicar a la copia
      hideElements(clonedForm)
      
      // Añadir la copia al contenedor temporal
      tempContainer.appendChild(clonedForm)
      document.body.appendChild(tempContainer)
      
      // Dar tiempo al navegador para renderizar el DOM clonado
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Configuración optimizada de html2canvas
      const canvas = await html2canvas(clonedForm, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        // Desactivar opciones problemáticas
        foreignObjectRendering: false,
        // Evitar llamadas a document.write()
        onclone: (clonedDoc) => {
          // Manipular el documento clonado si es necesario
          return clonedDoc
        }
      })
      
      // Verificar dimensiones del canvas
      if (canvas.width === 0 || canvas.height === 0) {
        document.body.removeChild(tempContainer)
        throw new Error('El canvas generado no tiene dimensiones válidas')
      }
      
      // Crear PDF con tamaño de carta
      const pdf = new jsPDF('p', 'mm', 'letter')
      
      // Dimensiones de la página
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      // Ajustar proporcionalmente para que quepa en una página
      const imgWidth = pageWidth - 20 // 10mm de margen a cada lado
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // Añadir la imagen al PDF
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 1.0),
        'JPEG',
        10, // Margen izquierdo
        10, // Margen superior
        imgWidth,
        imgHeight
      )
      
      // Guardar el PDF
      pdf.save('golf_cart_inspection.pdf')
      
      // Limpiar
      document.body.removeChild(tempContainer)
      
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