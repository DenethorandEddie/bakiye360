import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// App Router için modern config yapısı
export const dynamic = 'force-dynamic';

// Supabase client oluştur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Abonelik durumunu manuel olarak güncelleyen API endpoint'i
 * POST /api/subscription/update-status
 * 
 * Body:
 * {
 *   user_id: string; // Kullanıcı ID'si
 *   status: 'premium' | 'free'; // Yeni abonelik durumu
 *   stripe_subscription_id?: string; // Varsa Stripe abonelik ID'si
 *   stripe_customer_id?: string; // Varsa Stripe müşteri ID'si
 * }
 */
export async function POST(request: Request) {
  try {
    // Request body'yi al
    const { user_id, status, stripe_subscription_id, stripe_customer_id } = await request.json();
    
    // Gerekli parametreleri kontrol et
    if (!user_id || !status || !(status === 'premium' || status === 'free')) {
      return NextResponse.json(
        { error: 'Geçersiz parametreler. user_id ve status (premium/free) gereklidir.' },
        { status: 400 }
      );
    }
    
    console.log(`Abonelik durumu güncelleniyor. Kullanıcı: ${user_id}, Durum: ${status}`);
    
    // Kullanıcı ayarlarını kontrol et veya oluştur
    const { data: existingSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user_id)
      .single();
      
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Kullanıcı ayarları kontrol edilirken hata:', settingsError);
      return NextResponse.json(
        { error: 'Kullanıcı ayarları kontrol edilirken hata oluştu.' },
        { status: 500 }
      );
    }
    
    // Kullanıcı ayarlarını güncelle veya oluştur
    const now = new Date().toISOString();
    
    // Mevcut kayıt varsa güncelle, yoksa oluştur
    if (existingSettings) {
      // Güncellenecek veriler
      const updateData: any = {
        subscription_status: status,
        updated_at: now
      };
      
      // Stripe abonelik ID'si varsa ekle
      if (stripe_subscription_id) {
        updateData.stripe_subscription_id = stripe_subscription_id;
      }
      
      // Stripe müşteri ID'si varsa ekle
      if (stripe_customer_id) {
        updateData.stripe_customer_id = stripe_customer_id;
      }
      
      // Kullanıcı ayarlarını güncelle
      const { error: updateError } = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', user_id);
        
      if (updateError) {
        console.error('Kullanıcı ayarları güncellenirken hata:', updateError);
        return NextResponse.json(
          { error: 'Kullanıcı ayarları güncellenirken hata oluştu.' },
          { status: 500 }
        );
      }
    } else {
      // Yeni kullanıcı ayarları oluştur
      const newSettings: any = {
        user_id,
        subscription_status: status,
        email_notifications: true,
        budget_alerts: true,
        monthly_reports: true,
        app_preferences: { currency: 'TRY', language: 'tr' },
        created_at: now,
        updated_at: now
      };
      
      // Stripe abonelik ID'si varsa ekle
      if (stripe_subscription_id) {
        newSettings.stripe_subscription_id = stripe_subscription_id;
      }
      
      // Stripe müşteri ID'si varsa ekle
      if (stripe_customer_id) {
        newSettings.stripe_customer_id = stripe_customer_id;
      }
      
      // Yeni kullanıcı ayarları ekle
      const { error: insertError } = await supabase
        .from('user_settings')
        .insert(newSettings);
        
      if (insertError) {
        console.error('Kullanıcı ayarları oluşturulurken hata:', insertError);
        return NextResponse.json(
          { error: 'Kullanıcı ayarları oluşturulurken hata oluştu.' },
          { status: 500 }
        );
      }
    }
    
    // Bildirim ekle
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id,
          title: status === 'premium' ? 'Premium Aboneliğiniz Aktif' : 'Abonelik Durumunuz Güncellendi',
          content: status === 'premium' 
            ? 'Premium aboneliğiniz başarıyla aktif edildi. Tüm premium özelliklere erişebilirsiniz.'
            : 'Abonelik durumunuz güncellendi. Şu anda ücretsiz sürümü kullanıyorsunuz.',
          read: false,
          created_at: now,
          link: '/dashboard/subscription'
        });
      
      console.log(`✅ Kullanıcı ${user_id} için abonelik değişikliği bildirimi oluşturuldu.`);
    } catch (notifError) {
      console.error(`Kullanıcı ${user_id} için bildirim oluşturulurken hata:`, notifError);
      // Bildirim hatası kritik değil, devam et
    }
    
    return NextResponse.json({
      success: true,
      message: `Abonelik durumu başarıyla güncellendi: ${status}`
    });
    
  } catch (error) {
    console.error('Abonelik durumu güncellenirken beklenmeyen hata:', error);
    return NextResponse.json(
      { error: 'İşlem sırasında beklenmeyen bir hata oluştu.' },
      { status: 500 }
    );
  }
} 