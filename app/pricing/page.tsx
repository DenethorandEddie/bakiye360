'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSubscriptionContext } from '../context/SubscriptionContext';

export default function PricingPage() {
  const router = useRouter();
  const { isPremium } = useSubscriptionContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Ödeme hatası: ${errorData.error || 'Bilinmeyen hata'}`);
      }

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Ödeme işlemi başlatılırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-center mb-12">Bakiye360 Planları</h1>
      
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
            <button 
              className="w-full py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              onClick={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? 'İşleniyor...' : 'Premium\'a Geç'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 