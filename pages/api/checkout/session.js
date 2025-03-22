import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: 'User id is required' });
  }

  try {
    // Validate Stripe API key is present
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is missing');
      return res.status(500).json({ error: 'Stripe configuration is missing' });
    }

    // Validate Stripe Price ID is present
    if (!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID) {
      console.error('NEXT_PUBLIC_STRIPE_PRICE_ID is missing');
      return res.status(500).json({ error: 'Stripe price configuration is missing' });
    }

    // Validate URLs are present
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('NEXT_PUBLIC_APP_URL is missing');
      return res.status(500).json({ error: 'URL configuration is missing' });
    }

    // Initialize Stripe with a more recent API version
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
      apiVersion: '2023-10-16' 
    });

    console.log(`Creating checkout session for user: ${user_id}`);

    // Default URLs if not configured
    const successUrl = process.env.STRIPE_SUCCESS_URL || 
                      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account?status=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = process.env.STRIPE_CANCEL_URL || 
                     `${process.env.NEXT_PUBLIC_APP_URL}/pricing?status=canceled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
          quantity: 1,
        }
      ],
      metadata: { user_id },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    
    // Format Stripe errors better
    if (error.type && error.message) {
      return res.status(500).json({ 
        error: error.message,
        type: error.type
      });
    }
    
    return res.status(500).json({ error: error.message || 'Unknown error creating checkout session' });
  }
} 