import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yatırım Getirisi (ROI) Hesaplama - Kazanç ve Kârlılık Hesaplayıcı | Bakiye360',
  description: 'Yatırımlarınızın getiri oranını (ROI) hesaplayın. Başlangıç yatırımı, aylık katkı, getiri oranı ve enflasyon faktörlerini içeren detaylı hesaplama aracı.',
  keywords: 'yatırım getirisi, ROI hesaplama, yatırım hesaplayıcı, yatırım kârlılığı, bileşik getiri, enflasyon etkisi, finansal planlama, yatırım analizi',
  openGraph: {
    title: 'Yatırım Getirisi (ROI) Hesaplama Aracı - Bakiye360',
    description: 'Yatırımlarınızın uzun vadeli getirisini hesaplayın ve enflasyon etkisini görün. Detaylı yıllık projeksiyonlar ile yatırım planlaması yapın.',
    images: [{ url: '/images/og-yatirim-getirisi.jpg' }],
  },
};

export default function YatirimGetirisiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 