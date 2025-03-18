import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Route segment config for API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  console.log('--- Checkout Session API Çağrıldı ---', new Date().toISOString());
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Kullanıcı oturum bilgisini al
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('Checkout API: Oturum bulunamadı');
      return NextResponse.json(
        { error: 'Authenticated session required', debug: 'Checkout API - auth hatası' },
        { status: 401 }
      );
    }
    
    console.log('Checkout API: Oturum bulundu, kullanıcı ID:', session.user.id);
    
    // Kullanıcı bilgilerini al
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('email, id')
      .eq('id', session.user.id)
      .single();
    
    if (userError || !user) {
      console.error('Checkout API: Kullanıcı bulunamadı', {
        userId: session.user.id,
        error: userError
      });
      return NextResponse.json(
        { error: 'User not found', debug: 'Checkout API - user bulunamadı', userId: session.user.id },
        { status: 404 }
      );
    }
    
    console.log('Checkout API: Kullanıcı bilgileri alındı', {
      userId: user.id,
      email: user.email
    });
    
    // Checkout URL'lerini oluştur
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    
    if (!priceId) {
      console.error('Checkout API: NEXT_PUBLIC_STRIPE_PRICE_ID tanımlanmamış');
      return NextResponse.json(
        { error: 'Price ID is not configured', debug: 'Checkout API - price ID hatası' },
        { status: 500 }
      );
    }
    
    // Checkout session parametrelerini ayarla
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment', // Tek seferlik ödeme için "payment" kullan
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      success_url: `${baseUrl}/dashboard/account?success=true`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        userId: user.id
      }
    };
    
    // Debug bilgilerini logla
    console.log('Checkout API: Checkout session oluşturuluyor', {
      mode: params.mode,
      priceId,
      customer_email: user.email,
      success_url: params.success_url,
      cancel_url: params.cancel_url,
      userId: user.id
    });
    
    // Checkout session oluştur
    const checkoutSession = await stripe.checkout.sessions.create(params);
    
    // Session ID'yi logla
    console.log('Checkout API: Checkout session oluşturuldu - ID:', checkoutSession.id);
    
    // Session URL'sini döndür
    return NextResponse.json({ 
      sessionUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    });
  } catch (error) {
    console.error('Checkout API: Beklenmeyen hata', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Checkout session oluşturulurken hata oluştu', 
          debug: 'Checkout API - genel hata',
          message: error.message 
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Bilinmeyen bir hata oluştu', debug: 'Checkout API - bilinmeyen hata' },
      { status: 500 }
    );
  }
} 