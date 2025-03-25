import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kredi Kartı Borcu Hesaplama - Ödeme Planı Oluşturucu | Bakiye360',
  description: 'Kredi kartı borcunuzu ne kadar sürede ödeyebileceğinizi hesaplayın. Faiz oranı, minimum ödeme ve farklı ödeme stratejileri ile ödeme planınızı oluşturun.',
  keywords: 'kredi kartı borcu hesaplama, kredi kartı borç hesaplayıcı, kredi kartı faiz hesaplama, minimum ödeme hesaplama, kredi kartı taksitlendirme, borç ödeme planı, finansal hesaplayıcı',
  openGraph: {
    title: 'Kredi Kartı Borcu Hesaplama Aracı - Bakiye360',
    description: 'Kredi kartı borcunuzu ne kadar sürede kapatacağınızı ve ne kadar faiz ödeyeceğinizi hesaplayın. Etkili ödeme stratejileriyle borcunuzu planlayın.',
    images: [{ url: '/images/og-kredi-karti-borcu.jpg' }],
  },
};

export default function KrediKartiBorcuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 