import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: 'User id is required' });
  }

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase credentials are missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    console.log(`Fetching subscription for user_id: ${user_id}`);
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('subscription_status, subscription_end_date, subscription_tier')
      .eq('user_id', user_id)
      .single();

    if (error) {
      console.error('Error fetching subscription status:', error);
      return res.status(500).json({ error: 'Error fetching subscription status', details: error.message });
    }

    if (!data) {
      console.log(`No subscription data found for user: ${user_id}`);
      // Return default data for users without subscription records
      return res.status(200).json({ 
        isActive: false, 
        subscription: {
          subscription_status: null,
          subscription_end_date: null,
          subscription_tier: 'free'
        }
      });
    }

    let isActive = false;
    if (data?.subscription_status === 'active' && data.subscription_end_date && new Date(data.subscription_end_date) > new Date()) {
      isActive = true;
    }

    return res.status(200).json({ 
      isActive, 
      subscription_tier: data.subscription_tier || 'free',
      subscription_status: data.subscription_status,
      subscription_start_date: data.subscription_start_date,
      subscription_end_date: data.subscription_end_date,
      subscription: data 
    });
  } catch (error) {
    console.error('Unexpected error in subscription status API:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
} 