/**
 * API Güvenlik Politikaları
 * 
 * Bu modül, API güvenliğini sağlamak ve KVKK/GDPR uyumluluğunu korumak için
 * ortak güvenlik fonksiyonları ve middleware'ler içerir.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Rate limiting için basit bir in-memory cache
const rateLimitCache: Record<string, { count: number, resetTime: number }> = {};

/**
 * API rate limiting middleware'i
 * @param req NextRequest
 * @param maxRequests Belirli bir zaman diliminde izin verilen maksimum istek sayısı
 * @param windowMs Rate limit penceresinin süresi (ms)
 */
export async function rateLimit(
  req: NextRequest,
  maxRequests: number = 60,
  windowMs: number = 60000 // 1 dakika
) {
  // IP adresini al
  const ip = req.ip || 'unknown';
  const now = Date.now();
  
  // Rate limiting kaydını kontrol et
  if (!rateLimitCache[ip] || rateLimitCache[ip].resetTime < now) {
    // Yeni kayıt oluştur veya sıfırla
    rateLimitCache[ip] = { count: 1, resetTime: now + windowMs };
    return true;
  }
  
  // Limit kontrolü
  if (rateLimitCache[ip].count >= maxRequests) {
    return false;
  }
  
  // İstek sayısını artır
  rateLimitCache[ip].count++;
  return true;
}

/**
 * Kullanıcı doğrulama middleware'i
 * @param req NextRequest
 */
export async function authenticateUser(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { authenticated: false, user: null, error };
  }
  
  return { authenticated: true, user, error: null };
}

/**
 * API çağrılarını logla (KVKK uyumlu şekilde)
 * @param req NextRequest
 * @param action API eylemi/adı
 * @param success İşlem başarılı mı?
 * @param userId Kullanıcı ID'si
 * @param sensitiveData Hassas veri içeriyor mu?
 */
export async function logApiCall(
  req: NextRequest,
  action: string,
  success: boolean,
  userId?: string,
  sensitiveData: boolean = false
) {
  const supabase = createRouteHandlerClient({ cookies });
  const ip = req.ip || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  // IP adresinin son sekizlisini maskeleme (KVKK uyumluluğu)
  const maskedIp = sensitiveData ? 
    ip.split('.').slice(0, -1).join('.') + '.xxx' : 
    ip;
  
  try {
    await supabase
      .from('api_logs')
      .insert({
        action,
        user_id: userId || null,
        ip_address: maskedIp,
        user_agent: userAgent,
        success,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('API log kaydı eklenirken hata:', error);
  }
}

/**
 * Stripe API isteklerini imzalama ve doğrulama
 * @param payload İstek gövdesi
 * @param timestamp İstek zamanı
 * @param secret API anahtarı
 */
export function generateStripeSignature(
  payload: string,
  timestamp: number,
  secret: string
): string {
  const crypto = require('crypto');
  const signedPayload = `${timestamp}.${payload}`;
  
  // HMAC-SHA256 ile imzala
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
    
  return `t=${timestamp},v1=${signature}`;
}

/**
 * KVKK açısından kişisel verilerin silinmesi
 * @param userId Kullanıcı ID'si
 */
export async function deleteUserData(userId: string) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Kullanıcının kişisel verilerini anonim hale getir
    await supabase
      .from('user_settings')
      .update({
        email_notifications: false,
        budget_alerts: false,
        app_preferences: {},
        deleted_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    // Hassas bilgileri temizle
    await supabase
      .from('user_profiles')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        personal_info: null
      })
      .eq('user_id', userId);
    
    // Kullanıcıya veri silme işleminin tamamlandığını bildir
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Verileriniz Silindi',
        content: 'KVKK kapsamında talebiniz üzerine kişisel verileriniz sistemden silindi.',
        read: false,
        created_at: new Date().toISOString(),
        type: 'system'
      });
    
    return { success: true };
  } catch (error) {
    console.error('Kullanıcı verileri silinirken hata:', error);
    return { success: false, error };
  }
}

/**
 * Tüm API'ler için genel güvenlik middleware'i
 */
export function withSecurityPolicy(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    // Rate limiting kontrolü
    const allowed = await rateLimit(req, 100, 60000);
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.' },
        { status: 429 }
      );
    }
    
    // Security headers ekle
    const response = await handler(req);
    
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'");
    
    return response;
  };
} 