'use client';

type EventOptions = {
  category?: string;
  label?: string;
  value?: number;
};

export const useAnalytics = () => {
  // Google Analytics olayını gönderme
  const trackEvent = (action: string, options?: EventOptions) => {
    const { category, label, value } = options || {};
    
    // gtag fonksiyonunun global olarak tanımlı olup olmadığını kontrol et
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  };

  // Sayfa görüntüleme olayını gönderme
  const trackPageView = (url: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID as string, {
        page_path: url,
      });
    }
  };

  return { trackEvent, trackPageView };
};

// Global window tipi tanımlaması
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'js' | 'set',
      targetId: string,
      config?: Record<string, any>,
    ) => void;
    dataLayer: any[];
  }
} 