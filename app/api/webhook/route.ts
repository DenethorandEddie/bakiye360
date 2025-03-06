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
      event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      console.log(`Webhook doğrulandı: ${event.type}`);
    } catch (err: any) {
      console.error(`⚠️ Webhook imza doğrulama hatası:`, err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }
    
    // Özellikle checkout.session.completed olayını işle
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("Checkout tamamlandı:", JSON.stringify(session, null, 2));
      
      try {
        const userId = session.metadata?.userId;
        if (!userId) {
          console.error("userId bulunamadı!");
          return NextResponse.json({ error: "UserId bulunamadı" }, { status: 400 });
        }
        
        console.log(`Kullanıcı ID: ${userId}`);
        console.log(`Müşteri ID: ${session.customer}`);
        console.log(`Abonelik ID: ${session.subscription}`);
        
        // Stripe'dan abonelik bilgilerini al
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        
        // 1. Aboneliği subscriptions tablosuna kaydet
        const { error: subscriptionError } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          plan: "premium",
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        
        if (subscriptionError) {
          console.error("Abonelik subscriptions tablosuna kaydedilirken hata:", subscriptionError);
        } else {
          console.log("✅ Abonelik subscriptions tablosuna başarıyla kaydedildi!");
        }
        
        // 2. User settings tablosunu güncelle
        // Önce mevcut user_settings'i kontrol et
        const { data: existingSettings, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error("User settings kontrol edilirken hata:", settingsError);
        }
        
        // User settings bilgisini güncelle veya oluştur
        const userSettingsData = {
          user_id: userId,
          subscription_status: 'premium',
          subscription_plan: 'premium',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Eğer settings mevcutsa güncelle, yoksa yeni oluştur
        if (existingSettings) {
          const { error: updateError } = await supabase
            .from('user_settings')
            .update(userSettingsData)
            .eq('user_id', userId);
            
          if (updateError) {
            console.error("User settings güncellenirken hata:", updateError);
          } else {
            console.log("✅ User settings başarıyla güncellendi!");
          }
        } else {
          // Yeni settings oluştur
          const { error: insertError } = await supabase
            .from('user_settings')
            .insert({
              ...userSettingsData,
              created_at: new Date().toISOString(),
              // Varsayılan ayarlar
              email_notifications: true,
              budget_alerts: true,
              monthly_reports: true,
              app_preferences: {
                currency: "TRY",
                language: "tr",
              }
            });
            
          if (insertError) {
            console.error("User settings oluşturulurken hata:", insertError);
          } else {
            console.log("✅ User settings başarıyla oluşturuldu!");
          }
        }
        
      } catch (err) {
        console.error("Abonelik işlerken beklenmeyen hata:", err);
        return NextResponse.json({ error: "Abonelik işleme hatası" }, { status: 500 });
      }
    } else if (event.type === 'customer.subscription.updated') {
      // Abonelik güncellemelerini de işle
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      try {
        // Müşteri ID'sinden kullanıcı ID'sini bul
        const { data: subscriptionData, error: subQueryError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
          
        if (subQueryError) {
          console.error("Kullanıcı bilgisi bulunamadı:", subQueryError);
          return NextResponse.json({ error: "Kullanıcı bilgisi bulunamadı" }, { status: 400 });
        }
        
        const userId = subscriptionData.user_id;
        
        // 1. Subscriptions tablosunu güncelle
        const { error: subUpdateError } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
          
        if (subUpdateError) {
          console.error("Subscriptions tablosu güncellenirken hata:", subUpdateError);
        }
        
        // 2. User settings tablosunu güncelle
        const { error: settingsError } = await supabase
          .from('user_settings')
          .update({
            subscription_status: subscription.status,
            subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
          
        if (settingsError) {
          console.error("User settings güncellenirken hata:", settingsError);
        } else {
          console.log("✅ Abonelik bilgileri güncellendi!");
        }
      } catch (err) {
        console.error("Abonelik güncelleme hatası:", err);
      }
    } else if (event.type === 'customer.subscription.deleted') {
      // Abonelik iptali işlemi
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      try {
        // Müşteri ID'sinden kullanıcı ID'sini bul
        const { data: subscriptionData, error: subQueryError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
          
        if (subQueryError) {
          console.error("Kullanıcı bilgisi bulunamadı:", subQueryError);
          return NextResponse.json({ error: "Kullanıcı bilgisi bulunamadı" }, { status: 400 });
        }
        
        const userId = subscriptionData.user_id;
        
        // 1. Subscriptions tablosunu güncelle
        const { error: subUpdateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
          
        if (subUpdateError) {
          console.error("Subscriptions tablosu güncellenirken hata:", subUpdateError);
        }
        
        // 2. User settings tablosunu güncelle
        const { error: settingsError } = await supabase
          .from('user_settings')
          .update({
            subscription_status: 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
          
        if (settingsError) {
          console.error("User settings güncellenirken hata:", settingsError);
        } else {
          console.log("✅ Abonelik iptal bilgisi güncellendi!");
        }
      } catch (err) {
        console.error("Abonelik iptal hatası:", err);
      }
    }
    
    // Başarılı yanıt
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error("Genel webhook hatası:", error);
    return NextResponse.json({ error: "Webhook işleme hatası" }, { status: 500 });
  }
} 