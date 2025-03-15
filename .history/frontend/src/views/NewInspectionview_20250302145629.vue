<template>
    <div class="new-inspection">
      <h1 class="mb-4">Nueva Inspección de Golf Cart</h1>
      
      <div class="card">
        <div class="card-body">
          <form @submit.prevent="saveInspection">
            <!-- Información básica -->
            <div class="row mb-4">
              <div class="col-md-12">
                <h4 class="border-bottom pb-2">Información Básica</h4>
              </div>
              
              <div class="col-md-6">
                <div class="form-group">
                  <label for="cartId">ID del Golf Cart</label>
                  <input type="text" id="cartId" class="form-control" v-model="inspection.cart_id" required>
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="form-group">
                  <label for="inspectionDate">Fecha de Inspección</label>
                  <input type="date" id="inspectionDate" class="form-control" v-model="inspection.inspection_date" required>
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="form-group">
                  <label for="guestName">Nombre del Huésped</label>
                  <input type="text" id="guestName" class="form-control" v-model="inspection.guest_name" required>
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="form-group">
                  <label for="guestEmail">Correo del Huésped</label>
                  <input type="email" id="guestEmail" class="form-control" v-model="inspection.guest_email" required>
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="form-group">
                  <label for="inspectorName">Nombre del Inspector</label>
                  <input type="text" id="inspectorName" class="form-control" v-model="inspection.inspector_name" required>
                </div>
              </div>
            </div>
            
            <!-- Diagrama del Golf Cart -->
            <div class="row mb-4">
              <div class="col-md-12">
                <h4 class="border-bottom pb-2">Diagrama de Inspección</h4>
                <div class="golf-cart-diagram">
                  <div class="vehicle-container">
                    <img src="@/assets/golf-cart-diagram.png" alt="Diagrama de Golf Cart" class="img-fluid">
                    
                    <!-- Puntos interactivos en el diagrama -->
                    <div class="damage-point-container">
                      <div v-for="(point, index) in damagePoints" :key="index"
                           class="damage-point" 
                           :style="{ left: point.x + '%', top: point.y + '%' }"
                           @click="showDamageModal(point)">
                        <span class="damage-marker">!</span>
                      </div>
                      
                      <div v-if="showAddPoint" class="add-point-tooltip">
                        Haz clic en el diagrama para añadir un punto de daño
                      </div>
                      
                      <button type="button" class="btn btn-sm btn-primary add-damage-btn" @click="toggleAddPoint">
                        {{ showAddPoint ? 'Cancelar' : 'Añadir Punto de Daño' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Daños y Notas -->
            <div class="row mb-4">
              <div class="col-md-12">
                <h4 class="border-bottom pb-2">Registro de Daños</h4>
              </div>
              
              <div class="col-md-6">
                <div class="form-group">
                  <label for="frontDamage">Daños Frontales</label>
                  <textarea id="frontDamage" class="form-control" v-model="inspection.front_damage" rows="3"></textarea>
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="form-group">
                  <label for="backDamage">Daños Traseros</label>
                  <textarea id="backDamage" class="form-control" v-model="inspection.back_damage" rows="3"></textarea>
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="form-group">
                  <label for="leftDamage">Daños Lado Izquierdo</label>
                  <textarea id="leftDamage" class="form-control" v-model="inspection.left_damage" rows="3"></textarea>
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="form-group">
                  <label for="rightDamage">Daños Lado Derecho</label>
                  <textarea id="rightDamage" class="form-control" v-model="inspection.right_damage" rows="3"></textarea>
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="form-group">
                  <label for="interiorDamage">Daños Interiores</label>
                  <textarea id="interiorDamage" class="form-control" v-model="inspection.interior_damage" rows="3"></textarea>
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="form-group">
                  <label for="additionalNotes">Notas Adicionales</label>
                  <textarea id="additionalNotes" class="form-control" v-model="inspection.additional_notes" rows="3"></textarea>
                </div>
              </div>
            </div>
            
            <!-- Firma del Inspector -->
            <div class="row mb-4">
              <div class="col-md-12">
                <h4 class="border-bottom pb-2">Firma del Inspector</h4>
                <div class="signature-container">
                  <canvas ref="signatureCanvas" class="signature-canvas"></canvas>
                  <div class="signature-controls">
                    <button type="button" class="btn btn-sm btn-secondary" @click="clearSignature">Borrar Firma</button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Botones de formulario -->
            <div class="row">
              <div class="col-md-12 text-right">
                <button type="button" class="btn btn-secondary mr-2" @click="$router.push('/')">Cancelar</button>
                <button type="submit" class="btn btn-primary">Guardar y Enviar</button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Modal para añadir datos de daño -->
      <div class="modal fade" id="damageModal" tabindex="-1" role="dialog" aria-hidden="true" v-if="selectedDamage">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Detalle de Daño</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="damageDescription">Descripción del Daño</label>
                <textarea id="damageDescription" class="form-control" v-model="selectedDamage.description" rows="3"></textarea>
              </div>
              <div class="form-group">
                <label for="damageImage">Imagen del Daño</label>
                <input type="file" id="damageImage" class="form-control-file" accept="image/*" @change="handleImageUpload">
                <img v-if="selectedDamage.image" :src="selectedDamage.image" alt="Imagen de daño" class="img-fluid mt-2">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-danger mr-auto" @click="deleteDamagePoint">Eliminar</button>
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
              <button type="button" class="btn btn-primary" @click="saveDamagePoint">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import SignaturePad from 'signature_pad';
  import axios from 'axios';
  
  export default {
    name: 'NewInspection',
    data() {
      return {
        inspection: {
          cart_id: '',
          guest_name: '',
          guest_email: '',
          inspector_name: '',
          inspection_date: new Date().toISOString().slice(0, 10),
          front_damage: '',
          back_damage: '',
          left_damage: '',
          right_damage: '',
          interior_damage: '',
          additional_notes: '',
          inspector_signature: null
        },
        signaturePad: null,
        damagePoints: [],
        selectedDamage: null,
        showAddPoint: false,
        currentDamageIndex: -1
      };
    },
    mounted() {
      this.initSignaturePad();
      // Inicializar tooltips y modals de Bootstrap
      // Nota: Esto asume que estás usando Bootstrap 4 con jQuery
      if (window.jQuery) {
        window.jQuery('[data-toggle="tooltip"]').tooltip();
      }
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
        this.signaturePad.clear();
      },
      toggleAddPoint() {
        this.showAddPoint = !this.showAddPoint;
      },
      addDamagePoint(event) {
        if (!this.showAddPoint) return;
        
        const container = event.currentTarget;
        const rect = container.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        
        this.damagePoints.push({
          x,
          y,
          description: '',
          image: null
        });
        
        this.showAddPoint = false;
      },
      showDamageModal(point) {
        this.selectedDamage = {...point};
        this.currentDamageIndex = this.damagePoints.indexOf(point);
        window.jQuery('#damageModal').modal('show');
      },
      saveDamagePoint() {
        if (this.currentDamageIndex >= 0) {
          this.damagePoints[this.currentDamageIndex] = {...this.selectedDamage};
        }
        window.jQuery('#damageModal').modal('hide');
      },
      deleteDamagePoint() {
        if (this.currentDamageIndex >= 0) {
          this.damagePoints.splice(this.currentDamageIndex, 1);
        }
        window.jQuery('#damageModal').modal('hide');
      },
      handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
          this.selectedDamage.image = e.target.result;
        };
        reader.readAsDataURL(file);
      },
      async saveInspection() {
        // Capturar la firma como data URL
        if (!this.signaturePad.isEmpty()) {
          this.inspection.inspector_signature = this.signaturePad.toDataURL();
        }
        
        // Agregar información de puntos de daño al objeto de inspección
        // Por ejemplo, añadiéndola a las notas adicionales o creando un campo especial
        const damageNotes = this.damagePoints.map((point, index) => {
          return `Daño #${index + 1}: ${point.description} [Ubicación: ${Math.round(point.x)}%, ${Math.round(point.y)}%]`;
        }).join('\n\n');
        
        if (damageNotes) {
          this.inspection.additional_notes = (this.inspection.additional_notes || '') + 
            '\n\n--- PUNTOS DE DAÑO MARCADOS EN DIAGRAMA ---\n\n' + damageNotes;
        }
        
        try {
          // Enviar al servidor
          const response = await axios.post('/api/inspections/create/', this.inspection);
          
          // Una vez creado, enviarlo por correo
          if (response.data && response.data.id) {
            await axios.post(`/api/inspections/${response.data.id}/send/`);
            this.$router.push('/');
          }
        } catch (error) {
          console.error('Error al guardar la inspección:', error);
          alert('Ha ocurrido un error al guardar la inspección. Por favor intente nuevamente.');
        }
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
  
  .golf-cart-diagram {
    position: relative;
    margin: 20px 0;
  }
  
  .vehicle-container {
    position: relative;
    border: 1px solid #ddd;
    padding: 10px;
    background-color: #f8f9fa;
  }
  
  .damage-point-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  .damage-point {
    position: absolute;
    width: 20px;
    height: 20px;
    margin-left: -10px;
    margin-top: -10px;
    background-color: rgba(255, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  
  .damage-marker {
    color: white;
    font-weight: bold;
  }
  
  .add-damage-btn {
    position: absolute;
    bottom: 10px;
    right: 10px;
    z-index: 10;
  }
  
  .add-point-tooltip {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 3px;
    font-size: 14px;
  }
  </style>