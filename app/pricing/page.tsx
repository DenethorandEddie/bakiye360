'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSubscriptionContext } from '../context/SubscriptionContext';
import { useSupabase } from '@/components/supabase-provider';

export default function PricingPage() {
  const router = useRouter();
  const { isPremium } = useSubscriptionContext();
  const { user } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Checkout başlatılıyor...');
      
      if (!user) {
        const errorMessage = 'Ödeme yapmak için giriş yapmalısınız';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
        credentials: 'include',
      });

      console.log('Checkout yanıtı alındı:', {
        status: response.status,
        statusText: response.statusText
      });

      const responseData = await response.json();
      console.log('Checkout yanıt verisi:', responseData);

      if (!response.ok) {
        console.error('Checkout hatası:', responseData);
        let errorMessage = 'Ödeme işlemi başlatılırken bir hata oluştu';
        
        if (responseData.error) {
          if (typeof responseData.error === 'object') {
            // Stripe hata objesi kontrolü
            if (responseData.error.type === 'StripeAuthenticationError') {
              errorMessage = 'Ödeme sistemi yapılandırması hatalı. Lütfen daha sonra tekrar deneyin.';
            } else if (responseData.error.raw?.message) {
              errorMessage = `Ödeme hatası: ${responseData.error.raw.message}`;
            } else {
              errorMessage = JSON.stringify(responseData.error);
            }
          } else {
            errorMessage = responseData.error;
          }
        }
        
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      
      if (responseData.sessionUrl) {
        console.log('Stripe ödeme sayfasına yönlendiriliyor:', responseData.sessionUrl);
        window.location.href = responseData.sessionUrl;
      } else {
        console.error('Checkout URL bulunamadı:', responseData);
        setError('Ödeme sayfası URL\'si bulunamadı');
        throw new Error('Ödeme sayfası URL\'si bulunamadı');
      }
    } catch (error: any) {
      console.error('Checkout işlemi sırasında hata:', error);
      setError(error.message || 'Ödeme işlemi başlatılırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-center mb-12">Bakiye360 Planları</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
          <span className="block sm:inline">{error}</span>
          <span 
            className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
            onClick={() => setError(null)}
          >
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Kapat</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Free Plan */}
        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Temel Plan</h2>
          <p className="text-2xl font-bold mb-4">Ücretsiz</p>
          <ul className="space-y-2 mb-6">
            <li>• Aylık 30 işlem girişi</li>
            <li>• Maksimum 7 ana kategori</li>
            <li>• Son 3 aylık veri görüntüleme</li>
            <li>• 1 aktif bütçe hedefi</li>
            <li>• 1 abonelik kaydı</li>
          </ul>
          <button 
            className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded disabled:opacity-50"
            disabled={true}
          >
            Mevcut Plan
          </button>
        </div>
        
        {/* Premium Plan */}
        <div className="border rounded-lg p-6 shadow-sm bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <h2 className="text-xl font-semibold mb-2">Premium Plan</h2>
          <p className="text-2xl font-bold mb-4">149,99 ₺<span className="text-sm font-normal">/aylık</span></p>
          <ul className="space-y-2 mb-6">
            <li>• Sınırsız işlem girişi</li>
            <li>• Sınırsız kategori oluşturma</li>
            <li>• Tüm geçmiş verilere erişim</li>
            <li>• Sınırsız bütçe hedefi</li>
            <li>• Sınırsız abonelik kaydı</li>
            <li>• Gelişmiş raporlama ve analiz</li>
          </ul>
          {isPremium ? (
            <button 
              className="w-full py-2 px-4 bg-purple-100 text-purple-800 rounded cursor-not-allowed"
              disabled={true}
            >
              Aktif Abonelik
            </button>
          ) : (
            <div className="space-y-4">
              <button 
                className={`w-full py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed ${isLoading ? 'animate-pulse' : ''}`}
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? 'İşleniyor...' : 'Premium\'a Geç'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 