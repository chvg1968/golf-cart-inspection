'use client';

import React, { useState, useRef } from 'react';
import { 
  GolfCartFormData, 
  FormValidationErrors, 
  validateGolfCartForm, 
  hasFormErrors,
  DamageRecord,
  INSPECTION_SECTIONS,
  DAMAGE_TYPES
} from '.';
import { PlusIcon, TrashIcon } from 'lucide-react';
import { generatePDF } from './golf-cart-utils';
import { toast } from 'sonner';

interface GolfCartInspectionFormProps {
  properties: string[];
}

export const GolfCartInspectionForm: React.FC<GolfCartInspectionFormProps> = ({ properties }) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<GolfCartFormData>({
    // Sección 1: Guest Basic Information
    property: '',
    cartNumber: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    guestName: '',
    guestEmail: '',
    guestPhone: '',

    // Sección 2: Damages List
    damageRecords: [],

    // Sección 3: Guest Exclusive Fields
    previewObservationsByGuest: '',
    acceptInspectionTerms: false,
    guestSignature: null,

    // Campos adicionales
    golfcartinspectionsend: false
  });

  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));

    // Clear specific field error when user starts typing
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

    // Validate form
    const validationErrors = validateGolfCartForm(formData);
    
    if (hasFormErrors(validationErrors)) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Generación de PDF
      let pdfBase64 = '';
      try {
        pdfBase64 = generatePDF(formData);
        console.log('PDF Generado:', {
          length: pdfBase64.length,
          prefix: pdfBase64.substring(0, 50) + '...'
        });
      } catch (error) {
        console.error('Error generando PDF:', error);
        // Manejar el error de generación de PDF
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

      {/* Cart Number Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Property Select */}
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

        {/* Cart Number Input */}
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
          />
          {errors.cartNumber && <p className="text-red-500 text-sm mt-1">{errors.cartNumber}</p>}
        </div>
      </div>

      {/* Inspection Date Section */}
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
        />
        {errors.inspectionDate && <p className="text-red-500 text-sm mt-1">{errors.inspectionDate}</p>}
      </div>

      {/* Guest Information Section */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Guest Name */}
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
          />
          {errors.guestName && (
            <p className="text-red-500 text-sm mt-1">{errors.guestName}</p>
          )}
        </div>

        {/* Guest Email */}
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
          />
          {errors.guestEmail && (
            <p className="text-red-500 text-sm mt-1">{errors.guestEmail}</p>
          )}
        </div>

        {/* Guest Phone */}
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
          />
        </div>
      </div>

      {/* Damage Records Section */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Damage Records</h3>
        {(formData.damageRecords || []).map((record, index) => (
          <div key={index} className="grid grid-cols-4 gap-2 items-center mb-2">
            {/* Section Select */}
            <select
              name={`damageRecords.${index}.section`}
              value={record.section}
              onChange={(e) => updateDamageRecord(index, 'section', e.target.value)}
              className="col-span-1 px-2 py-1 border rounded"
            >
              {INSPECTION_SECTIONS.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>

            {/* Damage Type Select */}
            <select
              name={`damageRecords.${index}.damageType`}
              value={record.damageType}
              onChange={(e) => updateDamageRecord(index, 'damageType', e.target.value)}
              className="col-span-1 px-2 py-1 border rounded"
            >
              {DAMAGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Quantity Input */}
            <input
              type="number"
              name={`damageRecords.${index}.quantity`}
              value={record.quantity}
              onChange={(e) => updateDamageRecord(index, 'quantity', parseInt(e.target.value, 10))}
              className="col-span-1 px-2 py-1 border rounded"
              min="0"
            />

            {/* Remove Damage Record Button */}
            <button
              type="button"
              onClick={() => removeDamageRecord(index)}
              className="col-span-1 text-red-500 hover:text-red-700"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}

        {/* Add Damage Record Button */}
        <button
          type="button"
          onClick={addDamageRecord}
          className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          <PlusIcon className="w-5 h-5 mr-2" /> Add Damage Record
        </button>
      </div>

      {/* Guest Section */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Guest Section</h3>

        {/* Preview Observations */}
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
          />
        </div>

        {/* Inspection Terms Checkbox */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="acceptInspectionTerms"
              checked={formData.acceptInspectionTerms}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-gray-700">
              I accept the terms of the golf cart inspection
            </span>
          </label>
        </div>

        {/* Guest Signature Section */}
        <div>
          <label htmlFor="guestSignature" className="block text-gray-700 font-bold mb-2">
            Guest Signature
          </label>
          <div className="border border-gray-300 rounded-lg p-2">
            <canvas 
              id="signatureCanvas" 
              width="100%" 
              height="200" 
              className="w-full h-[200px] bg-white border border-gray-300 rounded"
            >
              Your browser does not support canvas. Please use a modern browser.
            </canvas>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-3 rounded-lg text-white font-bold ${
          isSubmitting 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Inspection'}
      </button>

      {/* Error Message */}
      {submitError && (
        <div className="mt-4 text-center text-red-500">
          {submitError}
        </div>
      )}
    </form>
  );
};
