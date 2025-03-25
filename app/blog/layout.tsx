import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Blog - Finansal Haberler | Bakiye360',
    template: '%s | Bakiye360 Blog'
  },
  description: 'Kişisel finans ve yatırım dünyasına dair güncel rehberler',
  keywords: ['finans', 'yatırım', 'bütçe yönetimi'],
  openGraph: {
    title: 'Bakiye360 Blog - Finans Rehberiniz',
    description: 'Profesyonel finans ipuçları ve analizler',
    url: 'https://bakiye360.com/blog',
    siteName: 'Bakiye360',
    images: [
      {
        url: '/og-blog.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'tr_TR',
    type: 'website',
  },
  alternates: {
    canonical: '/blog',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 