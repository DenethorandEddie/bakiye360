"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useTheme } from "next-themes";

// Lucide ikonlarını dinamik olarak import edelim
const Home = dynamic(() => import("lucide-react").then((mod) => mod.Home), { ssr: false });
const ListTodo = dynamic(() => import("lucide-react").then((mod) => mod.ListTodo), { ssr: false });
const BarChart3 = dynamic(() => import("lucide-react").then((mod) => mod.BarChart3), { ssr: false });
const Target = dynamic(() => import("lucide-react").then((mod) => mod.Target), { ssr: false });
const Settings = dynamic(() => import("lucide-react").then((mod) => mod.Settings), { ssr: false });
const LogOut = dynamic(() => import("lucide-react").then((mod) => mod.LogOut), { ssr: false });
const User = dynamic(() => import("lucide-react").then((mod) => mod.User), { ssr: false });
const CreditCard = dynamic(() => import("lucide-react").then((mod) => mod.CreditCard), { ssr: false });
const ChevronLeft = dynamic(() => import("lucide-react").then((mod) => mod.ChevronLeft), { ssr: false });
const ChevronRight = dynamic(() => import("lucide-react").then((mod) => mod.ChevronRight), { ssr: false });
const Menu = dynamic(() => import("lucide-react").then((mod) => mod.Menu), { ssr: false });
const Sun = dynamic(() => import("lucide-react").then((mod) => mod.Sun), { ssr: false });
const Moon = dynamic(() => import("lucide-react").then((mod) => mod.Moon), { ssr: false });
const X = dynamic(() => import("lucide-react").then((mod) => mod.X), { ssr: false });

// Sidebar context
export const SidebarContext = createContext({
  isSidebarExpanded: false,
  toggleSidebar: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

// Bir yükleme bileşeni oluşturalım - ikonlar yüklenirken bunu göstereceğiz
function LoadingPlaceholder() {
  return <div className="h-5 w-5 rounded-full bg-muted animate-pulse"></div>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClientComponentClient();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarExpanded, setSidebarExpanded] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isClientSide, setIsClientSide] = useState(false);

  // Mobil görünüm için sidebar durumu
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Client-side rendering kontrolü
  useEffect(() => {
    setIsClientSide(true);
  }, []);

  // Mobil menü açıkken body'ye class ekle/çıkar
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('mobile-scroll-active');
    } else {
      document.body.classList.remove('mobile-scroll-active');
    }
    
    // Cleanup function
    return () => {
      document.body.classList.remove('mobile-scroll-active');
    };
  }, [isMobileMenuOpen]);

  // Premium kontrol
  useEffect(() => {
    async function checkSubscription() {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("Kullanıcı bilgisi alınamadı", userError);
          setIsLoading(false);
          return;
        }
        
        // 1. Önce subscriptions tablosundan kontrol et
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
          
        // Aktif bir abonelik varsa, premium olarak ayarla
        if (subscriptionData) {
          console.log("Aktif abonelik bulundu:", subscriptionData);
          setIsPremium(true);
          setIsLoading(false);
          return;
        }
        
        // 2. Eğer subscriptions'da yoksa, user_settings tablosundaki durumu kontrol et
        const { data: userSettingsData, error: userSettingsError } = await supabase
          .from('user_settings')
          .select('subscription_status')
          .eq('user_id', user.id)
          .single();
          
        if (userSettingsData && userSettingsData.subscription_status === 'premium') {
          console.log("User settings'te premium abonelik bulundu");
          setIsPremium(true);
        } else {
          console.log("Premium abonelik bulunamadı, ücretsiz kullanıcı");
          setIsPremium(false);
        }
      } catch (error) {
        console.error("Abonelik durumu kontrol edilirken hata:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkSubscription();
  }, [supabase]);

  // Ekran genişliğine göre sidebar durumunu ayarla
  useEffect(() => {
    const handleResize = () => {
      // Mobil cihazlar için her zaman kapalı başla
      if (window.innerWidth < 1024) {
        setSidebarExpanded(false);
      } 
      // Desktop görünümde kullanıcı tercihine dayalı olarak başla
      else {
        const savedPreference = localStorage.getItem('sidebarExpanded');
        if (savedPreference === null) {
          setSidebarExpanded(false);
        } else {
          setSidebarExpanded(savedPreference === 'true');
        }
      }
    };

    // İlk yükleme
    handleResize();

    // Ekran boyutu değiştiğinde
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const toggleSidebar = () => {
    const newState = !isSidebarExpanded;
    setSidebarExpanded(newState);
    // Kullanıcı tercihini kaydet
    localStorage.setItem('sidebarExpanded', newState.toString());
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  // Abonelik sayfasını menüde gösterme veya gizleme
  // Premium kullanıcılar için gizlemek üzere conditional rendering kullanacağız
  const shouldShowSubscriptionLink = !isPremium;

  // Navigasyon öğeleri
  const navigationItems = [
    { name: "Ana Sayfa", href: "/dashboard", icon: Home },
    { name: "İşlemler", href: "/dashboard/transactions", icon: ListTodo },
    { name: "Bütçe Hedefleri", href: "/dashboard/budget-goals", icon: Target },
    { name: "Raporlar", href: "/dashboard/reports", icon: BarChart3 },
  ];

  // Ayarlar grubu
  const settingsItems = [
    { name: "Profil", href: "/dashboard/profile", icon: User },
    { name: "Ayarlar", href: "/dashboard/settings", icon: Settings },
  ];

  // Abonelik sadece ücretsiz kullanıcılar için
  if (shouldShowSubscriptionLink && !isLoading) {
    settingsItems.push({ name: "Abonelik", href: "/dashboard/subscription", icon: CreditCard });
  }

  // Client tarafı render kontrolü yaparak hydration hatalarını önle
  if (!isClientSide) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="flex-1 p-4 md:p-6 pt-16 lg:pt-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-muted rounded w-full mb-4"></div>
            <div className="h-32 bg-muted rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarContext.Provider value={{ isSidebarExpanded, toggleSidebar }}>
      <div className="flex min-h-screen bg-background">
        {/* Mobil menü butonu */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleMobileMenu} 
            className="bg-background shadow-md h-10 w-10 rounded-full p-0"
          >
            {isClientSide && <Menu className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Modern Sidebar */}
        <aside
          className={cn(
            "modern-sidebar",
            isSidebarExpanded && "expanded",
            isMobileMenuOpen && "mobile-open",
            isSidebarExpanded ? "w-60" : "w-[4.5rem]",
          )}
        >
          {/* Mobil kapatma butonu */}
          <button onClick={toggleMobileMenu} className="mobile-close lg:hidden">
            {isClientSide && <X size={16} />}
          </button>

          {/* Logo Bölümü */}
          <div className="sidebar-logo">
            <Link href="/dashboard">
              <div className="relative w-10 h-10">
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
          </div>

          {/* Sidebar genişlet/daralt butonu - sadece desktop */}
          <button 
            onClick={toggleSidebar} 
            className="toggle-button"
            aria-label={isSidebarExpanded ? "Sidebar'ı daralt" : "Sidebar'ı genişlet"}
          >
            {isClientSide && (isSidebarExpanded ? <ChevronLeft size={12} /> : <ChevronRight size={12} />)}
          </button>

          {/* Ana Navigasyon */}
          <nav className="nav-group">
            {/* Ana menü öğeleri */}
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "nav-item",
                  isActive(item.href) && "active"
                )}
              >
                <span className="nav-item-icon">
                  {isClientSide ? <item.icon size={18} /> : <LoadingPlaceholder />}
                </span>
                <span className="nav-item-text font-medium">{item.name}</span>
              </Link>
            ))}

            {/* Alt kısımda yer alan ayarlar vb. */}
            <div className="mt-auto pt-2">
              {settingsItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "nav-item",
                    isActive(item.href) && "active"
                  )}
                >
                  <span className="nav-item-icon">
                    {isClientSide ? <item.icon size={18} /> : <LoadingPlaceholder />}
                  </span>
                  <span className="nav-item-text font-medium">{item.name}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Alt Kısım (Tema ve Çıkış) */}
          <div className="nav-footer">
            {/* Tema Değiştirici */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="theme-toggle"
              aria-label={theme === "light" ? "Karanlık moda geç" : "Aydınlık moda geç"}
            >
              <span className="nav-item-icon">
                {isClientSide && (theme === "light" ? <Moon size={18} /> : <Sun size={18} />)}
              </span>
              {isSidebarExpanded && (
                <span className="nav-item-text font-medium">
                  {theme === "light" ? "Karanlık Mod" : "Aydınlık Mod"}
                </span>
              )}
            </button>

            {/* Çıkış Yap */}
            <button onClick={handleSignOut} className="logout-button">
              <span className="nav-item-icon">
                {isClientSide && <LogOut size={18} />}
              </span>
              {isSidebarExpanded && (
                <span className="nav-item-text font-medium">Çıkış Yap</span>
              )}
            </button>
          </div>
        </aside>

        {/* Mobil arka plan overlay */}
        {isMobileMenuOpen && (
          <div className="backdrop-overlay" onClick={toggleMobileMenu} />
        )}

        {/* Ana içerik */}
        <main 
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            isSidebarExpanded 
              ? "lg:pl-60" 
              : "lg:pl-[4.5rem]"
          )}
        >
          <div className="p-4 md:p-6 pt-16 lg:pt-6 min-h-screen overflow-x-hidden">
            <div className="overflow-guard">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}