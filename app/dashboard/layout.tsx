"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ListTodo,
  BarChart3,
  Target,
  Settings,
  LogOut,
  User,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClientComponentClient();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mobil görünüm için sidebar durumu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Kullanıcının abonelik durumunu kontrol et
  useEffect(() => {
    async function checkSubscription() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setIsLoading(false);
          return;
        }

        // Kullanıcının abonelik durumunu kontrol et
        const { data: subscription, error: subscriptionError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        setIsPremium(!!subscription);
      } catch (error) {
        console.error("Abonelik durumu kontrol edilirken bir hata oluştu:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkSubscription();
  }, [supabase]);

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") {
      return true;
    }
    if (path !== "/dashboard" && pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Ekran genişliğine göre sidebar durumunu ayarla
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };

    // İlk yükleme
    handleResize();

    // Ekran boyutu değiştiğinde
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobil menü butonu */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar - responsive */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-muted/40 border-r shadow-sm transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "w-[70px]" : "w-56",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo ve toggle buton */}
        <div className="flex flex-col items-center pt-6 pb-4 border-b">
          <Link href="/dashboard" className="flex justify-center mb-5">
            <div className="relative w-14 h-14">
              {/* Light mode logo */}
              <img 
                src="/logo.png" 
                alt="Bakiye360 Logo" 
                className="absolute inset-0 w-full h-full object-contain dark:opacity-0 transition-opacity"
              />
              {/* Dark mode logo */}
              <img 
                src="/logo_dark.png" 
                alt="Bakiye360 Logo" 
                className="absolute inset-0 w-full h-full object-contain opacity-0 dark:opacity-100 transition-opacity"
              />
            </div>
          </Link>
          
          {/* Sidebar toggle buton */}
          <div className="hidden md:flex w-full justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={toggleSidebar}
                    className="h-9 w-9 rounded-md"
                  >
                    {isSidebarCollapsed ? (
                      <ChevronRight className="h-5 w-5" />
                    ) : (
                      <ChevronLeft className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{isSidebarCollapsed ? "Genişlet" : "Daralt"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Menü */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <TooltipProvider>
            {/* Ana Sayfa */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex items-center justify-center h-9 px-2 text-sm font-medium rounded-md transition-colors",
                    isActive("/dashboard")
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <Home className={cn("h-4 w-4", !isSidebarCollapsed && "mr-2")} />
                  {!isSidebarCollapsed && <span>Ana Sayfa</span>}
                </Link>
              </TooltipTrigger>
              {isSidebarCollapsed && (
                <TooltipContent side="right">
                  <p>Ana Sayfa</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* İşlemler */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/transactions"
                  className={cn(
                    "flex items-center justify-center h-9 px-2 text-sm font-medium rounded-md transition-colors",
                    isActive("/dashboard/transactions")
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <ListTodo className={cn("h-4 w-4", !isSidebarCollapsed && "mr-2")} />
                  {!isSidebarCollapsed && <span>İşlemler</span>}
                </Link>
              </TooltipTrigger>
              {isSidebarCollapsed && (
                <TooltipContent side="right">
                  <p>İşlemler</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Bütçe Hedefleri */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/budget-goals"
                  className={cn(
                    "flex items-center justify-center h-9 px-2 text-sm font-medium rounded-md transition-colors",
                    isActive("/dashboard/budget-goals")
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <Target className={cn("h-4 w-4", !isSidebarCollapsed && "mr-2")} />
                  {!isSidebarCollapsed && <span>Bütçe Hedefleri</span>}
                </Link>
              </TooltipTrigger>
              {isSidebarCollapsed && (
                <TooltipContent side="right">
                  <p>Bütçe Hedefleri</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Raporlar */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/reports"
                  className={cn(
                    "flex items-center justify-center h-9 px-2 text-sm font-medium rounded-md transition-colors",
                    isActive("/dashboard/reports")
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <BarChart3 className={cn("h-4 w-4", !isSidebarCollapsed && "mr-2")} />
                  {!isSidebarCollapsed && <span>Raporlar</span>}
                </Link>
              </TooltipTrigger>
              {isSidebarCollapsed && (
                <TooltipContent side="right">
                  <p>Raporlar</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Abonelik - Sadece ücretsiz kullanıcılar için göster */}
            {!isPremium && !isLoading && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/subscription"
                    className={cn(
                      "flex items-center justify-center h-9 px-2 text-sm font-medium rounded-md transition-colors",
                      isActive("/dashboard/subscription")
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <CreditCard className={cn("h-4 w-4", !isSidebarCollapsed && "mr-2")} />
                    {!isSidebarCollapsed && <span>Abonelik</span>}
                  </Link>
                </TooltipTrigger>
                {isSidebarCollapsed && (
                  <TooltipContent side="right">
                    <p>Abonelik</p>
                  </TooltipContent>
                )}
              </Tooltip>
            )}

            {/* Profil */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/profile"
                  className={cn(
                    "flex items-center justify-center h-9 px-2 text-sm font-medium rounded-md transition-colors",
                    isActive("/dashboard/profile")
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <User className={cn("h-4 w-4", !isSidebarCollapsed && "mr-2")} />
                  {!isSidebarCollapsed && <span>Profil</span>}
                </Link>
              </TooltipTrigger>
              {isSidebarCollapsed && (
                <TooltipContent side="right">
                  <p>Profil</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Ayarlar */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/settings"
                  className={cn(
                    "flex items-center justify-center h-9 px-2 text-sm font-medium rounded-md transition-colors",
                    isActive("/dashboard/settings")
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <Settings className={cn("h-4 w-4", !isSidebarCollapsed && "mr-2")} />
                  {!isSidebarCollapsed && <span>Ayarlar</span>}
                </Link>
              </TooltipTrigger>
              {isSidebarCollapsed && (
                <TooltipContent side="right">
                  <p>Ayarlar</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </nav>

        {/* Tema değiştirme butonu ve çıkış */}
        <div className="p-2 space-y-1 border-t">
          {/* Tema butonu */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className={cn(
                    "w-full h-9 flex items-center text-sm font-medium rounded-md",
                    isSidebarCollapsed ? "justify-center" : "justify-start px-2"
                  )}
                >
                  <Sun className={cn("h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0", !isSidebarCollapsed && "mr-2")} />
                  <Moon className={cn("absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100", !isSidebarCollapsed && "mr-2")} />
                  {!isSidebarCollapsed && <span>Tema Değiştir</span>}
                </Button>
              </TooltipTrigger>
              {isSidebarCollapsed && (
                <TooltipContent side="right">
                  <p>Tema Değiştir</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {/* Çıkış butonu */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full h-9 flex items-center text-sm font-medium rounded-md",
                    isSidebarCollapsed ? "justify-center" : "justify-start px-2"
                  )}
                  onClick={handleSignOut}
                >
                  <LogOut className={cn("h-4 w-4", !isSidebarCollapsed && "mr-2")} />
                  {!isSidebarCollapsed && <span>Çıkış Yap</span>}
                </Button>
              </TooltipTrigger>
              {isSidebarCollapsed && (
                <TooltipContent side="right">
                  <p>Çıkış Yap</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>

      {/* Sayfa içeriği - sidebar durumuna göre genişlik ayarlanıyor */}
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "md:ml-[70px]" : "md:ml-56",
      )}>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}