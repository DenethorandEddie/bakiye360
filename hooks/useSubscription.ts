"use client";

import { useEffect, useState } from 'react';
import { useSupabase } from '@/components/supabase-provider';

type SubscriptionStatus = {
  subscription_tier: 'free' | 'premium';
  subscription_status: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  isActive: boolean;
};

const defaultStatus: SubscriptionStatus = {
  subscription_tier: 'free',
  subscription_status: null,
  subscription_start_date: null,
  subscription_end_date: null,
  isActive: false
};

export function useSubscription() {
  const { user } = useSupabase();
  const [subscription, setSubscription] = useState<SubscriptionStatus>(defaultStatus);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSubscription = async () => {
      if (!user) {
        setSubscription(defaultStatus);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/subscription/status');
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription status');
        }
        
        const data = await response.json();
        
        setSubscription({
          subscription_tier: data.subscription_tier || 'free',
          subscription_status: data.subscription_status,
          subscription_start_date: data.subscription_start_date,
          subscription_end_date: data.subscription_end_date,
          isActive: data.isActive || false
        });
      } catch (error) {
        console.error('Error loading subscription:', error);
        setSubscription(defaultStatus);
      } finally {
        setIsLoading(false);
      }
    };

    getSubscription();
  }, [user]);

  const isSubscribed = subscription.subscription_tier === 'premium' && subscription.isActive;
  const isPastDue = subscription.subscription_status === 'past_due';

  return {
    subscription,
    isLoading,
    isSubscribed,
    isActive: subscription.isActive,
    isPastDue,
  };
} 