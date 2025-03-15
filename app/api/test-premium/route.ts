import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Stripe from "stripe";

// App Router için modern config
export const dynamic = 'force-dynamic';

// Stripe API anahtarı
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any,
});

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 401 });
    }
    
    // Şu anki tarih
    const now = new Date();
    
    // 30 gün sonrası
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    
    // Bu, arka planda tüm webhook ve abonelik işlemlerini tetikleyecek
    // Gerçek bir ödeme yapmadan test amaçlı
    const testCustomerId = `manual_test_${Date.now()}`;
    const testSubscriptionId = `manual_test_sub_${Date.now()}`;
    
    // 1. Veritabanına premium abonelik ekle
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("subscriptions")
      .upsert({
        user_id: user.id,
        status: 'active',
        plan: 'premium',
        stripe_customer_id: testCustomerId,
        stripe_subscription_id: testSubscriptionId,
        current_period_start: now.toISOString(),
        current_period_end: nextMonth.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      });
      
    if (subscriptionError) {
      console.error("Abonelik kaydı oluşturulamadı:", subscriptionError);
      return NextResponse.json(
        { error: "Abonelik kaydı oluşturulamadı: " + subscriptionError.message },
        { status: 500 }
      );
    }
    
    // 2. Kullanıcı ayarlarını güncelle 
    const { data: userSettingsData, error: userSettingsError } = await supabase
      .from("user_settings")
      .upsert({
        user_id: user.id,
        subscription_status: 'premium',
        stripe_customer_id: testCustomerId,
        stripe_subscription_id: testSubscriptionId,
        subscription_period_start: now.toISOString(),
        subscription_period_end: nextMonth.toISOString(),
        updated_at: now.toISOString()
      });
    
    if (userSettingsError) {
      console.error("Kullanıcı ayarları güncellenemedi:", userSettingsError);
      return NextResponse.json(
        { error: "Kullanıcı ayarları güncellenemedi: " + userSettingsError.message },
        { status: 500 }
      );
    }
    
    // 3. Bildirim ekle
    const { data: notificationData, error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        title: 'Test Premium Abonelik Aktif',
        content: 'Test premium aboneliğiniz başarıyla etkinleştirildi. Bu test amaçlı bir aboneliktir ve gerçek bir ödeme yapılmamıştır.',
        read: false,
        type: 'subscription',
        created_at: now.toISOString(),
        link: '/dashboard/subscription'
      });
    
    if (notificationError) {
      console.warn("Bildirim eklenemedi:", notificationError);
      // Bildirim hatası kritik değil, devam et
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Premium abonelik manuel olarak eklendi. Sayfayı yenileyiniz." 
    });
  } catch (error) {
    console.error("Test premium hata:", error);
    return NextResponse.json({ 
      error: "İşlem sırasında bir hata oluştu: " + (error as Error).message
    }, { status: 500 });
  }
} 