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
  console.log("📣 Create checkout session API çağrıldı");
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    let requestData;
    
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("JSON parse hatası:", parseError);
      return NextResponse.json(
        { error: "Geçersiz istek formatı" }, 
        { status: 400, headers }
      );
    }
    
    const { userId, customerId } = requestData;

    if (!userId) {
      console.error("Kullanıcı ID eksik");
      return NextResponse.json(
        { error: "Kullanıcı ID eksik" }, 
        { status: 400, headers }
      );
    }

    // Kullanıcıyı doğrula 
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Kullanıcı doğrulama hatası:", authError);
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor" }, 
        { status: 401, headers }
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

    // Fiyat ID kontrolü
    let priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
    
    if (!priceId) {
      console.warn('⚠️ STRIPE_PREMIUM_PRICE_ID tanımlanmamış, dinamik olarak ürün oluşturuluyor');
      
      // Eğer ürün ve fiyat tanımlaması yapılmamışsa, dinamik olarak oluştur
      const product = await stripe.products.create({
        name: 'Bakiye360 Premium',
        description: 'Aylık premium abonelik planı',
        metadata: {
          type: 'subscription'
        }
      });
      
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 14999, // 149,99 TL
        currency: 'try',
        recurring: {
          interval: 'month'
        }
      });
      
      priceId = price.id;
      console.log(`✨ Ürün ve fiyat oluşturuldu. Fiyat ID: ${priceId}`);
    }

    // URL bilgilerini oluştur - trailing slash olmadan
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://bakiye360.com';
    const successUrl = `${origin}/dashboard/subscription?success=true`;
    const cancelUrl = `${origin}/dashboard/subscription?canceled=true`;

    console.log(`🔗 URL'ler hazırlandı: ${successUrl}, ${cancelUrl}`);

    // Checkout session oluştur
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId: userId
      }
    });

    console.log('✅ Checkout session oluşturuldu:', session.id);
    
    // Doğrudan NextResponse kullan
    return NextResponse.json(
      { sessionId: session.id },
      { status: 200, headers }
    );
  } catch (error: any) {
    console.error('❌ Stripe hatası:', error);
    
    // Hata mesajını güvenli bir şekilde döndür
    const errorMessage = error?.message || 'Bir hata oluştu';
    return NextResponse.json(
      { error: 'Ödeme sayfası oluşturulurken bir hata oluştu', details: errorMessage },
      { status: 500, headers }
    );
  }
} 