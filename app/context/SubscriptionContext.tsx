"use client";

import { createContext, useContext, ReactNode, useState } from 'react';
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
    fetchSubscription
  } = useSubscription();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const refreshSubscription = async () => {
    console.log("SubscriptionContext: refreshSubscription çağrıldı");
    setIsRefreshing(true);
    
    try {
      // Doğrudan API'den abonelik durumunu sorgula
      const response = await fetch('/api/subscription/status', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log("SubscriptionContext: API yanıtı alındı");
      
      if (!response.ok) {
        console.error("SubscriptionContext: API yanıtı hatalı:", response.status);
        throw new Error('Abonelik durumu alınamadı');
      }
      
      const data = await response.json();
      console.log("SubscriptionContext: Yeni abonelik durumu:", data);
      
      // Hook aracılığıyla da güncelleme yap
      await fetchSubscription();
      console.log("SubscriptionContext: useSubscription hook'u güncellendi");
    } catch (error) {
      console.error("SubscriptionContext: Yenileme hatası:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isLoading: isLoading || isRefreshing,
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