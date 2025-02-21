'use client';

import { useState } from 'react';
import { updateAirtableRecord } from '@/app/api/submit-form/airtable-service';

export default function SignatureConfirmPage() {
  const [inspectionId, setInspectionId] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!inspectionId) {
      setStatus('❌ Please enter an Inspection ID');
      return;
    }

    setIsLoading(true);
    setStatus('');

    try {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Confirm Golf Cart Signature</h1>
        
        <div className="mb-4">
          <label htmlFor="inspectionId" className="block mb-2 font-semibold">
            Inspection ID
          </label>
          <input 
            id="inspectionId"
            type="text" 
            value={inspectionId}
            onChange={(e) => setInspectionId(e.target.value)}
            placeholder="Enter the Inspection ID from your email"
            className="w-full p-2 border rounded focus:outline-blue-500"
          />
        </div>
        
        <button 
          onClick={handleConfirm}
          disabled={isLoading}
          className={`w-full p-2 rounded text-white ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isLoading ? 'Confirming...' : 'Confirm Signature'}
        </button>
        
        {status && (
          <p className="mt-4 text-center font-semibold text-sm">{status}</p>
        )}
        
        <div className="mt-6 text-sm text-gray-600 text-center">
          <p>🔍 Find your Inspection ID in the email subject or body</p>
          <p>📝 Ensure you've sent the signed PDF to conradovilla@hotmail.com</p>
        </div>
      </div>
    </div>
  );
}
