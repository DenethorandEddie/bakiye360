"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { loadStripe } from "@stripe/stripe-js";
import { CheckCircle, XCircle, Loader2, CreditCard, Sparkles, Shield, Clock, ArrowRight, ChevronDown, ChevronUp, FileText, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

// Stripe promise dışarıda oluşturuluyor (her render'da yeniden oluşturulmaması için)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface UserSettings {
  subscription_status: string;
  stripe_subscription_id: string | null;
  subscription_period_end: string | null;
  subscription_start: string | null;
  subscription_end: string | null;
  cancel_at_period_end: boolean;
}

export default function SubscriptionPage() {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [subscribeLoading, setSubscribeLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState<boolean>(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [subscriptionPeriodEnd, setSubscriptionPeriodEnd] = useState<Date | null>(null);
  
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();

  // URL parametrelerini kontrol et
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      toast.success('Aboneliğiniz başarıyla oluşturuldu! Premium özelliklere erişebilirsiniz.');
    }
    
    if (canceled === 'true') {
      toast.error('Ödeme işlemi iptal edildi. İsterseniz daha sonra tekrar deneyebilirsiniz.');
    }
  }, [searchParams]);

  useEffect(() => {
    async function checkSubscriptionStatus() {
      setLoading(true);
      setError(null);
      
      try {
        // Önce kullanıcı bilgilerini al
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("Kullanıcı bilgileri alınamadı:", userError);
          setError("Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.");
          setLoading(false);
          return;
        }
        
        setUserId(user.id);
        console.log("Kullanıcı ID:", user.id);
        
        // 1. Birincil kaynak olarak user_settings tablosundan subscription_status'e bak
        const { data: userSettings, error: userSettingsError } = await supabase
          .from('user_settings')
          .select('subscription_status, stripe_subscription_id, subscription_period_end, subscription_start, subscription_end, cancel_at_period_end')
          .eq('user_id', user.id)
          .single();
          
        if (userSettingsError) {
          console.error("User settings bilgisi alınamadı:", userSettingsError);
          
          // User settings bulunamadıysa, aktif bir abonelik var mı kontrol et
          const { data: subscription, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('id, status, current_period_end')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();
            
          if (subscriptionError) {
            console.error("Abonelik durumu alınamadı:", subscriptionError);
            setError("Abonelik durumu kontrol edilirken bir hata oluştu.");
            setLoading(false);
            return;
          }
          
          if (subscription) {
            console.log("Aktif abonelik bulundu:", subscription);
            
            // Abonelik süresi dolmuş mu kontrol et
            const periodEnd = new Date(subscription.current_period_end);
            const now = new Date();
            
            if (periodEnd > now) {
              setIsPremium(true);
              setSubscriptionId(subscription.id);
              
              // User settings güncellemesi yap
              try {
                const response = await fetch('/api/subscription/update-status', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    user_id: user.id,
                    status: 'premium',
                    stripe_subscription_id: subscription.id
                  }),
                });
                
                if (!response.ok) {
                  console.error("Kullanıcı ayarları güncellenemedi:", await response.text());
                } else {
                  console.log("Kullanıcı ayarları güncellendi");
                }
              } catch (error) {
                console.error("Kullanıcı ayarları güncellenirken hata:", error);
              }
            } else {
              console.log("Abonelik süresi dolmuş");
              setIsPremium(false);
            }
          } else {
            console.log("Premium abonelik bulunamadı, ücretsiz kullanıcı");
            setIsPremium(false);
          }
        } else {
          // User settings bulundu
          console.log("User settings bulundu:", userSettings);
          
          if (userSettings.subscription_status === 'premium') {
            // Abonelik süresi dolmuş mu kontrol et
            if (userSettings.subscription_period_end) {
              const periodEnd = new Date(userSettings.subscription_period_end);
              const now = new Date();
              
              if (periodEnd > now) {
                console.log("Premium abonelik aktif");
                setIsPremium(true);
                setSubscriptionId(userSettings.stripe_subscription_id || null);
              } else {
                console.log("Abonelik süresi dolmuş");
                setIsPremium(false);
              }
            } else {
              console.log("Premium abonelik aktif (süre bilgisi yok)");
              setIsPremium(true);
              setSubscriptionId(userSettings.stripe_subscription_id || null);
            }
          } else {
            console.log("Kullanıcı ücretsiz pakette");
            setIsPremium(false);
          }
        }
        
        // Subscription period end bilgisini ayrıca sakla
        if (userSettings?.subscription_period_end) {
          const periodEnd = new Date(userSettings.subscription_period_end);
          setSubscriptionPeriodEnd(periodEnd);
          
          // Subscription detaylarını kaydet
          setSubscriptionDetails({
            status: userSettings.subscription_status,
            startDate: userSettings.subscription_start ? new Date(userSettings.subscription_start) : null,
            endDate: periodEnd,
            cancelAtPeriodEnd: userSettings.cancel_at_period_end || false
          });
        }
      } catch (error) {
        console.error("Abonelik durumu kontrol edilirken hata:", error);
        setError("Abonelik durumu kontrol edilirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    }
    
    checkSubscriptionStatus();
    
    // Başarılı ödeme durumunda da abonelik durumunu kontrol et
    const success = searchParams.get('success');
    if (success === 'true') {
      console.log("Başarılı ödeme sonrası abonelik durumu kontrol ediliyor");
      // 5 saniye sonra abonelik durumunu tekrar kontrol et
      setTimeout(() => checkSubscriptionStatus(), 5000);
    }
  }, [supabase, searchParams]);
  
  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setSubscribeLoading(true);
      console.log("Premium'a yükseltme işlemi başlatılıyor...");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("Kullanıcı bulunamadı");
        toast.error("Oturum bilgileriniz alınamadı. Lütfen tekrar giriş yapın.");
        return;
      }
      
      console.log("Kullanıcı ID:", user.id);
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error("Kullanıcı ayarları bulunamadı:", error);
      }

      // Stripe key kullanımını düzelt
      const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      console.log("Stripe key kontrolü:", stripeKey ? "Mevcut" : "Eksik");
      
      if (!stripeKey) {
        console.error("Stripe key bulunamadı!");
        toast.error("Ödeme sistemi yapılandırması eksik. Lütfen destek ekibiyle iletişime geçin.");
        return;
      }
      
      console.log("Stripe entegrasyonu başlatılıyor...");
      const stripe = await loadStripe(stripeKey);
      
      if (!stripe) {
        console.error("Stripe yüklenemedi!");
        toast.error("Ödeme sistemi başlatılamadı. Lütfen daha sonra tekrar deneyin.");
        return;
      }

      // API endpoint'ine istek gönder (trailing slash olmadan)
      console.log("Checkout session isteniyor...");
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          customerId: data?.stripe_customer_id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API hatası:", response.status, errorText);
        toast.error(`Ödeme sayfası oluşturulamadı. Durum kodu: ${response.status}`);
        return;
      }

      let responseData;
      try {
        responseData = await response.json();
        console.log("Session ID alındı:", responseData.sessionId);
      } catch (jsonError) {
        console.error("JSON parse hatası:", jsonError);
        toast.error("Geçersiz yanıt alındı. Lütfen daha sonra tekrar deneyin.");
        return;
      }
      
      if (!responseData.sessionId) {
        console.error("Session ID alınamadı:", responseData);
        toast.error("Ödeme oturumu oluşturulamadı. Lütfen daha sonra tekrar deneyin.");
        return;
      }
      
      // Redirect işlemi
      console.log("Stripe checkout sayfasına yönlendiriliyor...");
      const result = await stripe.redirectToCheckout({ 
        sessionId: responseData.sessionId 
      });
      
      if (result?.error) {
        console.error("Redirect hatası:", result.error);
        toast.error("Ödeme sayfasına yönlendirme başarısız oldu: " + result.error.message);
      }
    } catch (err) {
      console.error("Ödeme yönlendirme hatası:", err);
      toast.error("Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
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
  
  // Test webhook fonksiyonu - Linter hatasını düzelt
  const testWebhook = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      toast.error("Kullanıcı bilgisi bulunamadı");
      return;
    }
    
    const res = await fetch('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test' // Test imzası
      },
      body: JSON.stringify({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'test_123',
            subscription: 'sub_test',
            customer: 'cus_test',
            metadata: { userId: user.id }
          }
        }
      })
    });
    
    const result = await res.json();
    toast.info(`Test sonucu: ${result.received ? 'Başarılı' : 'Başarısız'}`);
  };
  
  // Faturaları getiren fonksiyon
  const fetchInvoices = async () => {
    if (!isPremium) return;
    
    setInvoicesLoading(true);
    try {
      const response = await fetch('/api/invoices');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Faturalar alınırken bir hata oluştu');
      }
      
      const { data } = await response.json();
      setInvoices(data || []);
    } catch (error) {
      console.error('Fatura getirme hatası:', error);
      toast.error('Faturalar alınırken bir hata oluştu');
    } finally {
      setInvoicesLoading(false);
    }
  };
  
  // Fatura indirme veya görüntüleme fonksiyonu
  const viewInvoice = (url: string | null) => {
    if (!url) {
      toast.error('Fatura erişim linki bulunamadı');
      return;
    }
    
    window.open(url, '_blank');
  };
  
  // Premium kullanıcılar için faturaları getir
  useEffect(() => {
    if (isPremium && !loading) {
      fetchInvoices();
    }
  }, [isPremium, loading]);
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Abonelik Paketleri</h1>
      <p className="text-muted-foreground mb-8">Finansal hedeflerinize ulaşmak için ihtiyacınıza en uygun planı seçin.</p>
      
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Abonelik durumu kontrol ediliyor...</span>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 p-4 rounded-md text-destructive mb-8">
          <p>{error}</p>
          <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
            Tekrar Dene
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Ücretsiz Paket */}
            <Card className={`border-2 ${!isPremium ? "border-primary" : "border-border"}`}>
              <CardHeader>
                <CardTitle>Ücretsiz Paket</CardTitle>
                <CardDescription>Temel finansal yönetim özellikleri</CardDescription>
                <div className="mt-2 text-3xl font-bold">₺0 <span className="text-sm font-normal">/ay</span></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Aylık 30 işlem girişi</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>1 bütçe hedefi oluşturma</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Temel gelir-gider raporları</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Temel harcama kategorileri</span>
                  </div>
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-destructive mr-2" />
                    <span className="text-muted-foreground">Sınırsız işlem girişi</span>
                  </div>
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-destructive mr-2" />
                    <span className="text-muted-foreground">Sınırsız bütçe hedefi</span>
                  </div>
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-destructive mr-2" />
                    <span className="text-muted-foreground">Gelişmiş kategorilere erişim</span>
                  </div>
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-destructive mr-2" />
                    <span className="text-muted-foreground">Gelişmiş analiz grafikleri</span>
                  </div>
                </div>
                
                {!isPremium && (
                  <div className="mt-6">
                    <div className="bg-primary/10 p-3 rounded-md text-primary text-center text-sm mb-4">
                      Şu anda Ücretsiz Paketi kullanıyorsunuz
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Premium Paket */}
            <Card className={`border-2 ${isPremium ? "border-primary" : "border-border"} relative overflow-hidden shadow-lg`}>
              {!isPremium && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg shadow-sm">
                  Önerilen
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 pointer-events-none"></div>
              <CardHeader className="relative">
                <CardTitle>Premium Paket</CardTitle>
                <CardDescription>Gelişmiş finansal analiz ve planlama</CardDescription>
                <div className="mt-2 text-3xl font-bold">₺149.99 <span className="text-sm font-normal">/ay</span></div>
              </CardHeader>
              <CardContent className="relative pb-0">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Sınırsız işlem girişi</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Sınırsız bütçe hedefi oluşturma</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Detaylı finansal raporlar ve grafikler</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Tüm kategorilere tam erişim</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Harcama tahmin ve analizi</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Tekrarlayan işlem takibi</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Veri yedekleme ve dışa aktarma</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Öncelikli destek ve güncellemeler</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  {isPremium ? (
                    <>
                      <div className="bg-primary/10 p-3 rounded-md text-primary text-center text-sm mb-4">
                        Premium Paketi kullanıyorsunuz
                      </div>
                    </>
                  ) : null}
                </div>
              </CardContent>
              <CardFooter className="relative pt-4 flex flex-col gap-3">
                {isPremium ? (
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleCancelSubscription}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        İptal Ediliyor...
                      </>
                    ) : "Aboneliği İptal Et"}
                  </Button>
                ) : (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={handleUpgrade}
                      disabled={subscribeLoading}
                    >
                      {subscribeLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          İşleniyor...
                        </>
                      ) : (
                        <>
                          Premium'a Yükselt
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <div className="flex items-center justify-center w-full gap-4 px-4 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <CreditCard className="h-3 w-3 mr-1" />
                        Güvenli Ödeme
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        İptal Kolaylığı
                      </div>
                    </div>
                  </>
                )}
              </CardFooter>
            </Card>
          </div>
          
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Sıkça Sorulan Sorular</h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg overflow-hidden"
                >
                  <button
                    className="flex justify-between items-center w-full p-4 text-left bg-card hover:bg-muted/50 transition-colors"
                    onClick={() => toggleFaq(index)}
                  >
                    <span className="font-medium">{item.question}</span>
                    {openFaqIndex === index ? (
                      <ChevronUp className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  
                  {openFaqIndex === index && (
                    <div className="p-4 bg-muted/30 border-t">
                      <p className="text-muted-foreground">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Abonelik sorun giderme paneli */}
          <div className="mt-12 border border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-orange-800 dark:text-orange-400">Abonelik Sorun Giderme</h2>
            <p className="text-orange-700 dark:text-orange-300 mb-4">
              Eğer ödeme yaptığınız halde premium abonelik özelliklerine erişemiyorsanız, abonelik durumunuzu manuel olarak güncelleyebilirsiniz.
            </p>
            
            <div className="bg-white dark:bg-gray-900 p-4 rounded-md border border-orange-200 dark:border-orange-900 mb-4">
              <h3 className="font-medium text-lg mb-2">Premium Abonelik Durumunu Güncelle</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Bu işlem, abonelik sistemiyle ilgili bir sorun yaşadığınızda ve ödeme yaptığınız halde premium özelliklerine erişemediğinizde kullanılmalıdır.
              </p>
              
              <Button
                onClick={async () => {
                  if (!userId) {
                    toast.error("Kullanıcı bilgisi bulunamadı");
                    return;
                  }
                  
                  const confirm = window.confirm(
                    "Abonelik durumunuzu premium olarak güncellemek istediğinizden emin misiniz? Bu işlem sadece ödeme yaptığınız halde aboneliğiniz güncellenmediyse kullanılmalıdır."
                  );
                  
                  if (!confirm) return;
                  
                  try {
                    setSubscribeLoading(true);
                    
                    const response = await fetch('/api/subscription/update-status', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        userId: userId,
                        status: 'premium'
                      })
                    });
                    
                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.error || "Abonelik güncellenemedi");
                    }
                    
                    const data = await response.json();
                    toast.success("Abonelik durumunuz premium olarak güncellendi!");
                    
                    // Sayfayı yeniden yükle
                    setTimeout(() => {
                      window.location.reload();
                    }, 2000);
                    
                  } catch (error) {
                    console.error("Abonelik güncelleme hatası:", error);
                    toast.error(error instanceof Error ? error.message : "Abonelik güncellenirken bir hata oluştu");
                  } finally {
                    setSubscribeLoading(false);
                  }
                }}
                variant="default"
                className="w-full"
                disabled={loading}
              >
                {loading ? "İşleniyor..." : "Abonelik Durumumu Güncelle"}
              </Button>
              <p className="text-xs text-red-600 dark:text-red-400 mt-3">
                Not: Bu işlem sadece ödeme yaptığınız halde abonelik durumunuz güncellenmediyse kullanılmalıdır.
                Yardıma ihtiyacınız varsa lütfen destek ekibimizle iletişime geçin.
              </p>
            </div>
          </div>
          
          {/* Fatura tablosu - sadece premium kullanıcılara göster */}
          {isPremium && (
            <div className="mt-12">
              <h2 className="text-2xl font-semibold mb-4">Fatura Geçmişi</h2>
              <p className="text-muted-foreground mb-4">
                Ödeme geçmişinizi görüntüleyin ve faturalarınızı indirin.
              </p>
              
              {invoicesLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Faturalar alınıyor...</span>
                </div>
              ) : invoices.length === 0 ? (
                <div className="bg-muted/20 p-6 rounded-lg text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">Henüz faturanız bulunmuyor</h3>
                  <p className="text-muted-foreground mt-1">
                    Ödeme yaptıktan sonra faturalarınız burada listelenecektir.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Tarih
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Tutar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Dönem
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(invoice.created * 1000).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Intl.NumberFormat('tr-TR', {
                              style: 'currency',
                              currency: invoice.currency.toUpperCase(),
                            }).format(invoice.amount_paid)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                              ${invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                              {invoice.status === 'paid' ? 'Ödendi' : invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {invoice.period_start && invoice.period_end ? (
                              <>
                                {new Date(invoice.period_start).toLocaleDateString('tr-TR')} - {' '}
                                {new Date(invoice.period_end).toLocaleDateString('tr-TR')}
                              </>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewInvoice(invoice.hosted_invoice_url)}
                              title="Görüntüle"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewInvoice(invoice.pdf_url)}
                              title="PDF İndir"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Fatura ile ilgili sorularınız için lütfen <a href="mailto:destek@bakiye360.com" className="text-primary hover:underline">destek@bakiye360.com</a> adresine e-posta gönderin.</p>
              </div>
            </div>
          )}
          
          {/* Premium kullanıcılar için abonelik detayları kartı */}
          {isPremium && subscriptionDetails && (
            <div className="mt-8 bg-card p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">Abonelik Detayları</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Abonelik Durumu:</span>
                  <span className="font-medium">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Premium
                    </span>
                  </span>
                </div>
                
                {subscriptionDetails.startDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Başlangıç Tarihi:</span>
                    <span className="font-medium">
                      {subscriptionDetails.startDate.toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                )}
                
                {subscriptionPeriodEnd && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Yenileme Tarihi:</span>
                    <span className="font-medium">
                      {subscriptionPeriodEnd.toLocaleDateString('tr-TR')}
                      {subscriptionDetails.cancelAtPeriodEnd && 
                        " (İptal edildi, bu tarihte sonlanacak)"}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Otomatik Yenileme:</span>
                  <span className="font-medium">
                    {subscriptionDetails.cancelAtPeriodEnd ? 
                      <span className="text-destructive">Kapalı</span> : 
                      <span className="text-green-600 dark:text-green-400">Açık</span>}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Abonelik Ayarları</h3>
                <div className="space-x-2">
                  {!subscriptionDetails.cancelAtPeriodEnd && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCancelSubscription}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          İptal Ediliyor...
                        </>
                      ) : "Aboneliği İptal Et"}
                    </Button>
                  )}
                  
                  {subscriptionDetails.cancelAtPeriodEnd && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        // İptal edilmiş aboneliği yeniden aktifleştir
                        if (!subscriptionId) {
                          toast.error("Abonelik bilgisi bulunamadı.");
                          return;
                        }
                        
                        setCancelLoading(true);
                        
                        try {
                          const response = await fetch('/api/reactivate-subscription', {
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
                            throw new Error(errorData.error || "Abonelik yenilenemiyor.");
                          }
                          
                          toast.success("Aboneliğiniz başarıyla yenilendi. Otomatik yenileme tekrar aktif.");
                          
                          // Sayfayı yeniden yükle
                          setTimeout(() => {
                            window.location.reload();
                          }, 2000);
                          
                        } catch (error) {
                          console.error("Abonelik yenileme hatası:", error);
                          toast.error(error instanceof Error ? error.message : "Abonelik yenilenirken bir hata oluştu.");
                        } finally {
                          setCancelLoading(false);
                        }
                      }}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          İşleniyor...
                        </>
                      ) : "Aboneliği Yenile"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 