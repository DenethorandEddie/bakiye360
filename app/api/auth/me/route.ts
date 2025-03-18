import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  console.log('--- Auth/Me API Çağrıldı ---', new Date().toISOString());
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Oturum bilgilerini al
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Auth/Me API: Oturum bilgisi alınamadı', sessionError);
      return NextResponse.json({
        error: 'Session error',
        errorType: 'AUTH_ERROR',
        message: sessionError.message
      }, { status: 500 });
    }
    
    if (!session) {
      console.log('Auth/Me API: Oturum bulunamadı');
      return NextResponse.json({
        authenticated: false,
        message: 'No active session found'
      }, { status: 200 });
    }
    
    // Oturum bilgisi var, kullanıcı bilgilerini getir
    console.log('Auth/Me API: Oturum bulundu, kullanıcı ID:', session.user.id);
    
    // Kullanıcı profilini al
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('Auth/Me API: Profil bilgileri alınamadı', profileError);
      return NextResponse.json({
        authenticated: true,
        user: session.user,
        profile: null,
        error: 'Profile error',
        message: profileError.message
      }, { status: 200 });
    }
    
    console.log('Auth/Me API: Kullanıcı bilgileri alındı');
    
    // Kullanıcı bilgilerini döndür
    return NextResponse.json({
      authenticated: true,
      user: session.user,
      profile
    }, { status: 200 });
    
  } catch (error) {
    console.error('Auth/Me API: Beklenmeyen hata', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 