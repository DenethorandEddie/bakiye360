"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/components/supabase-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, Moon, Sun, Languages, CreditCard, Trash2, BadgePlus } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { supabase, user, signOut } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("free");
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    stripeSubscriptionId: string | null;
  }>({
    currentPeriodStart: null,
    currentPeriodEnd: null,
    stripeSubscriptionId: null
  });
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      budgetAlerts: true,
      monthlyReports: true,
    },
    preferences: {
      currency: "TRY",
      language: "tr",
    },
  });

  // Mevcut ayarları Supabase'den yükle
  useEffect(() => {
    async function loadUserSettings() {
      if (!supabase || !user) {
        setSettingsLoading(false);
        return;
      }

      try {
        console.log("Kullanıcı ayarları yükleniyor...");
        
        // İlk olarak user_settings tablosundan ayarları al
        const { data: userSettingsData, error: userSettingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (userSettingsError && userSettingsError.code !== 'PGRST116') {
          console.error('Ayarlar yüklenirken hata:', userSettingsError.message);
          toast.error('Bildirim ayarları yüklenirken bir hata oluştu');
          return;
        }

        // Abonelik bilgilerini kontrol et
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();
        
        if (subscriptionData) {
          setSubscriptionStatus('premium');
          setSubscriptionDetails({
            currentPeriodStart: subscriptionData.current_period_start as string,
            currentPeriodEnd: subscriptionData.current_period_end as string,
            stripeSubscriptionId: subscriptionData.stripe_subscription_id as string
          });
        } else {
          setSubscriptionStatus('free');
        }

        // Eğer user_settings tablosunda kayıt varsa
        if (userSettingsData) {
          console.log("Mevcut kullanıcı ayarları:", userSettingsData);
          
          // Abonelik durumunu ayarla
          setSubscriptionStatus(userSettingsData.subscription_status || 'free');
          
          // Profil bilgilerini güncelle
          setSettings({
            notifications: {
              email: typeof userSettingsData.email_notifications === 'boolean' ? userSettingsData.email_notifications : true,
              budgetAlerts: typeof userSettingsData.budget_alerts === 'boolean' ? userSettingsData.budget_alerts : true,
              monthlyReports: typeof userSettingsData.monthly_reports === 'boolean' ? userSettingsData.monthly_reports : true,
            },
            preferences: {
              currency: userSettingsData.app_preferences?.currency || "TRY",
              language: userSettingsData.app_preferences?.language || "tr",
            }
          });
        } else {
          console.log("Kullanıcı ayarları bulunamadı, varsayılan değerler kullanılacak");
          
          // Varsayılan ayarlarla devam et ve veritabanına yeni kayıt oluştur
          await saveSettingsToSupabase({
            notifications: {
              email: true,
              budgetAlerts: true,
              monthlyReports: true,
            },
            preferences: {
              currency: "TRY",
              language: "tr",
            }
          });
        }
      } catch (error) {
        console.error('Ayarlar yüklenirken hata:', error);
        toast.error('Bildirim ayarları yüklenirken bir hata oluştu');
      } finally {
        setSettingsLoading(false);
      }
    }

    loadUserSettings();
  }, [supabase, user]);

  const handleNotificationChange = async (field: string, value: boolean) => {
    // Ücretsiz planda değişiklik yapılmasını engelle
    if (subscriptionStatus !== 'premium') {
      toast.error('Bu özellik yalnızca Premium abonelikle kullanılabilir.');
      return;
    }
    
    // Önce yerel state'i güncelle
    const updatedSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [field]: value,
      },
    };
    
    setSettings(updatedSettings);
    
    // Ardından Supabase'e kaydet
    await saveSettingsToSupabase(updatedSettings);
  };

  const handlePreferenceChange = async (field: string, value: string) => {
    // Önce yerel state'i güncelle
    const updatedSettings = {
      ...settings,
      preferences: {
        ...settings.preferences,
        [field]: value,
      },
    };
    
    setSettings(updatedSettings);
    
    // Ardından Supabase'e kaydet
    await saveSettingsToSupabase(updatedSettings);
  };

  const saveSettingsToSupabase = async (settingsToSave: typeof settings) => {
    if (!supabase || !user) {
      toast.error("Oturum bilgisi bulunamadı");
      return;
    }

    try {
      // Kullanıcı ayarlarını Supabase'e kaydet
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          email_notifications: settingsToSave.notifications.email,
          budget_alerts: settingsToSave.notifications.budgetAlerts,
          monthly_reports: settingsToSave.notifications.monthlyReports,
          app_preferences: {
            currency: settingsToSave.preferences.currency,
            language: settingsToSave.preferences.language,
          }
        });

      if (error) {
        console.error('Ayarlar kaydedilirken hata:', error);
        toast.error('Ayarlar kaydedilirken bir hata oluştu');
        return;
      }

      toast.success('Ayarlar başarıyla kaydedildi');
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      toast.error('Ayarlar kaydedilirken bir hata oluştu');
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    await saveSettingsToSupabase(settings);
    setLoading(false);
  };

  const deleteAccount = async () => {
    if (!supabase || !user) {
      toast.error("Oturum bilgisi bulunamadı");
      return;
    }

    // Kullanıcıdan onay al
    if (!window.confirm("Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      return;
    }

    try {
      setLoading(true);

      // Kullanıcının verilerini sil (cascade ile otomatik silinebilir veya manuel silme işlemleri)
      // Bu örnek için sadece auth.users tablosundan siliyoruz
      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) {
        throw error;
      }

      // Oturumu kapat
      await signOut();
      toast.success("Hesabınız başarıyla silindi");
      window.location.href = "/";
    } catch (error) {
      console.error('Hesap silme hatası:', error);
      toast.error('Hesabınız silinirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Tarih formatını düzenle
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Bilgi yok";
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // İçerik yüklenirken yükleme spinner'ı göster
  if (settingsLoading) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Ayarlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground">
          Uygulama tercihlerinizi ve bildirim ayarlarınızı yönetin
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Bildirim Ayarları</CardTitle>
            </div>
            <CardDescription>
              Hangi bildirimler hakkında bilgilendirilmek istediğinizi seçin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* E-posta Bildirimleri */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">E-posta Bildirimleri</Label>
                <p className="text-sm text-muted-foreground">
                  Önemli güncellemeler ve bildirimler için e-posta alın
                </p>
              </div>
              {subscriptionStatus === 'premium' ? (
                <Switch
                  id="email-notifications"
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => handleNotificationChange("email", checked)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/subscription" className="text-xs flex items-center">
                      <BadgePlus className="h-4 w-4 mr-1" />
                      Premium
                    </Link>
                  </Button>
                  <Switch disabled />
                </div>
              )}
            </div>

            {/* Bütçe Uyarıları */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="budget-alerts">Bütçe Uyarıları</Label>
                <p className="text-sm text-muted-foreground">
                  Bütçe limitinize yaklaştığınızda veya aştığınızda bildirim alın
                </p>
              </div>
              {subscriptionStatus === 'premium' ? (
                <Switch
                  id="budget-alerts"
                  checked={settings.notifications.budgetAlerts}
                  onCheckedChange={(checked) => handleNotificationChange("budgetAlerts", checked)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/subscription" className="text-xs flex items-center">
                      <BadgePlus className="h-4 w-4 mr-1" />
                      Premium
                    </Link>
                  </Button>
                  <Switch disabled />
                </div>
              )}
            </div>

            {/* Aylık Raporlar */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="monthly-reports">Aylık Raporlar</Label>
                <p className="text-sm text-muted-foreground">
                  Her ayın sonunda finansal durumunuzla ilgili özet rapor alın
                </p>
              </div>
              {subscriptionStatus === 'premium' ? (
                <Switch
                  id="monthly-reports"
                  checked={settings.notifications.monthlyReports}
                  onCheckedChange={(checked) => handleNotificationChange("monthlyReports", checked)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/subscription" className="text-xs flex items-center">
                      <BadgePlus className="h-4 w-4 mr-1" />
                      Premium
                    </Link>
                  </Button>
                  <Switch disabled />
                </div>
              )}
            </div>

            {subscriptionStatus !== 'premium' && (
              <div className="bg-primary-foreground/20 p-3 rounded-md mt-4 text-sm">
                <p>
                  E-posta bildirimleri ve hatırlatıcılar Premium pakete özel bir özelliktir.{" "}
                  <Link href="/dashboard/subscription" className="text-primary font-medium hover:underline">
                    Premium'a yükselterek bu özelliklere erişebilirsiniz
                  </Link>.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Uygulama Tercihleri</CardTitle>
            </div>
            <CardDescription>
              Uygulama için tercih ettiğiniz ayarları belirleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Dil</Label>
              <Select
                value={settings.preferences.language}
                onValueChange={(value) => handlePreferenceChange("language", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bir dil seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr">Türkçe</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Para Birimi</Label>
              <Select
                value={settings.preferences.currency}
                onValueChange={(value) => handlePreferenceChange("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bir para birimi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">Türk Lirası (₺)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="GBP">Pound Sterling (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={saveSettings} disabled={loading}>
              {loading ? "Kaydediliyor..." : "Tercihleri Kaydet"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Abonelik</CardTitle>
            </div>
            <CardDescription>
              Mevcut abonelik planınızı görüntüleyin veya değiştirin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Mevcut Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionStatus === 'premium' ? 'Premium' : 'Ücretsiz'}
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/subscription">
                    {subscriptionStatus === 'premium' ? 'Aboneliği Yönet' : 'Yükselt'}
                  </Link>
                </Button>
              </div>

              {subscriptionStatus === 'premium' && (
                <div className="mt-4 border rounded-md p-4 bg-muted/20">
                  <h4 className="font-medium mb-2">Premium Abonelik Detayları</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Abonelik başlangıç:</span>
                      <span className="text-sm font-medium">{formatDate(subscriptionDetails.currentPeriodStart)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Sonraki ödeme tarihi:</span>
                      <span className="text-sm font-medium">{formatDate(subscriptionDetails.currentPeriodEnd)}</span>
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

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Tehlikeli Bölge</CardTitle>
            </div>
            <CardDescription>
              Hesabınızı ve tüm verilerinizi kalıcı olarak silme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Hesabınızı sildiğinizde, tüm verileriniz kalıcı olarak silinecektir ve bu işlem geri alınamaz.
            </p>
            <Button variant="destructive" onClick={deleteAccount} disabled={loading}>
              {loading ? "İşleniyor..." : "Hesabımı Sil"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}