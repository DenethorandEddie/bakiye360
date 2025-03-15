import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// App Router için modern config yapısı
export const dynamic = 'force-dynamic';

/**
 * Abonelik durumunu manuel olarak güncelleyen API endpoint'i
 * POST /api/subscription/update-status
 * 
 * Body:
 * {
 *   userId: string; // Kullanıcı ID'si
 *   status: 'premium' | 'free'; // Yeni abonelik durumu
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, status = 'premium' } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Kullanıcı ID eksik' },
        { status: 400 }
      );
    }

    // Kullanıcıyı doğrula
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }
    
    // Sadece kendi kullanıcı kimliğini güncelleyebilir veya admin yetkisi varsa başkasını
    const isAdmin = user.app_metadata?.role === 'admin';
    if (user.id !== userId && !isAdmin) {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      );
    }

    // Tarih bilgilerini oluştur
    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    // 1. RPC fonksiyonu ile güncelleme
    const { error: rpcError } = await supabase.rpc(
      'update_user_subscription_status',
      {
        p_user_id: userId,
        p_status: status,
        p_subscription_period_start: now.toISOString(),
        p_subscription_period_end: oneMonthLater.toISOString(),
      }
    );

    if (rpcError) {
      console.error('RPC ile güncellenirken hata:', rpcError);
      
      // 2. Direkt olarak user_settings tablosunu güncelle
      const { error: updateError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          subscription_status: status,
          subscription_period_start: now.toISOString(),
          subscription_period_end: oneMonthLater.toISOString(),
          updated_at: now.toISOString(),
          email_notifications: status === 'premium',
          budget_alerts: status === 'premium'
        });

      if (updateError) {
        console.error('Kullanıcı ayarları güncellenirken hata:', updateError);
        return NextResponse.json(
          { error: 'Abonelik durumu güncellenemedi' },
          { status: 500 }
        );
      }
    }

    // 3. subscriptions tablosuna kayıt ekle
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        status: 'active',
        plan: 'premium',
        current_period_start: now.toISOString(),
        current_period_end: oneMonthLater.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      });

    if (subscriptionError) {
      console.warn('Abonelik kaydı oluşturulurken uyarı (kritik değil):', subscriptionError);
    }

    // 4. Bildirim gönder
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Premium Üyelik Aktifleştirildi',
        content: 'Premium üyeliğiniz başarıyla aktifleştirildi. Artık tüm premium özelliklere erişebilirsiniz.',
        read: false,
        type: 'subscription',
        created_at: now.toISOString(),
        link: '/dashboard/subscription'
      });

    if (notificationError) {
      console.warn('Bildirim oluşturulurken uyarı (kritik değil):', notificationError);
    }

    // Başarılı yanıt döndür
    return NextResponse.json({
      success: true,
      message: 'Abonelik durumu başarıyla güncellendi',
      status: status,
      expiresAt: oneMonthLater.toISOString()
    });

  } catch (error) {
    console.error('Abonelik güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Abonelik durumu güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 