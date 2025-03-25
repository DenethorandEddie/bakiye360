import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Finansal Hesaplayıcılar - Bakiye360',
  description: 'Finansal hesaplamalarınızı kolayca yapın. Kredi, yatırım ve tasarruf hesaplayıcılarımızı kullanarak finansal planlarınızı yapın.',
};

export default function CalculatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#02051A] via-[#040B2C] to-[#02051A]">
      <div className="container py-4 md:py-6">
        <Link 
          href="/" 
          className="inline-flex items-center text-xs font-medium text-gray-300 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Ana Sayfaya Dön
        </Link>
        
        <div>
          {children}
        </div>
      </div>
    </div>
  );
} 