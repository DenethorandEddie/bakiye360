"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/components/supabase-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { User, Mail, Key, Database, Trash2 } from "lucide-react";

export default function ProfilePage() {
  const { supabase, user, signOut } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<{
    fullName: string;
    email: string;
    phone: string;
  }>({
    fullName: "",
    email: user?.email || "",
    phone: "",
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
          if (error.code === 'PGRST116') {
            console.log('Yeni profil oluşturulacak');
            // Yeni profil oluşturma mantığı ekleyin
            await supabase.from('profiles').upsert({
              id: user.id,
              full_name: '',
              phone: ''
            });
          } else {
            throw error;
          }
        }

        if (data) {
          setProfile({
            fullName: data.full_name || "",
            email: user.email || "",
            phone: data.phone || "",
          });
        }
      } catch (error) {
        console.error('Profil yüklenirken hata:', error);
        toast.error('Profil bilgileri yüklenemedi');
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfileData();
  }, [supabase, user]);

  const handleProfileChange = async (field: string, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    
    // Değişiklik olduğunda otomatik kaydet
    try {
      if (!supabase || !user) {
        throw new Error("Oturum bilgisi bulunamadı");
      }

      const updatedProfile = {
        ...profile,
        [field]: value
      };

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: updatedProfile.fullName,
          phone: updatedProfile.phone,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        throw error;
      }

      toast.success("Değişiklikler kaydedildi");
    } catch (error) {
      console.error("Profil güncelleme hatası:", error);
      toast.error("Değişiklikler kaydedilirken bir hata oluştu");
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const checkDatabaseSchema = async () => {
    // ... bu fonksiyonu tamamen kaldırıyoruz ...
  };

  // Ayarlardan taşınan fonksiyonlar
  const deleteAccount = async () => {
    if (!window.confirm('Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      setLoading(true);
      if (supabase && user) {
        // Kullanıcı verilerini sil
        await supabase.from('user_settings').delete().eq('user_id', user.id);
        await supabase.from('transactions').delete().eq('user_id', user.id);
        await supabase.from('budget_goals').delete().eq('user_id', user.id);
        
        // Auth hesabını sil
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error) throw error;
        
        await signOut();
        toast.success('Hesabınız başarıyla silindi');
      }
    } catch (error) {
      console.error('Hesap silinirken hata:', error);
      toast.error('Hesap silinirken bir hata oluştu');
    } finally {
      setLoading(false);
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
          <form>
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
            </CardContent>
          </form>
        </Card>

        {/* Sadece Hesap Silme Bölümü */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Tehlikeli İşlemler</CardTitle>
            <CardDescription>
              Bu işlemler geri alınamaz. Lütfen dikkatli olun.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={deleteAccount}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hesabı Kalıcı Olarak Sil
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}