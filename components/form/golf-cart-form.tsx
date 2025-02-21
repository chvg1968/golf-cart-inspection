'use client';

import React, { useState, useRef, useEffect } from 'react';
import SignaturePad from 'signature_pad';
import { 
  GolfCartFormData, 
  FormValidationErrors, 
  validateGolfCartForm, 
  hasFormErrors,
  DamageRecord,
  INSPECTION_SECTIONS,
  DAMAGE_TYPES
} from '.';
import { PlusIcon, TrashIcon, XIcon } from 'lucide-react';
import { generatePDF } from './golf-cart-utils';
import { toast } from 'sonner';

interface GolfCartInspectionFormProps {
  properties: string[];
  initialData?: Partial<GolfCartFormData>;
  isGuestMode?: boolean;
  inspectionId?: string;
}

export const GolfCartInspectionForm: React.FC<GolfCartInspectionFormProps> = ({ 
  properties, 
  initialData = {}, 
  isGuestMode = false,
  inspectionId 
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const signaturePadRef = useRef<HTMLCanvasElement>(null);
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);

  const [formData, setFormData] = useState<GolfCartFormData>({
    property: initialData.property || '',
    cartNumber: initialData.cartNumber || '',
    inspectionDate: initialData.inspectionDate || new Date().toISOString().split('T')[0],
    guestName: initialData.guestName || '',
    guestEmail: initialData.guestEmail || '',
    guestPhone: initialData.guestPhone || '',
    damageRecords: initialData.damageRecords || [],
    previewObservationsByGuest: initialData.previewObservationsByGuest || '',
    acceptInspectionTerms: initialData.acceptInspectionTerms || false,
    guestSignature: initialData.guestSignature || null,
    golfCartInspectionSend: false
  });

  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (signaturePadRef.current) {
      const pad = new SignaturePad(signaturePadRef.current, {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 3,
        throttle: 16
      });

      setSignaturePad(pad);

      const resizeCanvas = () => {
        if (signaturePadRef.current) {
          const canvas = signaturePadRef.current;
          const ratio = Math.max(window.devicePixelRatio || 1, 1);
          canvas.width = canvas.offsetWidth * ratio;
          canvas.height = canvas.offsetHeight * ratio;
          canvas.getContext('2d')?.scale(ratio, ratio);
          pad.clear(); 
        }
      };

      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        pad.off();
      };
    }
  }, []);

  const clearSignature = () => {
    signaturePad?.clear();
    setFormData(prev => ({ ...prev, guestSignature: null }));
  };

  const saveSignature = () => {
    if (signaturePad && !signaturePad.isEmpty()) {
      const signatureDataUrl = signaturePad.toDataURL('image/png');
      setFormData(prev => ({ ...prev, guestSignature: signatureDataUrl }));
      toast.success('Firma guardada', {
        description: 'La firma se ha guardado correctamente',
        duration: 2000
      });
    } else {
      toast.error('Firma inválida', {
        description: 'Por favor, firme en el área designada',
        duration: 2000
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));

    if (errors[name as keyof FormValidationErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormValidationErrors];
        return newErrors;
      });
    }
  };

  const addDamageRecord = () => {
    setFormData(prev => ({
      ...prev,
      damageRecords: [
        ...(prev.damageRecords || []),
        { section: 'Front Left Side', damageType: 'Scratches', quantity: 0 }
      ]
    }));
  };

  const removeDamageRecord = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      damageRecords: (prev.damageRecords || []).filter((_, index) => index !== indexToRemove)
    }));
  };

  const updateDamageRecord = (
    index: number, 
    field: keyof DamageRecord, 
    value: string | number
  ) => {
    setFormData(prev => {
      const newDamageRecords = [...(prev.damageRecords || [])];
      newDamageRecords[index] = {
        ...newDamageRecords[index],
        [field]: value
      };
      return { ...prev, damageRecords: newDamageRecords };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    if (!formData.guestSignature) {
      toast.error('Please provide a signature', {
        duration: 3000,
        position: 'top-center'
      });
      setIsSubmitting(false);
      return;
    }

    const validationErrors = validateGolfCartForm(formData);
    
    if (hasFormErrors(validationErrors)) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    if (isGuestMode && inspectionId) {
      try {
        const response = await fetch('/api/guest-submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            inspectionId,
            golfCartSignatureChecked: true
          })
        });

        if (response.ok) {
          toast.success('Inspection Submitted Successfully', {
            description: 'Your golf cart inspection form has been processed.',
            duration: 5000,
            position: 'top-center'
          });
          setSubmitSuccess(true);
        } else {
          toast.error('Submission failed', {
            description: response.statusText || 'Please try again.',
            duration: 5000,
            position: 'top-center'
          });
          setSubmitError(response.statusText || 'Submission failed');
        }
      } catch (error) {
        console.error('Submission error:', error);
        toast.error('An unexpected error occurred', {
          description: 'Please try again later.',
          duration: 5000,
          position: 'top-center'
        });
        setSubmitError('An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      try {
        let pdfBase64 = '';
        try {
          pdfBase64 = generatePDF(formData);
          console.log('PDF Generado:', {
            length: pdfBase64.length,
            prefix: pdfBase64.substring(0, 50) + '...'
          });
        } catch (error) {
          console.error('Error generando PDF:', error);
          return;
        }

        const formDataToSubmit = {
          ...formData,
          pdfBase64,
          inspectionDate: new Date().toISOString().split('T')[0],
          cartNumber: Number(formData.cartNumber)
        };

        const response = await fetch('/api/submit-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formDataToSubmit)
        });

        const result = await response.json();

        if (result.success) {
          toast.success('Inspection Submitted Successfully', {
            description: 'Your golf cart inspection form has been processed.',
            duration: 5000,
            position: 'top-center'
          });
          setSubmitSuccess(true);
        } else {
          toast.error('Submission failed', {
            description: result.error || 'Please try again.',
            duration: 5000,
            position: 'top-center'
          });
          setSubmitError(result.error || 'Submission failed');
        }
      } catch (error) {
        console.error('Submission error:', error);
        toast.error('An unexpected error occurred', {
          description: 'Please try again later.',
          duration: 5000,
          position: 'top-center'
        });
        setSubmitError('An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      {submitSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
            <h3 className="text-2xl font-bold text-green-600 mb-4">Submission Successful!</h3>
            <p className="mb-4">Your golf cart inspection form has been submitted successfully.</p>
            <div className="mb-4">
              <strong>Details:</strong>
              <ul className="text-left list-disc list-inside">
                <li>Property: {formData.property}</li>
                <li>Cart Number: {formData.cartNumber}</li>
                <li>Guest Name: {formData.guestName}</li>
                <li>Guest Email: {formData.guestEmail}</li>
              </ul>
            </div>
            <p className="mb-4">An email with the inspection report has been sent to {formData.guestEmail}.</p>
            <button 
              type="button"
              onClick={() => setSubmitSuccess(false)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-center">Golf Cart Inspection Form</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="property" className="block text-gray-700 font-bold mb-2">
            Property <span className="text-red-500">*</span>
          </label>
          <select
            id="property"
            name="property"
            value={formData.property}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
            disabled={isGuestMode}
          >
            <option value="">Select Property</option>
            {properties.map((prop) => (
              <option key={prop} value={prop}>
                {prop}
              </option>
            ))}
          </select>
          {errors.property && <p className="text-red-500 text-sm mt-1">{errors.property}</p>}
        </div>

        <div>
          <label htmlFor="cartNumber" className="block text-gray-700 font-bold mb-2">
            Golf Cart Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="cartNumber"
            name="cartNumber"
            value={formData.cartNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
            disabled={isGuestMode}
          />
          {errors.cartNumber && <p className="text-red-500 text-sm mt-1">{errors.cartNumber}</p>}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="inspectionDate" className="block text-gray-700 font-bold mb-2">
          Inspection Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="inspectionDate"
          name="inspectionDate"
          value={formData.inspectionDate}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          required
          disabled={isGuestMode}
        />
        {errors.inspectionDate && <p className="text-red-500 text-sm mt-1">{errors.inspectionDate}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="guestName" className="block text-gray-700 font-bold mb-2">
            Guest Name
          </label>
          <input
            type="text"
            id="guestName"
            name="guestName"
            value={formData.guestName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.guestName ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isGuestMode}
          />
          {errors.guestName && (
            <p className="text-red-500 text-sm mt-1">{errors.guestName}</p>
          )}
        </div>

        <div>
          <label htmlFor="guestEmail" className="block text-gray-700 font-bold mb-2">
            Guest Email
          </label>
          <input
            type="email"
            id="guestEmail"
            name="guestEmail"
            value={formData.guestEmail}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.guestEmail ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isGuestMode}
          />
          {errors.guestEmail && (
            <p className="text-red-500 text-sm mt-1">{errors.guestEmail}</p>
          )}
        </div>

        <div>
          <label htmlFor="guestPhone" className="block text-gray-700 font-bold mb-2">
            Guest Phone (Optional)
          </label>
          <input
            type="tel"
            id="guestPhone"
            name="guestPhone"
            value={formData.guestPhone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            disabled={isGuestMode}
          />
        </div>
      </div>

      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Damage Records</h3>
        {(formData.damageRecords || []).map((record, index) => (
          <div key={index} className="grid grid-cols-4 gap-2 items-center mb-2">
            <select
              name={`damageRecords.${index}.section`}
              value={record.section}
              onChange={(e) => updateDamageRecord(index, 'section', e.target.value)}
              className="col-span-1 px-2 py-1 border rounded"
              disabled={isGuestMode}
            >
              {INSPECTION_SECTIONS.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>

            <select
              name={`damageRecords.${index}.damageType`}
              value={record.damageType}
              onChange={(e) => updateDamageRecord(index, 'damageType', e.target.value)}
              className="col-span-1 px-2 py-1 border rounded"
              disabled={isGuestMode}
            >
              {DAMAGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <input
              type="number"
              name={`damageRecords.${index}.quantity`}
              value={record.quantity}
              onChange={(e) => updateDamageRecord(index, 'quantity', parseInt(e.target.value, 10))}
              className="col-span-1 px-2 py-1 border rounded"
              min="0"
              disabled={isGuestMode}
            />

            <button
              type="button"
              onClick={() => removeDamageRecord(index)}
              className="col-span-1 text-red-500 hover:text-red-700"
              disabled={isGuestMode}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addDamageRecord}
          className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          disabled={isGuestMode}
        >
          <PlusIcon className="w-5 h-5 mr-2" /> Add Damage Record
        </button>
      </div>

      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Guest Section</h3>

        <div className="mb-4">
          <label htmlFor="previewObservationsByGuest" className="block text-gray-700 font-bold mb-2">
            Guest Observations (Optional)
          </label>
          <textarea
            id="previewObservationsByGuest"
            name="previewObservationsByGuest"
            value={formData.previewObservationsByGuest || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={3}
            placeholder="Enter any additional observations"
            disabled={!isGuestMode}
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="acceptInspectionTerms"
              checked={formData.acceptInspectionTerms}
              onChange={handleChange}
              className="mr-2"
              disabled={!isGuestMode}
            />
            <span className="text-gray-700">
              I accept the terms of the golf cart inspection
            </span>
          </label>
        </div>

        <div className="mt-4">
          <label className="block text-gray-700 font-bold mb-2">
            Guest Signature <span className="text-red-500">*</span>
          </label>
          <div className="border border-gray-300 rounded-lg p-2">
            <canvas 
              ref={signaturePadRef} 
              className="w-full h-40 bg-white"
              style={{ touchAction: 'none' }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <button 
              type="button" 
              onClick={clearSignature}
              className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              disabled={!isGuestMode}
            >
              <XIcon size={16} /> Limpiar
            </button>
            <button 
              type="button" 
              onClick={saveSignature}
              className="bg-green-500 text-white px-4 py-2 rounded-lg"
              disabled={!isGuestMode}
            >
              Guardar Firma
            </button>
          </div>
          
          {formData.guestSignature && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Vista previa de la firma:</p>
              <img 
                src={formData.guestSignature} 
                alt="Firma del invitado" 
                className="max-h-24 border rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !isGuestMode}
        className={`w-full py-3 rounded-lg text-white font-bold ${
          isSubmitting 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Inspection'}
      </button>

      {submitError && (
        <div className="mt-4 text-center text-red-500">
          {submitError}
        </div>
      )}
    </form>
  );
};
