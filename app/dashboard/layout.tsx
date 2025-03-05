"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Header } from "@/components/dashboard/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key-for-development'
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Demo mod kontrolü
        if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://example.supabase.co') {
          // Demo modda kullanıcı oturumu kontrolü
          const demoUser = localStorage.getItem('demoUser');
          if (!demoUser) {
            router.push("/login");
            return;
          } else {
            setLoading(false);
          }
          return;
        }

        // Gerçek Supabase oturum kontrolü
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in Dashboard layout:", error);
        router.push("/login");
      }
    };

    checkSession();
    
    // Oturum değişikliklerini izle
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'demoUser' && !event.newValue) {
        router.push("/login");
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Supabase auth state değişimlerini izle
    let authListener: { data: { subscription: { unsubscribe: () => void } } };
    
    const setupAuthListener = async () => {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://example.supabase.co') {
        authListener = supabase.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_OUT') {
            router.push("/login");
          }
        });
      }
    };
    
    setupAuthListener();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (authListener?.data?.subscription) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Yükleniyor...</h2>
          <p className="text-muted-foreground">Lütfen bekleyin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}