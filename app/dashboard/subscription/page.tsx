"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { loadStripe } from "@stripe/stripe-js";
import { CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// Stripe promise dışarıda oluşturuluyor (her render'da yeniden oluşturulmaması için)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface UserSettings {
  subscription_status: string;
  stripe_subscription_id: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  email_notifications: boolean;
  budget_alerts: boolean;
  monthly_reports: boolean;
}

// Tarih formatını düzenle
const formatDate = (dateString: string | null) => {
  if (!dateString) return "Tarih bilgisi bulunamadı";
  
  try {
    const date = new Date(dateString);
    // Geçerli bir tarih mi kontrol et
    if (isNaN(date.getTime())) {
      console.error("Geçersiz tarih formatı:", dateString);
      return "Geçersiz tarih formatı";
    }
    
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error("Tarih formatlanırken hata:", error);
    return "Tarih işlenemedi";
  }
};

export default function SubscriptionPage() {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [subscribeLoading, setSubscribeLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [subscriptionPeriodEnd, setSubscriptionPeriodEnd] = useState<Date | null>(null);
  
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();

  // URL parametrelerini kontrol et
  useEffect(() => {
    if (searchParams) {
      const success = searchParams.get('success');
      const canceled = searchParams.get('canceled');
      
      if (success === 'true') {
        toast.success('Aboneliğiniz başarıyla oluşturuldu! Premium özelliklere erişebilirsiniz.');
      }
      
      if (canceled === 'true') {
        toast.error('Ödeme işlemi iptal edildi. İsterseniz daha sonra tekrar deneyebilirsiniz.');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const checkStatus = async () => {
      await checkSubscriptionStatus();
      if (searchParams && searchParams.get('success') === 'true') {
        // 3 kez kontrol et (5sn aralıklarla)
        let retries = 0;
        const interval = setInterval(async () => {
          if (retries >= 3) clearInterval(interval);
          await checkSubscriptionStatus();
          retries++;
        }, 5000);
      }
    };
    checkStatus();
  }, [supabase, searchParams]);

  async function checkSubscriptionStatus() {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Kullanıcı bilgileri alınamadı.");
        return;
      }
      
      setUserId(user.id);
      
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userSettings?.subscription_status === 'premium') {
        // Premium kullanıcı için bildirimleri aç
        await supabase
          .from('user_settings')
          .update({
            email_notifications: true,
            budget_alerts: true,
            monthly_reports: true
          })
          .eq('user_id', user.id);
        
        setIsPremium(true);
        setSubscriptionId(userSettings.stripe_subscription_id);
      } else {
        // Ücretsiz kullanıcı için bildirimleri kapat
        await supabase
          .from('user_settings')
          .update({
            email_notifications: false,
            budget_alerts: false,
            monthly_reports: false
          })
          .eq('user_id', user.id);
        
        setIsPremium(false);
      }
    } catch (error) {
      console.error("Abonelik durumu kontrol hatası:", error);
      setError("Abonelik durumu alınamadı");
    } finally {
      setLoading(false);
    }
  }

  const handleUpgrade = async () => {
    try {
      setSubscribeLoading(true);
      setError(null);
      
      if (!userId) {
        toast.error("Kullanıcı bilgileri yüklenemedi. Lütfen tekrar giriş yapın.");
        return;
      }
      
      // ÖNEMLİ: Gerçek Stripe ödeme akışını kullan
      try {
        console.log("Premium yükseltme isteği gönderiliyor - Fiyat ID:", process.env.NEXT_PUBLIC_STRIPE_PRICE_ID);
        
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId: 'price_1R2yjaGUPk4i0W9umpqRqn9c' // Sabit price ID kullanıyoruz
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Ödeme hatası detayları:", errorData);
          throw new Error(errorData.error || "Ödeme sayfası oluşturulurken bir hata oluştu.");
        }
        
        const { url, sessionId } = await response.json();
        
        if (!url) {
          throw new Error("Ödeme URL'si oluşturulamadı");
        }
        
        console.log("Ödeme sayfasına yönlendiriliyor:", url);
        
        // Kullanıcıyı Stripe ödeme sayfasına yönlendir
        window.location.href = url;
        return;
      } catch (error: any) {
        console.error("Stripe checkout hatası:", error);
        setError(error.message || "Ödeme sayfası oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
        toast.error("Ödeme sayfası açılamadı. Lütfen daha sonra tekrar deneyin.");
      }
    } catch (error: any) {
      console.error("Yükseltme hatası:", error);
      setError(error.message || "Premium yükseltme sırasında bir hata oluştu.");
    } finally {
      setSubscribeLoading(false);
    }
  };
  
  const handleCancelSubscription = async () => {
    if (!subscriptionId) {
      toast.error("Abonelik bilgisi bulunamadı.");
      return;
    }
    
    setCancelLoading(true);
    
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Abonelik iptal edilemedi.");
      }
      
      // Abonelik iptal edildikten sonra user_settings tablosunu güncelle
      // Not: Abonelik süresi dolana kadar kullanıcı premium olarak kalacak
      // Ancak cancel_at_period_end bayrağı true olacak
      if (userId) {
        try {
          // User settings tablosunu doğrudan güncelleme yapmıyoruz çünkü kullanıcı
          // dönem sonuna kadar premium kalacak. Bu, subscriptions güncellendikçe
          // webhook ile otomatik olarak güncellenecek.
          
          // Ancak aboneliğin iptal edildiğine dair bir bildirim ekleyelim
          await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              title: 'Aboneliğiniz İptal Edildi',
              content: 'Aboneliğiniz başarıyla iptal edildi. Mevcut ödeme dönem sonuna kadar premium özelliklere erişiminiz devam edecektir.',
              read: false,
              created_at: new Date().toISOString(),
              link: '/dashboard/subscription'
            });
          
          console.log("Abonelik iptal bildirimi eklendi");
        } catch (notifError) {
          console.error("Bildirim eklenirken hata:", notifError);
          // Bildirim hatası kritik değil, devam et
        }
      }
      
      // Başarılı yanıt
      // Not: Burada isPremium'u false yapmıyoruz çünkü kullanıcı dönem sonuna kadar premium kalmaya devam edecek
      // setIsPremium(false);
      toast.success("Aboneliğiniz başarıyla iptal edildi. Mevcut dönem sonuna kadar premium özelliklerden yararlanabilirsiniz.");
      
      // Abonelik durumunu güncellemek için sayfayı yeniden yükle
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error("Abonelik iptali hatası:", error);
      toast.error(error instanceof Error ? error.message : "Abonelik iptal edilirken bir hata oluştu.");
    } finally {
      setCancelLoading(false);
    }
  };

  const checkFeature = (isPremium: boolean, featureOnlyPremium: boolean) => {
    if (!featureOnlyPremium) return true; // Ücretsiz pakette de var
    return isPremium; // Premium pakette varsa true, yoksa false
  };
  
  const faqItems = [
    {
      question: "Premium pakete nasıl geçiş yapabilirim?",
      answer: "Premium'a Yükselt düğmesine tıklayarak güvenli ödeme sayfasına yönlendirileceksiniz. Ödemenizi kredi kartı veya banka kartı ile güvenle yapabilirsiniz."
    },
    {
      question: "Aboneliğimi istediğim zaman iptal edebilir miyim?",
      answer: "Evet, aboneliğinizi istediğiniz zaman iptal edebilirsiniz. İptal işlemi anında gerçekleşir, ancak ödemiş olduğunuz süre sonuna kadar premium özelliklere erişiminiz devam eder."
    },
    {
      question: "Ödeme bilgilerim güvende mi?",
      answer: "Kesinlikle! Tüm ödeme işlemleri Stripe güvenli ödeme altyapısı üzerinden gerçekleştirilir. Kredi kartı bilgileriniz bizim sistemimizde saklanmaz."
    },
    {
      question: "Premium'dan ücretsiz pakete geçersem verilerim ne olur?",
      answer: "Tüm verileriniz korunur, ancak premium özelliklere erişiminiz sınırlanır. Örneğin, aylık 30 işlem sınırı uygulanır, sadece 1 bütçe hedefi oluşturabilirsiniz ve gelişmiş kategorilere erişiminiz sınırlanır."
    },
    {
      question: "Ücretsiz paketin kısıtlamaları nelerdir?",
      answer: "Ücretsiz pakette aylık 30 işlem girişi yapabilir, maksimum 1 bütçe hedefi oluşturabilir ve sadece temel harcama kategorilerini kullanabilirsiniz. Ayrıca detaylı analiz grafikleri ve gelişmiş kategorilere erişim özellikleri premium pakette mevcuttur."
    },
    {
      question: "Aboneliğim otomatik olarak yenilenir mi?",
      answer: "Evet, premium aboneliğiniz her ay otomatik olarak yenilenir. İstediğiniz zaman aboneliğinizi iptal edebilirsiniz."
    },
    {
      question: "Premium pakette ne gibi ek özellikler var?",
      answer: "Premium pakette sınırsız işlem girişi, sınırsız bütçe hedefi oluşturma, tüm kategorilere erişim, detaylı analiz raporları, tekrarlayan işlem takibi, veri dışa aktarma ve öncelikli destek gibi özellikler bulunmaktadır."
    }
  ];
  
  const toggleFaq = (index: number) => {
    if (openFaqIndex === index) {
      setOpenFaqIndex(null);
    } else {
      setOpenFaqIndex(index);
    }
  };
  
  // Mevcut ayarları Supabase'den yükle
  useEffect(() => {
    async function loadUserSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError("Kullanıcı bilgileri alınamadı.");
          return;
        }
        
        setUserId(user.id);
        
        const { data: userSettingsData } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (userSettingsData) {
          const status = userSettingsData.subscription_status;
          
          // Abonelik durumunu subscription_status'a göre belirle
          if (status === 'premium') {
            setIsPremium(true);
            setSubscriptionId(userSettingsData.stripe_subscription_id);
            
            // Abonelik premium ise detayları ayarla
            setSubscriptionDetails({
              currentPeriodStart: userSettingsData.subscription_start_date ? String(userSettingsData.subscription_start_date) : null,
              currentPeriodEnd: userSettingsData.subscription_end_date ? String(userSettingsData.subscription_end_date) : null,
              stripeSubscriptionId: userSettingsData.stripe_subscription_id ? String(userSettingsData.stripe_subscription_id) : null
            });
          } else {
            setIsPremium(false);
            
            // Free kullanıcı için abonelik detaylarını sıfırla
            setSubscriptionDetails({
              currentPeriodStart: null,
              currentPeriodEnd: null,
              stripeSubscriptionId: null
            });
          }
        }
      } catch (error) {
        console.error("Abonelik durumu kontrol hatası:", error);
        setError("Abonelik durumu alınamadı");
      } finally {
        setLoading(false);
      }
    }
    
    loadUserSettings();
  }, [supabase]);

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Abonelik</h1>
        <p className="text-muted-foreground">
          Abonelik planınızı yönetin ve abonelik detaylarınızı görüntüleyin
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Mevcut Plan</CardTitle>
            </div>
            <CardDescription>
              Mevcut abonelik planınızı görüntüleyin veya değiştirin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">
                    {isPremium ? 'Premium' : 'Ücretsiz'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isPremium
                      ? 'Premium özelliklerden yararlanıyorsunuz'
                      : 'Temel özelliklerle sınırlısınız'}
                  </p>
                </div>
                {!isPremium && (
                  <Button onClick={handleUpgrade} disabled={subscribeLoading}>
                    {subscribeLoading ? 'Yükleniyor...' : 'Premium\'a Yükselt'}
                  </Button>
                )}
              </div>

              {isPremium && (
                <div className="mt-4 border rounded-md p-4 bg-muted/20">
                  <h4 className="font-medium mb-2">Premium Abonelik Detayları</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Abonelik başlangıç:</span>
                      <span className="text-sm font-medium">{subscriptionDetails?.currentPeriodStart ? formatDate(subscriptionDetails.currentPeriodStart) : 'Yükleniyor...'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Sonraki ödeme tarihi:</span>
                      <span className="text-sm font-medium">{subscriptionDetails?.currentPeriodEnd ? formatDate(subscriptionDetails.currentPeriodEnd) : 'Yükleniyor...'}</span>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Aboneliğiniz sonraki ödeme tarihinde otomatik olarak yenilenecektir.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {isPremium && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Premium Avantajları</CardTitle>
              </div>
              <CardDescription>
                Premium aboneliğinizin size sunduğu avantajlar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Sınırsız işlem girişi</h3>
                    <p className="text-sm text-muted-foreground">Dilediğiniz kadar gelir gider işlemi ekleyebilirsiniz</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Sınırsız bütçe hedefi</h3>
                    <p className="text-sm text-muted-foreground">İstediğiniz sayıda bütçe hedefi belirleyebilirsiniz</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Detaylı raporlar</h3>
                    <p className="text-sm text-muted-foreground">Gelir gider analizlerinizi detaylı grafiklerle takip edin</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Tüm kategoriler</h3>
                    <p className="text-sm text-muted-foreground">Gelir gider işlemlerinizi detaylı kategorilere ayırın</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Harcama analizi</h3>
                    <p className="text-sm text-muted-foreground">Harcamalarınızı analiz edin, tasarruf fırsatlarını keşfedin</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Tekrarlayan işlemler</h3>
                    <p className="text-sm text-muted-foreground">Düzenli ödemelerinizi kolayca takip edin</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Öncelikli destek</h3>
                    <p className="text-sm text-muted-foreground">Sorularınıza hızlı ve öncelikli yanıt, kesintisiz hizmet</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 