#!/bin/bash
set -e

# Cambiar al directorio frontend
cd frontend

# Instalar Vite como dependencia local si no está instalado
npm install vite --save-dev

# Instalar Vite globalmente
npm install --legacy-peer-deps 

# Instalar dependencias del proyecto
npm install

# Compilar el proyecto usando Vite desde node_modules
npx vite build

# Salir con éxito
exit 0
