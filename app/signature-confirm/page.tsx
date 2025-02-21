'use client';

import { useState } from 'react';
import { updateAirtableRecord } from '@/app/api/submit-form/airtable-service';

export default function SignatureConfirmPage() {
  const [inspectionId, setInspectionId] = useState('');
  const [status, setStatus] = useState('');

  const handleConfirm = async () => {
    try {
      await updateAirtableRecord(inspectionId, {
        'Golf Cart Signature Checked': true,
        'Signature Timestamp': new Date().toISOString()
      });
      setStatus('✅ Signature confirmed successfully!');
    } catch (error) {
      console.error('Confirmation error:', error);
      setStatus('❌ Error confirming signature');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4">Confirm Signature</h1>
        <input 
          type="text" 
          value={inspectionId}
          onChange={(e) => setInspectionId(e.target.value)}
          placeholder="Enter Inspection ID"
          className="w-full p-2 border rounded mb-4"
        />
        <button 
          onClick={handleConfirm}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Confirm Signature
        </button>
        {status && (
          <p className="mt-4 text-center font-semibold">{status}</p>
        )}
      </div>
    </div>
  );
}
