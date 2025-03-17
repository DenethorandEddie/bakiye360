"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useSidebar } from "@/app/dashboard/layout";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

// Lucide ikonlarını dinamik olarak import edelim
const Bell = dynamic(() => import("lucide-react").then((mod) => mod.Bell), { ssr: false });
const User = dynamic(() => import("lucide-react").then((mod) => mod.User), { ssr: false });
const Shield = dynamic(() => import("lucide-react").then((mod) => mod.Shield), { ssr: false });

export default function Header() {
  const { theme } = useTheme();
  const { isSidebarExpanded, toggleSidebar } = useSidebar();
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [userInitials, setUserInitials] = useState("U");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [userName, setUserName] = useState("");
  const [isClientSide, setIsClientSide] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Client-side rendering kontrolü
  useEffect(() => {
    setIsClientSide(true);
    checkAdminStatus();
  }, []);
  
  // Kullanıcı bilgilerini al
  useEffect(() => {
    async function getUserDetails() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Profil tablosundan kullanıcı adı ve soyadını al
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
          
        if (profileData && profileData.first_name) {
          // Adı ve soyadı varsa, baş harflerini al
          const firstInitial = profileData.first_name.charAt(0).toUpperCase();
          const lastInitial = profileData.last_name ? profileData.last_name.charAt(0).toUpperCase() : '';
          setUserInitials(firstInitial + lastInitial);
          
          // Tam ismi kaydet
          const fullName = profileData.last_name 
            ? `${profileData.first_name} ${profileData.last_name}` 
            : profileData.first_name;
          setUserName(fullName);
        } else if (user.email) {
          // Profil bulunamazsa email'den ilk harfi al
          setUserInitials(user.email.charAt(0).toUpperCase());
          setUserName(user.email);
        }
      }
    }
    
    getUserDetails();
  }, [supabase]);
  
  // Bildirimleri yükle
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (error) {
            console.error('Bildirimler alınırken hata:', error);
            return;
          }
          
          if (data) {
            setNotifications(data);
            // Okunmamış bildirim var mı kontrol et
            const hasAnyUnread = data.some(item => !item.read);
            setHasUnread(hasAnyUnread);
          }
        }
      } catch (error) {
        console.error('Bildirimler yüklenirken hata:', error);
      }
    }
    
    fetchNotifications();
    
    // Periyodik olarak bildirimleri güncelle (her 30 saniyede bir)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [supabase]);
  
  // Bildirimi okundu olarak işaretle
  const markAsRead = async (id: number) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
      
    // UI'ı güncelle
    setNotifications(prev => 
      prev.map(item => 
        item.id === id ? { ...item, read: true } : item
      )
    );
    
    // Tüm bildirimler okundu mu kontrol et
    const stillHasUnread = notifications.some(item => item.id !== id && !item.read);
    setHasUnread(stillHasUnread);
  };
  
  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = async () => {
    // Sadece okunmamış ID'leri al
    const unreadIds = notifications
      .filter(item => !item.read)
      .map(item => item.id);
      
    if (unreadIds.length > 0) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);
        
      // UI'ı güncelle
      setNotifications(prev => 
        prev.map(item => ({ ...item, read: true }))
      );
      
      setHasUnread(false);
    }
  };
  
  // Bildirim menüsüne tıklama
  const handleNotificationClick = (notification: any) => {
    // Bildirimi okundu olarak işaretle
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Bildirime göre yönlendirme
    if (notification.link) {
      router.push(notification.link);
    }
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

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

  return (
    <header className="flex items-center justify-end h-16 px-4 md:px-6 border-b bg-card">
      {/* Logo - sadece mobil görünümde ve ortada */}
      <div className="mr-auto lg:hidden">
        <Link href="/dashboard" className="flex items-center mx-auto">
          {theme === "light" ? (
            <Image src="/logo.png" alt="Bakiye360 Logo" width={100} height={25} />
          ) : (
            <Image src="/logo_dark.png" alt="Bakiye360 Logo" width={100} height={25} />
          )}
        </Link>
      </div>
      
      <div className="flex items-center ml-auto space-x-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              {isClientSide && <Bell className="h-4 w-4" />}
              {hasUnread && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>Bildirimler</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                disabled={!hasUnread}
                className="h-8 text-xs"
              >
                Tümünü Okundu İşaretle
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              <>
                {notifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id}
                    className={`p-3 cursor-pointer ${!notification.read ? 'bg-accent/30' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex flex-col w-full">
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">{notification.content}</div>
                      <div className="text-xs text-muted-foreground mt-1 self-end">
                        {new Date(notification.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/notifications" className="w-full text-center cursor-pointer">
                    <span className="text-primary">Tüm Bildirimleri Gör</span>
                  </Link>
                </DropdownMenuItem>
              </>
            ) : (
              <div className="p-3 text-center text-muted-foreground">
                Bildiriminiz bulunmuyor
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={userInitials} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{userName}</span>
                <span className="text-xs text-muted-foreground">Hesabınız</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                {isClientSide && <User className="mr-2 h-4 w-4" />}
                <span>Profil</span>
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/admin">
                  {isClientSide && <Shield className="mr-2 h-4 w-4" />}
                  <span>Admin Paneli</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>Ayarlar</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500" onClick={handleSignOut}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Çıkış Yap</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}