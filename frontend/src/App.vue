<template>
  <q-layout>
    <q-page-container>
      <q-page>
        <NewInspection />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import NewInspection from './views/NewInspection.vue'
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

#app {
  width: 100%;
  max-width: 1200px;
  padding: 20px;
  box-sizing: border-box;
}
</style>
