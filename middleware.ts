import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // Refresh session if it exists
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  // Log session status for debugging
  console.log('[Middleware] Session durumu:', {
    path: req.nextUrl.pathname,
    hasSession: !!session,
    error: sessionError?.message
  });
  
  // Protected routes that require authentication
  if (!session && (
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/api/checkout')
  )) {
    // API routes should return JSON response
    if (req.nextUrl.pathname.startsWith('/api/')) {
      console.log('[Middleware] API isteği reddedildi:', {
        path: req.nextUrl.pathname,
        reason: 'Oturum bulunamadı'
      });
      
      return new NextResponse(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
          path: req.nextUrl.pathname
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Regular routes should redirect to login
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Check for premium-only features
  if (session && 
      (req.nextUrl.pathname.includes('/premium-features') || 
       req.nextUrl.pathname.includes('/reports'))) {
    
    // Check if user has premium access
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, subscription_end_date')
      .eq('id', session.user.id)
      .single();
    
    const isPremium = profile?.subscription_tier === 'premium' && 
      profile?.subscription_status === 'active' &&
      profile?.subscription_end_date && 
      new Date(profile.subscription_end_date) > new Date();
      
    if (!isPremium) {
      return NextResponse.redirect(new URL('/pricing', req.url));
    }
  }
  
  // Analytics için pageview'u header'a ekle
  const url = req.nextUrl.pathname;
  res.headers.set('x-pathname', url);

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/premium-features/:path*',
    '/reports/:path*',
    '/admin/:path*',
    '/api/checkout/:path*',
    '/api/webhooks/:path*'
  ],
};