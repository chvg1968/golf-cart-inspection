import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import SignaturePad from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Tipos para tipado seguro
interface InspectionData {
  inspectionId: string;
  property: string;
  cartNumber: string;
  guestName: string;
  guestEmail: string;
  inspectionDate: string;
  sections: {
    [key: string]: {
      scratches: number;
      missingParts: number;
      damageBumps: number;
    }
  };
  issues: Array<{
    section: string;
    damageType: string;
    quantity: number;
  }>;
}

// Función de utilidad para limpiar y normalizar URLs
function sanitizeUrl(url: string): string {
  return url
    .replace(/^\/+|\/+$/g, '')  // Eliminar barras al inicio y final
    .replace(/\/+/g, '/')        // Reemplazar múltiples barras con una sola
    .trim();
}

// Función de utilidad para extraer ID de inspección
function extractInspectionId(input: unknown): string | null {
  // Manejar casos nulos o undefined
  if (input == null) return null;

  // Convertir a cadena, manejando diferentes tipos de entrada
  let rawId: string;
  if (typeof input === 'string') {
    rawId = input;
  } else if (Array.isArray(input)) {
    // Si es un array, tomar el primer elemento
    if (input.length === 0) return null;
    
    // Recursivamente extraer ID del primer elemento
    return extractInspectionId(input[0]);
  } else {
    // Convertir a cadena para otros tipos
    rawId = String(input);
  }

  // Estrategias de extracción
  const extractionStrategies = [
    // 1. Limpiar completamente
    () => rawId
      .replace(/^\/+|\/+$/g, '')  // Eliminar barras al inicio y final
      .replace(/\/+/g, '-')        // Reemplazar barras internas con guiones
      .trim(),
    
    // 2. Extraer último segmento
    () => {
      const parts = rawId.split('/').filter(Boolean);
      return parts[parts.length - 1] || null;
    },
    
    // 3. Usar toda la cadena
    () => rawId.trim()
  ];

  // Probar estrategias hasta encontrar un ID válido
  for (const strategy of extractionStrategies) {
    const id = strategy();
    if (id && id.length > 0) return id;
  }

  return null;
}

export default function SignaturePage() {
  const router = useRouter();
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [inspectionData, setInspectionData] = useState<InspectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const signaturePadRef = useRef<HTMLCanvasElement>(null);
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);

  // Middleware de corrección de URL
  useEffect(() => {
    const correctUrl = () => {
      if (typeof window === 'undefined') return;

      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      
      const sanitizedPath = sanitizeUrl(currentPath);
      
      const pathParts = sanitizedPath.split('/').filter(Boolean);
      const signatureIndex = pathParts.findIndex(part => part === 'signature');
      
      let correctPath = currentPath;
      
      if (signatureIndex !== -1 && pathParts.length > signatureIndex + 1) {
        const id = extractInspectionId(pathParts[signatureIndex + 1]);
        
        if (id) {
          correctPath = `/signature/${id}${currentSearch}`;
        }
      }

      // Si la ruta necesita corrección
      if (currentPath !== correctPath) {
        console.warn(`Corrigiendo URL de ${currentPath} a ${correctPath}`);
        
        window.history.replaceState(null, '', correctPath);

        router.replace(correctPath, undefined, { 
          shallow: true 
        });
      }
    };

    correctUrl();
    router.events.on('routeChangeComplete', correctUrl);

    return () => {
      router.events.off('routeChangeComplete', correctUrl);
    };
  }, [router]);

  // Función para obtener datos de inspección
  const fetchInspectionData = async (id: string) => {
    try {
      const response = await fetch(`/api/get-inspection/${id}`);
      if (!response.ok) {
        throw new Error('No se pudieron obtener los datos de inspección');
      }
      const data: InspectionData = await response.json();
      setInspectionData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching inspection data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
    }
  };

  // Efecto para manejar la extracción y normalización del ID
  useEffect(() => {
    const sources = [
      router.query.inspectionId,
      typeof window !== 'undefined' 
        ? window.location.pathname.split('/').filter(Boolean)[1] 
        : null
    ];

    const cleanId = sources
      .map(extractInspectionId)
      .find(id => id !== null);

    if (cleanId) {
      setInspectionId(cleanId);
      fetchInspectionData(cleanId);
    } else {
      setError('No se pudo encontrar un ID de inspección válido');
      setLoading(false);
    }
  }, [router.query]);

  // Inicializar SignaturePad
  useEffect(() => {
    if (signaturePadRef.current) {
      const pad = new SignaturePad(signaturePadRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
      });
      setSignaturePad(pad);
    }
  }, [signaturePadRef]);

  // Manejar envío de firma
  const handleSubmitSignature = async () => {
    if (!signaturePad || signaturePad.isEmpty()) {
      alert('Por favor, firme antes de enviar');
      return;
    }

    try {
      const signatureImage = signaturePad.toDataURL('image/png');
      
      const response = await fetch('/api/submit-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspectionId,
          signatureImage,
          inspectionData
        }),
      });

      if (response.ok) {
        alert('Firma enviada exitosamente');
        router.push('/confirmation');
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
          Golf Cart Inspection Signature
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Detalles de la inspección */}
        <div className="mb-6 bg-gray-100 p-4 rounded-lg grid grid-cols-2 gap-4">
          <div>
            <strong>Property:</strong> {inspectionData.property}
          </div>
          <div>
            <strong>Golf Cart Number:</strong> {inspectionData.cartNumber}
          </div>
          <div>
            <strong>Guest Name:</strong> {inspectionData.guestName}
          </div>
          <div>
            <strong>Inspection Date:</strong> {inspectionData.inspectionDate}
          </div>
        </div>

        {/* Tabla de Secciones e Incidencias */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Inspection Details</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section</TableHead>
                <TableHead>Scratches</TableHead>
                <TableHead>Missing Parts</TableHead>
                <TableHead>Damage/Bumps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(inspectionData.sections).map(([section, details]) => (
                <TableRow key={section}>
                  <TableCell>{section}</TableCell>
                  <TableCell>{details.scratches}</TableCell>
                  <TableCell>{details.missingParts}</TableCell>
                  <TableCell>{details.damageBumps}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Tabla de Incidencias Detalladas */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Detailed Issues</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section</TableHead>
                <TableHead>Damage Type</TableHead>
                <TableHead>Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspectionData.issues.map((issue, index) => (
                <TableRow key={index}>
                  <TableCell>{issue.section}</TableCell>
                  <TableCell>{issue.damageType}</TableCell>
                  <TableCell>{issue.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Área de firma */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Please Sign Below</h3>
          <canvas 
            ref={signaturePadRef} 
            className="border-2 border-gray-300 rounded-lg w-full h-48"
          />
          <Button 
            onClick={() => signaturePad?.clear()} 
            variant="outline" 
            className="mt-2 mr-2"
          >
            Clear Signature
          </Button>
        </div>

        {/* Botón de envío */}
        <Button 
          onClick={handleSubmitSignature} 
          className="w-full"
        >
          Submit Signature
        </Button>
      </CardContent>
    </Card>
  );
}
