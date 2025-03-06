import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";

// App Router için modern config yapısı
export const dynamic = 'force-dynamic';

// Supabase client oluştur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Stripe API anahtarı
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any, // Güncel API sürümü
});

// Webhook gizli anahtarı
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: Request) {
  try {
    // Raw request body'yi al - Next.js App Router bodyParser'ı otomatik devre dışı bırakır
    const payload = await request.text();
    
    // Stripe imzasını al
    const headersList = headers();
    const signature = headersList.get("stripe-signature") || "";

    console.log("Webhook alındı, doğrulanıyor...");
    
    let event;
    
    // İmzayı doğrula
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret
      );
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`Webhook event: ${event.type}`);

    // Olay tipine göre işle
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Müşteri ve abonelik ID'lerini al
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const userId = session.client_reference_id;
        
        if (!userId) {
          console.error('Kullanıcı ID bulunamadı');
          return NextResponse.json(
            { error: 'Kullanıcı ID bulunamadı' },
            { status: 400 }
          );
        }
        
        console.log(`Ödeme tamamlandı. Kullanıcı: ${userId}, Müşteri: ${customerId}, Abonelik: ${subscriptionId}`);
        
        try {
          // Abonelik detaylarını al
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Abonelik dönem tarihlerini al
          const periodStart = new Date(subscription.current_period_start * 1000).toISOString();
          const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
          
          console.log(`Abonelik dönem bilgileri: Başlangıç: ${periodStart}, Bitiş: ${periodEnd}`);
          
          // 1. Subscriptions tablosuna kaydet
          const { error: subscriptionInsertError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: subscription.status,
              plan: 'premium', // Plan tipi - ileride farklı planlar eklenebilir
              current_period_start: periodStart,
              current_period_end: periodEnd,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (subscriptionInsertError) {
            console.error('Abonelik kaydedilirken hata:', subscriptionInsertError);
          } else {
            console.log('Abonelik subscriptions tablosuna kaydedildi');
          }
          
          // 2. User settings tablosuna da kaydet
          // Önce mevcut kullanıcı ayarlarını kontrol et
          const { data: existingSettings, error: settingsError } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();
            
          if (settingsError && settingsError.code !== 'PGRST116') {
            console.error('Kullanıcı ayarları kontrol edilirken hata:', settingsError);
          }
          
          // Mevcut ayarları güncelle veya yeni kayıt oluştur
          const userSettingsData = {
            user_id: userId,
            subscription_status: 'premium',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_period_start: periodStart,
            subscription_period_end: periodEnd,
            updated_at: new Date().toISOString()
          };
          
          // Eğer mevcut kayıt yoksa, varsayılan değerlerle birlikte oluştur
          if (!existingSettings) {
            Object.assign(userSettingsData, {
              email_notifications: true,
              budget_alerts: true, 
              monthly_reports: true,
              app_preferences: { currency: 'TRY', language: 'tr' },
              created_at: new Date().toISOString()
            });
          }
          
          const { error: settingsUpdateError } = await supabase
            .from('user_settings')
            .upsert(userSettingsData);
            
          if (settingsUpdateError) {
            console.error('Kullanıcı ayarları güncellenirken hata:', settingsUpdateError);
          } else {
            console.log('Abonelik bilgileri user_settings tablosuna da kaydedildi');
          }
        } catch (err) {
          console.error('Abonelik işlenirken hata:', err);
          return NextResponse.json(
            { error: 'Abonelik işlenirken hata oluştu' },
            { status: 500 }
          );
        }
        
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Subscription ID ve müşteri ID'sini al
        const subscriptionId = subscription.id;
        const customerId = subscription.customer as string;
        
        console.log(`Abonelik güncellendi. ID: ${subscriptionId}, Durum: ${subscription.status}, İptal Durumu: ${subscription.cancel_at_period_end ? 'Dönem sonunda iptal' : 'Aktif'}`);
        
        // Supabase'den kullanıcıyı bul
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();
          
        if (subscriptionError) {
          console.error('Kullanıcı bulunamadı:', subscriptionError);
          return NextResponse.json(
            { error: 'Kullanıcı bulunamadı' },
            { status: 404 }
          );
        }
        
        const userId = subscriptionData.user_id;
        
        // Abonelik dönem tarihlerini al
        const periodStart = new Date(subscription.current_period_start * 1000).toISOString();
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        
        console.log(`Güncellenen abonelik dönem bilgileri: Başlangıç: ${periodStart}, Bitiş: ${periodEnd}`);
        
        // Abonelik durumunu belirle
        let subscriptionStatusForUser = 'free';
        
        // Aboneliğin durumuna göre kullanıcı için abonelik durumunu belirle
        if (subscription.status === 'active') {
          // Aktif abonelik
          subscriptionStatusForUser = 'premium';
        } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          // Ödeme sorunu olan abonelik - premium tutuyoruz ama ödeme alıncaya kadar takipteyiz
          subscriptionStatusForUser = 'premium';
        } else if (subscription.status === 'canceled' && new Date(subscription.current_period_end * 1000) > new Date()) {
          // İptal edilmiş ama süresi dolmamış abonelik - kullanıcı hala premium
          subscriptionStatusForUser = 'premium';
          console.log('Abonelik iptal edilmiş ama dönem sonu gelmemiş, premium olarak devam ediyor');
        }
        
        // 1. Subscriptions tablosunu güncelle
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId);
          
        if (updateError) {
          console.error('Abonelik güncellenirken hata:', updateError);
        } else {
          console.log('Abonelik durumu güncellendi');
        }
        
        // 2. User settings tablosunu da güncelle
        const { error: settingsUpdateError } = await supabase
          .from('user_settings')
          .update({
            subscription_status: subscriptionStatusForUser,
            subscription_period_start: periodStart,
            subscription_period_end: periodEnd,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (settingsUpdateError) {
          console.error('Kullanıcı ayarları güncellenirken hata:', settingsUpdateError);
        } else {
          console.log(`Abonelik bilgileri user_settings tablosunda da güncellendi. Durum: ${subscriptionStatusForUser}`);
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        
        console.log(`Abonelik silindi. ID: ${subscriptionId}`);
        
        // Supabase'den kullanıcıyı bul
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();
          
        if (subscriptionError) {
          console.error('Kullanıcı bulunamadı:', subscriptionError);
          return NextResponse.json(
            { error: 'Kullanıcı bulunamadı' },
            { status: 404 }
          );
        }
        
        const userId = subscriptionData.user_id;
        
        // Abonelik dönem sonu kontrolü yap
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        const now = new Date();
        
        // Eğer abonelik süresi dolmamışsa ve iptal edildiyse, kullanıcı premium kalmaya devam eder
        const subscriptionStatusForUser = currentPeriodEnd > now ? 'premium' : 'free';
        
        // 1. Subscriptions tablosunu güncelle
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId);
          
        if (updateError) {
          console.error('Abonelik güncellenirken hata:', updateError);
        } else {
          console.log('Abonelik durumu iptal edildi olarak güncellendi');
        }
        
        // 2. User settings tablosunu da güncelle
        const { error: settingsUpdateError } = await supabase
          .from('user_settings')
          .update({
            subscription_status: subscriptionStatusForUser,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (settingsUpdateError) {
          console.error('Kullanıcı ayarları güncellenirken hata:', settingsUpdateError);
        } else {
          console.log(`Abonelik bilgileri user_settings tablosunda güncellendi. Durum: ${subscriptionStatusForUser}`);
        }
        
        break;
      }
      
      // Yeni event handler: Abonelik süresi dolduğunda
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        console.log(`Fatura ödemesi başarısız. Abonelik ID: ${subscriptionId}`);
        
        if (!subscriptionId) {
          console.log('Bu faturada abonelik ID bulunamadı, geçiliyor');
          break;
        }
        
        // Abonelik bilgilerini al
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Supabase'den kullanıcıyı bul
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();
            
          if (subscriptionError) {
            console.error('Kullanıcı bulunamadı:', subscriptionError);
            break;
          }
          
          const userId = subscriptionData.user_id;
          
          // Abonelik durum kontrolü
          // Eğer ödeme başarısız ve abonelik aktif değilse free'ye düşür
          if (subscription.status !== 'active') {
            const { error: settingsUpdateError } = await supabase
              .from('user_settings')
              .update({
                subscription_status: 'free',
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId);
              
            if (settingsUpdateError) {
              console.error('Kullanıcı ayarları güncellenirken hata:', settingsUpdateError);
            } else {
              console.log('Ödeme başarısız olduğu için kullanıcı free statüsüne düşürüldü');
            }
          }
        } catch (err) {
          console.error('Fatura işlenirken hata:', err);
        }
        
        break;
      }
      
      // Diğer olay tipleri...
      default:
        console.log(`Bilinmeyen olay tipi: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook işlenirken hata oluştu:', error);
    return NextResponse.json(
      { error: 'Webhook işlenirken hata oluştu' },
      { status: 500 }
    );
  }
} 