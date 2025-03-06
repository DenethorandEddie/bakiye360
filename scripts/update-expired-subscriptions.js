/**
 * Bakiye360 - Süresi Dolan Abonelikler İçin Durum Güncelleme Scripti
 * 
 * Bu script, GitHub Actions tarafından düzenli olarak çalıştırılarak
 * abonelik süresi dolan kullanıcıların subscription_status'ünü "free" yapacaktır.
 */

const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

// Supabase bağlantısı
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL veya Service Role Key eksik!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Süresi dolan abonelikleri bulup kullanıcı durumunu "free" olarak günceller
 */
async function updateExpiredSubscriptions() {
  console.log('Süresi dolan abonelikler kontrol ediliyor...');
  
  const now = new Date().toISOString();
  
  try {
    // 1. Önce süresi dolan active abonelikleri bul
    // Bu abonelikler, period_end tarihi geçmiş ve cancel_at_period_end true olan aboneliklerdir
    const { data: expiredSubscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id, stripe_subscription_id, current_period_end')
      .or(`status.eq.active,status.eq.canceled`)
      .lt('current_period_end', now);
    
    if (subError) {
      console.error('Abonelikler sorgulanırken hata:', subError);
      return;
    }
    
    console.log(`Süresi dolan ${expiredSubscriptions.length || 0} abonelik bulundu.`);
    
    // Hiç süresi dolan abonelik yoksa işlemi bitir
    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      console.log('Süresi dolan abonelik bulunamadı. İşlem tamamlandı.');
      return;
    }
    
    // 2. Süresi dolan abonelikler için kullanıcı ayarlarını güncelle
    for (const subscription of expiredSubscriptions) {
      console.log(`Kullanıcı ${subscription.user_id} için abonelik süresi doldu. Abonelik ID: ${subscription.stripe_subscription_id}, Son Tarih: ${subscription.current_period_end}`);
      
      // a. user_settings tablosundaki subscription_status'ü "free" olarak güncelle
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ 
          subscription_status: 'free',
          updated_at: now
        })
        .eq('user_id', subscription.user_id);
      
      if (updateError) {
        console.error(`Kullanıcı ${subscription.user_id} için settings güncellenirken hata:`, updateError);
        continue;
      }
      
      // b. subscriptions tablosundaki durumu "canceled" olarak güncelle
      const { error: subUpdateError } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'canceled',
          updated_at: now
        })
        .eq('stripe_subscription_id', subscription.stripe_subscription_id);
      
      if (subUpdateError) {
        console.error(`Abonelik ${subscription.stripe_subscription_id} için durum güncellenirken hata:`, subUpdateError);
        continue;
      }
      
      console.log(`✅ Kullanıcı ${subscription.user_id} için abonelik süresi dolduğundan "free" statüsüne alındı.`);
      
      // Kullanıcıya bildirim ekle
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: subscription.user_id,
            title: 'Premium Aboneliğiniz Sona Erdi',
            content: 'Premium abonelik süreniz sona erdi. Hizmetlerimizden faydalanmaya devam etmek isterseniz aboneliğinizi yenileyebilirsiniz.',
            read: false,
            created_at: now,
            link: '/dashboard/subscription'
          });
          
        console.log(`✅ Kullanıcı ${subscription.user_id} için abonelik sonu bildirimi oluşturuldu.`);
      } catch (notifError) {
        console.error(`Kullanıcı ${subscription.user_id} için bildirim oluşturulurken hata:`, notifError);
      }
    }
    
    console.log('Abonelik durum güncelleme işlemi tamamlandı.');
    
  } catch (error) {
    console.error('Abonelik güncelleme işlemi sırasında hata:', error);
  }
}

/**
 * Ana fonksiyon
 */
async function main() {
  try {
    await updateExpiredSubscriptions();
    console.log('İşlem başarıyla tamamlandı.');
  } catch (error) {
    console.error('İşlem sırasında beklenmeyen bir hata oluştu:', error);
    process.exit(1);
  }
}

// Scripti çalıştır
main(); 