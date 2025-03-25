import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Konut Kredisi Hesaplama - Ev Kredisi Taksit ve Maliyet Hesaplayıcı | Bakiye360',
  description: 'Konut kredisi hesaplama aracı ile kredi tutarı, faiz oranı ve vade süresine göre aylık taksit tutarınızı, toplam ödeme ve maliyetinizi kolayca hesaplayın. Detaylı ödeme planı ile kredi maliyetinizi analiz edin.',
  keywords: 'konut kredisi hesaplama, ev kredisi hesaplama, mortgage hesaplama, konut kredisi taksit hesaplama, ev kredisi taksit hesaplama, konut kredisi faiz hesaplama, ev kredisi maliyet hesaplama, konut kredisi ödeme planı',
  openGraph: {
    title: 'Konut Kredisi Hesaplama - Ev Kredisi Taksit ve Maliyet Hesaplayıcı',
    description: 'Konut kredisi hesaplama aracı ile kredi tutarı, faiz oranı ve vade süresine göre aylık taksit tutarınızı, toplam ödeme ve maliyetinizi kolayca hesaplayın.',
    images: ['/og-image.png'],
  },
};

export default function KonutKredisiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 