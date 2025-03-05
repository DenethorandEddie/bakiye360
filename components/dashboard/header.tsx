"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { useTheme } from "next-themes";
import { useSupabase } from "@/components/supabase-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, User, LogOut, BarChart3, Target, Calendar, CreditCard, Home, Shield } from "lucide-react";

const navigation = [
  { name: "Ana Sayfa", href: "/dashboard", icon: Home },
  { name: "Gelir/Gider", href: "/dashboard/transactions", icon: CreditCard },
  { name: "Bütçe Hedefleri", href: "/dashboard/budget-goals", icon: Target },
  { name: "Raporlar", href: "/dashboard/reports", icon: BarChart3 },
];

export function Header() {
  const { user, signOut, supabase } = useSupabase();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, systemTheme } = useTheme();
  const [currentLogo, setCurrentLogo] = useState("/logo.png");
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    if (theme === "dark" || (theme === "system" && systemTheme === "dark")) {
      setCurrentLogo("/logo_dark.png");
    } else {
      setCurrentLogo("/logo.png");
    }
  }, [theme, systemTheme]);

  useEffect(() => {
    // Check if user is admin
    async function checkAdminRole() {
      if (!user) return;
      
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
          
        if (!error && profile?.role === "admin") {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("Admin role check error:", err);
      }
    }
    
    checkAdminRole();
  }, [supabase, user]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Image 
                    src={currentLogo} 
                    alt="Bakiye360 Logo" 
                    width={100} 
                    height={25} 
                    className="h-auto"
                  />
                </SheetTitle>
              </SheetHeader>
              <nav className="grid gap-2 py-6">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
                
                {isAdmin && (
                  <Link
                    href="/dashboard/admin"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
                      pathname === "/dashboard/admin"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    Yönetici Paneli
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="flex items-center">
            <Image 
              src={currentLogo} 
              alt="Bakiye360 Logo" 
              width={110} 
              height={28} 
              className="h-auto"
            />
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
          
          {isAdmin && (
            <Link
              href="/dashboard/admin"
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith("/dashboard/admin")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yönetici Paneli
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Kullanıcı menüsü</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Ayarlar</Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/admin">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Yönetici Paneli</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Çıkış Yap</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}