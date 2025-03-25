import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Finansal Hesaplayıcılar ve Araçlar | Bakiye360',
  description: 'Kredi, yatırım, tasarruf ve döviz hesaplama araçları. Finansal kararlarınızı kolaylaştıracak ücretsiz hesaplayıcılar ile geleceğinizi planlayın.',
  keywords: 'finansal hesaplayıcı, kredi hesaplama, faiz hesaplama, yatırım getirisi hesaplama, döviz hesaplama, kredi kartı borcu hesaplama, konut kredisi hesaplama',
  openGraph: {
    title: 'Finansal Hesaplayıcılar ve Araçlar | Bakiye360',
    description: 'Kredi, yatırım, tasarruf ve döviz hesaplama araçları ile finansal kararlarınızı kolaylaştırın.',
    url: 'https://bakiye360.com/hesaplamalar',
    type: 'website',
    images: [
      {
        url: '/images/og-hesaplayicilar.jpg',
        width: 1200,
        height: 630,
        alt: 'Bakiye360 Finansal Hesaplayıcılar'
      }
    ]
  },
  alternates: {
    canonical: 'https://bakiye360.com/hesaplamalar'
  }
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