"use client"

import { GolfCartInspectionForm } from '../components/form/golf-cart-form';

export default function SyntheticV0PageForDeployment() {
  // Lista de propiedades - idealmente vendría de una base de datos o configuración
  const properties = [
    '3325 Villa Clara', 
    '7256 Villa Palacio', 
    '8901 Villa Esperanza'
  ];

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <GolfCartInspectionForm properties={properties} />
      </div>
    </main>
  );
}