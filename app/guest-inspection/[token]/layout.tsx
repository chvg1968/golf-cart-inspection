import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Completar Inspección de Carrito de Golf',
  description: 'Página para completar la inspección de un carrito de golf',
  keywords: ['carrito de golf', 'inspección', 'formulario'],
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Completar Inspección de Carrito de Golf',
    description: 'Página para completar la inspección de un carrito de golf',
    type: 'website'
  }
};

export type PageProps = {
  params: { 
    token: string 
  },
  searchParams?: { 
    id?: string 
  }
};

export default function GuestInspectionLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return <>{children}</>;
}
