import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // İstek verisini al
    const { userId } = await request.json();
    
    // Mevcut oturum açmış kullanıcıyı kontrol et
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Oturum açmış kullanıcı bulunamadı' },
        { status: 401 }
      );
    }
    
    // Kullanıcının kendi hesabını silmek istediğinden emin ol
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Sadece kendi hesabınızı silebilirsiniz' },
        { status: 403 }
      );
    }
    
    // 1. Önce kullanıcının verilerini sil
    // Silme işlemlerini cascade ile yapabilirsiniz veya burada manuel olarak silebilirsiniz
    
    // Kullanıcının işlemlerini sil
    await supabase.from('transactions').delete().eq('user_id', userId);
    
    // Kullanıcının bütçe hedeflerini sil
    await supabase.from('budget_goals').delete().eq('user_id', userId);
    
    // Kullanıcının kategorilerini sil
    await supabase.from('categories').delete().eq('user_id', userId);
    
    // Kullanıcının ayarlarını sil
    await supabase.from('user_settings').delete().eq('user_id', userId);
    
    // 2. Son olarak kullanıcı hesabını sil
    // Not: Supabase istemci tarafında admin metodu erişilemez
    // Supabase Edge Functions veya backend servisi kullanmanız gerekebilir
    // Bu örnekte, kullanıcı verilerini sildikten sonra oturumu kapatıyoruz
    
    // Tüm oturumları sonlandır
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
    
    if (signOutError) {
      throw signOutError;
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Hesap silme hatası:', error);
    return NextResponse.json(
      { error: 'Hesap silme işlemi sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
} 