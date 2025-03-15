import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Stripe istemcisi
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any,
});

// Kullanıcının faturalarını getiren API endpoint'i
export async function GET(req: NextRequest) {
  try {
    // Kullanıcıyı doğrula
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }

    // Kullanıcının Stripe müşteri ID'sini al
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !userSettings?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Müşteri bilgileri bulunamadı' },
        { status: 404 }
      );
    }

    // Stripe'tan faturaları getir
    const invoices = await stripe.invoices.list({
      customer: userSettings.stripe_customer_id,
      limit: 10,
      status: 'paid',
    });

    // Fatura verilerini dön
    return NextResponse.json({
      success: true,
      data: invoices.data.map(invoice => ({
        id: invoice.id,
        created: invoice.created,
        amount_paid: invoice.amount_paid / 100,
        currency: invoice.currency,
        hosted_invoice_url: invoice.hosted_invoice_url,
        pdf_url: invoice.invoice_pdf,
        status: invoice.status,
        period_start: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
        period_end: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
      })),
    });

  } catch (error) {
    console.error('Fatura getirme hatası:', error);
    return NextResponse.json(
      { error: 'Faturalar alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Belirli bir faturayı getiren endpoint
export async function POST(req: NextRequest) {
  try {
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Fatura ID eksik' },
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

    // Kullanıcının Stripe müşteri ID'sini al
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !userSettings?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Müşteri bilgileri bulunamadı' },
        { status: 404 }
      );
    }

    // Faturayı getir
    const invoice = await stripe.invoices.retrieve(invoiceId);

    // Faturanın bu kullanıcıya ait olduğunu doğrula
    if (invoice.customer !== userSettings.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Bu faturaya erişim izniniz yok' },
        { status: 403 }
      );
    }

    // Fatura verilerini dön
    return NextResponse.json({
      success: true,
      data: {
        id: invoice.id,
        created: invoice.created,
        amount_paid: invoice.amount_paid / 100,
        currency: invoice.currency,
        hosted_invoice_url: invoice.hosted_invoice_url,
        pdf_url: invoice.invoice_pdf,
        status: invoice.status,
        period_start: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
        period_end: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
      },
    });

  } catch (error) {
    console.error('Fatura getirme hatası:', error);
    return NextResponse.json(
      { error: 'Fatura alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 