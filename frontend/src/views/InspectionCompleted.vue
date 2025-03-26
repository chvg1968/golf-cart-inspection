<template>
  <div class="inspection-completed-container">
    <div class="success-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="green" width="100px" height="100px">
        <path d="M0 0h24v24H0z" fill="none"/>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    </div>
    <h1>¡Inspección Completada!</h1>
    <p>Gracias por completar la inspección del carrito de golf. Su formulario ha sido recibido exitosamente.</p>
    <div class="actions">
      <router-link to="/" class="btn">Realizar Nueva Inspección</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// Componente simple sin lógica adicional
</script>

<style scoped>
.inspection-completed-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  background-color: #f4f4f4;
  padding: 20px;
}

.success-icon {
  margin-bottom: 20px;
}

h1 {
  color: #4CAF50;
  margin-bottom: 15px;
}

p {
  color: #666;
  max-width: 500px;
  margin-bottom: 30px;
}

.actions {
  display: flex;
  gap: 15px;
}

.btn {
  background-color: #4CAF50;
  color: white;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.btn:hover {
  background-color: #45a049;
}
</style>
