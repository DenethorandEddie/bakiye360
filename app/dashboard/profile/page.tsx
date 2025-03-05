"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/components/supabase-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { User, Mail, Key, Database } from "lucide-react";

export default function ProfilePage() {
  const { supabase, user } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState({
    fullName: "",
    email: user?.email || "",
    phone: "",
    emailNotifications: false,
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Profil verilerini yükle
  useEffect(() => {
    async function loadProfileData() {
      if (!supabase || !user) {
        setLoadingProfile(false);
        return;
      }

      try {
        console.log("Profil verisi alınıyor, kullanıcı ID:", user.id);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Profil verisi yüklenirken hata:', error.message, error.details, error.hint);
          
          // Profil kaydı yoksa, sıfır verilerle devam et
          if (error.code === 'PGRST116') {
            console.log('Profil kaydı bulunamadı, yeni kayıt oluşturulacak');
            return;
          }
          return;
        }

        console.log("Alınan profil verisi:", data);

        if (data) {
          setProfile({
            fullName: data.full_name || "",
            email: user.email || "",
            phone: data.phone || "",
            emailNotifications: data.email_notifications || false,
          });
        }
      } catch (error) {
        console.error('Profil yüklenirken hata:', error);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfileData();
  }, [supabase, user]);

  const handleProfileChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!supabase || !user) {
        throw new Error("Oturum bilgisi bulunamadı");
      }

      console.log("Profil güncelleniyor:", {
        fullName: profile.fullName,
        phone: profile.phone,
        userId: user.id
      });

      // Profil bilgilerini Supabase'e kaydet - upsert kullanarak
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,  // Önemli: id alanı kullanıcı id'si ile aynı olmalı
          full_name: profile.fullName,
          phone: profile.phone,
          email_notifications: profile.emailNotifications,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'  // id alanında çakışma olursa güncelle
        });

      if (error) {
        console.error("Güncelleme hatası:", error.message, error.details, error.hint);
        throw error;
      }

      toast.success("Profil bilgileriniz güncellendi");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(`Profil güncellenirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }
    
    if (passwords.newPassword.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır");
      return;
    }
    
    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Oturum bilgisi bulunamadı");
      }

      // Supabase ile şifre değiştirme
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });

      if (error) throw error;

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Şifreniz başarıyla güncellendi");
    } catch (error) {
      console.error("Password update error:", error);
      toast.error("Şifre güncellenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const checkDatabaseSchema = async () => {
    try {
      if (!supabase) {
        throw new Error("Oturum bilgisi bulunamadı");
      }

      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      if (error) {
        console.error('Veritabanı şeması kontrol edilirken hata:', error.message, error.details, error.hint);
        throw error;
      }

      console.log('Veritabanı şeması kontrol edildi, alınan veri:', data);

      if (data) {
        setProfile({
          fullName: data.full_name || "",
          email: user.email || "",
          phone: data.phone || "",
          emailNotifications: data.email_notifications || false,
        });
      }

      toast.success('Veritabanı şeması başarıyla kontrol edildi');
    } catch (error) {
      console.error('Veritabanı şeması kontrol edilirken hata:', error);
      toast.error('Veritabanı şeması kontrol edilirken bir hata oluştu');
    }
  };

  // Ana içerik yerine yükleniyor göster
  if (loadingProfile) {
    return (
      <div className="container py-6 flex justify-center items-center min-h-[500px]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Profil bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground">
          Hesap bilgilerinizi görüntüleyin ve güncelleyin
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Profil Bilgileri</CardTitle>
            </div>
            <CardDescription>
              Kişisel bilgilerinizi güncelleyin
            </CardDescription>
          </CardHeader>
          <form onSubmit={updateProfile}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Ad Soyad</Label>
                <Input
                  id="fullName"
                  placeholder="Ad Soyad"
                  value={profile.fullName}
                  onChange={(e) => handleProfileChange("fullName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="E-posta"
                  value={profile.email}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  E-posta adresiniz hesabınızın temel kimliğidir ve değiştirilemez.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  placeholder="Telefon"
                  value={profile.phone}
                  onChange={(e) => handleProfileChange("phone", e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications" className="text-base">
                    E-posta Bildirimleri
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Önemli güncellemeler ve bildirimler için e-posta almak istiyorum.
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={profile.emailNotifications}
                  onCheckedChange={(checked) => handleProfileChange("emailNotifications", checked.toString())}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
              <Button disabled={loading} className="w-full md:w-auto">
                {loading ? (
                  <>
                    <span className="mr-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </span>
                    Kaydediliyor...
                  </>
                ) : (
                  "Kaydet"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Şifre Değiştir</CardTitle>
            </div>
            <CardDescription>
              Hesap güvenliğiniz için şifrenizi düzenli olarak değiştirin
            </CardDescription>
          </CardHeader>
          <form onSubmit={updatePassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  value={passwords.currentPassword}
                  onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Yeni Şifre</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={passwords.newPassword}
                  onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={passwords.confirmPassword}
                  onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}