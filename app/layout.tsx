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
  title: 'Bakiye360 - Finansal Özgürlüğünüz İçin',
  description: 'Gelir ve giderlerinizi takip edin, bütçe hedeflerinizi belirleyin ve finansal özgürlüğünüze kavuşun.',
  keywords: 'bütçe yönetimi, finansal takip, gelir gider takibi, tasarruf, finansal özgürlük',
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