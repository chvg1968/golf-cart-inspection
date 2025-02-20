import { CalendarIcon, PlusIcon, TrashIcon } from "lucide-react"
import { format } from "date-fns"
import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { toast, Toaster } from 'sonner';
import { jsPDF } from "jspdf"
import html2canvas from 'html2canvas'
import SignatureCanvas from 'react-signature-canvas'
import { useId } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

type DamageRecord = {
  section: 
    | 'Front Left Side'
    | 'Front Right Side'
    | 'Rear Left Side'
    | 'Rear Right Side'
    | 'Roof'
    | 'Seats'
    | 'Steering & Dashboard'
    | 'Wheels & Tires'
    | 'Front Lights'
    | 'Rear Lights';
  
  damageType: 
    | 'Scratches'
    | 'Missing parts'
    | 'Damage/Bumps';
  
  quantity: number;
};

const PROPERTIES = [
  'Atl. G7 Casa Prestige',
  'Est. 24 Casa Paraiso',
  '3325 Villa Clara',
  '7256 Villa Palacio',
  '10180 Villa Flora',
  '5138 Villa Paloma',
  'Temporal',
  '2-102 Villa Ocean Bliss',
  '10389 Villa Tiffany',
  '2-208 Ocean Haven Villa'
];

const INSPECTION_SECTIONS: DamageRecord['section'][] = [
  'Front Left Side',
  'Front Right Side', 
  'Rear Left Side',
  'Rear Right Side',
  'Roof',
  'Seats',
  'Steering & Dashboard', 
  'Wheels & Tires',
  'Front Lights',
  'Rear Lights'
];

const DAMAGE_TYPES: DamageRecord['damageType'][] = [
  'Scratches',
  'Missing parts', 
  'Damage/Bumps'
];

type FormData = {
  property: string;
  cartNumber: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  date: Date;
  previewObservationsByGuest?: string;
  acceptInspectionTerms: boolean;
  guestSignature?: string;
  damageRecords: DamageRecord[];
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const generatePDF = async (formRef: React.RefObject<HTMLDivElement>): Promise<string> => {
  if (!formRef.current) {
    toast.error('Form reference is missing');
    return '';
  }
  
  try {
    const canvas = await html2canvas(formRef.current);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio);
    
    return pdf.output('datauristring');
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF');
    return '';
  }
};

const submitForm = async (formData: FormData & { pdfBase64: string; }) => {
  try {
    // Validación exhaustiva de datos antes del envío
    const sanitizedData = {
      property: formData.property,
      cartNumber: formData.cartNumber.toString(),
      guestName: formData.guestName.trim(),
      guestEmail: formData.guestEmail.trim().toLowerCase(),
      guestPhone: (formData.guestPhone || '').trim(),
      inspectionDate: format(formData.date, 'yyyy-MM-dd'),
      pdfBase64: formData.pdfBase64,
      previewObservationsByGuest: (formData.previewObservationsByGuest || '').trim(),
      acceptInspectionTerms: formData.acceptInspectionTerms,
      guestSignature: formData.guestSignature,
      damageRecords: formData.damageRecords.map(record => ({
        section: record.section,
        damageType: record.damageType,
        quantity: Math.max(0, Math.round(record.quantity)) // Asegurar cantidad no negativa
      }))
    };

  

    // Validación adicional
    const requiredFields = ['property', 'cartNumber', 'guestName', 'guestEmail', 'inspectionDate', 'pdfBase64'];
    const missingFields = requiredFields.filter(field => 
      !sanitizedData[field as keyof typeof sanitizedData]
    );

    if (missingFields.length > 0) {
      console.error('Campos faltantes:', missingFields);
      throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
    }

    const response = await fetch('/api/submit-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitizedData),
    });

    // Registro de respuesta del servidor
    const responseData = await response.json();
    console.log('Respuesta del servidor:', responseData);

    if (!response.ok) {
      console.error('Error en la respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        responseData
      });
      throw new Error(responseData.mensaje || responseData.message || 'Error al enviar el formulario');
    }

    return responseData;
  } catch (error) {
    // Registro exhaustivo del error
    console.error('Error detallado en el envío del formulario:', {
      errorNombre: error instanceof Error ? error.name : 'Error Desconocido',
      errorMensaje: error instanceof Error ? error.message : 'Error desconocido',
      errorPila: error instanceof Error ? error.stack : 'Sin traza de pila',
      errorCompleto: error
    });
    throw error;
  }
};

const validateCartNumber = (value: number) => {
  // Verificar que sea un número positivo
  if (!value || value <= 0) {
    return 'Golf Cart Number must be a positive number';
  }
  
  // Opcional: Límite máximo de número de carrito (ajustar según necesidad)
  if (value > 9999) {
    return 'Golf Cart Number cannot exceed 9999';
  }
  
  return true;
};

const GolfCartInspectionForm: React.FC = () => {
  // Hook para generar ID consistente
  const inspectionId = useId().replace(/:/g, '');

  const formRef = useRef<HTMLFormElement>(null);
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [damageRecords, setDamageRecords] = useState<DamageRecord[]>([]);
  const [acceptInspectionTerms, setAcceptInspectionTerms] = useState(false);
  const [guestSignature, setGuestSignature] = useState('');

  const schema = z.object({
    property: z.string().min(1, 'Property is required'),
    cartNumber: z.number().refine(
      (value) => value > 0, 
      { message: 'Golf Cart Number must be a positive number' }
    ),
    guestName: z.string().min(1, 'Guest Name is required'),
    guestEmail: z.string().email('Invalid email address').min(1, 'Guest Email is required'),
    date: z.date(),
  });

  const {
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset,
    setValue,
    watch
  } = useForm<FormData>({
    defaultValues: {
      property: '',
      cartNumber: undefined,
      date: new Date(),
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      previewObservationsByGuest: '',
      acceptInspectionTerms: false,
      guestSignature: '',
      damageRecords: []
    },
    resolver: zodResolver(schema)
  });

  const addDamageRecord = () => {
    setDamageRecords(prev => [
      ...prev,
      { section: 'Front Left Side', damageType: 'Scratches', quantity: 0 }
    ]);
  };

  const removeDamageRecord = (indexToRemove: number) => {
    setDamageRecords(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const updateDamageRecord = <K extends keyof DamageRecord>(
    index: number,
    field: K,
    value: DamageRecord[K]
  ) => {
    setDamageRecords(prev => {
      const newRecords = [...prev];
      newRecords[index][field] = value;
      return newRecords;
    });
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // Validaciones básicas
      const requiredFields = [
        'property', 
        'cartNumber', 
        'guestName', 
        'guestEmail', 
        'date'
      ];
      
      const missingFields = requiredFields.filter(field => {
        const value = data[field as keyof FormData];
        
        // Validación específica para cartNumber
        if (field === 'cartNumber') {
          return value === undefined || value === null || Number(value) <= 0;
        }
        
        return !value;
      });

      if (missingFields.length > 0) {
        toast.error(`Please complete the following fields: ${missingFields.join(', ')}`);
        return;
      }

      // Preparación de datos para envío inicial
      const formDataToSubmit = {
        ...data,
        cartNumber: Number(data.cartNumber), // Conversión explícita a número
        inspectionDate: format(data.date, 'yyyy-MM-dd'),
        damageRecords,
        previewObservationsByGuest: null, // Inicialmente nulo
        acceptInspectionTerms: false, // Inicialmente falso
        guestSignature: null // Inicialmente nulo
      };

      console.log('🚀 Datos a enviar:', JSON.stringify(formDataToSubmit, null, 2));

      // Generación de PDF
      const pdfBase64 = await generatePDF(formRef);
      
      if (!pdfBase64) {
        toast.error('Could not generate PDF');
        return;
      }

      const response = await submitForm({
        ...formDataToSubmit,
        pdfBase64
      });

      toast.success('Inspection Submitted Successfully', {
        description: 'Your golf cart inspection form has been processed. Data updated in Airtable and verification email sent.',
        duration: 5000,
        position: 'top-center'
      });
      
      // Resetear formulario después del envío inicial
      reset();
      setDamageRecords([]);

    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        ref={formRef} 
        className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg"
      >
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Inspection ID: INSP-{inspectionId}</h2>
        </div>

        {/* Sección 1: Información Básica */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Property</Label>
              <Select 
                value={watch('property')} 
                onValueChange={(value) => setValue('property', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Property" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTIES.map((prop) => (
                    <SelectItem key={prop} value={prop}>
                      {prop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.property && <p className="text-red-500">{errors.property.message}</p>}
            </div>
            
            <div>
              <Label>Golf Cart Number</Label>
              <input 
                type="number"
                min={1}
                max={9999}
                {...register('cartNumber', { 
                  required: 'Golf Cart Number is required',
                  validate: validateCartNumber,
                  valueAsNumber: true // Importante para manejar como número
                })}
                className={`w-full border rounded p-2 ${
                  errors.cartNumber ? 'border-red-500' : ''
                }`}
                placeholder="Enter Golf Cart Number"
              />
              {errors.cartNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.cartNumber.message}
                </p>
              )}
            </div>

            <div>
              <Label>Guest Name</Label>
              <Input 
                type="text" 
                {...register('guestName', { required: 'Guest Name is required' })}
              />
              {errors.guestName && <p className="text-red-500">{errors.guestName.message}</p>}
            </div>

            <div>
              <Label>Guest Email</Label>
              <Input 
                type="email" 
                {...register('guestEmail', { 
                  required: 'Guest Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errors.guestEmail && <p className="text-red-500">{errors.guestEmail.message}</p>}
            </div>

            <div>
              <Label>Guest Phone (Optional)</Label>
              <Input 
                type="tel" 
                {...register('guestPhone')}
              />
            </div>

            <div>
              <Label>Inspection Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watch('date') && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch('date') ? format(watch('date') as Date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watch('date') || undefined}
                    onSelect={(date) => setValue('date', date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Sección 2: Damage Records */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Damage Records</h3>
          {damageRecords.map((record, index) => (
            <div key={index} className="grid grid-cols-4 gap-2 items-center mb-2">
              <Select 
                value={record.section}
                onValueChange={(value) => updateDamageRecord(index, 'section', value as DamageRecord['section'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  {INSPECTION_SECTIONS.map(section => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={record.damageType} 
                onValueChange={(value) => updateDamageRecord(index, 'damageType', value as DamageRecord['damageType'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Damage Type" />
                </SelectTrigger>
                <SelectContent>
                  {DAMAGE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input 
                type="number" 
                placeholder="Quantity" 
                value={record.quantity} 
                onChange={(e) => updateDamageRecord(index, 'quantity', Number(e.target.value))}
                min={0}
              />
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => removeDamageRecord(index)}
                className="flex items-center"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button 
            type="button" 
            variant="outline" 
            onClick={addDamageRecord}
            className="flex items-center"
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Add Damage
          </Button>
        </div>

        {/* Sección 3: Guest Section */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Guest Section</h3>
          
          {/* Observaciones del invitado - Inicialmente deshabilitado */}
          <div className="mb-4">
            <Label className="text-gray-500">
              Preview Observations by Guest (Optional, to be enabled later)
            </Label>
            <textarea 
              {...register('previewObservationsByGuest')}
              placeholder="Observations will be available after initial submission"
              className="w-full border rounded p-2 bg-gray-200 cursor-not-allowed"
              disabled
            />
          </div>

          {/* Términos de inspección - Inicialmente deshabilitado */}
          <div className="mb-4">
            <div className="flex items-center opacity-50 cursor-not-allowed">
              <input 
                type="checkbox"
                checked={false}
                disabled
                className="mr-2 cursor-not-allowed"
              />
              <label className="text-gray-500">
                Terms of inspection will be enabled after email verification
              </label>
            </div>
          </div>

          {/* Espacio para firma - Inicialmente deshabilitado */}
          <div>
            <Label className="text-gray-500">
              Guest Signature Space (Will be activated after email verification)
            </Label>
            <div className="border rounded p-4 text-center text-gray-500 bg-gray-200">
              Signature will be added manually after guest email verification
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full"
        >
          Submit Inspection
        </Button>
      </form>
      
      {/* Añadir Toaster para mostrar mensajes */}
      <Toaster richColors />
    </>
  );
};

export default GolfCartInspectionForm;
