import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { SupabaseProvider } from '@/components/supabase-provider';

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
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SupabaseProvider>
            {children}
            <Toaster />
            <SonnerToaster />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}