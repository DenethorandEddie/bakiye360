import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kredi Hesaplama - Taksit ve Ödeme Planı Hesaplayıcı | Bakiye360',
  description: 'Kredi tutarı, faiz oranı ve vade bilgilerine göre aylık taksitlerinizi ve toplam ödeme planınızı hesaplayın. Ücretsiz kredi hesaplama aracı.',
  keywords: 'kredi hesaplama, kredi hesaplayıcı, taksit hesaplama, ödeme planı, kredi faiz hesaplama, kredi taksit hesaplama',
  openGraph: {
    title: 'Kredi Hesaplama - Bakiye360',
    description: 'Kredi tutarı, faiz oranı ve vade bilgilerine göre aylık taksitlerinizi hesaplayın',
    images: [{ url: '/images/og-kredi-hesaplama.jpg' }],
  },
};

export default function KrediHesaplamaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 