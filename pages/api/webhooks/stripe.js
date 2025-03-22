import { buffer } from 'micro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for required environment variables
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Stripe configuration is missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase configuration is missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
      apiVersion: '2023-10-16' 
    });
    
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const sig = req.headers['stripe-signature'];
    if (!sig) {
      console.error('No Stripe signature found');
      return res.status(400).json({ error: 'No Stripe signature' });
    }

    // Get the raw body
    let event;
    const buf = await buffer(req);
    
    try {
      event = stripe.webhooks.constructEvent(
        buf, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    console.log(`Processing Stripe webhook event: ${event.type}`);

    // Handle relevant events
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata && session.metadata.user_id;

      if (!userId) {
        console.error('No user_id found in session metadata');
        return res.status(400).json({ error: 'Missing user ID in session metadata' });
      }

      console.log(`Checkout completed for user: ${userId}`);
      
      // Get subscription details from Stripe
      let subscriptionDetails;
      if (session.subscription) {
        try {
          subscriptionDetails = await stripe.subscriptions.retrieve(session.subscription);
          console.log('Retrieved subscription details from Stripe');
        } catch (error) {
          console.error('Error retrieving subscription from Stripe:', error);
        }
      }

      // Set subscription period
      const startDate = new Date();
      let endDate;
      
      if (subscriptionDetails && subscriptionDetails.current_period_end) {
        // Use the end date from Stripe if available
        endDate = new Date(subscriptionDetails.current_period_end * 1000);
      } else {
        // Default to one month from now
        endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Update user settings in Supabase
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString(),
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          subscription_status: 'active',
          subscription_tier: 'premium'
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating subscription in Supabase:', error);
        return res.status(500).json({ 
          error: 'Error updating subscription status', 
          details: error.message 
        });
      }

      console.log(`Successfully updated subscription for user: ${userId}`);

    } else if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      if (!subscription.id) {
        console.error('Missing subscription ID in event data');
        return res.status(400).json({ error: 'Invalid subscription data' });
      }

      console.log(`Subscription updated: ${subscription.id}`);
      
      const newPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      const updatedStatus = subscription.status === 'active' ? 'active' : 'cancelled';
      const updatedTier = subscription.status === 'active' ? 'premium' : 'free';

      const { data, error } = await supabase
        .from('user_settings')
        .update({
          subscription_end_date: newPeriodEnd,
          subscription_status: updatedStatus,
          subscription_tier: updatedTier
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Error updating subscription in Supabase:', error);
        return res.status(500).json({ 
          error: 'Error updating subscription status',
          details: error.message
        });
      }

      console.log(`Successfully updated subscription: ${subscription.id}`);

    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      if (!subscription.id) {
        console.error('Missing subscription ID in event data');
        return res.status(400).json({ error: 'Invalid subscription data' });
      }

      console.log(`Subscription cancelled: ${subscription.id}`);
      
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          subscription_status: 'cancelled',
          subscription_tier: 'free'
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Error updating subscription cancellation in Supabase:', error);
        return res.status(500).json({ 
          error: 'Error updating cancellation status',
          details: error.message 
        });
      }

      console.log(`Successfully cancelled subscription: ${subscription.id}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return res.status(200).json({ received: true, event_type: event.type });
  } catch (error) {
    console.error('Unexpected error in webhook handler:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
} 