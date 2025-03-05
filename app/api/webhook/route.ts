import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Supabase admin client oluştur
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Stripe API anahtarı
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any, // Linter hatası için type assertion
});

// Webhook gizli anahtarı - Stripe'dan gelen olayların doğrulanmasında kullanılır
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

// Bu fonksiyon raw body'yi alır
async function getRawBody(req: Request): Promise<string> {
  const reader = req.body?.getReader();
  if (!reader) return '';
  
  const chunks: Uint8Array[] = [];
  
  // Tüm chunk'ları oku
  let done = false;
  while (!done) {
    const { done: readerDone, value } = await reader.read();
    done = readerDone;
    if (value) chunks.push(value);
  }
  
  // Chunk'ları birleştir
  const bodyBuffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    bodyBuffer.set(chunk, offset);
    offset += chunk.length;
  }
  
  // Buffer'ı string'e dönüştür
  return new TextDecoder().decode(bodyBuffer);
}

export async function POST(request: Request) {
  try {
    // İstek gövdesini Text formatında al
    const text = await request.text();
    
    // Stripe imzasını al
    const signature = request.headers.get("stripe-signature") || "";

    let event;
    
    // İmzayı doğrula ve Stripe event'ini oluştur
    try {
      event = stripe.webhooks.constructEvent(text, signature, endpointSecret);
    } catch (err) {
      console.error(`Webhook imza doğrulama hatası:`, err);
      return NextResponse.json(
        { error: "Webhook imza doğrulama hatası" },
        { status: 400 }
      );
    }
    
    // Supabase client oluştur
    const supabase = createRouteHandlerClient({ cookies });
    
    // Event tipine göre işlemi gerçekleştir
    switch (event.type) {
      // Ödeme başarılı ise
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        
        if (!userId) {
          console.error("Kullanıcı ID'si bulunamadı");
          return NextResponse.json(
            { error: "Kullanıcı ID'si bulunamadı" },
            { status: 400 }
          );
        }
        
        // Stripe'dan abonelik bilgilerini al
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        
        // Abonelik tarihlerini al
        const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        
        // Supabase'de abonelik kaydı oluştur veya güncelle
        const { error } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          plan: "premium",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        
        if (error) {
          console.error("Abonelik kaydı oluşturma hatası:", error);
          return NextResponse.json(
            { error: "Abonelik kaydı oluşturma hatası" },
            { status: 500 }
          );
        }
        
        break;
      }
      
      // Abonelik güncellendiğinde (yenileme, güncelleme vb.)
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Supabase'den abonelik bilgilerini sorgula
        const { data: subscriptionData, error: queryError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("stripe_subscription_id", subscription.id)
          .single();
        
        if (queryError || !subscriptionData) {
          console.error("Abonelik bulunamadı:", queryError);
          return NextResponse.json(
            { error: "Abonelik bulunamadı" },
            { status: 404 }
          );
        }
        
        // Abonelik bilgilerini güncelle
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscriptionData.id);
        
        if (error) {
          console.error("Abonelik güncelleme hatası:", error);
          return NextResponse.json(
            { error: "Abonelik güncelleme hatası" },
            { status: 500 }
          );
        }
        
        break;
      }
      
      // Abonelik iptal edildiğinde veya sona erdiğinde
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Supabase'den abonelik bilgilerini sorgula
        const { data: subscriptionData, error: queryError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("stripe_subscription_id", subscription.id)
          .single();
        
        if (queryError || !subscriptionData) {
          console.error("Abonelik bulunamadı:", queryError);
          return NextResponse.json(
            { error: "Abonelik bulunamadı" },
            { status: 404 }
          );
        }
        
        // Abonelik durumunu güncelle
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscriptionData.id);
        
        if (error) {
          console.error("Abonelik silme hatası:", error);
          return NextResponse.json(
            { error: "Abonelik silme hatası" },
            { status: 500 }
          );
        }
        
        break;
      }
      
      // Diğer olaylar için
      default:
        console.log(`İşlenmeyen Stripe olayı: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook işleme hatası:", error);
    return NextResponse.json(
      { error: "Webhook işleme hatası" },
      { status: 500 }
    );
  }
} 