'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';

// useSearchParams hook'unu kullanan bileşen
function AnalyticsPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    // Mevcut tam URL'yi al
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    // Sayfa görünümünü izle
    trackPageView(url);
  }, [pathname, searchParams, trackPageView]);

  // Bu bir görünmez bileşendir ve render işlemi yapmaz
  return null;
}

// Ana bileşen, Suspense ile sarmalanmış
export function AnalyticsPageView() {
  return (
    <Suspense fallback={null}>
      <AnalyticsPageViewTracker />
    </Suspense>
  );
} 