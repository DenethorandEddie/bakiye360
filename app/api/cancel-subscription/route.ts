import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// App Router için modern config
export const dynamic = 'force-dynamic';

// Stripe API anahtarı
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(request: NextRequest) {
  const { subscriptionId } = await request.json();

  if (!subscriptionId) {
    return NextResponse.json(
      { error: "Abonelik kimliği gereklidir" },
      { status: 400 }
    );
  }

  try {
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
      console.error("Abonelik bilgisi alınırken hata:", subscriptionError);
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

    // Stripe'da aboneliği iptal et
    const canceledSubscription = await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

    // Veritabanında subscriptions tablosundaki abonelik durumunu güncelle
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

    return NextResponse.json(
      { message: "Abonelik başarıyla iptal edildi", subscription: canceledSubscription },
      { status: 200 }
    );
  } catch (error) {
    console.error("Abonelik iptal hatası:", error);
    return NextResponse.json(
      { error: "Abonelik iptal edilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 