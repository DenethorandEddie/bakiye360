'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    try {
      setLoading(true);
      
      console.log('Starting checkout process...');
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error types
        const errorMessage = getErrorMessage(data);
        console.error('Checkout error:', {
          status: response.status,
          statusText: response.statusText,
          error: data
        });
        
        toast({
          title: 'Ödeme Hatası',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      if (data.url) {
        console.log('Redirecting to checkout:', data.url);
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Unexpected error during checkout:', error);
      toast({
        title: 'Beklenmeyen Hata',
        description: 'Ödeme işlemi başlatılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get user-friendly error messages
  const getErrorMessage = (error: any) => {
    switch (error.errorType) {
      case 'AUTH_ERROR':
      case 'NO_USER':
        return 'Lütfen giriş yapın veya oturumunuzu yenileyin.';
      
      case 'USER_SETTINGS_ERROR':
        return 'Kullanıcı ayarları yüklenirken bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.';
      
      case 'ACTIVE_SUBSCRIPTION':
        return 'Zaten aktif bir aboneliğiniz bulunmaktadır.';
      
      case 'STRIPE_CONFIG_ERROR':
      case 'PRICE_CONFIG_ERROR':
      case 'URL_CONFIG_ERROR':
        return 'Sistem yapılandırma hatası. Lütfen daha sonra tekrar deneyin veya destek ekibiyle iletişime geçin.';
      
      case 'STRIPE_CUSTOMER_ERROR':
        return 'Müşteri profili oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.';
      
      case 'DB_UPDATE_ERROR':
        return 'Veritabanı güncellenirken bir hata oluştu. Lütfen tekrar deneyin.';
      
      case 'CHECKOUT_SESSION_ERROR':
        return 'Ödeme oturumu başlatılırken bir hata oluştu. Lütfen tekrar deneyin.';
      
      case 'NO_SESSION_URL':
        return 'Ödeme sayfası oluşturulamadı. Lütfen tekrar deneyin.';
      
      case 'UNEXPECTED_ERROR':
        return 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
      
      default:
        return error.details || 'Bir hata oluştu. Lütfen tekrar deneyin.';
    }
  };

  return (
    <Button
      variant="default"
      onClick={handleCheckout}
      disabled={loading}
      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
    >
      {loading ? 'İşlem yapılıyor...' : 'Premium\'a Geç'}
    </Button>
  );
} 