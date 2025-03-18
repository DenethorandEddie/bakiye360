'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSubscriptionContext } from '@/app/context/SubscriptionContext';
import { useSupabase } from '@/components/supabase-provider';

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPremium, subscriptionEndDate, refreshSubscription } = useSubscriptionContext();
  const { user } = useSupabase();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [manualRefreshNeeded, setManualRefreshNeeded] = useState(false);

  // Debug bilgilerini göster
  useEffect(() => {
    console.log("Account sayfası durumu:", {
      isPremium,
      user: user ? 'Var' : 'Yok',
      loading,
      refreshing,
      retryCount,
      success: searchParams?.get('success'),
      manualRefreshNeeded
    });
  }, [isPremium, user, loading, refreshing, retryCount, searchParams, manualRefreshNeeded]);

  // Kimlik doğrulama kontrolü
  useEffect(() => {
    // Kullanıcı oturum açmamışsa ve kontrol tamamlanmışsa
    if (!user && !loading) {
      console.log("Kullanıcı oturum açmadı, giriş sayfasına yönlendiriliyor");
      router.push('/login?redirect=/dashboard/account' + (searchParams?.get('success') ? '?success=true' : ''));
    }
  }, [user, loading, router, searchParams]);

  // Başarı parametresi varsa manuel yenileme gerektiğini ayarla
  useEffect(() => {
    if (searchParams?.get('success') === 'true') {
      setShowSuccess(true);
      // URL'den success parametresini kaldır (geçmişi değiştirmeden)
      window.history.replaceState({}, '', '/dashboard/account');
    }
  }, [searchParams]);

  // Abonelik kontrolü
  useEffect(() => {
    if (!user) return;

    const checkSubscription = async () => {
      try {
        setLoading(true);
        
        // Ödeme başarı durumunu kontrol et
        if (showSuccess) {
          setRefreshing(true);
          
          console.log("Abonelik durumu yenileniyor...");
          await refreshSubscription();
          
          // 3 saniye bekle ve sayfayı yenile
          setTimeout(() => {
            console.log("Sayfa yenileniyor...");
            window.location.reload();
          }, 3000);
          
          return; // Diğer işlemleri yapma
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Abonelik kontrolünde hata:", error);
        setLoading(false);
        setRefreshing(false);
        setManualRefreshNeeded(true);
      }
    };

    checkSubscription();
  }, [user, showSuccess, refreshSubscription]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Bilinmiyor';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  // Manuel yenileme fonksiyonu
  const handleManualRefresh = () => {
    window.location.reload();
  };

  // Yükleme ekranı
  if (loading || refreshing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-600">
            {!user ? 'Oturum kontrol ediliyor...' : 
             refreshing ? 'Abonelik bilgileriniz güncelleniyor...' : 'Yükleniyor...'}
          </p>
          {refreshing && (
            <p className="text-sm text-gray-500 mt-2">
              Bu işlem birkaç saniye sürebilir...
            </p>
          )}
          {manualRefreshNeeded && (
            <button 
              onClick={handleManualRefresh}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Sayfayı Yenile
            </button>
          )}
        </div>
      </div>
    );
  }

  // Kullanıcı yoksa veya yüklenme tamamlanmadıysa içerik gösterme
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Oturum bilgileri yüklenemedi.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Hesap Bilgilerim</h1>
      
      {showSuccess && isPremium && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            <span className="font-medium">Ödeme başarıyla tamamlandı! Premium hesabınız aktifleştirildi.</span>
          </div>
        </div>
      )}
      
      {showSuccess && !isPremium && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm0 8a1 1 0 10-2 0 1 1 0 102 0z" clipRule="evenodd"></path>
            </svg>
            <span className="font-medium">Ödemeniz alındı, fakat abonelik henüz aktifleştirilmedi.</span>
          </div>
          <button 
            onClick={handleManualRefresh}
            className="mt-2 px-3 py-1 bg-yellow-200 text-yellow-800 text-sm rounded hover:bg-yellow-300"
          >
            Durumu Kontrol Et
          </button>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Abonelik Bilgileri</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 mb-1">Abonelik Durumu</p>
            <p className="font-medium">
              {isPremium ? (
                <span className="text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  Premium (Aktif)
                </span>
              ) : (
                <span className="text-gray-600">Temel Plan</span>
              )}
            </p>
          </div>
          
          {isPremium && (
            <div>
              <p className="text-gray-600 mb-1">Abonelik Bitiş Tarihi</p>
              <p className="font-medium">{formatDate(subscriptionEndDate || '')}</p>
            </div>
          )}
        </div>
        
        {!isPremium && !showSuccess && (
          <div className="mt-4">
            <button
              onClick={() => router.push('/pricing')}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Premium'a Yükselt
            </button>
          </div>
        )}
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Hesap Yönetimi</h2>
        
        <div className="space-y-4">
          <button
            onClick={() => router.push('/dashboard/profile')}
            className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200 text-left"
          >
            Profil Bilgilerimi Düzenle
          </button>
          
          {isPremium && (
            <button
              onClick={() => router.push('/dashboard/settings')}
              className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200 text-left"
            >
              Abonelik Ayarlarım
            </button>
          )}
          
          <button
            className="w-full bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200 text-left"
            onClick={() => confirm('Hesabınızı silmek istediğinize emin misiniz?')}
          >
            Hesabımı Sil
          </button>
        </div>
      </div>
    </div>
  );
} 