import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Çıkış yapmayı zorlayan yardımcı fonksiyon.
 * Uygulamanın herhangi bir yerinden çağrılabilir.
 */
export async function forceLogout() {
  try {
    // LocalStorage temizleme
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('supabase.') || key.includes('demoUser'))) {
        localStorage.removeItem(key);
      }
    }
    
    // Demo mod durumunda storage event tetiklenmesi
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'demoUser',
      newValue: null
    }));
    
    // Supabase oturumunu temizleme
    const supabase = createClientComponentClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key-for-development'
    });
    
    await supabase.auth.signOut();
    
    // Sayfayı ana sayfaya yönlendirme
    window.location.href = "/";
    
    return true;
  } catch (error) {
    console.error("Force logout error:", error);
    
    // Hata durumunda yine de ana sayfaya yönlendir
    window.location.href = "/";
    return false;
  }
} 