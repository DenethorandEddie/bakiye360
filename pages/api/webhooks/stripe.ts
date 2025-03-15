import { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'stream';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createOrUpdateSubscription, updateUserSubscriptionStatus, getUserByStripeCustomerId } from '@/lib/supabase-admin';

// Gelen raw body'i parse etme yardımcı fonksiyonu
async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          
          // Stripe'dan subscription verilerini al
          if (checkoutSession.subscription && checkoutSession.customer) {
            const subscription = await stripe.subscriptions.retrieve(
              checkoutSession.subscription as string
            );
            
            const userId = checkoutSession.metadata?.userId;
            if (!userId) {
              throw new Error('No user ID found in session metadata');
            }

            // Subscription verilerini veritabanına kaydet
            await createOrUpdateSubscription({
              user_id: userId,
              status: subscription.status,
              price_id: subscription.items.data[0].price.id,
              quantity: subscription.items.data[0].quantity || 1,
              cancel_at_period_end: subscription.cancel_at_period_end,
              created: new Date(subscription.created * 1000).toISOString(),
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              ended_at: subscription.ended_at 
                ? new Date(subscription.ended_at * 1000).toISOString() 
                : null,
              cancel_at: subscription.cancel_at 
                ? new Date(subscription.cancel_at * 1000).toISOString() 
                : null,
              canceled_at: subscription.canceled_at 
                ? new Date(subscription.canceled_at * 1000).toISOString() 
                : null,
              trial_start: subscription.trial_start 
                ? new Date(subscription.trial_start * 1000).toISOString() 
                : null,
              trial_end: subscription.trial_end 
                ? new Date(subscription.trial_end * 1000).toISOString() 
                : null,
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
            });
          }
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscriptionUpdated = event.data.object as Stripe.Subscription;
          const userId = await getUserByStripeCustomerId(subscriptionUpdated.customer as string);
          
          if (userId) {
            await updateUserSubscriptionStatus(userId, subscriptionUpdated.status);
          }
          break;

        case 'customer.subscription.deleted':
          const subscriptionDeleted = event.data.object as Stripe.Subscription;
          const deletedUserId = await getUserByStripeCustomerId(subscriptionDeleted.customer as string);
          
          if (deletedUserId) {
            await updateUserSubscriptionStatus(deletedUserId, 'canceled');
          }
          break;

        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = invoice.subscription;
          
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
            const invoiceUserId = await getUserByStripeCustomerId(subscription.customer as string);
            
            if (invoiceUserId) {
              await updateUserSubscriptionStatus(invoiceUserId, subscription.status);
            }
          }
          break;

        default:
          throw new Error(`Unhandled relevant event: ${event.type}`);
      }
    } catch (error) {
      console.error(error);
      return res.status(400).end();
    }
  }

  return res.json({ received: true });
} 