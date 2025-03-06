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
        
        // Aboneliği veritabanına kaydet
        const { error } = await supabase.from("subscriptions").upsert({
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
        
        if (error) {
          console.error("Abonelik kaydedilirken hata:", error);
          return NextResponse.json({ error: "Abonelik kaydedilemedi" }, { status: 500 });
        }
        
        console.log("✅ Abonelik başarıyla kaydedildi!");
        
      } catch (err) {
        console.error("Abonelik işlerken beklenmeyen hata:", err);
        return NextResponse.json({ error: "Abonelik işleme hatası" }, { status: 500 });
      }
    }
    
    // Başarılı yanıt
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error("Genel webhook hatası:", error);
    return NextResponse.json({ error: "Webhook işleme hatası" }, { status: 500 });
  }
} 