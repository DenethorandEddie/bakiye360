import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Finansal Hesaplayıcılar ve Hesaplama Araçları | Bakiye360',
  description: 'Kredi, yatırım, tasarruf ve döviz hesaplama araçları ile finansal planlarınızı kolayca yapın. Ücretsiz ve kullanımı kolay hesaplayıcılar.',
  keywords: 'finansal hesaplayıcı, kredi hesaplama, faiz hesaplama, yatırım hesaplama, döviz hesaplama, finansal araçlar',
  openGraph: {
    title: 'Finansal Hesaplayıcılar - Bakiye360',
    description: 'Kredi, yatırım, tasarruf ve döviz hesaplama araçları ile finansal planlarınızı kolayca yapın',
    images: [{ url: '/images/og-hesaplayicilar.jpg' }],
  },
};

export default function HesaplamaLayout({
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