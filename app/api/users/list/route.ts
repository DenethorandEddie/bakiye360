import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Supabase istemcisi
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET() {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Service Key mevcut:', !!supabaseServiceKey);
  
  try {
    // Admin yetkilerine sahip supabase istemcisi oluştur
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Auth API'sini kullanarak kullanıcıları getir
    console.log('Auth API kullanarak kullanıcıları getirmeye çalışıyorum...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Auth API sorgusu başarısız oldu:', authError);
      throw authError;
    }

    if (authUsers && authUsers.users) {
      console.log(`${authUsers.users.length} kullanıcı bulundu`);
      
      // Kullanıcıları daha kullanışlı bir format haline getir
      const formattedUsers = authUsers.users.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata
      }));
      
      return NextResponse.json({
        success: true,
        users: formattedUsers,
        count: formattedUsers.length,
        source: 'auth_api'
      });
    } else {
      // Auth API sonuç vermezse, manuel kullanıcı verileri dön
      console.log('Auth API sonuç vermedi, test kullanıcıları döndürülüyor.');
      const testUsers = [
        {
          id: 'test-user-1',
          email: 'test1@example.com',
          created_at: new Date().toISOString()
        },
        {
          id: 'test-user-2',
          email: 'test2@example.com',
          created_at: new Date().toISOString()
        },
        {
          id: 'test-user-3',
          email: 'test3@example.com',
          created_at: new Date().toISOString()
        }
      ];
      
      return NextResponse.json({
        success: true,
        users: testUsers,
        count: testUsers.length,
        source: 'test_data'
      });
    }
  } catch (error) {
    console.error('Kullanıcıları getirirken hata oluştu:', error);
    return NextResponse.json(
      { success: false, error: 'Kullanıcılar getirilemedi' },
      { status: 500 }
    );
  }
} 