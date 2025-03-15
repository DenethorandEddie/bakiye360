import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Stripe from "stripe";

// App Router için modern config
export const dynamic = 'force-dynamic';

// CORS headers'ı hazırla - tüm domainler için izin ver
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Error logging helper
function logError(step: string, error: any) {
  console.error(`[CHECKOUT ERROR] [${step}] ${error.message || 'Unknown error'}`);
  console.error(error);
}

// Stripe API anahtarı
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any, // Daha eski ve stabil bir API versiyonu
});

// SSL ayarını sadece development'ta devre dışı bırak
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// OPTIONS metodu için handler
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  console.log("🔄 Checkout session oluşturma isteği alındı");
  
  // CORS headers
  const responseHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/json'
  };

  try {
    // İstek gövdesini okuma
    const requestData = await req.json();
    console.log("📦 İstek verileri:", requestData);
    
    // Supabase client oluştur
    const supabase = createRouteHandlerClient({ cookies });
    
    // Mevcut kullanıcıyı al
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      logError("USER_AUTH", userError || new Error("User not found"));
      return NextResponse.json(
        { error: "Kimlik doğrulama başarısız" },
        { status: 401, headers: responseHeaders }
      );
    }
    
    console.log(`👤 Kullanıcı bulundu: ${user.id}`);
    
    // Kullanıcı zaten premium mi kontrol et - hem user_id hem de id alanlarına bakalım
    let isPremium = false;
    
    // 1. user_id ile kontrol
    const { data: userSettingsByUserId } = await supabase
      .from('user_settings')
      .select('subscription_status')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // 2. id ile kontrol  
    const { data: userSettingsById } = await supabase
      .from('user_settings')
      .select('subscription_status')
      .eq('id', user.id)
      .maybeSingle();
    
    // Herhangi birinde premium status varsa
    if (
      (userSettingsByUserId && userSettingsByUserId.subscription_status === 'premium') ||
      (userSettingsById && userSettingsById.subscription_status === 'premium')
    ) {
      isPremium = true;
    }
    
    if (isPremium) {
      console.log("⚠️ Kullanıcı zaten premium aboneliğe sahip");
      return NextResponse.json(
        { error: "Zaten premium aboneliğiniz bulunmaktadır" },
        { status: 400, headers: responseHeaders }
      );
    }
    
    // Ürün ve fiyat bilgilerini kontrol et
    let priceId = requestData?.priceId || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    
    if (!priceId) {
      console.error("❌ Fiyat ID bulunamadı. Ne istek gövdesinde ne de env değişkeninde mevcut değil");
      
      // Otomatik olarak bir price ID oluştur (sadece geçici çözüm)
      try {
        // Mevcut ürünleri kontrol et
        const products = await stripe.products.list({
          active: true,
          limit: 1,
        });
        
        let productId;
        
        // Eğer ürün yoksa oluştur
        if (products.data.length === 0) {
          console.log("ℹ️ Ürün bulunamadı, yeni ürün oluşturuluyor");
          const newProduct = await stripe.products.create({
            name: "Bakiye360 Premium",
            description: "Bakiye360 Premium Abonelik",
          });
          productId = newProduct.id;
        } else {
          productId = products.data[0].id;
        }
        
        // Fiyat bilgilerini kontrol et
        const prices = await stripe.prices.list({
          product: productId,
          active: true,
          limit: 1,
        });
        
        // Eğer fiyat yoksa oluştur
        if (prices.data.length === 0) {
          console.log("ℹ️ Fiyat bulunamadı, yeni fiyat oluşturuluyor");
          const newPrice = await stripe.prices.create({
            product: productId,
            unit_amount: 14999, // 149.99 TL
            currency: "try",
            recurring: {
              interval: "month",
            },
          });
          priceId = newPrice.id;
        } else {
          priceId = prices.data[0].id;
        }
        
        console.log(`✅ Fiyat ID otomatik olarak ayarlandı: ${priceId}`);
      } catch (priceError) {
        logError("PRICE_CREATE", priceError);
        return NextResponse.json(
          { error: "Fiyat bilgisi oluşturulamadı" },
          { status: 500, headers: responseHeaders }
        );
      }
    }
    
    console.log(`💵 Ödeme için price ID: ${priceId}`);
    
    // Müşteri bilgilerini kontrol et veya oluştur
    let stripeCustomerId;
    
    // Önce user_settings'de müşteri ID'sine bak
    const { data: userSettingsData } = await supabase
      .from('user_settings')
      .select('stripe_customer_id')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`) // Her iki alan da kontrol ediliyor
      .maybeSingle();
    
    if (userSettingsData?.stripe_customer_id) {
      stripeCustomerId = userSettingsData.stripe_customer_id;
      console.log(`🔄 Mevcut Stripe müşteri ID kullanılıyor: ${stripeCustomerId}`);
    } else {
      console.log('🆕 Yeni Stripe müşterisi oluşturuluyor...');
      
      // Kullanıcı bilgilerini al
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
        
      // Stripe'da yeni müşteri oluştur
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: profile?.full_name || user.email?.split('@')[0] || "Bakiye360 Kullanıcısı",
          metadata: {
            userId: user.id,
          },
        });
        
        stripeCustomerId = customer.id;
        console.log(`✅ Yeni Stripe müşteri oluşturuldu: ${stripeCustomerId}`);
      } catch (customerError) {
        logError("CUSTOMER_CREATE", customerError);
        return NextResponse.json(
          { error: "Müşteri profili oluşturulamadı" },
          { status: 500, headers: responseHeaders }
        );
      }
    }

    // URL bilgilerini oluştur - her zaman HTTPS kullan
    const origin = "https://www.bakiye360.com";
    const successUrl = `${origin}/dashboard/subscription?success=true`;
    const cancelUrl = `${origin}/dashboard/subscription?canceled=true`;

    console.log(`🔗 URL'ler hazırlandı: ${successUrl}, ${cancelUrl}`);

    // Checkout session oluştur
    try {
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
        client_reference_id: user.id,
        metadata: {
          userId: user.id
        }
      });

      console.log('✅ Checkout session oluşturuldu:', session.id);
      
      // URL bilgisi varsa bunu döndür
      return NextResponse.json({ 
        url: session.url || `https://checkout.stripe.com/pay/${session.id}`,
        sessionId: session.id
      }, { status: 200, headers: responseHeaders });
    } catch (checkoutError) {
      logError("CHECKOUT_CREATE", checkoutError);
      return NextResponse.json(
        { error: `Ödeme sayfası oluşturma hatası: ${(checkoutError as any)?.message || 'Bilinmeyen hata'}` },
        { status: 500, headers: responseHeaders }
      );
    }
  } catch (error: any) {
    // Genel hata yakalama
    logError("GENERAL", error);
    
    // Hata mesajını güvenli bir şekilde döndür
    const errorMessage = error?.message || 'Bir hata oluştu';
    const errorCode = error?.statusCode || 500;
    
    return NextResponse.json(
      { 
        error: 'Ödeme sayfası oluşturulurken bir hata oluştu', 
        details: errorMessage,
        code: errorCode 
      },
      { status: errorCode, headers: corsHeaders }
    );
  }
} 