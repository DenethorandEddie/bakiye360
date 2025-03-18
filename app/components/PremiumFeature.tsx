"use client";

import { ReactNode } from 'react';
import Link from 'next/link';
import { useSubscriptionContext } from '../context/SubscriptionContext';

type PremiumFeatureProps = {
  children: ReactNode;
  fallback?: ReactNode;
  feature?: 'transactions' | 'categories' | 'budgets' | 'subscriptions' | 'history';
};

export function PremiumFeature({ 
  children, 
  fallback,
  feature 
}: PremiumFeatureProps) {
  const { isLoading, isPremium } = useSubscriptionContext();
  
  if (isLoading) {
    return <div className="animate-pulse h-24 bg-gray-200 rounded"></div>;
  }
  
  if (isPremium) {
    return <>{children}</>;
  }
  
  // If no custom fallback is provided, show a default upgrade prompt
  if (!fallback) {
    let limitMessage = "Bu özelliğe erişim için Premium'a geçin";
    
    switch (feature) {
      case 'transactions':
        limitMessage = "Aylık 30 işlem limitinize ulaştınız. Sınırsız işlem için Premium'a geçin.";
        break;
      case 'categories':
        limitMessage = "Maksimum 7 kategoriniz olabilir. Daha fazlası için Premium'a geçin.";
        break;
      case 'budgets':
        limitMessage = "Sadece 1 bütçe hedefi oluşturabilirsiniz. Daha fazlası için Premium'a geçin.";
        break;
      case 'subscriptions':
        limitMessage = "Sadece 1 abonelik kaydedebilirsiniz. Daha fazlası için Premium'a geçin.";
        break;
      case 'history':
        limitMessage = "Sadece son 3 aylık verilerinize erişebilirsiniz. Tüm verileriniz için Premium'a geçin.";
        break;
    }
    
    return (
      <div className="p-6 border border-purple-200 bg-purple-50 rounded-lg text-center">
        <h3 className="font-medium text-purple-800 mb-2">Premium Özellik</h3>
        <p className="text-gray-600 mb-4">{limitMessage}</p>
        <Link 
          href="/pricing" 
          className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Premium'a Geç
        </Link>
      </div>
    );
  }
  
  return <>{fallback}</>;
} 