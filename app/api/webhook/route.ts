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

// Kullanıcı abonelik durumunu güncelleyen yardımcı fonksiyon
async function updateUserSubscriptionStatus(
  userId: string, 
  status: 'premium' | 'free', 
  subscriptionId?: string, 
  customerId?: string,
  periodStart?: string,
  periodEnd?: string
) {
  console.log(`Supabase user_settings tablosu direkt güncelleniyor. Kullanıcı: ${userId}, Durum: ${status}`);
  
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
    // Ücretsiz sürüme geçince bildirim ayarlarını kapat
    else if (status === 'free') {
      updateData.email_notifications = false;
      updateData.budget_alerts = false;
      updateData.monthly_reports = false;
      console.log(`Ücretsiz plan için bildirim ayarları otomatik olarak kapatıldı. Kullanıcı: ${userId}`);
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
    
    // Eğer kayıt varsa güncelle
    if (existingSettings) {
      const { error: updateError } = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Kullanıcı ayarları güncellenirken hata:', updateError);
        return false;
      }
    } else {
      // Kayıt yoksa oluştur
      const newSettings = {
        user_id: userId,
        subscription_status: status,
        stripe_subscription_id: subscriptionId || null,
        stripe_customer_id: customerId || null,
        subscription_period_start: periodStart || null,
        subscription_period_end: periodEnd || null,
        email_notifications: status === 'premium', // Premium ise true, değilse false
        budget_alerts: status === 'premium', // Premium ise true, değilse false
        monthly_reports: status === 'premium', // Premium ise true, değilse false
        app_preferences: { currency: 'TRY', language: 'tr' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('user_settings')
        .insert(newSettings);
      
      if (insertError) {
        console.error('Kullanıcı ayarları oluşturulurken hata:', insertError);
        return false;
      }
    }
    
    console.log(`✅ Kullanıcı ${userId} için abonelik durumu başarıyla güncellendi: ${status}`);
    return true;
  } catch (error) {
    console.error('Kullanıcı abonelik durumu güncellenirken beklenmeyen hata:', error);
    return false;
  }
}

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
        
        // Önce client_reference_id'yi kontrol et, yoksa metadata.userId'yi kontrol et
        let userId = session.client_reference_id || null;
        
        // client_reference_id boşsa metadata içindeki userId'yi kontrol et
        if (!userId && session.metadata && session.metadata.userId) {
          userId = session.metadata.userId;
          console.log(`client_reference_id boş, metadata.userId kullanılıyor: ${userId}`);
        }
        
        if (!userId) {
          console.error('Kullanıcı ID bulunamadı. client_reference_id ve metadata.userId alanları kontrol edildi.');
          console.log('Tam session objesi:', JSON.stringify(session, null, 2));
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
          console.log(`Abonelik durumu: ${subscription.status}`);
          
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
          
          // 2. User settings tablosunu doğrudan güncelle
          console.log(`User settings tablosu güncelleniyor, kullanıcı: ${userId}, status: premium`);
          
          const subscriptionUpdateSuccess = await updateUserSubscriptionStatus(
            userId,
            'premium',
            subscriptionId,
            customerId,
            periodStart,
            periodEnd
          );
          
          if (!subscriptionUpdateSuccess) {
            console.warn('User settings tablosu güncellenemedi, alternatif mekanizmalar deneniyor...');
            
            // Doğrudan SQL sorgusu ile güncelleme dene
            try {
              const { data: directUpdateData, error: directUpdateError } = await supabase
                .from('user_settings')
                .upsert({
                  user_id: userId,
                  subscription_status: 'premium',
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
            
            // 3. Alternatif olarak SQL fonksiyonu çağırmayı dene
            try {
              const { error: rpcError } = await supabase.rpc(
                'update_user_subscription_status',
                {
                  p_user_id: userId,
                  p_status: 'premium',
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