import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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
    
    // Veritabanına premium abonelik ekle
    const { data, error } = await supabase
      .from("subscriptions")
      .upsert({
        user_id: user.id,
        status: 'active',
        plan: 'premium',
        stripe_customer_id: 'manual_test_customer',
        stripe_subscription_id: 'manual_test_subscription',
        current_period_start: now.toISOString(),
        current_period_end: nextMonth.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      });
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Premium abonelik manuel olarak eklendi. Sayfayı yenileyiniz." 
    });
  } catch (error) {
    console.error("Test premium hata:", error);
    return NextResponse.json({ 
      error: "İşlem sırasında bir hata oluştu"
    }, { status: 500 });
  }
} 