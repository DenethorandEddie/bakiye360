import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Route segment config for API route
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Kullanıcı oturum bilgisini al
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authenticated session required' },
        { status: 401 }
      );
    }
    
    // Kullanıcı bilgilerini al
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('email, id')
      .eq('id', session.user.id)
      .single();
    
    if (userError || !user) {
      console.error('Error fetching user', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Checkout URL'lerini oluştur
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    
    if (!priceId) {
      console.error('NEXT_PUBLIC_STRIPE_PRICE_ID is not defined');
      return NextResponse.json(
        { error: 'Price ID is not configured' },
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
    console.log('Creating checkout session with params:', JSON.stringify({
      mode: params.mode,
      priceId,
      customer_email: user.email,
      success_url: params.success_url,
      cancel_url: params.cancel_url,
      userId: user.id
    }, null, 2));
    
    // Checkout session oluştur
    const checkoutSession = await stripe.checkout.sessions.create(params);
    
    // Session ID'yi logla
    console.log('Checkout session created:', checkoutSession.id);
    
    // Session URL'sini döndür
    return NextResponse.json({ sessionUrl: checkoutSession.url });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the checkout session' },
      { status: 500 }
    );
  }
} 