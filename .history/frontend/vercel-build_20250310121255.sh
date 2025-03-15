#!/bin/bash
set -e

# Cambiar al directorio frontend
cd frontend

# Instalar Vite globalmente
npm install -g vite

# Instalar dependencias del proyecto
npm install

# Compilar el proyecto
npm run build

# Salir con éxito
exit 0
