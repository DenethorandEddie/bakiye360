/**
 * Stripe Webhook Test Scripti
 * 
 * Bu script, Stripe webhook'larını manuel olarak tetikleyerek 
 * abonelik akışının testi için kullanılır.
 * 
 * Kullanım: 
 * node scripts/webhook-test.js USER_ID
 */

const axios = require('axios');
const crypto = require('crypto');

// Konfigürasyon
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';

// Komut satırı argümanlarını al 
const userId = process.argv[2];

if (!userId) {
  console.error('Kullanıcı ID'si belirtilmedi! Kullanım: node scripts/webhook-test.js USER_ID');
  process.exit(1);
}

// Test için tarih oluştur
const now = Math.floor(Date.now() / 1000);
const oneMonthLater = now + (30 * 24 * 60 * 60);

// Test checkout session olayı oluştur
const checkoutEvent = {
  id: `evt_test_${Date.now()}`,
  object: 'event',
  api_version: '2025-02-24.acacia',
  created: now,
  data: {
    object: {
      id: `cs_test_${Date.now()}`,
      object: 'checkout.session',
      client_reference_id: userId,
      customer: `cus_test_${Date.now()}`,
      subscription: `sub_test_${Date.now()}`,
      payment_status: 'paid',
      status: 'complete',
      metadata: {
        userId: userId
      }
    }
  },
  type: 'checkout.session.completed'
};

// Test subscription objesi oluştur
const subscriptionEvent = {
  id: `evt_test_sub_${Date.now()}`,
  object: 'event',
  api_version: '2025-02-24.acacia',
  created: now,
  data: {
    object: {
      id: checkoutEvent.data.object.subscription,
      object: 'subscription',
      customer: checkoutEvent.data.object.customer,
      status: 'active',
      current_period_start: now,
      current_period_end: oneMonthLater,
      cancel_at_period_end: false,
      metadata: {
        userId: userId
      }
    }
  },
  type: 'customer.subscription.updated'
};

// İmza oluşturma fonksiyonu
function generateSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

// Webhook'u çağır
async function callWebhook(event) {
  const signature = generateSignature(event, WEBHOOK_SECRET);
  
  try {
    console.log(`${event.type} olayı gönderiliyor...`);
    
    const response = await axios.post(WEBHOOK_URL, event, {
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
      }
    });
    
    console.log(`✅ Başarılı yanıt (${response.status}):`);
    console.log(response.data);
    return true;
  } catch (error) {
    console.error('❌ Webhook çağrısı başarısız:');
    if (error.response) {
      console.error(`Durum: ${error.response.status}`);
      console.error('Yanıt:', error.response.data);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

// Ana fonksiyon
async function main() {
  console.log(`🚀 Webhook test başlatılıyor (Kullanıcı: ${userId})`);
  
  // Önce checkout event'i gönder
  const checkoutSuccess = await callWebhook(checkoutEvent);
  
  if (checkoutSuccess) {
    console.log('\n');
    
    // Sonra subscription event'i gönder
    const subscriptionSuccess = await callWebhook(subscriptionEvent);
    
    if (subscriptionSuccess) {
      console.log('\n✨ Tüm test webhook'ları başarıyla gönderildi');
    }
  }
}

// Script'i çalıştır
main().catch(error => {
  console.error('❌ Script hatası:', error);
  process.exit(1);
}); 