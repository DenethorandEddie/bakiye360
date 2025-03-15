import { useRouter } from 'next/router';
import { useSubscription } from '@/hooks/useSubscription';

export function SubscriptionStatus() {
  const router = useRouter();
  const { isActive, isLoading, isPastDue, subscription } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center text-sm text-gray-500">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Abonelik durumu kontrol ediliyor...
      </div>
    );
  }

  if (isPastDue) {
    return (
      <div className="flex items-center text-sm">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 mr-2">
          Ödeme Bekliyor
        </span>
        <button
          onClick={() => router.push('/subscription')}
          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
        >
          Ödemeyi Tamamla
        </button>
      </div>
    );
  }

  if (isActive) {
    return (
      <div className="flex items-center text-sm">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
          Premium
        </span>
        <span className="text-gray-600 text-xs">
          {subscription && new Date(subscription.current_period_end).toLocaleDateString('tr-TR')} tarihine kadar
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-sm">
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-2">
        Ücretsiz
      </span>
      <button
        onClick={() => router.push('/subscription')}
        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
      >
        Premium'a Yükselt
      </button>
    </div>
  );
} 