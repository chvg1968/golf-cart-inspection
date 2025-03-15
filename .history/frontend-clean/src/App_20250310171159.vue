<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>
          Golf Cart Inspection
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer 
      v-model="leftDrawerOpen" 
      show-if-above 
      bordered 
      class="bg-grey-2"
    >
      <q-list>
        <q-item-label header>Navigation</q-item-label>
        
        <q-item 
          clickable 
          v-ripple 
          to="/"
          exact
        >
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>Home</q-item-section>
        </q-item>
        
        <q-item 
          clickable 
          v-ripple 
          to="/new-inspection"
          exact
        >
          <q-item-section avatar>
            <q-icon name="add" />
          </q-item-section>
          <q-item-section>New Inspection</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>

<style lang="scss">
:root {
  // Pastel color palette
  --color-background: #FFF5E6;  // Soft cream/white
  --color-primary: #FF6B6B;     // Soft red
  --color-secondary: #FFD93D;   // Soft orange
  --color-text-primary: #333333; // Near black
  --color-text-secondary: #666666; // Dark gray
  --color-accent: #6A5ACD;      // Soft lavender (for contrast)
}

body {
  font-family: 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif;
  background-color: var(--color-background);
  color: var(--color-text-primary);
  margin: 0;
  padding: 0;
  line-height: 1.6;
}

.custom-header {
  background-color: var(--color-primary);
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.custom-drawer {
  background-color: #FFFFFF;
  border-right: 1px solid rgba(0,0,0,0.1);
}

.custom-page-container {
  background-color: var(--color-background);
  padding: 16px;
}

// Global component styling
.q-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.q-btn {
  transition: all 0.3s ease;
  border-radius: 8px;
}

.q-btn.q-btn--outline {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.q-input, .q-select {
  background-color: white;
  border-radius: 8px;
  transition: all 0.3s ease;
}

// Typography
h1, h2, h3, h4, h5, h6 {
  color: var(--color-text-primary);
  font-weight: 600;
  margin-bottom: 0.5em;
}

p {
  color: var(--color-text-secondary);
}

// Responsive adjustments
@media (max-width: 600px) {
  .custom-page-container {
    padding: 8px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
