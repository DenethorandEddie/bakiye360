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
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret is not configured' },
        { status: 500 }
      );
    }
    
    const supabase = createRouteHandlerClient({ cookies });
    
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed', details: error.message },
        { status: 400 }
      );
    }
    
    console.log('Webhook event received:', {
      type: event.type,
      id: event.id,
      created: new Date(event.created * 1000).toISOString()
    });
    
    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Processing checkout.session.completed:', {
        sessionId: session.id,
        customerId: session.customer,
        paymentStatus: session.payment_status,
        metadata: session.metadata
      });
      
      // Metadata'dan userId'yi al
      const userId = session.metadata?.userId;
      
      if (!userId) {
        console.error('User ID not found in session metadata:', session);
        return NextResponse.json(
          { error: 'User ID not found in session metadata' },
          { status: 400 }
        );
      }
      
      try {
        // Kullanıcıyı ID ile bul
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileError || !profile) {
          console.error('Profile not found:', { userId, error: profileError });
          return NextResponse.json(
            { error: 'Profile not found', userId },
            { status: 404 }
          );
        }
        
        console.log('Profile found:', {
          userId: profile.id,
          currentTier: profile.subscription_tier,
          currentStatus: profile.subscription_status
        });
        
        // Abonelik tarihlerini ayarla
        const now = new Date();
        const oneMonthLater = new Date();
        oneMonthLater.setMonth(now.getMonth() + 1);
        
        // Kullanıcının abonelik bilgilerini güncelle
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: 'premium',
            subscription_status: 'active',
            subscription_start_date: now.toISOString(),
            subscription_end_date: oneMonthLater.toISOString(),
            stripe_customer_id: session.customer as string,
            stripe_payment_id: session.id,
            updated_at: now.toISOString()
          })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Failed to update profile:', {
            userId,
            error: updateError
          });
          return NextResponse.json(
            { error: 'Failed to update profile', details: updateError },
            { status: 500 }
          );
        }
        
        console.log('Profile updated successfully:', {
          userId,
          newTier: 'premium',
          newStatus: 'active',
          startDate: now.toISOString(),
          endDate: oneMonthLater.toISOString()
        });
        
        return NextResponse.json({
          received: true,
          updated: true,
          userId: userId
        });
      } catch (error: any) {
        console.error('Error processing webhook:', error);
        return NextResponse.json(
          { error: 'Error processing webhook', details: error.message },
          { status: 500 }
        );
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
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Unexpected webhook error:', error);
    return NextResponse.json(
      { error: 'Unexpected webhook error', details: error.message },
      { status: 500 }
    );
  }
}