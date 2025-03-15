import { createClient } from '@supabase/supabase-js';
import { Database } from 'types/database.types';
import { Subscription } from 'types/subscription';

// Admin rolüyle Supabase'e bağlanma
// Bu client sadece sunucu taraflı işlemler için kullanılmalı
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Supabase tabloları için yardımcı fonksiyonlar
export const getSubscription = async (userId: string): Promise<Subscription | null> => {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Subscription error:', error);
    return null;
  }

  return data;
};

export const createOrUpdateSubscription = async (subscription: Partial<Subscription>) => {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscription)
    .select()
    .single();

  if (error) {
    console.error('Error creating/updating subscription:', error);
    return null;
  }

  return data;
};

export const updateUserSubscriptionStatus = async (
  userId: string,
  status: Subscription['status']
) => {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({ status })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating subscription status:', error);
    return false;
  }

  return true;
};

export const getUserByStripeCustomerId = async (customerId: string) => {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error) {
    console.error('Error getting user by Stripe customer ID:', error);
    return null;
  }

  return data?.user_id;
};

export default supabaseAdmin; 