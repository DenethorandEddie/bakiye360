import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  try {
    // Demo mod kontrolü için localStorage'a erişim yok, bu yüzden
    // sadece gerçek Supabase bağlantısı varsa middleware çalışacak
    const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://example.supabase.co';
    
    if (!isDemo) {
      const supabase = createMiddlewareClient({ 
        req, 
        res,
        options: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key-for-development'
        }
      });
      
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Auth check for protected routes
      if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/login';
        redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Redirect logged in users away from auth pages
      if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register')) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/dashboard';
        return NextResponse.redirect(redirectUrl);
      }
    }
  } catch (error) {
    console.error("Middleware error:", error);
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
  ],
};