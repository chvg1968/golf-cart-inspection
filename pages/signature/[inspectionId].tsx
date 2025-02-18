import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Tipos para la estructura de datos de inspección
type InspectionSection = {
  scratches: number;
  missingParts: number;
  damageBumps: number;
}

type InspectionData = {
  inspectionId: string;
  property: string;
  cartNumber: string;
  date: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  observations?: string;
  sections: {
    frontLeftSide: InspectionSection;
    frontRightSide: InspectionSection;
  };
  issues: Array<{
    section: string;
    damageType: string;
    quantity: number;
  }>;
}

// Función para limpiar y normalizar URLs
const normalizeUrl = (url: string): string => {
  // Eliminar barras dobles al inicio
  const cleanUrl = url.replace(/^\/+/, '/');
  
  // Eliminar barras adicionales
  return cleanUrl.replace(/\/+/g, '/');
};

// Función para generar URL de inspección
export const generateInspectionUrl = (
  property: string, 
  cartNumber: string, 
  date: string, 
  randomId?: string
): string => {
  // Generar ID único si no se proporciona
  const uniqueId = randomId || 
    `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  // Formato: propiedad-cartNumber-fecha-randomId
  const formattedUrl = `${property}-${cartNumber}-${date}-${uniqueId}`;
  
  // Codificar para URL segura
  return encodeURIComponent(formattedUrl);
};

// Hook para manejar la navegación segura
const useCleanNavigation = () => {
  const router = useRouter();

  const navigateTo = useCallback((path: string) => {
    const cleanPath = normalizeUrl(path);
    
    try {
      router.push(cleanPath);
    } catch (error) {
      console.error('Error de navegación:', error);
      // Fallback: navegación forzada
      window.location.href = cleanPath;
    }
  }, [router]);

  return { navigateTo };
};

export async function getStaticPaths() {
  // Estrategia de generación de rutas
  return {
    paths: [], // Generadas dinámicamente en build time
    fallback: 'blocking' // Genera páginas bajo demanda
  };
}

export async function getStaticProps(context: { 
  params?: { inspectionId?: string } 
}) {
  const inspectionId = context.params?.inspectionId;
  
  if (!inspectionId) {
    return { 
      notFound: true,  // 404 si no hay ID
      revalidate: 60   // Revalidar cada minuto
    };
  }

  try {
    // Usar función de Netlify para recuperar datos
    const response = await fetch(
      `https://golfcartinsp.netlify.app/.netlify/functions/get-inspection?inspectionId=${inspectionId}`
    );

    if (!response.ok) {
      return { 
        notFound: true,
        revalidate: 60 
      };
    }

    const inspectionData = await response.json();

    return {
      props: { 
        initialInspectionData: inspectionData 
      },
      revalidate: 60  // Regenerar página cada minuto
    };
  } catch (error) {
    console.error('Error en getStaticProps:', error);
    return { 
      notFound: true,
      revalidate: 60 
    };
  }
}

export default function SignaturePage({ 
  initialInspectionData 
}: { 
  initialInspectionData?: InspectionData 
}) {
  const router = useRouter();
  const { navigateTo } = useCleanNavigation();
  const [inspectionData, setInspectionData] = useState(initialInspectionData);
  const [loading, setLoading] = useState(!initialInspectionData);
  const [error, setError] = useState<string | null>(null);
  const signatureRef = useRef<any>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Función de extracción de ID más robusta
  const extractInspectionId = useCallback((input: unknown): string | null => {
    // Manejar casos nulos o undefined
    if (input == null) return null;

    // Convertir a cadena, manejando diferentes tipos de entrada
    let rawId: string;
    if (typeof input === 'string') {
      // Eliminar barras dobles o iniciales
      rawId = decodeURIComponent(input.replace(/^\/+/, ''));
    } else if (Array.isArray(input)) {
      // Si es un array, tomar el primer elemento
      if (input.length === 0) return null;
      return extractInspectionId(input[0]);
    } else {
      // Convertir a cadena para otros tipos
      rawId = decodeURIComponent(String(input).replace(/^\/+/, ''));
    }

    // Estrategias de extracción
    const extractionStrategies = [
      // 1. Usar toda la cadena
      () => rawId.trim(),
      
      // 2. Extraer último segmento
      () => {
        const parts = rawId.split('/').filter(Boolean);
        return parts[parts.length - 1] || null;
      }
    ];

    // Probar estrategias hasta encontrar un ID válido
    for (const strategy of extractionStrategies) {
      const id = strategy();
      if (id && id.length > 0) return id;
    }

    return null;
  }, []);

  // Función para parsear respuesta JSON de manera segura
  const safeParseJSON = async (response: Response) => {
    try {
      // Intentar obtener texto primero
      const text = await response.text();
      
      // Log del contenido de respuesta
      console.log('Respuesta de API:', text);
      
      // Intentar parsear JSON
      return JSON.parse(text);
    } catch (error) {
      console.error('Error al parsear JSON:', error);
      console.error('Contenido recibido:', text);
      
      // Manejar diferentes tipos de errores
      if (error instanceof SyntaxError) {
        throw new Error('Respuesta no es JSON válido');
      }
      
      throw error;
    }
  };

  // Función para obtener datos de inspección
  const fetchInspectionData = useCallback(async (id: string) => {
    try {
      // Configurar opciones de fetch
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Añadir timeout
        signal: AbortSignal.timeout(10000)  // 10 segundos
      };

      // URL de la función de Netlify
      const netlifyFunctionUrl = `/.netlify/functions/get-inspection?inspectionId=${encodeURIComponent(id)}`;

      // Realizar solicitud
      const response = await fetch(netlifyFunctionUrl, fetchOptions);
      
      // Verificar estado de respuesta
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error en la solicitud: ${response.status} ${response.statusText}`);
        console.error('Detalles del error:', errorText);
        throw new Error(`Error al obtener datos: ${response.status}`);
      }

      // Parsear JSON de manera segura
      const data = await safeParseJSON(response);

      // Validar estructura de datos
      const requiredFields = [
        'inspectionId', 'property', 'cartNumber', 
        'date', 'guestName', 'guestEmail'
      ];

      const missingFields = requiredFields.filter(field => !data[field]);
      if (missingFields.length > 0) {
        throw new Error(`Campos faltantes: ${missingFields.join(', ')}`);
      }

      setInspectionData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching inspection:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
    }
  }, []);

  // Efecto para cargar datos de inspección
  useEffect(() => {
    // Intentar extraer el ID de diferentes fuentes
    const sources = [
      router.query.inspectionId,
      typeof window !== 'undefined' 
        ? window.location.pathname.split('/').filter(Boolean)[1] 
        : null
    ];

    // Encontrar el primer ID válido
    const cleanId = sources
      .map(extractInspectionId)
      .find(id => id !== null);

    if (cleanId && !initialInspectionData) {
      console.log('ID de inspección extraído:', cleanId);
      fetchInspectionData(cleanId);
    }
  }, [router.query, extractInspectionId, fetchInspectionData, initialInspectionData]);

  // Generar PDF
  const generatePDF = async () => {
    if (!formRef.current) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const canvas = await html2canvas(formRef.current, {
      scale: 2,
      useCORS: true
    });
    const imgData = canvas.toDataURL('image/png');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const x = (pageWidth - imgWidth) / 2;
    const y = 10;

    doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    doc.setFontSize(16);
    doc.text('Golf Cart Inspection Report', pageWidth / 2, 10, { align: 'center' });

    return doc;
  };

  // Enviar firma y actualizar registro
  const handleSubmitSignature = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert('Por favor, firme antes de enviar');
      return;
    }

    try {
      // Obtener imagen de firma
      const signatureImage = signatureRef.current.toDataURL('image/png');
      
      // Generar PDF
      const pdfDoc = await generatePDF();
      const pdfBlob = pdfDoc ? new Blob([pdfDoc.output('blob')], { type: 'application/pdf' }) : null;

      // Preparar datos para envío
      const formData = new FormData();
      formData.append('inspectionId', inspectionData?.inspectionId || '');
      formData.append('signatureImage', signatureImage);
      if (pdfBlob) {
        formData.append('signedPdf', pdfBlob, `inspection-${inspectionData?.inspectionId}.pdf`);
      }

      // Enviar al backend
      const response = await fetch('/api/submit-signature', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('Firma enviada exitosamente');
        navigateTo('/confirmation');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar la firma');
      }
    } catch (error) {
      console.error('Error submitting signature:', error);
      alert('No se pudo enviar la firma. Intente nuevamente.');
    }
  };

  // Renderizado condicional
  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!inspectionData) return <div>No se encontraron datos de inspección</div>;

  return (
    <Card className="w-full max-w-6xl mx-auto mt-10">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Revisión de Inspección de Carrito de Golf
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} className="space-y-6">
          {/* Sección de Información Personal */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <FormLabel>Propiedad</FormLabel>
              <Input 
                value={inspectionData.property} 
                readOnly 
                className="bg-gray-100" 
              />
            </div>
            <div>
              <FormLabel>Número de Carrito</FormLabel>
              <Input 
                value={inspectionData.cartNumber} 
                readOnly 
                className="bg-gray-100" 
              />
            </div>
            <div>
              <FormLabel>Fecha</FormLabel>
              <Input 
                value={inspectionData.date} 
                readOnly 
                className="bg-gray-100" 
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <FormLabel>Nombre del Huésped</FormLabel>
              <Input 
                value={inspectionData.guestName} 
                readOnly 
                className="bg-gray-100" 
              />
            </div>
            <div>
              <FormLabel>Email del Huésped</FormLabel>
              <Input 
                value={inspectionData.guestEmail} 
                readOnly 
                className="bg-gray-100" 
              />
            </div>
            {inspectionData.guestPhone && (
              <div>
                <FormLabel>Teléfono del Huésped</FormLabel>
                <Input 
                  value={inspectionData.guestPhone} 
                  readOnly 
                  className="bg-gray-100" 
                />
              </div>
            )}
          </div>

          {/* Tabla de Daños */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sección</TableHead>
                <TableHead>Rayones</TableHead>
                <TableHead>Partes Faltantes</TableHead>
                <TableHead>Golpes/Daños</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Lado Izquierdo</TableCell>
                <TableCell>{inspectionData.sections.frontLeftSide.scratches}</TableCell>
                <TableCell>{inspectionData.sections.frontLeftSide.missingParts}</TableCell>
                <TableCell>{inspectionData.sections.frontLeftSide.damageBumps}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Lado Derecho</TableCell>
                <TableCell>{inspectionData.sections.frontRightSide.scratches}</TableCell>
                <TableCell>{inspectionData.sections.frontRightSide.missingParts}</TableCell>
                <TableCell>{inspectionData.sections.frontRightSide.damageBumps}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Área de Observaciones */}
          <div>
            <FormLabel>Observaciones</FormLabel>
            <Textarea 
              value={inspectionData.observations || ''} 
              readOnly 
              className="bg-gray-100" 
            />
          </div>

          {/* Área de Firma */}
          <div>
            <FormLabel>Firma del Cliente</FormLabel>
            <div className="border-2 border-gray-300 rounded-lg p-2">
              <SignatureCanvas 
                ref={signatureRef}
                penColor='black'
                canvasProps={{
                  width: '100%', 
                  height: 200, 
                  className: 'signature-pad'
                }} 
              />
            </div>
            <div className="mt-2 flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => signatureRef.current?.clear()}
              >
                Limpiar Firma
              </Button>
            </div>
          </div>

          {/* Casilla de verificación */}
          <div className="flex items-center space-x-2">
            <Checkbox id="signatureChecked" />
            <label
              htmlFor="signatureChecked"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              He revisado y confirmo que la información es correcta
            </label>
          </div>

          {/* Botón de envío */}
          <Button 
            onClick={handleSubmitSignature} 
            className="w-full"
          >
            Enviar Firma y Generar PDF
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
