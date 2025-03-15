/**
 * Bu script, bir kullanıcının abonelik durumunu manuel olarak güncellemek için kullanılır.
 * Stripe webhook çalışmadığında veya abonelik durumu güncellenemediğinde kullanılabilir.
 * 
 * Kullanım:
 * node manual-subscription-update.js <userId> [status]
 * 
 * Parametreler:
 * - userId: Aboneliği güncellenecek kullanıcının ID'si
 * - status: Ayarlanacak abonelik durumu ('premium' veya 'free', varsayılan: premium)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Argümanları al
const userId = process.argv[2];
const status = process.argv[3] || 'premium';

// Kullanıcı ID'si kontrolü
if (!userId) {
  console.error('Kullanıcı ID\'si belirtilmedi!');
  console.log('Kullanım: node manual-subscription-update.js <userId> [status]');
  process.exit(1);
}

// Durum kontrolü
if (status !== 'premium' && status !== 'free') {
  console.error('Geçersiz abonelik durumu! Sadece "premium" veya "free" kullanılabilir.');
  process.exit(1);
}

// Supabase client oluştur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateSubscription() {
  console.log(`Kullanıcı ${userId} için abonelik durumu "${status}" olarak güncelleniyor...`);
  
  try {
    // Önce user_settings tablosunu kontrol et
    const { data: existingSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Kullanıcı ayarları kontrol edilirken hata:', settingsError);
    }
    
    // Kullanıcı ayarlarını güncelle veya oluştur
    const updateData = {
      subscription_status: status,
      updated_at: new Date().toISOString()
    };
    
    // Tarih bilgilerini ekle
    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    
    updateData.subscription_period_start = now.toISOString();
    updateData.subscription_period_end = oneMonthLater.toISOString();
    updateData.subscription_start = now.toISOString(); // İlk abonelik başlangıcı
    
    // Premium aboneliğe geçince bildirim ayarlarını otomatik aç
    if (status === 'premium') {
      updateData.email_notifications = true;
      updateData.budget_alerts = true;
      updateData.monthly_reports = true;
    }
    
    let result;
    
    // Eğer kayıt varsa güncelle, yoksa yeni kayıt oluştur
    if (existingSettings) {
      console.log('Mevcut kullanıcı ayarları güncelleniyor');
      result = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', userId);
    } else {
      console.log('Yeni kullanıcı ayarları oluşturuluyor');
      result = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          ...updateData,
          app_preferences: { currency: 'TRY', language: 'tr' },
          created_at: new Date().toISOString()
        });
    }
    
    if (result.error) {
      console.error('Kullanıcı ayarları güncellenirken/oluşturulurken hata:', result.error);
      process.exit(1);
    }
    
    // subscriptions tablosunu da güncelle
    const subscriptionData = {
      user_id: userId,
      status: status === 'premium' ? 'active' : 'canceled',
      plan: 'premium',
      current_period_start: now.toISOString(),
      current_period_end: oneMonthLater.toISOString(),
      updated_at: now.toISOString()
    };
    
    // Önce subscription var mı kontrol et
    const { data: existingSub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (subError && subError.code !== 'PGRST116') {
      console.error('Abonelik kontrolünde hata:', subError);
    }
    
    let subResult;
    
    if (existingSub) {
      // Mevcut aboneliği güncelle
      subResult = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSub.id);
    } else {
      // Yeni abonelik kaydı oluştur
      subResult = await supabase
        .from('subscriptions')
        .insert({
          ...subscriptionData,
          created_at: now.toISOString()
        });
    }
    
    if (subResult.error) {
      console.error('Abonelik kaydı güncellenirken/oluşturulurken hata:', subResult.error);
    }
    
    // Başarı bildirimi ekle
    if (status === 'premium') {
      const notification = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Premium Üyelik Aktifleştirildi',
          content: 'Premium üyeliğiniz başarıyla aktifleştirildi. Artık tüm premium özelliklere erişebilirsiniz.',
          read: false,
          created_at: new Date().toISOString(),
          type: 'subscription',
          link: '/dashboard/subscription'
        });
        
      if (notification.error) {
        console.error('Bildirim oluşturulurken hata:', notification.error);
      }
    }
    
    console.log(`✅ Kullanıcı ${userId} için abonelik durumu başarıyla "${status}" olarak güncellendi!`);
    console.log('Subscription bitiş tarihi:', oneMonthLater.toLocaleString());
    
    // RPC fonksiyonunu çağırarak resmi güncelleme yöntemini de dene
    try {
      const { error: rpcError } = await supabase.rpc(
        'update_user_subscription_status',
        {
          p_user_id: userId,
          p_status: status,
          p_subscription_period_start: now.toISOString(),
          p_subscription_period_end: oneMonthLater.toISOString()
        }
      );
      
      if (rpcError) {
        console.warn('RPC fonksiyonu çağrılırken uyarı (önemli değil):', rpcError);
      } else {
        console.log('RPC fonksiyonu ile de güncelleme başarılı');
      }
    } catch (rpcError) {
      console.warn('RPC fonksiyonu çağrılırken uyarı (önemli değil):', rpcError);
    }
    
  } catch (error) {
    console.error('İşlem sırasında beklenmeyen hata:', error);
    process.exit(1);
  }
}

// Güncelleme işlemini başlat
updateSubscription(); 