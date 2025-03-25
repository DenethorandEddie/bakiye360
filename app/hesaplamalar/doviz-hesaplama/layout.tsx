import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Döviz Hesaplayıcısı | Bakiye360",
  description: "Güncel döviz kurları ile farklı para birimleri arasında dönüşüm yapın. USD, EUR, GBP ve diğer para birimlerini kolayca hesaplayın.",
  keywords: "döviz hesaplama, kur hesaplama, döviz çevirici, para birimi dönüştürücü, dolar hesaplama, euro hesaplama, sterlin hesaplama, döviz kuru hesaplama, online döviz hesaplama",
  openGraph: {
    title: "Döviz Hesaplayıcısı | Bakiye360",
    description: "Güncel döviz kurları ile farklı para birimleri arasında dönüşüm yapın. USD, EUR, GBP ve diğer para birimlerini kolayca hesaplayın.",
    type: "website",
    url: "https://www.bakiye360.com/hesaplamalar/doviz-hesaplama",
  },
};

export default function DovizHesaplamaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 