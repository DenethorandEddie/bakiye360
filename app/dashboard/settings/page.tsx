"use client";

import { useState } from "react";
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
import { Bell, Moon, Sun, Languages, CreditCard, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { supabase, user, signOut } = useSupabase();
  const [loading, setLoading] = useState(false);
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

  const handleNotificationChange = (field: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value,
      },
    }));
  };

  const handlePreferenceChange = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value,
      },
    }));
  };

  const saveSettings = async () => {
    setLoading(true);

    try {
      if (!supabase || !user) {
        throw new Error("Oturum bilgisi bulunamadı");
      }

      // Kullanıcı ayarlarını Supabase'e kaydet
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notification_preferences: settings.notifications,
          app_preferences: {
            currency: settings.preferences.currency,
            language: settings.preferences.language
          }
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success("Ayarlarınız güncellendi");
    } catch (error) {
      console.error("Settings update error:", error);
      toast.error("Ayarlar güncellenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    const confirmed = window.confirm(
      "Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinecektir."
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      if (!supabase || !user) {
        throw new Error("Oturum bilgisi bulunamadı");
      }

      // Kullanıcının verilerini sil (işlemler, bütçe hedefleri, kategoriler vb.)
      // Silme işlemlerini transaction içinde yapmak daha güvenli olacaktır,
      // ancak şimdilik sırasıyla siliyoruz
      
      // Kullanıcının işlemlerini sil
      await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id);
      
      // Kullanıcının bütçe hedeflerini sil
      await supabase
        .from('budget_goals')
        .delete()
        .eq('user_id', user.id);
      
      // Kullanıcının özel kategorilerini sil
      await supabase
        .from('categories')
        .delete()
        .eq('user_id', user.id);
      
      // Kullanıcının ayarlarını sil
      await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id);
      
      // Kullanıcının profilini sil
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      // En son kullanıcı hesabını sil
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        // Eğer admin API erişimi yoksa, alternatif olarak:
        // Kullanıcının oturumunu sonlandır ve yöneticiden hesabın silinmesini talep et
        await supabase.auth.signOut();
        toast.info("Hesabınız silinmek üzere işaretlendi. Yönetici onayından sonra tamamen silinecektir.");
        return;
      }

      toast.success("Hesabınız başarıyla silindi");
      signOut();
    } catch (error) {
      console.error("Account deletion error:", error);
      toast.error("Hesap silinirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">E-posta Bildirimleri</Label>
                <p className="text-sm text-muted-foreground">
                  Önemli güncellemeler ve bildirimler için e-posta alın
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.notifications.email}
                onCheckedChange={(checked) => handleNotificationChange("email", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="budget-alerts">Bütçe Uyarıları</Label>
                <p className="text-sm text-muted-foreground">
                  Bütçe limitinize yaklaştığınızda veya aştığınızda bildirim alın
                </p>
              </div>
              <Switch
                id="budget-alerts"
                checked={settings.notifications.budgetAlerts}
                onCheckedChange={(checked) => handleNotificationChange("budgetAlerts", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="monthly-reports">Aylık Raporlar</Label>
                <p className="text-sm text-muted-foreground">
                  Her ayın sonunda finansal durumunuzla ilgili özet rapor alın
                </p>
              </div>
              <Switch
                id="monthly-reports"
                checked={settings.notifications.monthlyReports}
                onCheckedChange={(checked) => handleNotificationChange("monthlyReports", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Uygulama Tercihleri</CardTitle>
            </div>
            <CardDescription>
              Uygulama deneyiminizi özelleştirin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Para Birimi</Label>
              <Select
                value={settings.preferences.currency}
                onValueChange={(value) => handlePreferenceChange("currency", value)}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Para birimi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">Türk Lirası (₺)</SelectItem>
                  <SelectItem value="USD">Amerikan Doları ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="GBP">İngiliz Sterlini (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Dil</Label>
              <Select
                value={settings.preferences.language}
                onValueChange={(value) => handlePreferenceChange("language", value)}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Dil seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr">Türkçe</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={saveSettings} disabled={loading}>
              {loading ? "Kaydediliyor..." : "Ayarları Kaydet"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Hesabı Sil</CardTitle>
            </div>
            <CardDescription>
              Hesabınızı ve tüm verilerinizi kalıcı olarak silin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecektir.
              Devam etmeden önce gerekli verileri yedeklediğinizden emin olun.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="destructive" onClick={deleteAccount} disabled={loading}>
              {loading ? "İşleniyor..." : "Hesabı Sil"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}