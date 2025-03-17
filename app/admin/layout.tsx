"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  FolderClosed, 
  LogOut,
  Settings,
  Menu,
  X
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { useTheme } from "next-themes";

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard
  },
  {
    title: "Blog Yazıları",
    href: "/admin/posts",
    icon: FileText
  },
  {
    title: "Kategoriler",
    href: "/admin/categories",
    icon: FolderClosed
  },
  {
    title: "Ayarlar",
    href: "/admin/settings",
    icon: Settings
  }
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '';
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();

  const toggleMobileNav = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            {isMobileMenuOpen ? (
              <Button variant="ghost" size="icon" onClick={toggleMobileNav} className="md:hidden">
                <X className="h-6 w-6" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={toggleMobileNav} className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            )}
            <div className="flex items-center gap-2 ml-2 md:ml-0">
              <Link href="/" className="flex items-center">
                <Image 
                  src={theme === "dark" ? "/logo_dark.png" : "/logo.png"} 
                  alt="Bakiye360 Logo" 
                  width={120} 
                  height={60} 
                  className="h-auto w-auto"
                  style={{ maxHeight: '60px' }}
                  priority
                />
              </Link>
              <span className="text-lg font-semibold hidden md:inline-block dark:text-white">
                Admin Panel
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-20 w-64 transform bg-background border-r transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:h-[calc(100vh-4rem)]",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full pt-5 pb-4 overflow-hidden">
            <div className="px-4 mb-6 md:hidden">
              <p className="text-lg font-semibold dark:text-white">Bakiye360 Admin</p>
              <p className="text-sm text-muted-foreground dark:text-gray-400">Blog yönetimi</p>
            </div>
            <ScrollArea className="flex-1 py-4">
              <nav className="px-2 space-y-1">
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    pathname === "/admin"
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-primary/5 dark:text-gray-300 dark:hover:bg-primary/10"
                  )}
                >
                  <LayoutDashboard className="mr-3 h-5 w-5" />
                  Dashboard
                </Link>
                <Link
                  href="/admin/posts"
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    pathname.includes("/admin/posts")
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-primary/5 dark:text-gray-300 dark:hover:bg-primary/10"
                  )}
                >
                  <FileText className="mr-3 h-5 w-5" />
                  Blog Yazıları
                </Link>
                <Link
                  href="/admin/categories"
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    pathname.includes("/admin/categories")
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-primary/5 dark:text-gray-300 dark:hover:bg-primary/10"
                  )}
                >
                  <FolderClosed className="mr-3 h-5 w-5" />
                  Kategoriler
                </Link>
                <Link
                  href="/admin/settings"
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    pathname.includes("/admin/settings")
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-primary/5 dark:text-gray-300 dark:hover:bg-primary/10"
                  )}
                >
                  <Settings className="mr-3 h-5 w-5" />
                  Ayarlar
                </Link>
              </nav>
            </ScrollArea>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-background p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
} 