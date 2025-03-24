"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useTheme } from "next-themes";
import {
  Home,
  ListTodo,
  BarChart3,
  Target,
  Settings,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sun,
  Moon,
  X,
  CalendarClock,
  Shield,
  ArrowRight
} from "lucide-react";

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
  const [isSidebarExpanded, setSidebarExpanded] = useState(true);
  const { theme, setTheme } = useTheme();
  const [isPremium, setIsPremium] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isClientSide, setIsClientSide] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Mobil görünüm için sidebar durumu
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Client-side rendering kontrolü
  useEffect(() => {
    setIsClientSide(true);
    checkAdminStatus();
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

  // Kullanıcının abonelik durumunu kontrol et
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        setIsPremium(true); // Her zaman premium
      } catch (error) {
        console.error("Abonelik durumu kontrol hatası:", error);
        setIsPremium(true); // Hata durumunda bile premium
      }
    };

    checkSubscriptionStatus();
  }, [supabase]);

  // Kullanıcı ayarlarını kontrol et
  useEffect(() => {
    const checkUserSettings = async () => {
      try {
        setIsPremium(true); // Her zaman premium
      } catch (error) {
        console.error("Kullanıcı ayarları kontrol hatası:", error);
        setIsPremium(true); // Hata durumunda bile premium
      }
    };

    checkUserSettings();
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
          setSidebarExpanded(true);
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

  async function checkAdminStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setIsAdmin(profile?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }

  const isActive = (path: string) => {
    if (!pathname) return false;
    
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

  // Navigasyon öğeleri
  const navigationItems = [
    { name: "Ana Sayfa", href: "/dashboard", icon: Home },
    { name: "İşlemler", href: "/dashboard/transactions", icon: ListTodo },
    { name: "Bütçe Hedefleri", href: "/dashboard/budget-goals", icon: Target },
    { name: "Abonelikler", href: "/dashboard/subscriptions", icon: CalendarClock },
    { name: "Raporlar", href: "/dashboard/reports", icon: BarChart3 },
  ];

  // Ayarlar grubu
  const settingsItems = [
    { name: "Profil", href: "/dashboard/profile", icon: User },
  ];

  // Admin menüsü öğeleri
  const adminItems = [
    {
      name: "Admin Paneli",
      href: "/admin",
      icon: Shield
    }
  ];

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
            isSidebarExpanded ? "w-56" : "w-20",
          )}
        >
          {/* Mobil kapatma butonu */}
          <button onClick={toggleMobileMenu} className="mobile-close lg:hidden">
            {isClientSide && <X size={16} />}
          </button>

          {/* Logo Bölümü */}
          <div className="sidebar-logo">
            <Link href="/dashboard" className="block">
              {isClientSide && (isSidebarExpanded ? (
                <div className="dark:hidden">
                  <img src="/logo.png" alt="Bakiye360" width={140} height={36} className="h-9 w-auto" />
                </div>
              ) : (
                <div className="dark:hidden">
                  <img src="/logo.png" alt="Bakiye360" width={56} height={36} className="h-11 w-11" />
                </div>
              ))}
              
              {isClientSide && (isSidebarExpanded ? (
                <div className="hidden dark:block">
                  <img src="/logo_dark.png" alt="Bakiye360" width={140} height={36} className="h-9 w-auto" />
                </div>
              ) : (
                <div className="hidden dark:block">
                  <img src="/logo_dark.png" alt="Bakiye360" width={56} height={36} className="h-11 w-11" />
                </div>
              ))}
            </Link>
          </div>

          {/* Ana Navigasyon */}
          <nav className="nav-group">
            {isSidebarExpanded && (
              <div className="nav-section-title">Ana Menü</div>
            )}
            
            {/* Ana menü öğeleri */}
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "nav-item",
                  isActive(item.href) && "active"
                )}
                title={item.name}
              >
                <span className="nav-item-icon">
                  {isClientSide ? <item.icon size={isSidebarExpanded ? 18 : 17} /> : <LoadingPlaceholder />}
                </span>
                <span className="nav-item-text">{item.name}</span>
                <span className="nav-item-indicator"></span>
              </Link>
            ))}

            {/* Admin menüsü */}
            {isAdmin && (
              <>
                {isSidebarExpanded && (
                  <div className="nav-section-title">Yönetim</div>
                )}
                {adminItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "nav-item",
                      isActive(item.href) && "active"
                    )}
                    title={item.name}
                  >
                    <span className="nav-item-icon">
                      {isClientSide ? <item.icon size={isSidebarExpanded ? 18 : 17} /> : <LoadingPlaceholder />}
                    </span>
                    <span className="nav-item-text">{item.name}</span>
                    <span className="nav-item-indicator"></span>
                  </Link>
                ))}
              </>
            )}

            {/* Yeni tasarım: Sidebar genişlet/daralt butonu */}
            <div className="relative">
              <button 
                onClick={toggleSidebar} 
                className={cn(
                  "absolute right-0 top-2 transform translate-x-1/2",
                  "flex items-center justify-center",
                  "w-5 h-10 rounded-full",
                  "bg-background border border-border shadow-sm",
                  "hover:bg-accent hover:border-accent-foreground/20",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  "dark:bg-background dark:border-border"
                )}
                aria-label={isSidebarExpanded ? "Sidebar'ı daralt" : "Sidebar'ı genişlet"}
              >
                {isClientSide && (
                  <div className="flex items-center justify-center w-full h-full">
                    {isSidebarExpanded ? (
                      <ChevronLeft className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                )}
              </button>
            </div>

            {/* Alt kısımda yer alan ayarlar vb. */}
            <div>
              {isSidebarExpanded && (
                <div className="nav-section-title">Hesap</div>
              )}
              
              {settingsItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "nav-item",
                    isActive(item.href) && "active"
                  )}
                  title={item.name}
                >
                  <span className="nav-item-icon">
                    {isClientSide ? <item.icon size={isSidebarExpanded ? 18 : 17} /> : <LoadingPlaceholder />}
                  </span>
                  <span className="nav-item-text">{item.name}</span>
                  <span className="nav-item-indicator"></span>
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
              title={theme === "light" ? "Karanlık moda geç" : "Aydınlık moda geç"}
            >
              <span className="theme-toggle-icon">
                {isClientSide && (theme === "light" ? <Moon size={isSidebarExpanded ? 18 : 17} /> : <Sun size={isSidebarExpanded ? 18 : 17} />)}
              </span>
              <span className="theme-toggle-text">
                {theme === "light" ? "Karanlık" : "Aydınlık"}
              </span>
            </button>

            {/* Çıkış Yap */}
            <button 
              onClick={handleSignOut} 
              className="logout-button" 
              title="Çıkış Yap"
            >
              <span className="logout-button-icon">
                {isClientSide && <LogOut size={isSidebarExpanded ? 18 : 17} />}
              </span>
              <span className="logout-button-text">Çıkış</span>
            </button>
          </div>
        </aside>

        {/* Backdrop Overlay for Mobile */}
        {isMobileMenuOpen && (
          <div 
            className="backdrop-overlay lg:hidden" 
            onClick={toggleMobileMenu}
            aria-hidden="true"
          ></div>
        )}
        
        {/* Main Content */}
        <main className="flex-1 px-4 py-4 md:px-6 md:py-6 pt-16 lg:pt-6 pb-16 w-full overflow-x-hidden overflow-y-auto lg:ml-20">
          {isSidebarExpanded && (
            <div className="lg:ml-36 transition-all duration-300 ease-in-out"></div>
          )}
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}