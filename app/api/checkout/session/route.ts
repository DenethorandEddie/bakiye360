import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Route segment config for API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Hata yanıtı oluşturan yardımcı fonksiyon
function createErrorResponse(message: string, debug: string, status: number, extraData = {}) {
  console.error(`Checkout API Error: ${message}`, { debug, ...extraData });
  return NextResponse.json(
    { error: message, debug, ...extraData },
    { status }
  );
}

export async function POST(request: Request) {
  console.log('--- Checkout Session API Çağrıldı ---', new Date().toISOString());
  
  if (!process.env.STRIPE_SECRET_KEY) {
    return createErrorResponse(
      'Stripe configuration missing',
      'STRIPE_SECRET_KEY not found',
      500
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Kullanıcı oturum bilgisini al
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return createErrorResponse(
        'Authentication error',
        'Session retrieval failed',
        401,
        { sessionError }
      );
    }
    
    if (!session) {
      return createErrorResponse(
        'Authentication required',
        'No active session found',
        401
      );
    }
    
    console.log('Checkout API: Oturum bulundu, kullanıcı ID:', session.user.id);
    
    // Kullanıcı bilgilerini al - önce auth.users tablosundan deneyelim
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(session.user.id);
    
    if (authError) {
      console.error('Auth user lookup failed:', authError);
    }
    
    // Profil bilgilerini al
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('Profile lookup failed:', profileError);
      
      // Profil bulunamadıysa, yeni profil oluştur
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: session.user.id,
            email: session.user.email,
            subscription_tier: 'free',
            subscription_status: 'inactive'
          }
        ])
        .select()
        .single();
      
      if (createError) {
        return createErrorResponse(
          'Profile creation failed',
          'Could not create user profile',
          500,
          { userId: session.user.id, error: createError }
        );
      }
      
      profile = newProfile;
    }
    
    if (!profile) {
      return createErrorResponse(
        'User profile not found',
        'Profile lookup and creation failed',
        404,
        { userId: session.user.id }
      );
    }
    
    console.log('Checkout API: Kullanıcı bilgileri alındı', {
      userId: profile.id,
      email: profile.email
    });
    
    // Checkout URL'lerini oluştur
    const baseUrl = 'https://www.bakiye360.com';
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    
    if (!priceId) {
      return createErrorResponse(
        'Configuration error',
        'STRIPE_PRICE_ID missing',
        500
      );
    }
    
    // Checkout session parametrelerini ayarla
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: profile.email,
      success_url: `${baseUrl}/dashboard/account?success=true`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        userId: profile.id
      }
    };
    
    console.log('Checkout API: Checkout session oluşturuluyor', {
      mode: params.mode,
      priceId,
      customer_email: profile.email,
      success_url: params.success_url,
      cancel_url: params.cancel_url,
      userId: profile.id
    });
    
    // Checkout session oluştur
    const checkoutSession = await stripe.checkout.sessions.create(params);
    
    console.log('Checkout API: Session başarıyla oluşturuldu', {
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    });
    
    return NextResponse.json({ 
      sessionUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    });
    
  } catch (error: any) {
    return createErrorResponse(
      'Unexpected error',
      error.message || 'Unknown error occurred',
      500,
      { error }
    );
  }
} 