"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/supabase-provider";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { 
  Loader2, 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  BarChart2, 
  Shield, 
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const adminRoutes = [
  {
    name: "Genel Bakış",
    href: "/dashboard/admin",
    icon: LayoutDashboard
  },
  {
    name: "Kullanıcılar",
    href: "/dashboard/admin/users",
    icon: Users
  },
  {
    name: "İşlemler",
    href: "/dashboard/admin/transactions",
    icon: CreditCard
  },
  {
    name: "Raporlar",
    href: "/dashboard/admin/reports",
    icon: BarChart2
  },
  {
    name: "Sistem Ayarları",
    href: "/dashboard/admin/settings",
    icon: Settings
  },
  {
    name: "Güvenlik",
    href: "/dashboard/admin/security",
    icon: Shield
  }
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkAdminAccess() {
      if (!user) {
        toast.error("Yönetici paneline erişmek için giriş yapmanız gerekiyor");
        router.push("/dashboard");
        return;
      }

      try {
        // Check if the user has admin role
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Profil bilgisi alınırken hata:", error);
          toast.error("Yetki kontrolü sırasında bir hata oluştu");
          router.push("/dashboard");
          return;
        }

        if (profile?.role !== "admin") {
          toast.error("Bu sayfaya erişim yetkiniz bulunmuyor");
          router.push("/dashboard");
          return;
        }

        // User is admin
        setIsAdmin(true);
      } catch (error) {
        console.error("Yetkilendirme kontrolü sırasında hata:", error);
        toast.error("Yetkilendirme kontrolü sırasında bir hata oluştu");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }

    checkAdminAccess();
  }, [user, supabase, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Yetki kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will never render as we redirect unauthorized users
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <div className="hidden md:flex flex-col w-64 bg-muted/30 border-r border-border h-screen overflow-y-auto sticky top-0">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-tight">Yönetici Paneli</h2>
          <p className="text-sm text-muted-foreground mt-1">Sistem yönetimi</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 pb-6">
          {adminRoutes.map((route) => {
            const Icon = route.icon;
            const isActive = pathname === route.href;
            
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                <span>{route.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden sticky top-0 z-10 w-full bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="text-lg font-bold">Yönetici Paneli</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Menü <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Yönetici Menüsü</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {adminRoutes.map((route) => {
                const Icon = route.icon;
                return (
                  <DropdownMenuItem key={route.href} asChild>
                    <Link href={route.href} className="flex items-center">
                      <Icon className="h-4 w-4 mr-2" />
                      <span>{route.name}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="text-muted-foreground">
                  Kullanıcı Paneline Dön
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-auto">
        <main className="container mx-auto py-8 px-4 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
