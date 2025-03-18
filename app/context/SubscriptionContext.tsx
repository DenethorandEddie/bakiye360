"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';

type SubscriptionContextType = {
  isLoading: boolean;
  isPremium: boolean;
  subscriptionTier: 'free' | 'premium';
  subscriptionStatus: string | null;
  subscriptionEndDate: string | null;
  refreshSubscription: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  isLoading: true,
  isPremium: false,
  subscriptionTier: 'free',
  subscriptionStatus: null,
  subscriptionEndDate: null,
  refreshSubscription: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { 
    isLoading, 
    isActive, 
    subscription, 
  } = useSubscription();
  
  const refreshSubscription = async () => {
    // The useSubscription hook already handles refreshing on user change
    // This is just a placeholder in case we need manual refresh later
    window.location.reload();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isLoading,
        isPremium: isActive,
        subscriptionTier: subscription.subscription_tier,
        subscriptionStatus: subscription.subscription_status,
        subscriptionEndDate: subscription.subscription_end_date,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscriptionContext = () => useContext(SubscriptionContext); 