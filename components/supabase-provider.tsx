"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SupabaseContextType = {
  supabase: ReturnType<typeof createClientComponentClient>;
  user: any;
  signOut: () => Promise<void>;
  loading: boolean;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Create a mock Supabase client if environment variables are not available
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key-for-development'
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        // Demo mod kontrolü
        if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://example.supabase.co') {
          // Demo modda kullanıcı oturumu simüle et
          const demoUser = localStorage.getItem('demoUser');
          if (demoUser) {
            setUser(JSON.parse(demoUser));
          }
          setLoading(false);
          return;
        }

        // Gerçek Supabase oturum kontrolü
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    try {
      // Demo mod kontrolü
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://example.supabase.co') {
        // Demo modda oturum değişikliklerini dinleme
        window.addEventListener('storage', (event) => {
          if (event.key === 'demoUser') {
            if (event.newValue) {
              setUser(JSON.parse(event.newValue));
            } else {
              setUser(null);
            }
            router.refresh();
          }
        });
        
        return () => {
          window.removeEventListener('storage', () => {});
        };
      }

      // Gerçek Supabase oturum değişikliklerini dinleme
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        router.refresh();
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up auth state change:", error);
      setLoading(false);
      return () => {};
    }
  }, [supabase, router]);

  const signOut = async () => {
    try {
      // Demo mod kontrolü
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://example.supabase.co') {
        // Demo modda çıkış işlemi
        localStorage.removeItem('demoUser');
        
        // Local storage'dan Supabase ile ilgili öğeleri temizle
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('supabase.') || key.includes('demoUser'))) {
            localStorage.removeItem(key);
          }
        }
        
        // Oturum durumunu temizle
        setUser(null);
        
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'demoUser',
          newValue: null
        }));
        
        toast.success("Demo mod: Başarıyla çıkış yapıldı");
        
        // Yönlendirme gecikme ile yapılsın
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 100);
        
        return;
      }

      // Gerçek Supabase çıkış işlemi
      await supabase.auth.signOut();
      setUser(null);
      
      toast.success("Başarıyla çıkış yapıldı");
      
      // Yönlendirme gecikme ile yapılsın
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 100);
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Çıkış yapılırken bir hata oluştu");
      
      // Hata durumunda zorla çıkış yapma girişimi
      setUser(null);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 100);
    }
  };

  const value = {
    supabase,
    user,
    signOut,
    loading
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
};