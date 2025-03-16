"use client";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import supabase from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    email: false,
    budget: false,
    reports: false
  });
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        // Kullanıcı bilgisini al
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Kullanıcı ayarlarını getir
        const { data: userSettings } = await supabase
          .from('user_settings')
          .select('subscription_status, email_notifications, budget_alerts, monthly_reports')
          .eq('user_id', user.id)
          .single();
        
        // Premium durumunu kontrol et
        setIsPremium(userSettings?.subscription_status === 'premium');
        
        // Bildirim ayarlarını ayarla
        setSettings({
          email: userSettings?.email_notifications || false,
          budget: userSettings?.budget_alerts || false,
          reports: userSettings?.monthly_reports || false
        });
      } catch (error) {
        console.error("Ayarlar yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const updateSetting = async (field: string, value: boolean) => {
    try {
      // Premium kontrolü yap
      if (!isPremium) {
        toast.error("Bu özellik sadece premium kullanıcılar için kullanılabilir");
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Kullanıcı bilgileri alınamadı");
        return;
      }
      
      // Ayarları güncelle
      const fieldMapping: Record<string, string> = {
        'email': 'email_notifications',
        'budget': 'budget_alerts',
        'reports': 'monthly_reports'
      };
      
      const { error } = await supabase
        .from('user_settings')
        .update({ [fieldMapping[field]]: value })
        .eq('user_id', user.id);
      
      if (error) {
        console.error("Ayar güncellenirken hata:", error);
        toast.error("Ayar güncellenemedi");
        return;
      }
      
      // UI'ı güncelle
      setSettings(prev => ({ ...prev, [field]: value }));
      toast.success("Bildirim ayarınız güncellendi");
    } catch (error) {
      console.error("Ayar güncellenirken hata:", error);
      toast.error("Bir hata oluştu, lütfen tekrar deneyin");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold mb-6">Bildirim Ayarları</h1>
      <p className="text-muted-foreground mb-6">
        Hangi bildirimler hakkında bilgilendirilmek istediğinizi seçin
        {!isPremium && (
          <span className="block mt-2 text-sm text-amber-600 dark:text-amber-400">
            Premium abonelik olmadan bildirim ayarlarını değiştiremezsiniz.
            <a href="/dashboard/subscription" className="underline ml-1">Premium'a yükselt</a>
          </span>
        )}
      </p>
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">E-posta Bildirimleri</h3>
          <p className="text-sm text-muted-foreground">
            Önemli güncellemeler ve bildirimler için e-posta alın
          </p>
        </div>
        <Switch 
          checked={settings.email} 
          onCheckedChange={(val) => updateSetting('email', val)}
          disabled={!isPremium}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Bütçe Uyarıları</h3>
          <p className="text-sm text-muted-foreground">
            Bütçe limitinize yaklaştığınızda veya aştığınızda bildirim alın
          </p>
        </div>
        <Switch 
          checked={settings.budget} 
          onCheckedChange={(val) => updateSetting('budget', val)}
          disabled={!isPremium}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Aylık Raporlar</h3>
          <p className="text-sm text-muted-foreground">
            Her ayın sonunda finansal durumunuzla ilgili özet rapor alın
          </p>
        </div>
        <Switch 
          checked={settings.reports} 
          onCheckedChange={(val) => updateSetting('reports', val)}
          disabled={!isPremium}
        />
      </div>
    </div>
  );
} 