import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { SupabaseProvider } from '@/components/supabase-provider';
import { SubscriptionProvider } from './context/SubscriptionContext';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { AnalyticsPageView } from '@/components/AnalyticsPageView';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bakiye360 - Kişisel Finans ve Bütçe Yönetimi',
  description: 'Gelir ve giderlerinizi takip edin, aboneliklerinizi yönetin, bütçe hedeflerinizi belirleyin ve finansal özgürlüğünüze kavuşun. Ücretsiz kişisel finans yönetim platformu.',
  keywords: 'bütçe yönetimi, finansal takip, gelir gider takibi, tasarruf, finansal özgürlük, abonelik takibi, kişisel finans, para yönetimi',
  metadataBase: new URL('https://bakiye360.com'),
  openGraph: {
    title: 'Bakiye360 - Kişisel Finans ve Bütçe Yönetimi',
    description: 'Gelir ve giderlerinizi takip edin, aboneliklerinizi yönetin ve finansal özgürlüğünüze kavuşun.',
    url: 'https://bakiye360.com',
    siteName: 'Bakiye360',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Bakiye360 - Kişisel Finans Yönetimi'
      }
    ],
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bakiye360 - Kişisel Finans ve Bütçe Yönetimi',
    description: 'Gelir ve giderlerinizi takip edin, aboneliklerinizi yönetin ve finansal özgürlüğünüze kavuşun.',
    images: ['/og-image.png'],
    creator: '@bakiye360',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: 'https://bakiye360.com'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3553192650486850"
     crossOrigin="anonymous"></script>
      </head>
      <body className={`${inter.className} dark:bg-gray-900 dark-bg`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SupabaseProvider>
            <SubscriptionProvider>
              {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
                <>
                  <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
                  <AnalyticsPageView />
                </>
              )}
              {children}
              <Toaster />
              <SonnerToaster />
            </SubscriptionProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}