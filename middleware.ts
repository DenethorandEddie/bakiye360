import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // Refresh session if it exists
  const { data: { session } } = await supabase.auth.getSession();
  
  // Protected routes that require authentication
  if (!session && (
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/api/checkout')
  )) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      console.log('[Middleware] Oturum bulunamadı, API isteği:', {
        path: req.nextUrl.pathname,
        session: session ? 'var' : 'yok'
      });
      return NextResponse.json({ 
        error: 'Unauthorized', 
        errorType: 'AUTH_ERROR',
        message: 'Bu API endpoint\'i için oturum açmanız gerekiyor',
        debug: 'Middleware - auth kontrolü'
      }, { status: 401 });
    }
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Check for premium-only features
  if (session && 
      (req.nextUrl.pathname.includes('/premium-features') || 
       req.nextUrl.pathname.includes('/reports'))) {
    
    // Check if user has premium access
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('subscription_status, subscription_end_date')
      .eq('user_id', session.user.id)
      .single();
    
    const isPremium = userSettings?.subscription_status === 'premium' && 
      userSettings?.subscription_end_date && 
      new Date(userSettings.subscription_end_date) > new Date();
      
    if (!isPremium) {
      return NextResponse.redirect(new URL('/pricing', req.url));
    }
  }
  
  // Analytics için pageview'u header'a ekle
  // Bu header'ı client side'da yakalayıp analytics olayı olarak kullanabilirsiniz
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
    '/api/checkout/session',
    '/api/checkout/:path*'
  ],
};