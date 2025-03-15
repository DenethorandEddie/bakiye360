import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Stripe istemcisi
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any,
});

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Abonelik ID eksik' },
        { status: 400 }
      );
    }

    // Kullanıcıyı doğrula
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }

    // Aboneliğin bu kullanıcıya ait olduğunu doğrula
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Abonelik bulunamadı veya bu kullanıcıya ait değil' },
        { status: 404 }
      );
    }

    // Stripe'ta aboneliği yeniden aktifleştir
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    // Veritabanında aboneliği güncelle
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (updateError) {
      console.error('Abonelik güncellenirken hata:', updateError);
      return NextResponse.json(
        { error: 'Abonelik durumu güncellenemedi' },
        { status: 500 }
      );
    }

    // User settings tablosunu da güncelle
    const { error: settingsError } = await supabase
      .from('user_settings')
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (settingsError) {
      console.error('Kullanıcı ayarları güncellenirken hata:', settingsError);
      // Bu kritik değil, devam et
    }

    // Bildirim oluştur
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Aboneliğiniz Yenilendi',
        content: 'Aboneliğiniz başarıyla yenilendi. Otomatik yenileme tekrar aktif edildi.',
        read: false,
        created_at: new Date().toISOString(),
        type: 'subscription',
        link: '/dashboard/subscription'
      });

    return NextResponse.json({
      success: true,
      message: 'Abonelik başarıyla yenilendi'
    });

  } catch (error) {
    console.error('Abonelik yenileme hatası:', error);
    return NextResponse.json(
      { error: 'Abonelik yenilenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 