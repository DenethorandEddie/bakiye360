import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Route segment config for API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    console.log('Starting checkout session creation...');
    
    const supabase = createRouteHandlerClient({ cookies });
    console.log('Supabase client created, checking authentication...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentication error:', {
        error: authError,
        message: authError.message,
        status: 'AUTH_ERROR'
      });
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: authError.message,
        errorType: 'AUTH_ERROR'
      }, { status: 401 });
    }
    
    if (!user) {
      console.error('No authenticated user found', {
        status: 'NO_USER',
        cookies: cookies().getAll() // Log cookies for debugging
      });
      return NextResponse.json({ 
        error: 'Unauthorized - No user found',
        errorType: 'NO_USER',
        details: 'Please log in to continue'
      }, { status: 401 });
    }
    
    console.log('User authenticated successfully:', {
      userId: user.id,
      email: user.email
    });
    
    // Get user settings to check existing subscription and Stripe customer ID
    console.log('Fetching user settings...');
    const { data: userSettings, error: userSettingsError } = await supabase
      .from('user_settings')
      .select('stripe_customer_id, subscription_end_date')
      .eq('user_id', user.id)
      .single();
      
    if (userSettingsError) {
      console.error('Error fetching user settings:', {
        error: userSettingsError,
        message: userSettingsError.message,
        userId: user.id,
        status: 'USER_SETTINGS_ERROR'
      });
      return NextResponse.json({ 
        error: 'User settings not found',
        details: userSettingsError.message,
        errorType: 'USER_SETTINGS_ERROR',
        userId: user.id
      }, { status: 404 });
    }
    
    // Check for active subscription
    if (userSettings?.subscription_end_date) {
      const subscriptionEnd = new Date(userSettings.subscription_end_date);
      if (subscriptionEnd > new Date()) {
        console.error('User already has active subscription:', {
          userId: user.id,
          subscriptionEnd: subscriptionEnd,
          status: 'ACTIVE_SUBSCRIPTION'
        });
        return NextResponse.json({ 
          error: 'Active subscription exists',
          details: 'You already have an active subscription',
          errorType: 'ACTIVE_SUBSCRIPTION',
          endDate: subscriptionEnd
        }, { status: 400 });
      }
    }
      
    // Check for Stripe API key
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe API key missing', {
        status: 'STRIPE_CONFIG_ERROR'
      });
      return NextResponse.json({ 
        error: 'Payment service not configured',
        errorType: 'STRIPE_CONFIG_ERROR'
      }, { status: 500 });
    }
    
    // Initialize Stripe
    console.log('Initializing Stripe...');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    
    // Create or retrieve Stripe customer
    let customerId = userSettings?.stripe_customer_id;
    
    if (!customerId) {
      console.log('No existing Stripe customer, creating new one...');
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
          },
        });
        
        customerId = customer.id;
        console.log('New Stripe customer created:', {
          customerId: customer.id,
          email: user.email
        });
      } catch (stripeError: any) {
        console.error('Error creating Stripe customer:', {
          error: stripeError,
          message: stripeError.message,
          code: stripeError.code,
          type: stripeError.type,
          status: 'STRIPE_CUSTOMER_ERROR'
        });
        return NextResponse.json({ 
          error: 'Failed to create Stripe customer',
          details: stripeError.message,
          errorType: 'STRIPE_CUSTOMER_ERROR',
          stripeError: {
            code: stripeError.code,
            type: stripeError.type
          }
        }, { status: 500 });
      }
      
      // Update user with new customer ID
      console.log('Updating user settings with new customer ID...');
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
        
      if (updateError) {
        console.error('Error updating user with customer ID:', {
          error: updateError,
          message: updateError.message,
          userId: user.id,
          customerId,
          status: 'DB_UPDATE_ERROR'
        });
        return NextResponse.json({ 
          error: 'Failed to update user settings',
          details: updateError.message,
          errorType: 'DB_UPDATE_ERROR'
        }, { status: 500 });
      }
    }
    
    // Check for Stripe price ID
    if (!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID) {
      console.error('Stripe price ID not configured', {
        status: 'PRICE_CONFIG_ERROR'
      });
      return NextResponse.json({ 
        error: 'Payment service price not configured',
        errorType: 'PRICE_CONFIG_ERROR'
      }, { status: 500 });
    }
    
    // Check for site URL
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('Site URL not configured', {
        status: 'URL_CONFIG_ERROR'
      });
      return NextResponse.json({ 
        error: 'Site URL not configured',
        errorType: 'URL_CONFIG_ERROR'
      }, { status: 500 });
    }
    
    console.log('Creating checkout session...', {
      customerId,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
    });
    
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
        console.error('Checkout session created but no URL returned', {
          session,
          status: 'NO_SESSION_URL'
        });
        return NextResponse.json({ 
          error: 'No checkout URL in session',
          errorType: 'NO_SESSION_URL'
        }, { status: 500 });
      }
      
      console.log('Checkout session created successfully:', {
        sessionId: session.id,
        url: session.url
      });
      
      return NextResponse.json({ url: session.url });
    } catch (checkoutError: any) {
      console.error('Error creating checkout session:', {
        error: checkoutError,
        message: checkoutError.message,
        type: checkoutError.type,
        code: checkoutError.code,
        param: checkoutError.param,
        status: 'CHECKOUT_SESSION_ERROR'
      });
      
      return NextResponse.json({ 
        error: 'Failed to create checkout session',
        details: checkoutError.message,
        errorType: 'CHECKOUT_SESSION_ERROR',
        stripeError: {
          type: checkoutError.type,
          code: checkoutError.code,
          param: checkoutError.param
        }
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Unexpected error in POST handler:', {
      error,
      message: error.message,
      stack: error.stack,
      status: 'UNEXPECTED_ERROR'
    });
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error.message,
      errorType: 'UNEXPECTED_ERROR'
    }, { status: 500 });
  }
} 