import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createStripeCheckoutSession } from '@/lib/stripe';
import { Database } from '@/types/database.types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Kullanıcının oturum bilgilerini al
    const supabase = createServerSupabaseClient<Database>({ req, res });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
    }

    // Stripe ödeme sayfası oluştur
    // Sabit fiyat ID: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!
    const checkoutSession = await createStripeCheckoutSession({
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
      userId: session.user.id,
      userEmail: session.user.email || '',
    });

    return res.status(200).json({ sessionId: checkoutSession.id });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
} 