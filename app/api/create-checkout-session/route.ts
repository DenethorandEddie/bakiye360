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

export async function POST(req: NextRequest) {
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

    // URL bilgilerini oluştur
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${origin}/dashboard/subscription?success=true`;
    const cancelUrl = `${origin}/dashboard/subscription?canceled=true`;

    // Premium abonelik fiyat ID'si
    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID || 'create-a-product-first';
    if (priceId === 'create-a-product-first') {
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
      
      console.log(`✨ Ürün ve fiyat oluşturuldu. Fiyat ID: ${price.id}`);
    }

    // Checkout session oluştur
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'try',
            product_data: {
              name: 'Bakiye360 Premium',
              description: 'Aylık premium abonelik planı'
            },
            unit_amount: 14999, // 149,99 TL
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId, // Önemli: Webhook'ta userId eşleştirmesi için bu alanı kullanıyoruz
      metadata: {
        userId: userId // Ek güvenlik - bazı webhook'lar metadata'yı kullanır
      }
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Checkout session oluşturma hatası:', error);
    return NextResponse.json(
      { error: 'Ödeme sayfası oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
} 