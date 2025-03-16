import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Abonelik detaylarını Stripe'dan al
      const subscription = session.subscription 
        ? await stripe.subscriptions.retrieve(session.subscription as string)
        : null;
      
      const currentDate = new Date().toISOString();
      // Bir sonraki ay için tarih hesapla (varsayılan)
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      await supabase
        .from('user_settings')
        .update({ 
          subscription_status: 'premium',
          stripe_subscription_id: session.subscription,
          subscription_start: currentDate, // Abonelik başlangıç tarihi
          subscription_end: subscription?.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString() 
            : nextMonth.toISOString(), // Abonelik bitiş tarihi (Stripe'dan veya hesaplanmış)
          subscription_period_start: subscription?.current_period_start 
            ? new Date(subscription.current_period_start * 1000).toISOString() 
            : currentDate, // Mevcut dönem başlangıcı
          subscription_period_end: subscription?.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString() 
            : nextMonth.toISOString(), // Mevcut dönem bitişi
          email_notifications: true,
          budget_alerts: true,
          monthly_reports: true
        })
        .eq('user_id', session.client_reference_id);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      
      await supabase
        .from('user_settings')
        .update({ 
          subscription_status: 'free',
          email_notifications: false,
          budget_alerts: false,
          monthly_reports: false
        })
        .eq('stripe_subscription_id', subscription.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
} 