import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createCustomerPortalLink } from '@/lib/stripe';
import { getSubscription } from '@/lib/supabase-admin';
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

    // Kullanıcının abonelik bilgilerini al
    const subscription = await getSubscription(session.user.id);

    if (!subscription || !subscription.stripe_customer_id) {
      return res.status(404).json({ error: 'Abonelik bulunamadı' });
    }

    // Stripe müşteri portalı linki oluştur
    const portalUrl = await createCustomerPortalLink(subscription.stripe_customer_id);

    return res.status(200).json({ url: portalUrl });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
} 