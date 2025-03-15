import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// App Router için modern config
export const dynamic = 'force-dynamic';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// OPTIONS metodu için handler
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  console.log("🔄 Test premium isteği alındı");
  
  try {
    // URL'den userId parametresini al
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: "Kullanıcı ID'si gereklidir" },
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`📝 Test için premium yapılacak kullanıcı: ${userId}`);
    
    // Supabase client oluştur
    const supabase = createRouteHandlerClient({ cookies });
    
    // Önce tablonun yapısını öğren
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1);
      
    console.log("Tablo yapısı:", tableInfo, tableError);
    
    // Kullanıcı ayarlarını kontrol et
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    console.log("Mevcut kullanıcı ayarları:", userSettings, settingsError);
    
    // Eğer hata varsa veya kullanıcı ayarları bulunamadıysa yeni kayıt oluştur
    if (settingsError || !userSettings) {
      // Dinamik olarak insert yapalım - muhtemel alan adları
      const insertData: any = {
        user_id: userId,
      };
      
      // İki olası alan adı için de değer girelim
      insertData.subscription_status = 'premium';
      insertData.status = 'premium';
      
      const { data: insertResult, error: insertError } = await supabase
        .from('user_settings')
        .insert(insertData);
        
      if (insertError) {
        console.error("Yeni kullanıcı ayarı oluşturma hatası:", insertError);
        return NextResponse.json(
          { error: "Premium abonelik kaydı oluşturulamadı" },
          { status: 500, headers: corsHeaders }
        );
      }
      
      console.log("Yeni premium abonelik kaydı oluşturuldu:", insertResult);
    } else {
      // Mevcut kaydı güncelle
      const updateData: any = {};
      
      // Her iki olası alan adı için de güncelleme yapalım
      if ('subscription_status' in userSettings) {
        updateData.subscription_status = 'premium';
      }
      
      if ('status' in userSettings) {
        updateData.status = 'premium';
      }
      
      // En azından bir alan güncelleniyor mu kontrol et
      if (Object.keys(updateData).length === 0) {
        // Hiçbir alan tanımlanmamış, bu durumda iki alanı da güncelleyelim
        updateData.subscription_status = 'premium';
        updateData.status = 'premium';
      }
      
      const { data: updateResult, error: updateError } = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', userId);
        
      if (updateError) {
        console.error("Kullanıcı ayarı güncelleme hatası:", updateError);
        return NextResponse.json(
          { error: "Premium abonelik güncellenemedi" },
          { status: 500, headers: corsHeaders }
        );
      }
      
      console.log("Premium abonelik güncellendi:", updateResult);
    }
    
    return NextResponse.json(
      { success: true, message: "Premium abonelik aktifleştirildi" },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Test premium hatası:", error);
    
    return NextResponse.json(
      { 
        error: "Premium abonelik işlemi başarısız", 
        details: error.message || "Bilinmeyen hata"
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 