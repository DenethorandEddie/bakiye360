import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kredi Hesaplama - Detaylı Taksit ve Maliyet Hesaplayıcı | Bakiye360',
  description: 'Konut kredisi, ihtiyaç kredisi ve taşıt kredisi için detaylı hesaplama yapın. Kredi tutarı, faiz oranı ve vade süresine göre aylık taksit, toplam maliyet ve ödeme planınızı öğrenin.',
  keywords: 'kredi hesaplama, konut kredisi hesaplama, ihtiyaç kredisi hesaplama, taşıt kredisi hesaplama, kredi taksit hesaplama, kredi faiz hesaplama, kredi maliyet hesaplama, kredi ödeme planı, ücretsiz kredi hesaplama',
  openGraph: {
    title: 'Kredi Hesaplama - Detaylı Taksit ve Maliyet Hesaplayıcı | Bakiye360',
    description: 'Konut kredisi, ihtiyaç kredisi ve taşıt kredisi için detaylı hesaplama yapın. Aylık taksit ve toplam maliyetinizi öğrenin.',
    url: 'https://bakiye360.com/hesaplamalar/kredi-hesaplama',
    type: 'website',
    images: [
      {
        url: '/images/og-kredi-hesaplama.jpg',
        width: 1200,
        height: 630,
        alt: 'Bakiye360 Kredi Hesaplama Aracı'
      }
    ]
  },
  alternates: {
    canonical: 'https://bakiye360.com/hesaplamalar/kredi-hesaplama'
  }
}; 