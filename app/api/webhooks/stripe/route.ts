import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PostgrestError } from '@supabase/supabase-js';

// Tip tanımlamaları
interface UserProfile {
  id: string;
  email?: string;
  display_name?: string;
  subscription_tier?: string;
  subscription_status?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  created_at?: string;
  updated_at?: string;
}

// Route segment config for API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') as string;
    
    const supabase = createRouteHandlerClient({ cookies });
    
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Webhook: checkout.session.completed olayı alındı - DETAYLI LOG:', JSON.stringify(session, null, 2));
      console.log('Webhook: checkout.session.completed olayı özet:', {
        sessionId: session.id,
        customerId: session.customer,
        subscriptionId: session.subscription,
        mode: session.mode,
        customerEmail: session.customer_details?.email || session.customer_email,
        paymentStatus: session.payment_status
      });
  
      try {
        // Kullanıcıyı bul - önce customer ID ile dene
        console.log(`Webhook: Supabase'den kullanıcı bilgileri alınıyor (Customer ID: ${session.customer}, Email: ${session.customer_details?.email || session.customer_email})`);
        
        // İlk olarak kullanıcı e-posta adresini alalım
        const userEmail = session.customer_details?.email || session.customer_email;
        
        if (!userEmail) {
          console.error('Webhook: Kullanıcı e-posta adresi bulunamadı:', session);
          return NextResponse.json({ error: 'Kullanıcı e-posta adresi bulunamadı' }, { status: 400 });
        }
        
        // Profil tablosunda e-posta ile kullanıcıyı bul
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail)
          .single();
          
        if (userError || !userData) {
          console.error('Webhook: Kullanıcı bulunamadı:', userError, userEmail);
          return NextResponse.json({ 
            error: 'Kullanıcı bulunamadı',
            email: userEmail,
            customerId: session.customer
          }, { status: 404 });
        }
        
        console.log('Webhook: Kullanıcı bulundu:', userData);
        
        // Kullanıcı bulundu, premium abonelik bilgilerini ayarla
        const now = new Date();
        const oneMonthLater = new Date();
        oneMonthLater.setMonth(now.getMonth() + 1); // 1 aylık premium
        
        // Kullanıcının abonelik bilgilerini güncelle
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: 'premium',
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription || session.payment_intent || session.id, // Tek seferlik ödeme için payment_intent veya session ID'yi kullan
            subscription_start_date: now.toISOString(),
            subscription_end_date: oneMonthLater.toISOString(), // 1 aylık premium
            updated_at: now.toISOString()
          })
          .eq('id', userData.id);
        
        if (updateError) {
          console.error('Webhook: Kullanıcı abonelik bilgisi güncelleme hatası:', updateError);
          return NextResponse.json({ error: 'Kullanıcı bilgileri güncellenirken hata oluştu' }, { status: 500 });
        }
        
        console.log('Webhook: Kullanıcının abonelik bilgileri başarıyla güncellendi! Yeni bilgiler:', {
          userId: userData.id,
          email: userEmail,
          subscriptionTier: 'premium',
          subscriptionStatus: 'active',
          startDate: now.toISOString(),
          endDate: oneMonthLater.toISOString()
        });
        
        return NextResponse.json({ 
          received: true, 
          updated: true,
          userId: userData.id,
          email: userEmail,
          status: 'premium'
        }, { status: 200 });
      } catch (error) {
        console.error('Webhook işleme hatası:', error);
        return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
      }
    }
  
    // Handle the customer.subscription.deleted event
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('Webhook: customer.subscription.deleted olayı alındı', subscription);
      
      try {
        // Kullanıcıyı bul
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .single();
        
        if (userData) {
          // Kullanıcının abonelik bilgilerini güncelle
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'inactive',
              subscription_tier: 'basic',
              updated_at: new Date().toISOString()
            })
            .eq('id', userData.id);
          
          if (updateError) {
            console.error('Webhook: Kullanıcı abonelik bilgisi güncellenemedi', updateError);
            return NextResponse.json({ error: 'Kullanıcı bilgileri güncellenemedi' }, { status: 500 });
          }
          
          console.log('Webhook: Kullanıcının aboneliği iptal edildi (inactive)');
          return NextResponse.json({ received: true, updated: true }, { status: 200 });
        } else {
          console.log('Webhook: İptal edilen abonelik için kullanıcı bulunamadı', userError);
          return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
        }
      } catch (error) {
        console.error('Webhook işleme hatası:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }
  
    // Handle the customer.subscription.updated event
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('Webhook: customer.subscription.updated olayı alındı', subscription);
      
      try {
        // Kullanıcıyı bul
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .single();
        
        if (userData) {
          // Abonelik durumunu kontrol et
          let subscriptionStatus: string;
          let subscriptionTier: string;
          
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            subscriptionStatus = 'active';
            subscriptionTier = 'premium';
          } else {
            subscriptionStatus = 'inactive';
            subscriptionTier = 'basic';
          }
          
          // Kullanıcının abonelik bilgilerini güncelle
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              subscription_status: subscriptionStatus,
              subscription_tier: subscriptionTier,
              subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', userData.id);
          
          if (updateError) {
            console.error('Webhook: Kullanıcı abonelik bilgisi güncellenemedi', updateError);
            return NextResponse.json({ error: 'Kullanıcı bilgileri güncellenemedi' }, { status: 500 });
          }
          
          console.log('Webhook: Kullanıcının abonelik bilgileri güncellendi', {
            status: subscriptionStatus,
            tier: subscriptionTier
          });
          return NextResponse.json({ received: true, updated: true }, { status: 200 });
        } else {
          console.log('Webhook: Güncellenen abonelik için kullanıcı bulunamadı', userError);
          return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
        }
      } catch (error) {
        console.error('Webhook işleme hatası:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}