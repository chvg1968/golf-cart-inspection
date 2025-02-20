"use client"

import Image from "next/legacy/image"
import { CalendarIcon, PlusIcon, TrashIcon } from "lucide-react"
import { format } from "date-fns"
import { useState, useRef } from "react"
import SignatureCanvas from "react-signature-canvas"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { jsPDF } from "jspdf"
import html2canvas from 'html2canvas'
import { FormProvider } from "react-hook-form"

const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.NEXT_PUBLIC_AIRTABLE_TABLE_NAME;

enum Property {
  VillaFlora = "Villa Flora",
  CasaBlanca = "Casa Blanca",
  Other = "Other"
}

enum Section {
  FrontLeft = "Front Left",
  FrontRight = "Front Right",
  BackLeft = "Back Left",
  BackRight = "Back Right",
  Top = "Top",
  Seats = "Seats",
  Other = "Other"
}

enum DamageType {
  Scratches = "Scratches",
  Dents = "Dents",
  Tears = "Tears",
  Stains = "Stains",
  Other = "Other"
}

interface FormData {
  property: Property;
  cartNumber: string;
  date: Date | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  observations: string;
  signatureChecked: boolean;
}

interface DamageRecord {
  section: Section;
  damageType: DamageType;
  quantity: number;
}

interface FormDataWithSignature {
  inspectionId: string;
  property: Property;
  cartNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  inspectionDate: string;
  observations: string;
  signatureChecked: boolean;
  pdfBase64: string;
  signature: string;
  damageRecords: DamageRecord[];
}

// Función de validación de correo electrónico
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return emailRegex.test(email);
};

const sendAirtableData = async (airtableRecord: any) => {
  try {
    const airtableResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records: [airtableRecord] })
    });

    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(errorData.message || 'Error al enviar datos a Airtable');
    }
  } catch (error) {
    console.error('Error:', error);
    throw new Error(error instanceof Error ? error.message : 'Error al enviar datos a Airtable');
  }
}

const sendEmail = async (formData: FormDataWithSignature) => {
  try {
    const emailResponse = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(errorData.message || 'Error al enviar correo electrónico');
    }
  } catch (error) {
    console.error('Error:', error);
    throw new Error(error instanceof Error ? error.message : 'Error al enviar correo electrónico');
  }
}

const sendFormData = async (formData: FormDataWithSignature) => {
  try {
    await Promise.all([
      sendAirtableData(formData),
      sendEmail(formData)
    ]);
  } catch (error) {
    console.error('Error:', error);
    throw new Error(error instanceof Error ? error.message : 'Error al enviar datos');
  }
}

export default function GolfCartInspectionForm(): JSX.Element {
  const formRef = useRef<HTMLFormElement>(null);
  const signaturePadRef = useRef<SignatureCanvas>(null);

  const [signaturePad, setSignaturePad] = useState<SignatureCanvas | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartNumber, setCartNumber] = useState(1);
  const [damageRecords, setDamageRecords] = useState<DamageRecord[]>([]);

  const form = useForm<FormData>({
    defaultValues: {
      property: Property.VillaFlora,
      cartNumber: cartNumber.toString(),
      date: new Date(),
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      observations: '',
      signatureChecked: false
    }
  });

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = form;

  // Manejadores para los registros de daños
  const addDamageRecord = () => {
    setDamageRecords(prev => [
      ...prev,
      { section: Section.FrontLeft, damageType: DamageType.Scratches, quantity: 0 }
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

      // Validar campos requeridos
      if (!data.property || !data.guestName || !data.guestEmail || !data.date || !data.cartNumber) {
        toast.error('Por favor, complete todos los campos requeridos');
        return;
      }

      if (!isValidEmail(data.guestEmail)) {
        toast.error('Por favor, ingrese un correo electrónico válido');
        return;
      }

      // Validar y convertir el número de carrito
      const cartNumber = parseInt(data.cartNumber, 10);
      if (isNaN(cartNumber)) {
        toast.error('Por favor, ingrese un número de carrito válido');
        return;
      }

      // Formatear fecha
      const formattedDate = data.date ? format(data.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

      // Generar el PDF
      const base64PDF = await generatePDF();
      if (!base64PDF) {
        toast.error('Error al generar el PDF');
        return;
      }

      // Validar firma
      if (!signaturePad?.toData().length) {
        toast.error('Por favor, firme el formulario');
        return;
      }

      // Generar ID de inspección
      const inspectionId = `cart${cartNumber}-${formattedDate}-${Date.now()}`
        .replace(/[^a-zA-Z0-9-]/g, '')
        .toLowerCase();

      // Preparar datos para Airtable
      const airtableRecord = {
        "Inspection ID": inspectionId,
        "Property": data.property || "Sin Especificar",
        "Golf Cart Number": cartNumber,
        "Inspection Date": formattedDate,
        "Guest Name": data.guestName.trim(),
        "Guest Email": data.guestEmail.trim().toLowerCase(),
        "Guest Phone": (data.guestPhone || "").trim(),
        "Golf Cart Inspection Send": true,
        "Golf Cart Signature Checked": !!data.signatureChecked
      };

      // Preparar los datos del formulario
      const formData = {
        inspectionId: inspectionId,
        property: data.property,
        cartNumber: cartNumber.toString(),
        guestName: data.guestName.trim(),
        guestEmail: data.guestEmail.trim().toLowerCase(),
        guestPhone: data.guestPhone?.trim() || '',
        inspectionDate: formattedDate,
        observations: data.observations?.trim() || '',
        signatureChecked: data.signatureChecked,
        pdfBase64: base64PDF,
        signature: signaturePad.toDataURL(),
        damageRecords: damageRecords
      };

      // Enviar datos
      await sendFormData(formData);

      // Mostrar mensaje de éxito
      toast.success('Formulario enviado correctamente');

      // Limpiar formulario
      reset();
      setDamageRecords([]);
      setCartNumber(1);
      signaturePad?.clear();

      // Scroll al inicio
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar el formulario');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Función para generar PDF del formulario HTML
  const generatePDF = async (): Promise<string | null> => {
    if (!formRef.current) {
      toast.error('Error al generar el PDF');
      return null;
    }

    try {
      // Capturar el formulario con html2canvas
      const canvas = await html2canvas(formRef.current, {
        scale: 2, // Mayor calidad
        useCORS: true, // Permitir imágenes de otros dominios
        logging: false,
        windowWidth: 1024,
        windowHeight: formRef.current.scrollHeight,
        backgroundColor: '#ffffff', // Fondo blanco
        imageTimeout: 0, // No timeout para imágenes
        onclone: (clonedDoc) => {
          // Asegurarse de que las imágenes estén cargadas
          const images = clonedDoc.getElementsByTagName('img');
          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            img.crossOrigin = 'anonymous';
          }
          return clonedDoc;
        }
      });

      // Convertir a PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
        hotfixes: ['px_scaling']
      });

      // Añadir la imagen al PDF con compresión
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height, '', 'FAST');

      // Devolver el PDF como base64
      return pdf.output('datauristring');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
      return null;
    }
  }

  return (
    <FormProvider {...form}>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Golf Cart Inspection</CardTitle>
        </CardHeader>
        <CardContent>
          <form 
            ref={formRef}
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-8"
          >
            <div className="relative w-full h-[400px] mb-6">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Golf%20Cart%20Damage%20Inspection%20Check%20list%20Four%20Seater%20edited-qJbaES9ueamIzo64B8vaA7Ln65pMiZ.png"
                alt="Golf Cart Inspection Checklist"
                layout="fill"
                objectFit="contain"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property">Property</Label>
                <Select onValueChange={value => setValue("property", value as Property)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Property.VillaFlora}>{Property.VillaFlora}</SelectItem>
                    <SelectItem value={Property.CasaBlanca}>{Property.CasaBlanca}</SelectItem>
                    <SelectItem value={Property.Other}>{Property.Other}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cartNumber">Golf Cart Number</Label>
                <Input id="cartNumber" type="number" {...register("cartNumber")} />
              </div>
            </div>

            <div>
              <Label>Inspection Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !watch("date") && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch("date") ? (
                      format(watch("date")!, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watch("date")}
                    onSelect={(date: Date | null) => {
                      setValue("date", date);
                    }}
                    disabled={(date: Date) => 
                      date > new Date() || date < new Date("2023-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guestName">Guest Name</Label>
                <Input id="guestName" type="text" {...register("guestName")} />
              </div>

              <div>
                <Label htmlFor="guestEmail">Guest Email</Label>
                <Input id="guestEmail" type="email" {...register("guestEmail")} />
              </div>
            </div>

            <div>
              <Label htmlFor="guestPhone">Guest Phone (Optional)</Label>
              <Input id="guestPhone" type="tel" {...register("guestPhone")} />
            </div>

            <div>
              <Label htmlFor="observations">Observations</Label>
              <Input id="observations" type="text" {...register("observations")} />
            </div>

            <div>
              <Label>Damage Records</Label>
              {damageRecords.map((record, index) => {
                return (
                  <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                    <Select onValueChange={value => updateDamageRecord(index, "section", value as Section)}>
                      <SelectTrigger className="col-span-1">
                        <SelectValue placeholder="Section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Section.FrontLeft}>{Section.FrontLeft}</SelectItem>
                        <SelectItem value={Section.FrontRight}>{Section.FrontRight}</SelectItem>
                        <SelectItem value={Section.BackLeft}>{Section.BackLeft}</SelectItem>
                        <SelectItem value={Section.BackRight}>{Section.BackRight}</SelectItem>
                        <SelectItem value={Section.Top}>{Section.Top}</SelectItem>
                        <SelectItem value={Section.Seats}>{Section.Seats}</SelectItem>
                        <SelectItem value={Section.Other}>{Section.Other}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select onValueChange={value => updateDamageRecord(index, "damageType", value as DamageType)}>
                      <SelectTrigger className="col-span-1">
                        <SelectValue placeholder="Damage Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DamageType.Scratches}>{DamageType.Scratches}</SelectItem>
                        <SelectItem value={DamageType.Dents}>{DamageType.Dents}</SelectItem>
                        <SelectItem value={DamageType.Tears}>{DamageType.Tears}</SelectItem>
                        <SelectItem value={DamageType.Stains}>{DamageType.Stains}</SelectItem>
                        <SelectItem value={DamageType.Other}>{DamageType.Other}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      className="col-span-1"
                      value={record.quantity.toString()}
                      onChange={e => {
                        const parsedValue = parseInt(e.target.value, 10);
                        if (!isNaN(parsedValue) && parsedValue >= 0) {
                          updateDamageRecord(index, "quantity", parsedValue);
                        } else {
                          toast.error('Por favor, ingrese un número válido');
                        }
                      }}
                    />

                    <Button variant="destructive" size="icon" onClick={() => removeDamageRecord(index)}>
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            <Button variant="outline" size="sm" onClick={addDamageRecord}>
              Add Damage Record <PlusIcon className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="signatureChecked"
              {...register("signatureChecked")}
            />
            <Label htmlFor="signatureChecked">
              Golf Cart Signature Checked
            </Label>
          </div>

          <div>
            <Label>Signature</Label>
            <div className="border rounded-md">
              <SignatureCanvas
                ref={signaturePadRef}
                canvasProps={{ width: 600, height: 200, className: 'border border-black' }}
              />
            </div>
          </div>

          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <>
                Enviando...
                <svg className="animate-spin h-5 w-5 ml-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </CardContent>
      </Card>
    </FormProvider>
  );
}
