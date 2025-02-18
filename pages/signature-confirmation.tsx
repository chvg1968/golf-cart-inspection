import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircleIcon } from 'lucide-react';

export default function SignatureConfirmation() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <CheckCircleIcon className="w-10 h-10 text-green-500" />
            Firma Confirmada
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">
            Su firma ha sido recibida y guardada exitosamente.
          </p>
          <p className="text-gray-500">
            Gracias por completar la inspección del carrito de golf.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
