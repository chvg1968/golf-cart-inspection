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
}
</style>
