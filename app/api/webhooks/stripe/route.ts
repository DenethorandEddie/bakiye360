import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Route segment config for API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') as string;
    
    const supabase = createRouteHandlerClient({ cookies });
    
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
  
      try {
        // Retrieve the subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  
        // Calculate the subscription start and end dates
        const subscriptionStart = new Date(subscription.current_period_start * 1000).toISOString();
        const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
  
        // Fetch the user's record from Supabase
        const { data: userData, error: userError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('stripe_customer_id', session.customer)
          .single();
  
        if (userError) {
          throw userError;
        }
  
        // Update the user's subscription details in Supabase
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({
            subscription_tier: 'premium',
            subscription_status: 'active',
            stripe_subscription_id: subscription.id,
            subscription_start_date: subscriptionStart,
            subscription_end_date: subscriptionEnd,
          })
          .eq('user_id', userData.user_id);
  
        if (updateError) {
          throw updateError;
        }
  
        console.log('Subscription updated successfully in Supabase');
      } catch (error) {
        console.error('Error processing subscription:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
      }
    }
  
    // Handle the customer.subscription.deleted event
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
  
      try {
        // Fetch the user's record from Supabase
        const { data: userData, error: userError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .single();
  
        if (userError) {
          throw userError;
        }
  
        // Update the user's subscription status in Supabase
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({
            subscription_tier: 'free',
            subscription_status: 'inactive',
          })
          .eq('user_id', userData.user_id);
  
        if (updateError) {
          throw updateError;
        }
  
        console.log('Subscription cancelled successfully in Supabase');
      } catch (error) {
        console.error('Error processing subscription cancellation:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
      }
    }
  
    // Handle customer.subscription.updated event
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      
      try {
        // Fetch the user's record from Supabase
        const { data: userData, error: userError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .single();
  
        if (userError) {
          throw userError;
        }
  
        // Update subscription details
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({
            subscription_status: subscription.status,
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('user_id', userData.user_id);
  
        if (updateError) {
          throw updateError;
        }
  
        console.log('Subscription updated successfully in Supabase');
      } catch (error) {
        console.error('Error processing subscription update:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}