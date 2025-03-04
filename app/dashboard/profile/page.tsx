"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/components/supabase-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Mail, Key } from "lucide-react";

export default function ProfilePage() {
  const { supabase, user } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "",
    email: user?.email || "",
    phone: "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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

      // Profil bilgilerini Supabase'e kaydet
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.fullName,
          email: profile.email,
          phone: profile.phone
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profil bilgileriniz güncellendi");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Profil güncellenirken bir hata oluştu");
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
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Güncelleniyor..." : "Profili Güncelle"}
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