import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import SignaturePad from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignaturePage() {
  const router = useRouter();
  const { inspectionId } = router.query;
  const [inspectionData, setInspectionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const signaturePadRef = useRef<HTMLCanvasElement>(null);
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);

  useEffect(() => {
    // Limpiar y normalizar el inspectionId
    const cleanInspectionId = Array.isArray(inspectionId) 
      ? inspectionId[0] 
      : inspectionId?.replace(/^\//, '') || '';

    // Función de fetcheo de datos
    const fetchInspectionData = async () => {
      if (!cleanInspectionId) return;

      try {
        const response = await fetch(`/api/get-inspection/${encodeURIComponent(cleanInspectionId)}`);
        if (!response.ok) {
          throw new Error('No se encontró la inspección');
        }
        const data = await response.json();
        setInspectionData(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      }
    };

    // Solo fetchear si tenemos un ID
    if (router.isReady) {
      fetchInspectionData();
    }
  }, [inspectionId, router.isReady]);

  useEffect(() => {
    if (signaturePadRef.current) {
      const pad = new SignaturePad(signaturePadRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
      });
      setSignaturePad(pad);
    }
  }, [signaturePadRef]);

  const handleSubmitSignature = async () => {
    if (!signaturePad || signaturePad.isEmpty()) {
      alert('Por favor, firme antes de enviar');
      return;
    }

    try {
      const signatureImage = signaturePad.toDataURL('image/png');
      
      // Limpiar y normalizar el inspectionId para enviar
      const cleanInspectionId = Array.isArray(inspectionId) 
        ? inspectionId[0] 
        : inspectionId?.replace(/^\//, '') || '';

      const response = await fetch('/api/submit-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspectionId: cleanInspectionId,
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

  // Renderizado condicional con mejor manejo de estados
  if (!router.isReady) return <div>Cargando...</div>;
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
