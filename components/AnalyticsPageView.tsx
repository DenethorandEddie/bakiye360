'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';

export function AnalyticsPageView() {
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