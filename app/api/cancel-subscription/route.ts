import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Stripe from "stripe";

// App Router için modern config
export const dynamic = 'force-dynamic';

// Stripe API anahtarı
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any, // Güncel API versiyonu
});

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const { subscriptionId } = requestData;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Abonelik ID'si bulunamadı" },
        { status: 400 }
      );
    }

    // Supabase client oluştur
    const supabase = createRouteHandlerClient({ cookies });

    // Kullanıcı oturumunu kontrol et
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Kullanıcı doğrulanamadı" },
        { status: 401 }
      );
    }

    // Abonelik bilgisini veritabanından al
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subscriptionError) {
      return NextResponse.json(
        { error: "Abonelik bilgisi bulunamadı" },
        { status: 404 }
      );
    }

    // Aboneliğin bu kullanıcıya ait olduğunu doğrula
    if (subscription.user_id !== user.id) {
      return NextResponse.json(
        { error: "Bu abonelik üzerinde işlem yapma yetkiniz yok" },
        { status: 403 }
      );
    }

    // Stripe'dan aboneliği iptal et
    await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

    // 1. Veritabanında subscriptions tablosundaki abonelik durumunu güncelle
    const { error: subUpdateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);
      
    if (subUpdateError) {
      console.error("Abonelik güncellenirken hata:", subUpdateError);
      return NextResponse.json(
        { error: "Abonelik güncellenirken hata oluştu" },
        { status: 500 }
      );
    }
    
    // 2. User settings tablosunu da güncelle
    const { error: settingsError } = await supabase
      .from('user_settings')
      .update({
        subscription_status: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
      
    if (settingsError) {
      console.error("User settings güncellenirken hata:", settingsError);
      // İşlemi durdurmuyoruz, çünkü subscriptions tablosu birincil kaynaktır
    }

    return NextResponse.json({ 
      success: true,
      message: "Abonelik başarıyla iptal edildi" 
    });
    
  } catch (error) {
    console.error("Abonelik iptali hatası:", error);
    return NextResponse.json(
      { error: "Abonelik iptal edilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 