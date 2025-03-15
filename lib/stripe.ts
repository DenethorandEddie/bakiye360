import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // Güncel Stripe API versiyonu
  appInfo: {
    name: 'Buzdolabı Asistanı',
    version: '1.0.0',
  },
});

export async function createStripeCheckoutSession({
  priceId,
  userId,
  userEmail,
}: {
  priceId: string;
  userId: string;
  userEmail: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    billing_address_collection: 'auto',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
    },
    customer_email: userEmail,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?canceled=true`,
  });

  return session;
}

export async function createCustomerPortalLink(customerId: string) {
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return portalSession.url;
}

export async function getStripeCustomer(userId: string) {
  const customers = await stripe.customers.list({
    limit: 1,
    metadata: {
      userId,
    },
  });

  return customers.data[0];
} 