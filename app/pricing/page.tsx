'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSubscriptionContext } from '../context/SubscriptionContext';

export default function PricingPage() {
  const router = useRouter();
  const { isPremium } = useSubscriptionContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Checkout başlatılıyor...');
      
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        setError(`Ödeme hatası: ${responseData.error || 'Bilinmeyen hata'}`);
        throw new Error(`Ödeme hatası: ${responseData.error || 'Bilinmeyen hata'}`);
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
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
                className="w-full py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? 'İşleniyor...' : 'Premium\'a Geç'}
              </button>
              
              <button 
                className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={() => window.open('https://dashboard.stripe.com/test/dashboard', '_blank')}
                disabled={isLoading}
              >
                Stripe Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 