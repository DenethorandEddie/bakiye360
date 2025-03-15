import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Stripe from "stripe";

// App Router için modern config
export const dynamic = 'force-dynamic';

// Stripe API anahtarı
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any, // Güncel API versiyonu
});

// SSL ayarını sadece development'ta devre dışı bırak
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function POST(req: NextRequest) {
  // CORS headers ekleyin
  const headers = new Headers({
    'Access-Control-Allow-Origin': 'https://bakiye360.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });

  try {
    const { userId, customerId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Kullanıcı ID eksik" },
        { status: 400 }
      );
    }

    // Kullanıcıyı doğrula 
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }

    console.log(`🔑 Ödeme başlatıldı. Kullanıcı: ${userId}, Müşteri ID: ${customerId || 'Yeni'}`);

    // Stripe müşterisi oluştur veya mevcut olanı kullan
    let stripeCustomerId = customerId;
    
    if (!stripeCustomerId) {
      console.log('🆕 Yeni Stripe müşterisi oluşturuluyor...');
      
      // Kullanıcı bilgilerini al
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();
        
      // Yeni Stripe müşterisi oluştur
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || user.email,
        metadata: {
          userId: userId
        }
      });
      
      stripeCustomerId = customer.id;
      
      // Kullanıcı ayarlarına müşteri ID'sini kaydet
      await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString()
        });
        
      console.log(`✅ Stripe müşterisi oluşturuldu: ${stripeCustomerId}`);
    }

    // Fiyat ID kontrolünü iyileştirme
    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
    if (!priceId) {
      console.error('STRIPE_PREMIUM_PRICE_ID tanımlanmamış!');
      return NextResponse.json(
        { error: 'Sunucu yapılandırma hatası' },
        { status: 500 }
      );
    }

    // URL bilgilerini oluştur
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${origin}/dashboard/subscription?success=true`;
    const cancelUrl = `${origin}/dashboard/subscription?canceled=true`;

    // Checkout session oluştur
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId, // Direkt priceId kullan
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId, // Önemli: Webhook'ta userId eşleştirmesi için bu alanı kullanıyoruz
      metadata: {
        userId: userId // Ek güvenlik - bazı webhook'lar metadata'yı kullanır
      }
    });

    console.log('✅ Checkout session oluşturuldu:', session.id);
    return new Response(JSON.stringify({ sessionId: session.id }), { 
      status: 200,
      headers: new Headers({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache' // Önbellek sorunlarını önle
      })
    });
  } catch (error) {
    console.error('Stripe hatası:', error);
    return NextResponse.json(
      { error: 'Stripe API hatası: ' + error.message },
      { status: 500 }
    );
  }
} 