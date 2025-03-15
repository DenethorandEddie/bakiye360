import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest } from 'next/server';

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

// Webhook işleme iyileştirmeleri
// Hata günlüğü tutma fonksiyonu
function logWebhookError(type: string, error: any, details?: any) {
  console.error(`[WEBHOOK_ERROR] [${type}] ${error.message || 'Bilinmeyen hata'}`, error);
  if (details) {
    console.error('Ek detaylar:', JSON.stringify(details, null, 2));
  }
}

// Kullanıcı abonelik durumunu güncelleyen yardımcı fonksiyon
async function updateUserSubscriptionStatus(
  userId: string, 
  status: 'premium' | 'free', 
  subscriptionId?: string, 
  customerId?: string,
  periodStart?: string,
  periodEnd?: string
) {
  console.log(`Supabase user_settings tablosu güncelleniyor. Kullanıcı: ${userId}, Durum: ${status}`);
  
  try {
    // Kullanıcı ayarlarını kontrol et
    const { data: existingSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      logWebhookError('SETTINGS_CHECK', settingsError, { userId });
      return false;
    }
    
    const updateData: any = {
      subscription_status: status,
      updated_at: new Date().toISOString()
    };
    
    // Premium aboneliğe geçince bildirim ayarlarını otomatik aç
    if (status === 'premium') {
      updateData.email_notifications = true;
      updateData.budget_alerts = true;
      updateData.monthly_reports = true;
      console.log(`Premium abonelik için bildirim ayarları otomatik olarak açıldı. Kullanıcı: ${userId}`);
    } 
    
    if (subscriptionId) {
      updateData.stripe_subscription_id = subscriptionId;
    }
    
    if (customerId) {
      updateData.stripe_customer_id = customerId;
    }
    
    // Abonelik dönemi tarihlerini ekle (varsa)
    if (periodStart) {
      updateData.subscription_period_start = periodStart;
    }
    
    if (periodEnd) {
      updateData.subscription_period_end = periodEnd;
    }
    
    let result;
    
    // Eğer kayıt varsa güncelle, yoksa yeni kayıt oluştur
    if (existingSettings) {
      console.log('Mevcut kullanıcı ayarları güncelleniyor:', updateData);
      result = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', userId);
    } else {
      console.log('Yeni kullanıcı ayarları oluşturuluyor:', {
        user_id: userId,
        ...updateData,
        app_preferences: { currency: 'TRY', language: 'tr' },
        created_at: new Date().toISOString()
      });
      
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
      logWebhookError('SETTINGS_UPDATE', result.error, { userId, updateData });
      return false;
    }
    
    console.log(`✅ Kullanıcı ${userId} için abonelik durumu başarıyla güncellendi: ${status}`);
    return true;
  } catch (error) {
    logWebhookError('SUBSCRIPTION_UPDATE', error, { userId, status });
    return false;
  }
}

export async function POST(req: NextRequest) {
  console.log(`⚡ Webhook isteği alındı: ${new Date().toISOString()}`);
  
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    // Log raw request information (but mask sensitive data)
    console.log(`📥 Webhook istek başlıkları: ${JSON.stringify({
      'stripe-signature': signature?.substring(0, 8) + '...',
      'content-type': req.headers.get('content-type'),
      'content-length': req.headers.get('content-length'),
    }, null, 2)}`);

    // Check for missing webhook secret
    if (!endpointSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET çevre değişkeni tanımlanmamış!');
      return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
    }

    // Webhook imzasını doğrula
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        endpointSecret
      );
    } catch (err: any) {
      console.error(`❌ Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    console.log(`🪝 Webhook olayı alındı: ${event.type} (${event.id})`);
    
    // İşleme başlamadan önce hızlı yanıt ver - Stripe 2 saniye içinde yanıt bekler
    const response = NextResponse.json({ received: true, status: 'processing', event_id: event.id });
    
    // Olay tipine göre işle
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          // Kullanıcı ID'yi al
          const userId = session.client_reference_id;
          if (!userId) {
            console.error('❌ Client reference ID bulunamadı, kullanıcı belirlenemedi');
            return NextResponse.json({ error: 'Missing client_reference_id' }, { status: 400 });
          }
          
          console.log(`💰 Checkout tamamlandı! Kullanıcı: ${userId}`);
          
          // Artık burada premium durumuna geçirmiyoruz, sadece kayıt tutuyoruz
          // Ödeme onaylandıktan sonra premium durumuna geçirilecek (invoice.payment_succeeded)
          console.log(`ℹ️ Kullanıcı ${userId} için checkout tamamlandı, ödeme onayı bekleniyor...`);
          
          // Subscriptions tablosuna kayıt ekle (varsa)
          if (session.subscription) {
            try {
              const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
              
              const { error: subError } = await supabase
                .from('subscriptions')
                .upsert({
                  stripe_subscription_id: subscription.id,
                  user_id: userId,
                  status: subscription.status, // Bu aşamada 'incomplete' olabilir
                  stripe_customer_id: session.customer as string,
                  plan: 'premium',
                  current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                  current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
                
              if (subError) {
                console.error(`❌ Abonelik bilgileri kaydedilemedi: ${subError.message}`);
              } else {
                console.log(`✅ Abonelik bilgileri kaydedildi: ${subscription.id}`);
              }
            } catch (subRetrieveError) {
              console.error(`❌ Stripe'dan abonelik alınamadı: ${(subRetrieveError as Error).message}`);
            }
          }
          break;
        }
        
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`📝 Abonelik güncellendi: ${subscription.id}, Durum: ${subscription.status}`);
          
          // Müşteri ID'den kullanıcıyı bul
          const customerId = subscription.customer as string;
          const { data: userSettings, error: settingsError } = await supabase
            .from('user_settings')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .single();
          
          if (settingsError || !userSettings) {
            console.error(`❌ Müşteri ID için kullanıcı bulunamadı: ${customerId}`);
            break;
          }
          
          const userId = userSettings.user_id;
          
          // Abonelik durumunu belirle
          const subscriptionStatus = subscription.status === 'active' ? 'premium' : 'free';
          
          // Abonelik kaydını güncelle
          const { error: subUpdateError } = await supabase
            .from('subscriptions')
            .upsert({
              stripe_subscription_id: subscription.id,
              user_id: userId,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (subUpdateError) {
            console.error(`❌ Abonelik güncellenirken hata: ${subUpdateError.message}`);
          }
          
          // Kullanıcı ayarlarını güncelle
          const { error: userUpdateError } = await supabase
            .from('user_settings')
            .update({
              subscription_status: subscriptionStatus,
              subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
          
          if (userUpdateError) {
            console.error(`❌ Kullanıcı ayarları güncellenirken hata: ${userUpdateError.message}`);
          } else {
            console.log(`✅ Kullanıcı ${userId} için abonelik durumu güncellendi: ${subscriptionStatus}`);
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
          
          // 2. User settings tablosunu doğrudan güncelle
          const subscriptionUpdateSuccess = await updateUserSubscriptionStatus(
            userId,
            subscriptionStatusForUser as 'premium' | 'free'
          );
          
          if (!subscriptionUpdateSuccess) {
            console.warn('User settings tablosu güncellenemedi, Supabase fonksiyonu kullanılacak.');
            
            // 3. Alternatif olarak SQL fonksiyonu çağırmayı dene
            try {
              const { error: rpcError } = await supabase.rpc(
                'update_user_subscription_status',
                {
                  p_user_id: userId,
                  p_status: subscriptionStatusForUser
                }
              );
              
              if (rpcError) {
                console.error('SQL fonksiyonu çağrılırken hata:', rpcError);
              } else {
                console.log('Kullanıcı durumu SQL fonksiyonu ile güncellendi');
              }
            } catch (rpcError) {
              console.error('SQL fonksiyonu çağrılırken beklenmeyen hata:', rpcError);
            }
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
        
        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = invoice.subscription as string;
          
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Abonelik süresini uzat
          await supabase.rpc('update_user_subscription_status', {
            user_id: subscription.metadata.userId,
            new_status: 'premium',
            start_date: new Date(subscription.current_period_start * 1000).toISOString(),
            end_date: new Date(subscription.current_period_end * 1000).toISOString()
          });
          break;
        }
        
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          
          // Yalnızca abonelik faturaları için işlem yap
          if (!invoice.subscription) {
            console.log('ℹ️ Abonelik olmayan fatura, işlem yapılmıyor');
            break;
          }

          try {
            // Faturanın ait olduğu aboneliği al
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            
            // Abonelik veritabanından müşteriyi bul
            const { data: subscriptionData, error: subError } = await supabase
              .from('subscriptions')
              .select('user_id')
              .eq('stripe_subscription_id', subscription.id)
              .maybeSingle();
              
            if (subError || !subscriptionData) {
              console.error(`❌ Veritabanında abonelik bulunamadı: ${subscription.id}`);
              break;
            }
            
            const userId = subscriptionData.user_id;
            
            // Ödeme başarılı olduğu için premium durumuna yükselt
            console.log(`💵 Fatura ödendi! Kullanıcı: ${userId}, abonelik: ${subscription.id}`);
            
            // Abonelik durumunu güncelle
            const result = await updateUserSubscriptionStatus(userId, 'premium', 
              subscription.id, 
              subscription.customer as string,
              new Date(subscription.current_period_start * 1000).toISOString(),
              new Date(subscription.current_period_end * 1000).toISOString()
            );
            
            if (!result) {
              console.error(`❌ Kullanıcı ${userId} için premium abonelik etkinleştirilemedi`);
            } else {
              console.log(`✅ Kullanıcı ${userId} için premium abonelik başarıyla etkinleştirildi`);
              
              // Subscription tablosunu güncelle
              const { error: updateError } = await supabase
                .from('subscriptions')
                .update({
                  status: subscription.status,
                  updated_at: new Date().toISOString()
                })
                .eq('stripe_subscription_id', subscription.id);
                
              if (updateError) {
                console.error(`❌ Abonelik durumu güncellenemedi: ${updateError.message}`);
              }
            }
          } catch (error) {
            logWebhookError('INVOICE_PAYMENT', error as Error);
          }
          break;
        }
        
        // Diğer olay tipleri...
        default:
          console.log(`ℹ️ İşlenmeyen olay tipi: ${event.type}`);
      }
    } catch (error) {
      // Ana işleme hatalarını kaydet ama webhookun başarılı yanıt verdiğinden emin ol
      logWebhookError('EVENT_PROCESSING', error, { event_type: event.type, event_id: event.id });
    }
    
    // Yanıt zaten hazırlandı
    return response;
  } catch (error) {
    // Genel hataları yakala
    const err = error as Error;
    logWebhookError('GENERAL', err);
    return NextResponse.json({ error: `Webhook Hatası: ${err.message}` }, { status: 400 });
  }
}

// Checkout tamamlandığında aboneliği işleyen yardımcı fonksiyon
async function handleCheckoutCompletion(
  session: Stripe.Checkout.Session, 
  userId: string, 
  supabase: any
) {
  console.log(`💳 Ödeme başarılı. Kullanıcı ID: ${userId}, Müşteri ID: ${session.customer}, Abonelik ID: ${session.subscription}`);
  
  try {
    // Stripe subscription detaylarını al
    const subscription = session.subscription 
      ? await stripe.subscriptions.retrieve(session.subscription as string)
      : null;
    
    if (!subscription) {
      console.error('⚠️ Checkout session ile ilişkili abonelik bulunamadı');
      return;
    }
    
    console.log(`📅 Abonelik detayları alındı: ${subscription.id}, Durum: ${subscription.status}`);
    
    // Müşteri ve abonelik bilgilerini kaydet
    
    // 1. user_settings tablosunu kontrol et ve güncelle
    const { data: existingSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
        
    const now = new Date().toISOString();
    const periodStart = new Date(subscription.current_period_start * 1000).toISOString();
    const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        
    const updateData = {
      subscription_status: 'premium',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription.id,
      subscription_period_start: periodStart,
      subscription_period_end: periodEnd,
      subscription_start: now,
      email_notifications: true,
      budget_alerts: true,
      monthly_reports: true,
      updated_at: now
    };
        
    let result;
        
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.log(`🆕 Kullanıcı ayarları oluşturuluyor... Hata kodu: ${settingsError.code}`);
      // Kayıt yok, oluştur
      result = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          ...updateData,
          app_preferences: { currency: 'TRY', language: 'tr' },
          created_at: now
        });
    } else {
      // Var olan kaydı güncelle
      console.log('🔄 Mevcut kullanıcı ayarları güncelleniyor...');
      result = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', userId);
    }
        
    if (result.error) {
      logWebhookError('SETTINGS_UPDATE', result.error, { userId, updateData });
    } else {
      console.log('✅ Kullanıcı ayarları güncellendi');
    }
        
    // 2. subscriptions tablosuna kayıt ekle
    try {
      const subscriptionData = {
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        plan: 'premium',
        current_period_start: periodStart,
        current_period_end: periodEnd,
        created_at: now,
        updated_at: now
      };
          
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData);
          
      if (subError) {
        // subscriptions tablosu zaten varsa güncelleniyor
        if (subError.code === '23505') { // Unique violation
          console.log('🔄 Abonelik kaydı zaten var, güncelleniyor...');
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: subscription.status,
              updated_at: now
            })
            .eq('stripe_subscription_id', subscription.id);
            
          if (updateError) {
            logWebhookError('SUBSCRIPTION_UPDATE', updateError, { subscriptionId: subscription.id });
          } else {
            console.log('✅ Mevcut abonelik kaydı güncellendi');
          }
        } else {
          logWebhookError('SUBSCRIPTION_INSERT', subError, { subscriptionData });
        }
      } else {
        console.log('✅ Abonelik kaydı oluşturuldu');
      }
    } catch (subError) {
      logWebhookError('SUBSCRIPTION_PROCESS', subError, { userId, subscriptionId: subscription.id });
    }
        
    // 3. Bildirim ekle
    try {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Premium Aboneliğiniz Aktif',
          content: 'Premium aboneliğiniz başarıyla aktif edildi. Tüm premium özelliklere erişebilirsiniz.',
          read: false,
          type: 'subscription',
          created_at: now,
          link: '/dashboard/subscription'
        });
          
      if (notifError) {
        logWebhookError('NOTIFICATION_INSERT', notifError, { userId });
      } else {
        console.log('✅ Bildirim kaydı oluşturuldu');
      }
    } catch (notifError) {
      logWebhookError('NOTIFICATION_PROCESS', notifError, { userId });
    }
  } catch (error) {
    logWebhookError('CHECKOUT_COMPLETION', error, { userId, sessionId: session.id });
  }
} 