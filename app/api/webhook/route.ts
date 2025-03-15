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
      console.error('Kullanıcı ayarları kontrol edilirken hata:', settingsError);
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
      console.error('Kullanıcı ayarları güncellenirken/oluşturulurken hata:', result.error);
      return false;
    }
    
    console.log(`✅ Kullanıcı ${userId} için abonelik durumu başarıyla güncellendi: ${status}`);
    return true;
  } catch (error) {
    console.error('Kullanıcı abonelik durumu güncellenirken beklenmeyen hata:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  try {
    // Webhook imzasını doğrula
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    const supabase = createRouteHandlerClient({ cookies });
    
    console.log(`🪝 Webhook olayı alındı: ${event.type}`);
    console.log(`Olay detayları: ${JSON.stringify(event.data.object, null, 2)}`);
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // userId'yi metadata'dan almayı dene
        console.log('Checkout session metadata:', session.metadata);
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error('⚠️ userId metadata bulunamadı. client_reference_id kullanılıyor...');
          // client_reference_id varsa dene
          if (session.client_reference_id) {
            console.log(`client_reference_id bulundu: ${session.client_reference_id}`);
            // Burada client_reference_id, userId olarak kullanılabilir
            await handleCheckoutCompletion(session, session.client_reference_id, supabase);
          } else {
            throw new Error('Session metadata ve client_reference_id içerisinde userId bulunamadı');
          }
        } else {
          await handleCheckoutCompletion(session, userId, supabase);
        }
        
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Subscription ID ve müşteri ID'sini al
        const subscriptionId = subscription.id;
        const customerId = subscription.customer as string;
        
        console.log(`Abonelik güncellendi. ID: ${subscriptionId}, Durum: ${subscription.status}, İptal Durumu: ${subscription.cancel_at_period_end ? 'Dönem sonunda iptal' : 'Aktif'}`);
        console.log('Tam subscription objesi:', JSON.stringify(subscription, null, 2));
        
        // Veritabanında kayıtlı aboneliği arayarak kullanıcıyı bul
        let userId = null;
        
        try {
          // Önce subscriptions tablosunda ara
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscriptionId)
            .maybeSingle();
            
          if (subscriptionError) {
            console.error('Subscription tablosunda kullanıcı bulunamadı:', subscriptionError);
          } else if (subscriptionData) {
            userId = subscriptionData.user_id;
            console.log(`Subscription tablosunda kullanıcı bulundu: ${userId}`);
          }
          
          // Kullanıcı bulunamadıysa user_settings tablosunda da ara
          if (!userId) {
            const { data: userSettingsData, error: userSettingsError } = await supabase
              .from('user_settings')
              .select('user_id')
              .eq('stripe_subscription_id', subscriptionId)
              .maybeSingle();
              
            if (userSettingsError) {
              console.error('User settings tablosunda kullanıcı bulunamadı:', userSettingsError);
            } else if (userSettingsData) {
              userId = userSettingsData.user_id;
              console.log(`User settings tablosunda kullanıcı bulundu: ${userId}`);
            }
          }
          
          if (!userId) {
            console.error(`Kullanıcı bulunamadı. Subscription ID: ${subscriptionId}`);
            return NextResponse.json(
              { error: 'Kullanıcı bulunamadı' },
              { status: 404 }
            );
          }
          
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
          
          console.log(`Belirlenmiş abonelik durumu: ${subscriptionStatusForUser}`);
          
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
          
          // 2. User settings tablosunu güncelleme - tüm yöntemleri dene
          
          // a. İlk olarak yardımcı fonksiyonla güncelleme
          console.log(`updateUserSubscriptionStatus çağrılıyor, kullanıcı: ${userId}, durum: ${subscriptionStatusForUser}`);
          const subscriptionUpdateSuccess = await updateUserSubscriptionStatus(
            userId,
            subscriptionStatusForUser as 'premium' | 'free',
            subscriptionId,
            customerId,
            periodStart,
            periodEnd
          );
          
          if (!subscriptionUpdateSuccess) {
            console.warn('updateUserSubscriptionStatus başarısız oldu, alternatif yöntemler deneniyor...');
            
            // b. Doğrudan SQL sorgusu ile güncelleme
            try {
              console.log(`Doğrudan SQL sorgusu ile güncelleme deneniyor, kullanıcı: ${userId}, durum: ${subscriptionStatusForUser}`);
              const { data: directUpdateData, error: directUpdateError } = await supabase
                .from('user_settings')
                .upsert({
                  user_id: userId,
                  subscription_status: subscriptionStatusForUser,
                  stripe_customer_id: customerId,
                  stripe_subscription_id: subscriptionId,
                  subscription_period_start: periodStart,
                  subscription_period_end: periodEnd,
                  updated_at: new Date().toISOString()
                });
                
              if (directUpdateError) {
                console.error('Doğrudan SQL sorgusu ile güncelleme başarısız:', directUpdateError);
              } else {
                console.log('Doğrudan SQL sorgusu ile güncelleme başarılı');
              }
            } catch (directError) {
              console.error('Doğrudan güncelleme hatası:', directError);
            }
            
            // c. SQL fonksiyonu ile güncelleme
            try {
              console.log(`SQL RPC fonksiyonu ile güncelleme deneniyor, kullanıcı: ${userId}, durum: ${subscriptionStatusForUser}`);
              const { error: rpcError } = await supabase.rpc(
                'update_user_subscription_status',
                {
                  p_user_id: userId,
                  p_status: subscriptionStatusForUser,
                  p_stripe_subscription_id: subscriptionId,
                  p_stripe_customer_id: customerId,
                  p_subscription_period_start: periodStart,
                  p_subscription_period_end: periodEnd
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
        } catch (err) {
          console.error('Abonelik güncellenirken genel hata:', err);
          return NextResponse.json(
            { error: 'Abonelik güncellenirken beklenmeyen hata oluştu' },
            { status: 500 }
          );
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
      
      // Yeni event handler ekle
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
      
      // Diğer olay tipleri...
      default:
        console.log(`Bilinmeyen olay tipi: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const err = error as Error;
    console.error('[WEBHOOK_ERROR]', err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
}

// Checkout tamamlandığında aboneliği işleyen yardımcı fonksiyon
async function handleCheckoutCompletion(
  session: Stripe.Checkout.Session, 
  userId: string, 
  supabase: any
) {
  console.log(`💳 Ödeme başarılı. Kullanıcı ID: ${userId}, Müşteri ID: ${session.customer}, Abonelik ID: ${session.subscription}`);
  
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
  try {
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
      
    if (settingsError) {
      // Kayıt yok, oluştur
      console.log('🆕 Kullanıcı ayarları oluşturuluyor...');
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
      console.error('⚠️ Kullanıcı ayarları güncellenirken hata:', result.error);
    } else {
      console.log('✅ Kullanıcı ayarları güncellendi');
    }
      
    // 2. subscriptions tablosuna kayıt ekle
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
      console.error('⚠️ Abonelik kaydı oluşturulurken hata:', subError);
    } else {
      console.log('✅ Abonelik kaydı oluşturuldu');
    }
      
    // 3. Bildirim ekle
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
      console.error('⚠️ Bildirim oluşturulurken hata:', notifError);
    } else {
      console.log('✅ Bildirim kaydı oluşturuldu');
    }
  } catch (error) {
    console.error('⚠️ Abonelik işlenirken beklenmeyen hata:', error);
  }
} 