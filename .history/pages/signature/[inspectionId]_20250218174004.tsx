import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import SignaturePad from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [inspectionData, setInspectionData] = useState<any>(null);
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

  // Efecto para manejar la extracción y normalización del ID
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

    if (cleanId) {
      setInspectionId(cleanId);
      console.log('ID de inspección extraído:', cleanId);
    } else {
      setError('No se pudo encontrar un ID de inspección válido');
      setLoading(false);
    }
  }, [router.query]);

  // Efecto para obtener datos de la inspección
  useEffect(() => {
    const fetchInspectionData = async () => {
      if (!inspectionId) return;

      try {
        console.log('Buscando datos para ID:', inspectionId);
        const response = await fetch(`/api/get-inspection/${encodeURIComponent(inspectionId)}`);
        
        if (!response.ok) {
          throw new Error('No se encontró la inspección');
        }
        
        const data = await response.json();
        console.log('Datos de inspección recibidos:', data);
        setInspectionData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching inspection:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      }
    };

    if (inspectionId) {
      fetchInspectionData();
    }
  }, [inspectionId]);

  // Inicializar el pad de firma
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
          signatureImage
        })
      });

      if (!response.ok) {
        throw new Error('Error al guardar la firma');
      }

      alert('Firma guardada exitosamente');
      router.push('/signature-confirmation');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // Renderizado condicional
  if (loading) return <div>Verificando inspección...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!inspectionData) return <div>No se encontró la inspección</div>;

  return (
    <Card className="w-full max-w-4xl mx-auto mt-10">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Firma de Inspección de Carrito de Golf
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold">Detalles de la Inspección</h3>
              <p><strong>Número de Carrito:</strong> {inspectionData.cartNumber}</p>
              <p><strong>Propiedad:</strong> {inspectionData.property}</p>
              <p><strong>Fecha:</strong> {inspectionData.inspectionDate}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Daños Registrados</h3>
              <p><strong>Lado Izquierdo:</strong></p>
              <ul>
                <li>Rayones: {inspectionData.frontLeftSide?.scratches || 0}</li>
                <li>Partes Faltantes: {inspectionData.frontLeftSide?.missingParts || 0}</li>
                <li>Golpes: {inspectionData.frontLeftSide?.damageBumps || 0}</li>
              </ul>
              <p><strong>Lado Derecho:</strong></p>
              <ul>
                <li>Rayones: {inspectionData.frontRightSide?.scratches || 0}</li>
                <li>Partes Faltantes: {inspectionData.frontRightSide?.missingParts || 0}</li>
                <li>Golpes: {inspectionData.frontRightSide?.damageBumps || 0}</li>
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Firma del Cliente</h3>
            <canvas 
              ref={signaturePadRef} 
              className="w-full h-64 border border-gray-300"
            />
            <div className="mt-2 flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => signaturePad?.clear()}
              >
                Limpiar Firma
              </Button>
              <Button onClick={handleSubmitSignature}>
                Guardar Firma
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
