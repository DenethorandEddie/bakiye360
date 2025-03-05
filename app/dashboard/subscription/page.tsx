"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { loadStripe } from "@stripe/stripe-js";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

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
  
  const supabase = createClientComponentClient();

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
  }, [supabase]);
  
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
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Abonelik Paketleri</h1>
      
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
            <Card className={`border-2 ${isPremium ? "border-primary" : "border-border"}`}>
              <CardHeader>
                <CardTitle>Premium Paket</CardTitle>
                <CardDescription>Gelişmiş finansal analiz ve planlama</CardDescription>
                <div className="mt-2 text-3xl font-bold">₺29.99 <span className="text-sm font-normal">/ay</span></div>
              </CardHeader>
              <CardContent>
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
                    <span>Yapay zeka destekli tahminler</span>
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
                    </>
                  ) : (
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
                      ) : "Premium'a Yükselt"}
                    </Button>
                  )}
                </div>
              </CardContent>
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
                    <td className="p-4">Yapay Zeka Tahminleri</td>
                    <td className="text-center p-4">
                      <XCircle className="h-5 w-5 text-destructive mx-auto" />
                    </td>
                    <td className="text-center p-4">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
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
          
          <div className="mt-12 bg-muted p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Sıkça Sorulan Sorular</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Premium pakete nasıl geçiş yapabilirim?</h3>
                <p className="text-muted-foreground">Premium'a Yükselt düğmesine tıklayarak güvenli ödeme sayfasına yönlendirileceksiniz. Ödemenizi kredi kartı veya banka kartı ile güvenle yapabilirsiniz.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Aboneliğimi istediğim zaman iptal edebilir miyim?</h3>
                <p className="text-muted-foreground">Evet, aboneliğinizi istediğiniz zaman iptal edebilirsiniz. İptal işlemi anında gerçekleşir, ancak ödemiş olduğunuz süre sonuna kadar premium özelliklere erişiminiz devam eder.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Ödeme bilgilerim güvende mi?</h3>
                <p className="text-muted-foreground">Kesinlikle! Tüm ödeme işlemleri Stripe güvenli ödeme altyapısı üzerinden gerçekleştirilir. Kredi kartı bilgileriniz bizim sistemimizde saklanmaz.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Premium'dan ücretsiz pakete geçersem verilerim ne olur?</h3>
                <p className="text-muted-foreground">Tüm verileriniz korunur, ancak bazı premium özelliklere erişiminiz sınırlanır. Örneğin, 30'dan fazla işlem giremezsiniz ve özel kategorileriniz görüntülenebilir ancak yeni özel kategori ekleyemezsiniz.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 