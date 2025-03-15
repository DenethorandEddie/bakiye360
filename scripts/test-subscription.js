/**
 * Bu script, Stripe aboneliklerini test etmek için kullanılır.
 * Farklı abonelik durumlarını taklit ederek sistemin doğru çalıştığını kontrol eder.
 * 
 * Kullanım:
 * node scripts/test-subscription.js <test-type> <user-id>
 * 
 * Test Tipleri:
 * - checkout: Checkout session completed olayını simüle eder
 * - update: Abonelik güncelleme olayını simüle eder
 * - cancel: Abonelik iptal olayını simüle eder
 * - renew: Abonelik yenileme olayını simüle eder
 * - fail: Ödeme başarısız olayını simüle eder
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Webhook URL
const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`;

// Kullanıcı ID'si ve test tipi
const testType = process.argv[2];
const userId = process.argv[3];

if (!testType || !userId) {
  console.log('Kullanım: node scripts/test-subscription.js <test-type> <user-id>');
  console.log('Test Tipleri: checkout, update, cancel, renew, fail');
  process.exit(1);
}

// Test verisi oluştur
async function generateTestData(type, userId) {
  // Temel bilgiler
  const now = Math.floor(Date.now() / 1000);
  const oneMonthLater = now + (30 * 24 * 60 * 60);
  
  // Test verileri
  const testData = {
    checkout: {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: `cs_test_${Date.now()}`,
          subscription: `sub_test_${Date.now()}`,
          customer: `cus_test_${Date.now()}`,
          metadata: { userId },
          payment_status: 'paid',
          mode: 'subscription'
        }
      }
    },
    update: {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: `sub_test_${Date.now()}`,
          customer: `cus_test_${Date.now()}`,
          status: 'active',
          current_period_start: now,
          current_period_end: oneMonthLater,
          cancel_at_period_end: false,
          metadata: { userId }
        }
      }
    },
    cancel: {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: `sub_test_${Date.now()}`,
          customer: `cus_test_${Date.now()}`,
          status: 'active',
          current_period_start: now,
          current_period_end: oneMonthLater,
          cancel_at_period_end: true,
          metadata: { userId }
        }
      }
    },
    renew: {
      type: 'invoice.paid',
      data: {
        object: {
          id: `in_test_${Date.now()}`,
          subscription: `sub_test_${Date.now()}`,
          customer: `cus_test_${Date.now()}`,
          period_start: now,
          period_end: oneMonthLater,
          metadata: { userId }
        }
      }
    },
    fail: {
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: `in_test_${Date.now()}`,
          subscription: `sub_test_${Date.now()}`,
          customer: `cus_test_${Date.now()}`,
          metadata: { userId }
        }
      }
    }
  };
  
  return testData[type];
}

// Webhook isteği gönder
async function sendWebhookRequest(eventData) {
  try {
    const response = await axios.post(webhookUrl, eventData, {
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature'
      }
    });
    
    console.log('Webhook isteği gönderildi');
    console.log('Yanıt:', response.data);
    return response.data;
  } catch (error) {
    console.error('Webhook isteği başarısız:', error.response?.data || error.message);
    throw error;
  }
}

// Kullanıcının abonelik durumunu kontrol et
async function checkUserSubscription(userId) {
  try {
    // User settings tablosundan abonelik durumunu al
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('subscription_status, subscription_period_end, cancel_at_period_end')
      .eq('user_id', userId)
      .single();
      
    if (settingsError) {
      console.error('Kullanıcı abonelik durumu alınamadı:', settingsError);
      return null;
    }
    
    // Subscriptions tablosundan abonelik bilgilerini al
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (subError && subError.code !== 'PGRST116') {
      console.error('Abonelik bilgileri alınamadı:', subError);
    }
    
    return {
      userSettings,
      subscription: subscription || null
    };
  } catch (error) {
    console.error('Veritabanı sorgusu başarısız:', error);
    return null;
  }
}

// Ana test fonksiyonu
async function runTest() {
  console.log(`${testType} testi başlatılıyor... Kullanıcı: ${userId}`);
  
  // Test öncesi abonelik durumunu kontrol et
  console.log('Test öncesi abonelik durumu kontrol ediliyor...');
  const beforeTest = await checkUserSubscription(userId);
  console.log('Mevcut abonelik durumu:', beforeTest?.userSettings?.subscription_status);
  
  // Test verisi oluştur
  const eventData = await generateTestData(testType, userId);
  
  if (!eventData) {
    console.error(`Geçersiz test tipi: ${testType}`);
    process.exit(1);
  }
  
  console.log('Test verisi oluşturuldu:', JSON.stringify(eventData, null, 2));
  
  // Webhook isteği gönder
  console.log('Webhook isteği gönderiliyor...');
  await sendWebhookRequest(eventData);
  
  // Veritabanının güncellemesi için bekle
  console.log('Veritabanı güncellemesi için 2 saniye bekleniyor...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test sonrası abonelik durumunu kontrol et
  console.log('Test sonrası abonelik durumu kontrol ediliyor...');
  const afterTest = await checkUserSubscription(userId);
  console.log('Yeni abonelik durumu:', afterTest?.userSettings?.subscription_status);
  
  // Sonuçları karşılaştır
  console.log('\nTest Sonuçları:');
  console.log('----------------');
  console.log('Test Tipi:', testType);
  console.log('Önceki Durum:', beforeTest?.userSettings?.subscription_status);
  console.log('Sonraki Durum:', afterTest?.userSettings?.subscription_status);
  
  if (testType === 'checkout' && afterTest?.userSettings?.subscription_status === 'premium') {
    console.log('✅ Test BAŞARILI: Checkout sonrası abonelik premium olarak güncellendi');
  } else if (testType === 'cancel' && afterTest?.userSettings?.cancel_at_period_end) {
    console.log('✅ Test BAŞARILI: Abonelik iptal edildi ve dönem sonunda bitecek işaretlendi');
  } else if (testType === 'fail' && afterTest?.userSettings?.subscription_status === 'free') {
    console.log('✅ Test BAŞARILI: Ödeme başarısız sonrası abonelik free olarak güncellendi');
  } else if (testType === 'renew' && afterTest?.userSettings?.subscription_status === 'premium') {
    console.log('✅ Test BAŞARILI: Abonelik yenilendi');
  } else if (testType === 'update') {
    console.log('Abonelik durumu:', afterTest?.userSettings);
    console.log('✅ Test BAŞARILI: Abonelik durumu güncellendi');
  } else {
    console.log('❌ Test BAŞARISIZ: Beklenen duruma ulaşılamadı');
  }
}

// Testi çalıştır
runTest()
  .then(() => {
    console.log('Test tamamlandı');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test başarısız oldu:', error);
    process.exit(1);
  }); 