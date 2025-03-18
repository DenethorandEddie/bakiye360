import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Route segment config for API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: subscription, error } = await supabase
      .from('user_settings')
      .select('subscription_tier, subscription_status, subscription_start_date, subscription_end_date')
      .eq('user_id', user.id)
      .single();
      
    if (error) {
      console.error('Error fetching subscription:', error);
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
      
    // Check if subscription is active
    const isActive = subscription?.subscription_tier === 'premium' && 
      subscription?.subscription_status === 'active' && 
      subscription?.subscription_end_date && 
      new Date(subscription.subscription_end_date) > new Date();
      
    return NextResponse.json({
      ...subscription,
      isActive,
    });
  } catch (error: any) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 