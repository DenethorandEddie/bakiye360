"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { loadStripe } from "@stripe/stripe-js";
import { CheckCircle, XCircle, Loader2, CreditCard, Sparkles, Shield, Clock, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

// Stripe promise dışarıda oluşturuluyor (her render'da yeniden oluşturulmaması için)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

export default function SubscriptionPage() {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [subscribeLoading, setSubscribeLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
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
          setError("Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.");
          setLoading(false);
          return;
        }
        
        setUserId(user.id);
        
        // Kullanıcının abonelik durumunu kontrol et
        const { data: subscription, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, diğer hataları kontrol et
          console.error("Abonelik durumu alınamadı:", subscriptionError);
          setError("Abonelik durumu kontrol edilirken bir hata oluştu.");
          setLoading(false);
          return;
        }
        
        if (subscription) {
          setIsPremium(subscription.status === 'active');
          setSubscriptionId(subscription.id);
        } else {
          setIsPremium(false);
          setSubscriptionId(null);
        }
        
      } catch (error) {
        console.error("Beklenmeyen bir hata oluştu:", error);
        setError("Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    }
    
    checkSubscriptionStatus();
    
    // Başarılı ödeme durumunda da abonelik durumunu kontrol et
    const success = searchParams.get('success');
    if (success === 'true') {
      // Kısa bir gecikme ekleyerek webhook'un işlenmesi için zaman tanı
      const timer = setTimeout(() => {
        checkSubscriptionStatus();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [supabase, searchParams]);
  
  const handleSubscribe = async () => {
    if (!userId) {
      toast.error("Kullanıcı bilgilerinize erişilemedi. Lütfen tekrar giriş yapın.");
      return;
    }
    
    setSubscribeLoading(true);
    
    try {
      // Stripe Checkout oturumu oluştur
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ödeme işlemi başlatılamadı.");
      }
      
      const data = await response.json();
      
      // Stripe'ı yükle ve ödeme sayfasına yönlendir
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe yüklenemedi.");
      }
      
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
      
      if (error) {
        throw new Error(error.message || "Ödeme sayfasına yönlendirme başarısız oldu.");
      }
      
    } catch (error) {
      console.error("Ödeme işlemi hatası:", error);
      toast.error(error instanceof Error ? error.message : "Ödeme işlemi sırasında bir hata oluştu.");
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
      
      // Başarılı yanıt
      setIsPremium(false);
      toast.success("Aboneliğiniz başarıyla iptal edildi. Mevcut dönem sonuna kadar premium özelliklerden yararlanabilirsiniz.");
      
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
      answer: "Tüm verileriniz korunur, ancak bazı premium özelliklere erişiminiz sınırlanır. Örneğin, 30'dan fazla işlem giremezsiniz ve özel kategorileriniz görüntülenebilir ancak yeni özel kategori ekleyemezsiniz."
    },
    {
      question: "Aynı anda birden fazla cihazda kullanabilir miyim?",
      answer: "Evet, premium hesabınızla istediğiniz kadar cihazda giriş yapabilir ve tüm özelliklerden yararlanabilirsiniz. Aboneliğiniz cihaza değil, hesabınıza bağlıdır."
    },
    {
      question: "Aboneliğim otomatik olarak yenilenir mi?",
      answer: "Evet, premium aboneliğiniz her ay otomatik olarak yenilenir. İstediğiniz zaman aboneliğinizi iptal edebilirsiniz."
    }
  ];
  
  const toggleFaq = (index: number) => {
    if (openFaqIndex === index) {
      setOpenFaqIndex(null);
    } else {
      setOpenFaqIndex(index);
    }
  };
  
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
                    <span>Temel bütçe yönetimi</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Temel raporlar ve grafikler</span>
                  </div>
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-destructive mr-2" />
                    <span className="text-muted-foreground">Özelleştirilmiş analiz ve tahminler</span>
                  </div>
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-destructive mr-2" />
                    <span className="text-muted-foreground">Sınırsız işlem girişi</span>
                  </div>
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-destructive mr-2" />
                    <span className="text-muted-foreground">E-posta bildirimleri</span>
                  </div>
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-destructive mr-2" />
                    <span className="text-muted-foreground">Öncelikli destek</span>
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
                    <span>Gelişmiş bütçe yönetimi</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Detaylı analiz raporları</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Özelleştirilmiş bildirimler</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Veri yedekleme ve dışa aktarma</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>7/24 öncelikli destek</span>
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
                      onClick={handleSubscribe}
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
            <h2 className="text-2xl font-semibold mb-6">Paket Karşılaştırması</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Özellik</th>
                    <th className="text-center p-4">Ücretsiz</th>
                    <th className="text-center p-4">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4">Aylık İşlem Limiti</td>
                    <td className="text-center p-4">30</td>
                    <td className="text-center p-4">Sınırsız</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Bütçe Hedefleri</td>
                    <td className="text-center p-4">Maksimum 3</td>
                    <td className="text-center p-4">Sınırsız</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Harcama Kategorileri</td>
                    <td className="text-center p-4">Standart Kategoriler</td>
                    <td className="text-center p-4">Özel Kategoriler</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Raporlar ve Grafikler</td>
                    <td className="text-center p-4">Temel</td>
                    <td className="text-center p-4">Gelişmiş</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">E-posta Bildirimleri</td>
                    <td className="text-center p-4">
                      <XCircle className="h-5 w-5 text-destructive mx-auto" />
                    </td>
                    <td className="text-center p-4">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Veri Yedekleme</td>
                    <td className="text-center p-4">
                      <XCircle className="h-5 w-5 text-destructive mx-auto" />
                    </td>
                    <td className="text-center p-4">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4">Öncelikli Destek</td>
                    <td className="text-center p-4">
                      <XCircle className="h-5 w-5 text-destructive mx-auto" />
                    </td>
                    <td className="text-center p-4">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-12 bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-6">Sıkça Sorulan Sorular</h2>
            <div className="space-y-4">
              {faqItems.map((faq, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg overflow-hidden"
                >
                  <button
                    className="w-full p-4 flex justify-between items-center bg-card hover:bg-muted/50 transition-colors"
                    onClick={() => toggleFaq(index)}
                  >
                    <h3 className="text-lg font-medium text-left">{faq.question}</h3>
                    {openFaqIndex === index ? 
                      <ChevronUp className="h-5 w-5 flex-shrink-0" /> : 
                      <ChevronDown className="h-5 w-5 flex-shrink-0" />
                    }
                  </button>
                  {openFaqIndex === index && (
                    <div className="p-4 bg-muted/20 border-t">
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 