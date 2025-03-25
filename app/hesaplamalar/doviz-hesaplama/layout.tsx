import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Döviz Hesaplama - Güncel Kurlar ile Para Birimi Dönüştürücü | Bakiye360",
  description: "Güncel döviz kurları ile TL, USD, EUR, GBP ve diğer para birimleri arasında anlık dönüşüm yapın. Canlı kurlar ile döviz hesaplama aracı.",
  keywords: "döviz hesaplama, kur hesaplama, döviz çevirici, para birimi dönüştürücü, dolar hesaplama, euro hesaplama, sterlin hesaplama, döviz kuru hesaplama, online döviz hesaplama, güncel döviz kurları",
  openGraph: {
    title: "Döviz Hesaplama - Güncel Kurlar ile Para Birimi Dönüştürücü | Bakiye360",
    description: "Güncel döviz kurları ile TL, USD, EUR, GBP ve diğer para birimleri arasında anlık dönüşüm yapın.",
    type: "website",
    url: "https://bakiye360.com/hesaplamalar/doviz-hesaplama",
    images: [
      {
        url: '/images/og-doviz-hesaplama.jpg',
        width: 1200,
        height: 630,
        alt: 'Bakiye360 Döviz Hesaplama Aracı'
      }
    ]
  },
  alternates: {
    canonical: 'https://bakiye360.com/hesaplamalar/doviz-hesaplama'
  }
};

export default function DovizHesaplamaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 