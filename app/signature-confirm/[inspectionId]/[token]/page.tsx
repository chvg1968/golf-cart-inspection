'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { updateAirtableRecord } from '@/app/api/submit-form/airtable-service';

export default function SignatureConfirmPage() {
  const params = useParams();
  const [status, setStatus] = useState('Confirming signature...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const confirmSignature = async () => {
      const { inspectionId, token } = params;

      if (!inspectionId || !token) {
        setStatus('❌ Invalid confirmation link');
        setIsLoading(false);
        return;
      }

      try {
        // Validar token (implementación básica)
        const expectedToken = generateUniqueToken(inspectionId);
        if (token !== expectedToken) {
          throw new Error('Invalid token');
        }

        await updateAirtableRecord(inspectionId, {
          'Golf Cart Signature Checked': true,
          'Signature Timestamp': new Date().toISOString()
        });

        setStatus('✅ Signature confirmed successfully in Airtable!');
      } catch (error) {
        console.error('Confirmation error:', error);
        setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    confirmSignature();
  }, [params]);

  // Función auxiliar para generar token (debe coincidir con la implementación en golf-cart-utils.ts)
  const generateUniqueToken = (inspectionId: string): string => {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(`${inspectionId}-signature-confirm`)
      .digest('hex')
      .slice(0, 16);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Golf Cart Signature Confirmation</h1>
        
        <div className={`
          p-4 rounded-md mt-4 
          ${isLoading ? 'bg-blue-100 text-blue-800' : 
            status.includes('✅') ? 'bg-green-100 text-green-800' : 
            'bg-red-100 text-red-800'}
        `}>
          {status}
        </div>

        {!isLoading && status.includes('✅') && (
          <div className="mt-6">
            <p className="text-green-700">Thank you for confirming your signature!</p>
            <p className="text-sm text-gray-600 mt-2">
              The inspection record has been updated in our system.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
