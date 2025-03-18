import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Route segment config for API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('Unauthorized attempt to create checkout session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user settings to check existing subscription and Stripe customer ID
    const { data: userSettings, error: userSettingsError } = await supabase
      .from('user_settings')
      .select('stripe_customer_id, subscription_end_date')
      .eq('user_id', user.id)
      .single();
      
    if (userSettingsError) {
      console.error('Error fetching user settings:', userSettingsError);
      return NextResponse.json({ 
        error: 'User settings not found',
        details: userSettingsError.message
      }, { status: 404 });
    }
      
    // Check for Stripe API key
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe API key not configured');
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }
    
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    
    // Create or retrieve Stripe customer
    let customerId = userSettings?.stripe_customer_id;
    
    if (!customerId) {
      console.log('Creating new Stripe customer for user:', user.id);
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
          },
        });
        
        customerId = customer.id;
      } catch (stripeError: any) {
        console.error('Error creating Stripe customer:', stripeError);
        return NextResponse.json({ 
          error: 'Failed to create Stripe customer',
          details: stripeError.message
        }, { status: 500 });
      }
      
      // Update user with new customer ID
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
        
      if (updateError) {
        console.error('Error updating user with customer ID:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update user settings',
          details: updateError.message
        }, { status: 500 });
      }
    }
    
    // Check for Stripe price ID
    if (!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID) {
      console.error('Stripe price ID not configured');
      return NextResponse.json({ error: 'Payment service price not configured' }, { status: 500 });
    }
    
    // Check for site URL
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('Site URL not configured');
      return NextResponse.json({ error: 'Site URL not configured' }, { status: 500 });
    }
    
    console.log('Creating checkout session with price:', process.env.NEXT_PUBLIC_STRIPE_PRICE_ID);
    
    try {
      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account?checkout=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=canceled`,
        subscription_data: {
          metadata: {
            userId: user.id,
          },
        },
      });
      
      if (!session.url) {
        console.error('Checkout session created but no URL returned', session);
        return NextResponse.json({ error: 'No checkout URL in session' }, { status: 500 });
      }
      
      return NextResponse.json({ url: session.url });
    } catch (checkoutError: any) {
      console.error('Error creating checkout session:', {
        error: checkoutError,
        message: checkoutError.message,
        type: checkoutError.type,
        code: checkoutError.code,
        param: checkoutError.param,
      });
      
      return NextResponse.json({ 
        error: 'Failed to create checkout session',
        details: checkoutError.message,
        type: checkoutError.type,
        code: checkoutError.code,
        param: checkoutError.param
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ 
      error: error.message,
      details: error.type || error.code || 'unknown_error'
    }, { status: 500 });
  }
} 