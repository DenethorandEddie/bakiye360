"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { forceLogout } from "@/utils/force-logout";
import { toast } from "sonner";

interface ForceLogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ForceLogoutButton({ 
  variant = "destructive", 
  size = "default" 
}: ForceLogoutButtonProps) {
  const handleForceLogout = async () => {
    try {
      toast.loading("Çıkış yapılıyor...");
      const success = await forceLogout();
      if (success) {
        toast.success("Başarıyla çıkış yapıldı");
      } else {
        toast.error("Çıkış yapılırken bir sorun oluştu, lütfen sayfayı yenileyin");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Çıkış yapılırken hata oluştu");
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleForceLogout}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Güvenli Çıkış
    </Button>
  );
} 