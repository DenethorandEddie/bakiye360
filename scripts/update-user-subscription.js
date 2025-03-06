/**
 * Bakiye360 - Kullanıcı Abonelik Durumu Manuel Güncelleme Tool'u
 * 
 * Bu script, belirli bir kullanıcının abonelik durumunu manuel olarak güncellemek için kullanılır.
 * Örnek Kullanım:
 * node scripts/update-user-subscription.js [userId] [status] [stripe_subscription_id] [stripe_customer_id]
 * 
 * - userId: Kullanıcı ID'si (zorunlu)
 * - status: Abonelik durumu ('premium' veya 'free') (zorunlu)
 * - stripe_subscription_id: Stripe Abonelik ID'si (opsiyonel)
 * - stripe_customer_id: Stripe Müşteri ID'si (opsiyonel)
 */

const fetch = require('node-fetch');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

// Argümanları al
const args = process.argv.slice(2);
const userId = args[0];
const status = args[1];
const stripeSubscriptionId = args[2] || null;
const stripeCustomerId = args[3] || null;

// Argüman kontrolü
if (!userId || !status || !['premium', 'free'].includes(status)) {
  console.error(`
Kullanım: node scripts/update-user-subscription.js [userId] [status] [stripe_subscription_id] [stripe_customer_id]

- userId: Kullanıcı ID'si (zorunlu)
- status: Abonelik durumu ('premium' veya 'free') (zorunlu)
- stripe_subscription_id: Stripe Abonelik ID'si (opsiyonel)
- stripe_customer_id: Stripe Müşteri ID'si (opsiyonel)
  `);
  process.exit(1);
}

// Bağlantı bilgilerini kontrol et
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Gerekli çevre değişkenleri bulunamadı. .env dosyasını kontrol edin.');
  process.exit(1);
}

// Supabase istemcisi oluştur
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Kullanıcı varlığını kontrol et
 */
async function checkUserExists(userId) {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error) {
      console.error('Kullanıcı kontrol edilirken hata:', error);
      return false;
    }
    
    return !!data?.user;
  } catch (error) {
    console.error('Kullanıcı kontrol edilirken beklenmeyen hata:', error);
    return false;
  }
}

/**
 * API endpoint'i üzerinden abonelik durumunu güncelle
 */
async function updateUserSubscriptionAPI() {
  try {
    // API endpoint'ine istek yap
    const response = await fetch(`${APP_URL}/api/subscription/update-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        status: status,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('API isteği başarısız. Hata:', result.error);
      return false;
    }
    
    console.log('API isteği başarılı:', result);
    return true;
  } catch (error) {
    console.error('API isteği sırasında hata:', error);
    return false;
  }
}

/**
 * Doğrudan Supabase üzerinden abonelik durumunu güncelle
 */
async function updateUserSubscriptionDirect() {
  try {
    // Önce kullanıcı ayarlarını kontrol et
    const { data: existingSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Kullanıcı ayarları kontrol edilirken hata:', settingsError);
      return false;
    }
    
    // Güncellenecek veri
    const updateData = {
      user_id: userId,
      subscription_status: status,
      updated_at: new Date().toISOString()
    };
    
    // Stripe bilgilerini ekle
    if (stripeSubscriptionId) {
      updateData.stripe_subscription_id = stripeSubscriptionId;
    }
    
    if (stripeCustomerId) {
      updateData.stripe_customer_id = stripeCustomerId;
    }
    
    // Mevcut kayıt yoksa varsayılan değerleri ekle
    if (!existingSettings) {
      Object.assign(updateData, {
        email_notifications: true,
        budget_alerts: true,
        monthly_reports: true,
        app_preferences: { currency: 'TRY', language: 'tr' },
        created_at: new Date().toISOString()
      });
    }
    
    // Güncelleme işlemi
    const { error: updateError } = await supabase
      .from('user_settings')
      .upsert(updateData);
      
    if (updateError) {
      console.error('Kullanıcı ayarları güncellenirken hata:', updateError);
      return false;
    }
    
    console.log('Kullanıcı ayarları başarıyla güncellendi.');
    return true;
  } catch (error) {
    console.error('Doğrudan güncelleme sırasında hata:', error);
    return false;
  }
}

/**
 * Ana fonksiyon
 */
async function main() {
  console.log(`
========================================================
  BAKİYE360 - KULLANICI ABONELİK DURUMU GÜNCELLEME
========================================================
  Kullanıcı ID: ${userId}
  Yeni Durum: ${status}
  Stripe Abonelik ID: ${stripeSubscriptionId || 'Belirtilmedi'}
  Stripe Müşteri ID: ${stripeCustomerId || 'Belirtilmedi'}
========================================================
`);

  try {
    // Kullanıcı varlığını kontrol et
    const userExists = await checkUserExists(userId);
    
    if (!userExists) {
      console.error(`${userId} ID'li kullanıcı bulunamadı.`);
      process.exit(1);
    }
    
    console.log(`${userId} ID'li kullanıcı doğrulandı.`);
    
    // Önce API ile güncelleme dene
    console.log('API endpoint üzerinden güncelleme deneniyor...');
    const apiSuccess = await updateUserSubscriptionAPI();
    
    if (apiSuccess) {
      console.log('✅ API üzerinden abonelik durumu başarıyla güncellendi.');
    } else {
      console.warn('❗ API üzerinden güncelleme başarısız oldu. Doğrudan güncelleme deneniyor...');
      
      // API başarısız olursa doğrudan güncelle
      const directSuccess = await updateUserSubscriptionDirect();
      
      if (directSuccess) {
        console.log('✅ Doğrudan veritabanı üzerinden abonelik durumu başarıyla güncellendi.');
      } else {
        console.error('❌ Abonelik durumu güncellenemedi. Tüm yöntemler başarısız oldu.');
        process.exit(1);
      }
    }
    
    // Bildirim eklemeyi dene
    try {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: status === 'premium' ? 'Premium Aboneliğiniz Aktif' : 'Abonelik Durumunuz Güncellendi',
          content: status === 'premium' 
            ? 'Premium aboneliğiniz başarıyla aktif edildi. Tüm premium özelliklere erişebilirsiniz.'
            : 'Abonelik durumunuz güncellendi. Şu anda ücretsiz sürümü kullanıyorsunuz.',
          read: false,
          created_at: new Date().toISOString(),
          link: '/dashboard/subscription'
        });
        
      if (notifError) {
        console.warn('⚠️ Bildirim eklenirken hata oluştu:', notifError);
      } else {
        console.log('✅ Bildirim başarıyla eklendi.');
      }
    } catch (notifError) {
      console.warn('⚠️ Bildirim eklenirken beklenmeyen hata:', notifError);
    }
    
    console.log(`
========================================================
  İŞLEM BAŞARIYLA TAMAMLANDI
  ${userId} kullanıcısının abonelik durumu ${status.toUpperCase()} olarak güncellendi.
========================================================
`);
  } catch (error) {
    console.error('İşlem sırasında beklenmeyen bir hata oluştu:', error);
    process.exit(1);
  }
}

// Scripti çalıştır
main(); 