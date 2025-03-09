import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      await supabase.auth.exchangeCodeForSession(code);
      // E-posta doğrulandıktan sonra giriş sayfasına yönlendir
      return NextResponse.redirect(new URL('/login', requestUrl.origin));
    } catch (error) {
      console.error('Auth callback error:', error);
      // Hata durumunda ana sayfaya yönlendir
      return NextResponse.redirect(new URL('/', requestUrl.origin));
    }
  }

  // Code parametresi yoksa ana sayfaya yönlendir
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}