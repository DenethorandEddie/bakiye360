import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PostgrestError } from '@supabase/supabase-js';

// Tip tanımlamaları
interface UserSettings {
  id: string;
  user_id: string;
  subscription_tier?: string;
  subscription_status?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserProfile {
  id: string;
  email?: string;
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
        mode: session.mode
      });
  
      try {
        // Tek seferlik ödeme (payment) veya abonelik (subscription) olabilir
        // Her iki durumu da ele alalım
        let subscriptionId = session.subscription as string;
        let subscriptionStart: string;
        let subscriptionEnd: string;
        
        if (session.mode === 'subscription' && subscriptionId) {
          // Abonelik modu, subscription ID var
          console.log(`Webhook: Stripe'dan abonelik detayları alınıyor (ID: ${subscriptionId})`);
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            console.log('Webhook: Stripe abonelik verileri alındı', {
              subscriptionId: subscription.id,
              status: subscription.status,
              startDate: new Date(subscription.current_period_start * 1000).toISOString(),
              endDate: new Date(subscription.current_period_end * 1000).toISOString(),
            });
            
            // Abonelik tarihleri
            subscriptionStart = new Date(subscription.current_period_start * 1000).toISOString();
            subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
          } catch (subError) {
            console.error('Webhook: Abonelik verileri alınamadı', subError);
            // Varsayılan tarihler oluştur (1 ay)
            const now = new Date();
            subscriptionStart = now.toISOString();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
            subscriptionEnd = endDate.toISOString();
          }
        } else {
          // Abonelik modu değil veya subscription ID yok - Tek seferlik ödeme olarak işle
          console.log('Webhook: Abonelik ID bulunamadı, tek seferlik ödeme olarak işleniyor');
          const now = new Date();
          subscriptionStart = now.toISOString();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1); // Varsayılan olarak 1 aylık premium ver
          subscriptionEnd = endDate.toISOString();
          // Yoksa subscription ID oluştur
          subscriptionId = session.id || `manual_sub_${Date.now()}`;
        }

        // Kullanıcıyı bul - önce customer ID ile dene
        console.log(`Webhook: Supabase'den kullanıcı bilgileri alınıyor (Customer ID: ${session.customer})`);
        let userData: UserSettings | null = null;
        let userError: PostgrestError | null = null;
        
        try {
          const result = await supabase
            .from('user_settings')
            .select('*')
            .eq('stripe_customer_id', session.customer)
            .single();
          
          userData = result.data as UserSettings;
          userError = result.error;
        } catch (dbError) {
          console.error('Webhook: Veritabanı sorgusu hatası:', dbError);
        }
        
        // Customer ID ile bulunamadıysa, müşteri e-postasını kullanarak profil tablosundan bulmayı deneyelim
        if (!userData && session.customer_email) {
          try {
            console.log(`Webhook: Kullanıcı customer ID ile bulunamadı, e-posta ile aranıyor: ${session.customer_email}`);
            const profileResult = await supabase
              .from('profiles')
              .select('id, email')
              .eq('email', session.customer_email)
              .single();
            
            if (profileResult.data) {
              console.log('Webhook: E-posta ile kullanıcı bulundu:', profileResult.data);
              const profile = profileResult.data as UserProfile;
              
              // Bu kullanıcı ID'si ile user_settings tablosunda kayıt var mı?
              const settingsResult = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', profile.id)
                .single();
                
              if (settingsResult.data) {
                userData = settingsResult.data as UserSettings;
                userError = null;
              } else {
                // user_settings kaydı yok, yeni oluşturulmalı
                console.log('Webhook: Kullanıcının settings kaydı yok, yeni oluşturulacak');
                const insertResult = await supabase
                  .from('user_settings')
                  .insert({
                    user_id: profile.id,
                    stripe_customer_id: session.customer,
                    created_at: new Date().toISOString()
                  })
                  .select()
                  .single();
                
                if (insertResult.data) {
                  userData = insertResult.data as UserSettings;
                  userError = null;
                } else {
                  userError = insertResult.error;
                }
              }
            }
          } catch (profileError) {
            console.error('Webhook: Profil arama hatası:', profileError);
          }
        }

        if (userData) {
          console.log('Webhook: Kullanıcı bulundu, abonelik bilgileri güncelleniyor:', userData);
          
          // Kullanıcının abonelik bilgilerini güncelle
          const { error: updateError } = await supabase
            .from('user_settings')
            .update({
              stripe_subscription_id: subscriptionId,
              subscription_status: 'active',
              subscription_tier: 'premium',
              subscription_start_date: subscriptionStart,
              subscription_end_date: subscriptionEnd,
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
          return NextResponse.json({ error: 'Kullanıcı bulunamadı veya veritabanı hatası' }, { status: 404 });
        }
      } catch (error) {
        console.error('Webhook: Abonelik işleme hatası', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
      }
    }
  
    // Handle the customer.subscription.deleted event
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
  
      try {
        // Fetch the user's record from Supabase
        const { data: userData, error: userError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .single();
  
        if (userError) {
          throw userError;
        }
  
        // Update the user's subscription status in Supabase
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({
            subscription_tier: 'free',
            subscription_status: 'inactive',
          })
          .eq('user_id', userData.user_id);
  
        if (updateError) {
          throw updateError;
        }
  
        console.log('Subscription cancelled successfully in Supabase');
      } catch (error) {
        console.error('Error processing subscription cancellation:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
      }
    }
  
    // Handle customer.subscription.updated event
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      
      try {
        // Fetch the user's record from Supabase
        const { data: userData, error: userError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .single();
  
        if (userError) {
          throw userError;
        }
  
        // Update subscription details
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({
            subscription_status: subscription.status,
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('user_id', userData.user_id);
  
        if (updateError) {
          throw updateError;
        }
  
        console.log('Subscription updated successfully in Supabase');
      } catch (error) {
        console.error('Error processing subscription update:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}