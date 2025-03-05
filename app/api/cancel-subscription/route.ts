import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Stripe from "stripe";

// Stripe API anahtarı
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any, // Linter hatası için type assertion
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

    // Veritabanında abonelik durumunu güncelle
    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

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