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
      console.log('Webhook: checkout.session.completed olayı alındı', {
        sessionId: session.id,
        customerId: session.customer,
        subscriptionId: session.subscription,
        mode: session.mode,
        customerEmail: session.customer_email
      });
  
      try {
        // Tek seferlik ödeme (payment) veya abonelik (subscription) olabilir
        // Her iki durumu da ele alalım
        let subscriptionId = session.subscription as string;
        let subscriptionStart: string;
        let subscriptionEnd: string;
        
        if (session.mode === 'subscription' && subscriptionId) {
          try {
            // Subscription detaylarını Stripe'dan al
            console.log(`Webhook: Stripe'dan abonelik detayları alınıyor (ID: ${subscriptionId})`);
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            const currentPeriodStart = new Date(subscription.current_period_start * 1000);
            const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
            
            subscriptionStart = currentPeriodStart.toISOString();
            subscriptionEnd = currentPeriodEnd.toISOString();
            
            console.log('Webhook: Abonelik detayları alındı', {
              start: subscriptionStart,
              end: subscriptionEnd,
              status: subscription.status
            });
          } catch (stripeError) {
            console.error('Webhook: Stripe abonelik bilgisi alınamadı:', stripeError);
            // Varsayılan değerler ata
            const now = new Date();
            const oneMonthLater = new Date();
            oneMonthLater.setMonth(now.getMonth() + 1);
            
            subscriptionStart = now.toISOString();
            subscriptionEnd = oneMonthLater.toISOString();
          }
        } else {
          // Tek seferlik ödeme için 1 aylık premium abonelik oluştur
          console.log('Webhook: Tek seferlik ödeme için abonelik tarihleri ayarlanıyor');
          const now = new Date();
          const oneMonthLater = new Date();
          oneMonthLater.setMonth(now.getMonth() + 1);
          
          subscriptionStart = now.toISOString();
          subscriptionEnd = oneMonthLater.toISOString();
        }

        // Kullanıcıyı bul - önce customer ID ile dene
        console.log(`Webhook: Supabase'den kullanıcı bilgileri alınıyor (Customer ID: ${session.customer})`);
        let userData: UserProfile | null = null;
        let userError: PostgrestError | null = null;
        
        try {
          if (session.customer) {
            const result = await supabase
              .from('profiles')
              .select('*')
              .eq('stripe_customer_id', session.customer)
              .single();
            
            userData = result.data as UserProfile;
            userError = result.error;
          }
        } catch (dbError) {
          console.error('Webhook: Veritabanı sorgusu hatası:', dbError);
        }
        
        // Customer ID ile bulunamadıysa, müşteri e-postasını kullanarak profil tablosundan bulmayı deneyelim
        if (!userData && session.customer_email) {
          try {
            console.log(`Webhook: Kullanıcı customer ID ile bulunamadı, e-posta ile aranıyor: ${session.customer_email}`);
            const profileResult = await supabase
              .from('profiles')
              .select('*')
              .eq('email', session.customer_email)
              .single();
            
            if (profileResult.data) {
              console.log('Webhook: E-posta ile kullanıcı bulundu:', profileResult.data);
              userData = profileResult.data as UserProfile;
              userError = null;
            } else {
              userError = profileResult.error;
            }
          } catch (profileError) {
            console.error('Webhook: Profil arama hatası:', profileError);
          }
        }

        if (userData) {
          console.log('Webhook: Kullanıcı bulundu, abonelik bilgileri güncelleniyor:', userData);
          
          // Kullanıcının abonelik bilgilerini güncelle
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              stripe_subscription_id: subscriptionId,
              subscription_status: 'active',
              subscription_tier: 'premium',
              subscription_start_date: subscriptionStart,
              subscription_end_date: subscriptionEnd,
              stripe_customer_id: session.customer || userData.stripe_customer_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', userData.id);
          
          if (updateError) {
            console.error('Webhook: Kullanıcı abonelik bilgisi güncelleme hatası:', updateError);
            return NextResponse.json({ error: 'Kullanıcı bilgileri güncellenirken hata oluştu' }, { status: 500 });
          }
          
          console.log('Webhook: Kullanıcının abonelik bilgileri başarıyla güncellendi!');
          return NextResponse.json({ received: true, updated: true }, { status: 200 });
        } else {
          console.error('Webhook: Kullanıcı bulunamadı veya veritabanı hatası:', userError);
          return NextResponse.json({ 
            error: 'Kullanıcı bulunamadı veya veritabanı hatası',
            customer_email: session.customer_email,
            customer_id: session.customer
          }, { status: 404 });
        }
      } catch (error) {
        console.error('Webhook işleme hatası:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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