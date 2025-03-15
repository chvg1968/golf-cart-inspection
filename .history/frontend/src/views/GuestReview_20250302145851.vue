<template>
    <div class="guest-review">
      <div v-if="loading" class="text-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Cargando...</span>
        </div>
      </div>
      
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <div v-else-if="inspection" class="inspection-review">
        <div class="header-section mb-4">
          <h1>Revisión de Inspección de Golf Cart</h1>
          <p class="lead">Por favor revise los detalles de la inspección y firme si está de acuerdo.</p>
        </div>
        
        <div class="card mb-4">
          <div class="card-header bg-primary text-white">
            <h3 class="m-0">Detalles de la Inspección</h3>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <p><strong>ID del Golf Cart:</strong> {{ inspection.cart_id }}</p>
                <p><strong>Fecha de Inspección:</strong> {{ formatDate(inspection.inspection_date) }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Huésped:</strong> {{ inspection.guest_name }}</p>
                <p><strong>Estado:</strong> <span class="badge" :class="statusClass">{{ statusText }}</span></p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Diagrama de Golf Cart -->
        <div class="card mb-4">
          <div class="card-header bg-light">
            <h4 class="m-0">Diagrama de Golf Cart</h4>
          </div>
          <div class="card-body text-center">
            <img src="@/assets/golf-cart-diagram.png" alt="Diagrama de Golf Cart" class="img-fluid mb-3" style="max-width: 500px;">
            <!-- Aquí se mostrarían los puntos de daño del diagrama -->
          </div>
        </div>
        
        <!-- Información de Daños -->
        <div class="card mb-4">
          <div class="card-header bg-light">
            <h4 class="m-0">Registro de Daños</h4>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <div class="damage-section">
                  <h5>Daños Frontales</h5>
                  <p class="damage-text">{{ inspection.front_damage || 'No se registraron daños' }}</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="damage-section">
                  <h5>Daños Traseros</h5>
                  <p class="damage-text">{{ inspection.back_damage || 'No se registraron daños' }}</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="damage-section">
                  <h5>Daños Lado Izquierdo</h5>
                  <p class="damage-text">{{ inspection.left_damage || 'No se registraron daños' }}</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="damage-section">
                  <h5>Daños Lado Derecho</h5>
                  <p class="damage-text">{{ inspection.right_damage || 'No se registraron daños' }}</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="damage-section">
                  <h5>Daños Interiores</h5>
                  <p class="damage-text">{{ inspection.interior_damage || 'No se registraron daños' }}</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="damage-section">
                  <h5>Notas Adicionales</h5>
                  <p class="damage-text">{{ inspection.additional_notes || 'No hay notas adicionales' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Sección de Firma -->
        <div class="card mb-4">
          <div class="card-header bg-light">
            <h4 class="m-0">Su Firma</h4>
          </div>
          <div class="card-body">
            <p>Al firmar, confirma que ha revisado y está de acuerdo con los detalles de la inspección.</p>
            
            <div class="signature-container">
              <canvas ref="signatureCanvas" class="signature-canvas"></canvas>
              <div class="signature-controls">
                <button type="button" class="btn btn-sm btn-secondary" @click="clearSignature">Borrar Firma</button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Botones de acción -->
        <div class="row mb-4">
          <div class="col-md-12 text-right">
            <button type="button" class="btn btn-secondary mr-2" @click="downloadPdf">Ver PDF</button>
            <button type="button" class="btn btn-primary" @click="submitSignature" :disabled="!canSubmit">
              Confirmar y Firmar
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import SignaturePad from 'signature_pad';
  import axios from 'axios';
  
  export default {
    name: 'GuestReview',
    data() {
      return {
        token: null,
        inspection: null,
        loading: true,
        error: null,
        signaturePad: null
      };
    },
    computed: {
      statusClass() {
        switch (this.inspection.status) {
          case 'sent': return 'badge-warning';
          case 'signed': return 'badge-success';
          default: return 'badge-secondary';
        }
      },
      statusText() {
        switch (this.inspection.status) {
          case 'draft': return 'Borrador';
          case 'sent': return 'Pendiente de Revisión';
          case 'signed': return 'Firmado';
          default: return 'Desconocido';
        }
      },
      canSubmit() {
        return this.inspection && 
               this.inspection.status !== 'signed' && 
               this.signaturePad && 
               !this.signaturePad.isEmpty();
      }
    },
    async created() {
      this.token = this.$route.params.token;
      
      if (!this.token) {
        this.error = 'Token de acceso no válido';
        this.loading = false;
        return;
      }
      
      try {
        const response = await axios.get(`/api/guest/${this.token}/`);
        this.inspection = response.data;
      } catch (error) {
        console.error('Error al cargar la inspección:', error);
        this.error = 'No se pudo cargar la inspección. El enlace puede haber expirado o ser inválido.';
      } finally {
        this.loading = false;
      }
    },
    mounted() {
      this.$nextTick(() => {
        if (this.$refs.signatureCanvas) {
          this.initSignaturePad();
        }
      });
    },
    methods: {
      initSignaturePad() {
        const canvas = this.$refs.signatureCanvas;
        canvas.width = canvas.offsetWidth;
        canvas.height = 200;
        
        this.signaturePad = new SignaturePad(canvas, {
          backgroundColor: 'rgb(255, 255, 255)'
        });
      },
      clearSignature() {
        if (this.signaturePad) {
          this.signaturePad.clear();
        }
      },
      formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
      },
      async submitSignature() {
        if (!this.canSubmit) return;
        
        const signature = this.signaturePad.toDataURL();
        
        try {
          await axios.post(`/api/guest/${this.token}/`, {
            guest_signature: signature
          });
          
          // Redirigir a página de agradecimiento
          this.$router.push('/thankyou');
        } catch (error) {
          console.error('Error al enviar la firma:', error);
          alert('Ha ocurrido un error al enviar su firma. Por favor intente nuevamente.');
        }
      },
      downloadPdf() {
        // Abrir el PDF en una nueva ventana
        window.open(`/api/pdf/${this.token}/`, '_blank');
      }
    }
  };
  </script>
  
  <style scoped>
  .signature-container {
    border: 1px solid #ccc;
    margin-top: 10px;
  }
  
  .signature-canvas {
    width: 100%;
    height: 200px;
    border-bottom: 1px solid #eee;
  }
  
  .signature-controls {
    padding: 10px;
    text-align: right;
    background-color: #f8f9fa;
  }
  
  .damage-section {
    background-color: #f8f9fa;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 15px;
    min-height: 120px;
  }
  
  .damage-text {
    white-space: pre-line;
    color: #555;
  }
  </style>