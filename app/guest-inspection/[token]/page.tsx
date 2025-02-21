'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GolfCartInspectionForm } from '@/components/form/golf-cart-form';

export default function GuestInspectionPage() {
  const params = useParams();
  const token = params.token as string;

  const [tokenValidation, setTokenValidation] = useState<{
    valid: boolean;
    inspectionId?: string;
    inspectionData?: any;
    message?: string;
  }>({ valid: false });

  useEffect(() => {
    async function validateToken() {
      try {
        const response = await fetch('/api/validate-guest-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        });

        const data = await response.json();
        setTokenValidation(data);
      } catch (error) {
        console.error('Error validating token:', error);
        setTokenValidation({ 
          valid: false, 
          message: 'Error al validar el token' 
        });
      }
    }

    if (token) {
      validateToken();
    }
  }, [token]);

  if (!tokenValidation.valid) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
        <p>{tokenValidation.message || 'El token no es válido'}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Completar Inspección de Carrito de Golf</h1>
      <GolfCartInspectionForm 
        initialData={tokenValidation.inspectionData} 
        isGuestMode={true} 
        inspectionId={tokenValidation.inspectionId || ''}
        properties={[]} 
      />
    </div>
  );
}
