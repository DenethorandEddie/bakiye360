import { useEffect, useState } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Subscription, SubscriptionWithPriceAndProduct } from '@/types/subscription';

export function useSubscription() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [subscription, setSubscription] = useState<SubscriptionWithPriceAndProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getSubscription = async () => {
      if (!user) {
        setSubscription(null);
        return;
      }

      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*, prices(*, products(*))')
          .eq('user_id', user.id)
          .single();

        if (error) {
          throw error;
        }

        setSubscription(data as SubscriptionWithPriceAndProduct);
      } catch (error) {
        console.error('Error loading subscription:', error);
        setSubscription(null);
      } finally {
        setIsLoading(false);
      }
    };

    getSubscription();
  }, [user, supabase]);

  const isSubscribed = !!subscription && subscription.status === 'active';
  const isTrialing = !!subscription && subscription.status === 'trialing';
  const isActive = isSubscribed || isTrialing;
  const isPastDue = !!subscription && subscription.status === 'past_due';

  return {
    subscription,
    isLoading,
    isSubscribed,
    isTrialing,
    isActive,
    isPastDue,
  };
} 