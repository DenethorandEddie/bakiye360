"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Facebook, Instagram, Twitter, Globe } from "lucide-react";

interface Settings {
  site_title: string;
  site_description: string;
  site_keywords: string;
  social_twitter: string;
  social_facebook: string;
  social_instagram: string;
  contact_email: string;
  footer_text: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    site_title: "Bakiye360",
    site_description: "Abonelik ve bütçe yönetim uygulaması",
    site_keywords: "abonelik, bütçe, finansal, yönetim",
    social_twitter: "",
    social_facebook: "",
    social_instagram: "",
    contact_email: "",
    footer_text: "© 2023 Bakiye360. Tüm hakları saklıdır."
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchSettings() {
      try {
        // Ayarlar tablosunun varlığını kontrol et
        const { error: tableError } = await supabase
          .from('settings')
          .select('*')
          .limit(1);

        // Tablo yoksa oluştur
        if (tableError && tableError.message.includes('does not exist')) {
          console.log('Settings table does not exist, using defaults');
          return;
        }

        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .single();

        if (error) {
          console.error('Error fetching settings:', error);
          return;
        }

        if (data) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Error initializing settings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Önce settings tablosunu temizle (sadece bir kayıt olacak)
      await supabase.from('settings').delete().neq('id', '0');
      
      // Yeni ayarları ekle
      const { error } = await supabase.from('settings').insert([settings]);

      if (error) throw error;
      toast.success('Ayarlar başarıyla kaydedildi');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Ayarlar kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  }

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Site Ayarları</h1>
        <Button type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="social">Sosyal Medya</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card className="dark:bg-gray-800/50 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Genel Ayarlar</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Sitenizin genel ayarlarını buradan yapılandırın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="site_title" className="dark:text-gray-300">Site Başlığı</Label>
                <Input
                  id="site_title"
                  name="site_title"
                  value={settings.site_title}
                  onChange={handleInputChange}
                  placeholder="Site Başlığı"
                  className="dark:bg-gray-700/50 dark:text-white dark:border-gray-600"
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="site_description" className="dark:text-gray-300">Site Açıklaması</Label>
                <Textarea
                  id="site_description"
                  name="site_description"
                  value={settings.site_description}
                  onChange={handleInputChange}
                  placeholder="Site Açıklaması"
                  className="dark:bg-gray-700/50 dark:text-white dark:border-gray-600"
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="contact_email" className="dark:text-gray-300">İletişim E-posta</Label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={handleInputChange}
                  placeholder="ornek@mail.com"
                  className="dark:bg-gray-700/50 dark:text-white dark:border-gray-600"
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="footer_text" className="dark:text-gray-300">Alt Bilgi Metni</Label>
                <Input
                  id="footer_text"
                  name="footer_text"
                  value={settings.footer_text}
                  onChange={handleInputChange}
                  placeholder="© 2023 Site Adı. Tüm hakları saklıdır."
                  className="dark:bg-gray-700/50 dark:text-white dark:border-gray-600"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4 mt-4">
          <Card className="dark:bg-gray-800/50 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">SEO Ayarları</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Sayfaların arama motorlarında daha iyi sıralanması için SEO ayarlarını yapılandırın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="site_keywords" className="dark:text-gray-300">Anahtar Kelimeler</Label>
                <Textarea
                  id="site_keywords"
                  name="site_keywords"
                  value={settings.site_keywords}
                  onChange={handleInputChange}
                  placeholder="finans, bütçe, abonelik, yönetim"
                  className="dark:bg-gray-700/50 dark:text-white dark:border-gray-600"
                />
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Virgülle ayrılmış anahtar kelimeler ekleyin.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4 mt-4">
          <Card className="dark:bg-gray-800/50 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Sosyal Medya Ayarları</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Sosyal medya hesaplarınızı bağlayın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="social_twitter" className="flex items-center gap-2 dark:text-gray-300">
                  <Twitter className="h-4 w-4" /> Twitter
                </Label>
                <Input
                  id="social_twitter"
                  name="social_twitter"
                  value={settings.social_twitter}
                  onChange={handleInputChange}
                  placeholder="https://twitter.com/hesapadı"
                  className="dark:bg-gray-700/50 dark:text-white dark:border-gray-600"
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="social_facebook" className="flex items-center gap-2 dark:text-gray-300">
                  <Facebook className="h-4 w-4" /> Facebook
                </Label>
                <Input
                  id="social_facebook"
                  name="social_facebook"
                  value={settings.social_facebook}
                  onChange={handleInputChange}
                  placeholder="https://facebook.com/hesapadı"
                  className="dark:bg-gray-700/50 dark:text-white dark:border-gray-600"
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="social_instagram" className="flex items-center gap-2 dark:text-gray-300">
                  <Instagram className="h-4 w-4" /> Instagram
                </Label>
                <Input
                  id="social_instagram"
                  name="social_instagram"
                  value={settings.social_instagram}
                  onChange={handleInputChange}
                  placeholder="https://instagram.com/hesapadı"
                  className="dark:bg-gray-700/50 dark:text-white dark:border-gray-600"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 