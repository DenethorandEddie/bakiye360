"use client";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabaseClient";

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    email: false,
    budget: false,
    reports: false
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('user_settings')
        .select('email_notifications, budget_alerts, monthly_reports')
        .eq('user_id', user?.id)
        .single();

      setSettings({
        email: data?.email_notifications || false,
        budget: data?.budget_alerts || false,
        reports: data?.monthly_reports || false
      });
    };
    fetchSettings();
  }, []);

  const updateSetting = async (field: string, value: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('user_settings')
      .update({ [field]: value })
      .eq('user_id', user?.id);
    
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">E-posta Bildirimleri</h3>
          <p className="text-sm text-muted-foreground">
            Önemli güncellemeler ve duyurular
          </p>
        </div>
        <Switch 
          checked={settings.email} 
          onCheckedChange={(val) => updateSetting('email_notifications', val)}
          disabled={!isPremium} // Sadece premium kullanıcılar değiştirebilir
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Bütçe Uyarıları</h3>
          <p className="text-sm text-muted-foreground">
            Bütçe limiti aşıldığında uyarı
          </p>
        </div>
        <Switch 
          checked={settings.budget} 
          onCheckedChange={(val) => updateSetting('budget_alerts', val)}
          disabled={!isPremium}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Aylık Raporlar</h3>
          <p className="text-sm text-muted-foreground">
            Otomatik aylık finansal özet
          </p>
        </div>
        <Switch 
          checked={settings.reports} 
          onCheckedChange={(val) => updateSetting('monthly_reports', val)}
          disabled={!isPremium}
        />
      </div>
    </div>
  );
} 