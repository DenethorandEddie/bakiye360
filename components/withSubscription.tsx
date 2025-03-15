import { useRouter } from 'next/router';
import { FC, ComponentType, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useSubscription } from '@/hooks/useSubscription';

export function withSubscription<T>(Component: ComponentType<T>) {
  const WithSubscription: FC<T> = (props) => {
    const router = useRouter();
    const user = useUser();
    const { isActive, isLoading } = useSubscription();
    
    useEffect(() => {
      // Kullanıcı girişi yoksa, giriş sayfasına yönlendir
      if (!user && !isLoading) {
        router.push('/auth/signin');
        return;
      }
      
      // Premium abonelik gerekli ve aktif bir abonelik yoksa, abonelik sayfasına yönlendir
      if (user && !isLoading && !isActive) {
        router.push({
          pathname: '/subscription',
          query: { required: true }
        });
      }
    }, [user, isActive, isLoading, router]);

    // Yükleme durumunda veya koşullar sağlanmadığında yükleme göster
    if (isLoading || !user || !isActive) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      );
    }

    // Tüm koşullar sağlandığında, orijinal bileşeni render et
    return <Component {...props} />;
  };

  // Bileşen adı ve displayName özelliklerini korumak için
  const componentName = Component.displayName || Component.name || 'Component';
  WithSubscription.displayName = `withSubscription(${componentName})`;

  return WithSubscription;
} 