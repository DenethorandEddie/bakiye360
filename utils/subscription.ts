import { createClient } from '@supabase/supabase-js';

// Bu fonksiyon sunucu tarafında çağrılmalıdır
export async function checkSubscription(userId: string) {
  try {
    // Supabase bağlantısı oluştur
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Kullanıcının aktif aboneliği olup olmadığını kontrol et
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .single();

    if (error) {
      console.error('Subscription check error:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

// Premium özellikler için erişim kontrol fonksiyonu
export const premiumFeatures = {
  // Sınırsız ürün ekleme
  unlimitedProducts: async (userId: string) => {
    return await checkSubscription(userId);
  },
  
  // Gelişmiş son kullanma tarihi bildirimleri
  advancedNotifications: async (userId: string) => {
    return await checkSubscription(userId);
  },
  
  // Özelleştirilebilir etiketler
  customTags: async (userId: string) => {
    return await checkSubscription(userId);
  },
  
  // Beslenme analizleri
  nutritionAnalytics: async (userId: string) => {
    return await checkSubscription(userId);
  },
  
  // Akıllı alışveriş listesi
  smartShoppingList: async (userId: string) => {
    return await checkSubscription(userId);
  },
  
  // Aile hesabı paylaşımı
  familySharing: async (userId: string) => {
    return await checkSubscription(userId);
  }
};

// API route middleware için kullanılabilecek fonksiyon
export async function requireSubscription(req: any, res: any, next: () => void) {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const hasSubscription = await checkSubscription(userId);
  
  if (!hasSubscription) {
    return res.status(403).json({ 
      error: 'Premium subscription required',
      subscriptionRequired: true
    });
  }
  
  next();
} 