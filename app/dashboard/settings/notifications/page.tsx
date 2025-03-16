"use client";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import supabase from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    email: false,
    budget: false,
    reports: false
  });
  const [isPremium, setIsPremium] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        const { data: userSettings, error } = await supabase
          .from('user_settings')
          .select('email_notifications, budget_alerts, monthly_reports')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        if (userSettings) {
          setSettings({
            email: userSettings.email_notifications || false,
            budget: userSettings.budget_alerts || false,
            reports: userSettings.monthly_reports || false,
          });
        }
        
        // Her zaman premium
        setIsPremium(true);
        
      } catch (error) {
        console.error('Kullanıcı ayarları yüklenirken hata:', error);
        toast.error('Kullanıcı ayarları yüklenemedi');
        // Hata durumunda bile premium yap
        setIsPremium(true);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserSettings();
  }, [supabase]);

  const updateSetting = async (field: string, value: boolean) => {
    try {
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
      </p>
      
      <div className="grid gap-8 mt-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailNotifications" className="font-medium">E-posta Bildirimleri</Label>
            <Switch
              id="emailNotifications"
              name="emailNotifications"
              checked={settings.email}
              onCheckedChange={(checked) => updateSetting('email', checked)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Hesabınızla ilgili önemli bildirimler ve güncellemeler için e-posta alın.
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="budgetAlerts" className="font-medium">Bütçe Uyarıları</Label>
            <Switch
              id="budgetAlerts"
              name="budgetAlerts"
              checked={settings.budget}
              onCheckedChange={(checked) => updateSetting('budget', checked)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Bütçe hedeflerinize yaklaştığınızda veya aştığınızda bildirimler alın.
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="monthlyReports" className="font-medium">Aylık Rapor Özetleri</Label>
            <Switch
              id="monthlyReports"
              name="monthlyReports"
              checked={settings.reports}
              onCheckedChange={(checked) => updateSetting('reports', checked)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Her ayın sonunda finansal durumunuzla ilgili özet rapor alın.
          </p>
        </div>
      </div>
    </div>
  );
} 