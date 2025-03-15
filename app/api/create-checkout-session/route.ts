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
    const { userId } = requestData;

    if (!userId) {
      return NextResponse.json(
        { error: "Kullanıcı bilgisi bulunamadı" },
        { status: 400 }
      );
    }

    // Supabase client oluştur
    const supabase = createRouteHandlerClient({ cookies });

    // Kullanıcı bilgilerini al
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Kullanıcı doğrulanamadı" },
        { status: 401 }
      );
    }

    // Kullanıcı ID'lerini karşılaştır
    if (userData.user.id !== userId) {
      return NextResponse.json(
        { error: "Yetkisiz erişim" },
        { status: 403 }
      );
    }

    // Uygulama URL'sini al
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (!appUrl) {
      console.error("NEXT_PUBLIC_APP_URL çevre değişkeni bulunamadı");
      return NextResponse.json(
        { error: "Uygulama yapılandırması eksik" },
        { status: 500 }
      );
    }

    console.log("Kullanılan APP URL:", appUrl);

    // Ödeme başarıyla tamamlandığında yönlendirilecek URL
    const successUrl = `${appUrl}/dashboard/subscription?success=true`;
    // Ödeme iptal edildiğinde yönlendirilecek URL
    const cancelUrl = `${appUrl}/dashboard/subscription?canceled=true`;

    // Stripe Checkout Session oluştur
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "try",
            product_data: {
              name: "Bakiye360 Premium Paket",
              description: "Aylık abonelik - Gelişmiş finansal analiz ve yönetim özellikleri",
            },
            unit_amount: 14999, // 149.99 TL (kuruş cinsinden)
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userData.user.email,
      client_reference_id: userId,
      metadata: {
        userId: userId,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Stripe ödeme oturumu oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Ödeme oturumu oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
} 