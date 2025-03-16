import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient({ req, res });

  const body = await JSON.stringify(req.body);
  const signature = req.headers['stripe-signature'] as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
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
          subscription_status: 'premium',
          stripe_subscription_id: subscription.id,
          subscription_start_date: subscriptionStart,
          subscription_end_date: subscriptionEnd,
          email_notifications: true,
          budget_alerts: true,
          monthly_reports: true,
        })
        .eq('id', userData.id);

      if (updateError) {
        throw updateError;
      }

      console.log('Subscription updated successfully in Supabase');
    } catch (error) {
      console.error('Error processing subscription:', error);
      return res.status(400).send('Webhook handler failed. View logs.');
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
          subscription_status: 'free',
          email_notifications: false,
          budget_alerts: false,
          monthly_reports: false,
        })
        .eq('id', userData.id);

      if (updateError) {
        throw updateError;
      }

      console.log('Subscription cancelled successfully in Supabase');
    } catch (error) {
      console.error('Error processing subscription cancellation:', error);
      return res.status(400).send('Webhook handler failed. View logs.');
    }
  }

  res.json({ received: true });
}