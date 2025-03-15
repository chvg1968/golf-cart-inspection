<template>
    <div id="app">
      <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
          <a class="navbar-brand" href="/">Sistema de Inspección de Golf Carts</a>
        </div>
      </nav>
      
      <div class="container my-4">
        <router-view />
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'App'
  }
  </script>
  
  <style>
  /* Estilos generales de la aplicación */
  </style>