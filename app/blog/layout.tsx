import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog - Finansal Haberler, İpuçları ve Rehberler | Bakiye360',
  description: 'Kişisel finans, bütçe yönetimi, tasarruf ve yatırım konularında güncel haberler, uzman ipuçları ve detaylı rehberler. Finansal özgürlüğünüz için pratik bilgiler.',
  keywords: 'finans blogu, kişisel finans, bütçe yönetimi, tasarruf ipuçları, yatırım rehberi, finansal haberler, para yönetimi, finansal planlama, borç yönetimi',
  openGraph: {
    title: 'Bakiye360 Blog - Finansal Haberler ve Uzman İpuçları',
    description: 'Kişisel finans ve bütçe yönetimi konularında güncel içerikler, uzman tavsiyeleri ve detaylı rehberler.',
    url: 'https://bakiye360.com/blog',
    type: 'website',
    images: [
      {
        url: '/images/og-blog.jpg',
        width: 1200,
        height: 630,
        alt: 'Bakiye360 Blog - Finansal İçerikler'
      }
    ]
  }
}; 