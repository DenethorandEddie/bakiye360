import { useRouter } from 'next/router';
import { useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { loadStripe } from '@stripe/stripe-js';
import { useSubscription } from '@/hooks/useSubscription';

// Stripe.js ön yüklemesi
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function SubscriptionPage() {
  const router = useRouter();
  const user = useUser();
  const { subscription, isLoading, isActive } = useSubscription();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      // Kullanıcı giriş yapmamışsa giriş sayfasına yönlendir
      router.push('/auth/signin');
      return;
    }

    try {
      setIsSubmitting(true);

      // Checkout session oluştur
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Ödeme sayfası oluşturulamadı');
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      // Stripe Checkout sayfasına yönlendir
      const { error } = await stripe!.redirectToCheckout({ sessionId });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Ödeme işlemi hatası:', error);
      alert('Ödeme sayfası açılırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsSubmitting(true);

      // Müşteri portal linki oluştur
      const response = await fetch('/api/create-portal-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Portal linki oluşturulamadı');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Portal açma hatası:', error);
      alert('Abonelik yönetim sayfası açılırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stripe checkout'tan dönüş sonrası başarı/iptal mesajını göster
  const { success, canceled } = router.query;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Buzdolabı Asistanı Premium</h1>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Aboneliğiniz başarıyla oluşturuldu!</p>
          <p>Artık premium özelliklerin keyfini çıkarabilirsiniz.</p>
        </div>
      )}

      {canceled && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          <p>Ödeme işlemi iptal edildi veya tamamlanmadı.</p>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 text-white">
            <h2 className="text-2xl font-bold">Premium Paket</h2>
            <p className="mt-2 opacity-90">Tüm özelliklere sınırsız erişim</p>
            <div className="mt-4">
              <span className="text-3xl font-bold">149.99 ₺</span>
              <span className="ml-1 opacity-90">/ay</span>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Premium Özellikleri</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Sınırsız ürün takibi</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Gelişmiş son kullanma tarihi bildirimleri</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Özelleştirilebilir etiketler ve kategoriler</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Detaylı beslenme analizleri</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Akıllı alışveriş listesi oluşturma</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>10 kişiye kadar aile hesabı paylaşımı</span>
              </li>
            </ul>

            <div className="mt-8">
              {isLoading ? (
                <button
                  disabled
                  className="w-full py-3 px-6 text-white bg-gray-400 rounded-md shadow-md"
                >
                  Yükleniyor...
                </button>
              ) : isActive ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-md transition-colors"
                >
                  {isSubmitting ? 'İşleniyor...' : 'Aboneliği Yönet'}
                </button>
              ) : (
                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-md transition-colors"
                >
                  {isSubmitting ? 'İşleniyor...' : 'Hemen Abone Ol'}
                </button>
              )}
            </div>

            {isActive && (
              <div className="mt-4 text-center text-sm text-green-600">
                Aktif aboneliğiniz bulunmaktadır. 
                <br />
                Bitiş tarihi: {subscription && new Date(subscription.current_period_end).toLocaleDateString('tr-TR')}
              </div>
            )}

            <div className="mt-4 text-center text-xs text-gray-500">
              <p>Aboneliğinizi istediğiniz zaman iptal edebilirsiniz.</p>
              <p>Kredi kartı bilgileriniz güvenli bir şekilde Stripe tarafından saklanır.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 