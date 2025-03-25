import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog - Finansal Haberler, İpuçları ve Rehberler | Bakiye360',
  description: 'Kişisel finans, bütçe yönetimi, tasarruf ve yatırım konularında güncel haberler, uzman ipuçları ve detaylı rehberler. Finansal özgürlüğünüz için pratik bilgiler.',
  keywords: 'finans blogu, kişisel finans, bütçe yönetimi, tasarruf ipuçları, yatırım rehberi, finansal haberler, para yönetimi, finansal planlama, borç yönetimi',
  openGraph: {
    title: 'Blog - Finansal Haberler ve İpuçları | Bakiye360',
    description: 'Kişisel finans, bütçe yönetimi, tasarruf ve yatırım konularında güncel haberler, ipuçları ve rehberler.',
    url: 'https://bakiye360.com/blog',
    siteName: 'Bakiye360',
    images: [
      {
        url: '/images/og-blog.jpg',
        width: 1200,
        height: 630,
        alt: 'Bakiye360 Blog'
      }
    ],
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog - Finansal Haberler ve İpuçları | Bakiye360',
    description: 'Kişisel finans, bütçe yönetimi, tasarruf ve yatırım konularında güncel haberler, ipuçları ve rehberler.',
    images: ['/images/og-blog.jpg'],
  },
  alternates: {
    canonical: 'https://bakiye360.com/blog'
  }
}; 