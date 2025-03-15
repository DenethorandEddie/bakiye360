import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Stripe from "stripe";

// App Router için modern config
export const dynamic = 'force-dynamic';

// Error logging helper
function logError(step: string, error: any) {
  console.error(`[CHECKOUT ERROR] [${step}] ${error.message || 'Unknown error'}`);
  console.error(error);
}

// Stripe API anahtarı
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any, // Güncel API versiyonu
});

// SSL ayarını sadece development'ta devre dışı bırak
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function POST(req: NextRequest) {
  console.log("🔄 Checkout session oluşturma isteği alındı");
  
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
      logError("USER_AUTH", authError || new Error("User not found"));
      return NextResponse.json(
        { error: "Kimlik doğrulama başarısız" },
        { status: 401, headers }
      );
    }

    console.log(`👤 Kullanıcı bulundu: ${user.id}`);
    
    // Kullanıcı zaten premium mi kontrol et
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('subscription_status')
      .eq('user_id', user.id)
      .single();
    
    if (!settingsError && userSettings?.subscription_status === 'premium') {
      console.log("⚠️ Kullanıcı zaten premium aboneliğe sahip");
      return NextResponse.json(
        { error: "Zaten premium aboneliğiniz bulunmaktadır" },
        { status: 400, headers }
      );
    }
    
    // Ürün ve fiyat bilgilerini kontrol et
    let priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    
    if (!priceId) {
      console.error("❌ NEXT_PUBLIC_STRIPE_PRICE_ID çevre değişkeni tanımlanmamış");
      
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
            unit_amount: 1900, // 19 TL
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
          { status: 500, headers }
        );
      }
    }
    
    console.log(`💵 Ödeme için price ID: ${priceId}`);
    
    // Müşteri bilgilerini kontrol et veya oluştur
    let stripeCustomerId = customerId;
    
    if (!stripeCustomerId) {
      console.log('🆕 Yeni Stripe müşterisi oluşturuluyor...');
      
      // Kullanıcı bilgilerini al
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        logError("PROFILE_FETCH", profileError);
        // Hata durumunda yine de devam et, sadece müşteri bilgilerini Supabase'den alamadık
        console.log("⚠️ Profil bilgileri alınamadı, kullanıcı e-posta bilgisi kullanılacak");
      }
      
      // Stripe'da yeni müşteri oluştur
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: profile?.full_name || user.email?.split('@')[0],
          metadata: {
            userId: userId,
          },
        });
        
        stripeCustomerId = customer.id;
        console.log(`✅ Yeni Stripe müşteri oluşturuldu: ${stripeCustomerId}`);
      } catch (customerError) {
        logError("CUSTOMER_CREATE", customerError);
        return NextResponse.json(
          { error: "Müşteri profili oluşturulamadı" },
          { status: 500, headers }
        );
      }
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
    // Genel hata yakalama
    logError("GENERAL", error);
    
    // Hata mesajını güvenli bir şekilde döndür
    const errorMessage = error?.message || 'Bir hata oluştu';
    return NextResponse.json(
      { error: 'Ödeme sayfası oluşturulurken bir hata oluştu', details: errorMessage },
      { status: 500, headers }
    );
  }
} 