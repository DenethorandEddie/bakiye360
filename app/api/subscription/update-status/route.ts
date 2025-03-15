import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// App Router için modern config yapısı
export const dynamic = 'force-dynamic';

// CORS headers'ı hazırla
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Error logging yardımcı fonksiyonu
function logError(step: string, error: any) {
  console.error(`[UPDATE STATUS ERROR] [${step}] ${error.message || 'Unknown error'}`);
  console.error(error);
}

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
  console.log("🔄 Kullanıcı abonelik durumu güncelleme isteği alındı");
  
  // CORS headers
  const responseHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/json'
  };

  try {
    // İstek gövdesini al
    const body = await req.json();
    const { userId, status = 'premium', stripe_subscription_id = null } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Kullanıcı ID'si gereklidir" },
        { status: 400, headers: responseHeaders }
      );
    }
    
    console.log(`👤 Kullanıcı durumu güncelleniyor: ${userId} -> ${status}`);
    
    // Supabase client oluştur
    const supabase = createRouteHandlerClient({ cookies });
    
    // Kullanıcı kontrolü yap
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      logError("USER_AUTH", userError || new Error("User not found"));
      return NextResponse.json(
        { error: "Kimlik doğrulama başarısız" },
        { status: 401, headers: responseHeaders }
      );
    }
    
    // Yalnızca kullanıcının kendi bilgilerini veya admin'in herhangi bir kullanıcıyı güncellemesine izin ver
    // Admin kontrol mekanizması eklenmeli
    if (user.id !== userId) {
      const { data: userRole } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      const isAdmin = userRole?.role === 'admin';
      
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Bu işlem için yetkiniz bulunmamaktadır" },
          { status: 403, headers: responseHeaders }
        );
      }
    }
    
    // Önce user_settings tablosunda kullanıcının var olup olmadığını kontrol et
    const { data: existingSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('id')
      .or(`user_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle();
    
    console.log("Mevcut ayarlar:", existingSettings);
    
    let updateResult;
    
    if (!existingSettings) {
      // Kullanıcı ayarları yoksa oluştur
      console.log("Kullanıcı ayarları bulunamadı, yeni kayıt oluşturuluyor");
      
      const currentDate = new Date().toISOString();
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      
      updateResult = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          subscription_status: status,
          stripe_subscription_id: stripe_subscription_id,
          subscription_start: currentDate,
          subscription_period_end: oneMonthLater.toISOString(),
          cancel_at_period_end: false,
          created_at: currentDate,
          updated_at: currentDate
        });
    } else {
      // Mevcut ayarları güncelle - user_id ile kontrol et
      console.log("Mevcut kullanıcı ayarları güncelleniyor (user_id)");
      
      const currentDate = new Date().toISOString();
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      
      // Önce user_id ile güncellemeyi dene
      updateResult = await supabase
        .from('user_settings')
        .update({
          subscription_status: status,
          stripe_subscription_id: stripe_subscription_id,
          subscription_start: currentDate,
          subscription_period_end: oneMonthLater.toISOString(),
          cancel_at_period_end: false,
          updated_at: currentDate
        })
        .eq('user_id', userId);
      
      // user_id ile güncelleme başarısız olduysa id ile dene
      if (updateResult.error) {
        console.log("user_id ile güncelleme başarısız, id ile deneniyor");
        
        updateResult = await supabase
          .from('user_settings')
          .update({
            subscription_status: status,
            stripe_subscription_id: stripe_subscription_id,
            subscription_start: currentDate,
            subscription_period_end: oneMonthLater.toISOString(),
            cancel_at_period_end: false,
            updated_at: currentDate
          })
          .eq('id', userId);
      }
    }
    
    if (updateResult.error) {
      logError("UPDATE_SETTINGS", updateResult.error);
      return NextResponse.json(
        { error: "Kullanıcı ayarları güncellenirken bir hata oluştu" },
        { status: 500, headers: responseHeaders }
      );
    }
    
    console.log("✅ Kullanıcı abonelik durumu başarıyla güncellendi");
    
    // Kullanıcıya bildirim ekleme
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Abonelik Durumunuz Güncellendi',
          content: status === 'premium' 
            ? 'Premium aboneliğiniz aktifleştirildi. Tüm premium özelliklere erişebilirsiniz.'
            : 'Abonelik durumunuz ücretsiz plana değiştirildi.',
          read: false,
          created_at: new Date().toISOString(),
          link: '/dashboard/subscription'
        });
        
      console.log("✅ Bildirim eklendi");
    } catch (notificationError) {
      console.error("Bildirim eklenirken hata:", notificationError);
      // Bildirim hatası kritik değil, işleme devam et
    }
    
    return NextResponse.json(
      { success: true, message: "Abonelik durumu başarıyla güncellendi" },
      { status: 200, headers: responseHeaders }
    );
  } catch (error: any) {
    // Genel hata yakalama
    logError("GENERAL", error);
    
    const errorMessage = error?.message || 'Bir hata oluştu';
    const errorCode = error?.statusCode || 500;
    
    return NextResponse.json(
      { 
        error: 'Abonelik durumu güncellenirken bir hata oluştu', 
        details: errorMessage
      },
      { status: errorCode, headers: responseHeaders }
    );
  }
}

// OPTIONS metodu için handler
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 