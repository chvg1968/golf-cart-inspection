<template>
    <div class="thank-you text-center">
      <div class="success-icon mb-4">
        <i class="fas fa-check-circle"></i>
      </div>
      
      <h1 class="mb-3">¡Gracias por su confirmación!</h1>
      
      <p class="lead mb-4">La inspección ha sido firmada correctamente.</p>
      
      <div class="card mb-4">
        <div class="card-body">
          <p>Se ha enviado una copia del documento firmado a su correo electrónico.</p>
          <p>Puede descargar el documento PDF haciendo clic en el botón de abajo.</p>
          
          <div class="mt-3">
            <a :href="`/api/pdf/${token}/`" class="btn btn-primary" target="_blank">
              <i class="far fa-file-pdf"></i> Descargar PDF
            </a>
          </div>
        </div>
      </div>
      
      <div class="mt-5">
        <p>Si tiene alguna pregunta, por favor contacte a nuestro equipo de soporte.</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ThankYou',
    data() {
      return {
        token: null
      };
    },
    created() {
      // Recuperar el token de localStorage o sessionStorage
      this.token = localStorage.getItem('inspectionToken') || sessionStorage.getItem('inspectionToken');
    }
  };
  </script>
  
  <style scoped>
  .thank-you {
    max-width: 600px;
    margin: 0 auto;
    padding: 30px 0;
  }
  
  .success-icon {
    font-size: 80px;
    color: #28a745;
  }
  
  .success-icon i {
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  </style>