import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addDays } from 'date-fns';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Supabase istemcisi
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const daysRange = parseInt(searchParams.get('days') || '7', 10);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı ID\'si belirtilmedi' },
        { status: 400 }
      );
    }

    // Tarih aralığını hesapla
    const today = new Date();
    const endDate = addDays(today, daysRange);
    
    const todayString = today.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];

    // Ödemeleri getir
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('due_date', todayString)
      .lte('due_date', endDateString)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Ödemeleri getirirken hata:', error);
      return NextResponse.json(
        { success: false, error: 'Ödemeler getirilemedi' },
        { status: 500 }
      );
    }

    // Eğer ödeme bulunamadıysa test verileri gönderin
    if (!data || data.length === 0) {
      console.log(`${userId} kullanıcısı için gerçek ödeme bulunamadı, test verileri döndürülüyor`);
      
      // Test ödeme verileri
      const testPayments = [
        {
          id: `test-payment-1-${userId}`,
          user_id: userId,
          description: 'Elektrik Faturası (Test)',
          amount: 350.75,
          category: 'Fatura',
          due_date: todayString,
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: `test-payment-2-${userId}`,
          user_id: userId,
          description: 'İnternet Faturası (Test)',
          amount: 250.50,
          category: 'Fatura',
          due_date: addDays(today, 1).toISOString().split('T')[0],
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: `test-payment-3-${userId}`,
          user_id: userId,
          description: 'Netflix Aboneliği (Test)',
          amount: 120.00,
          category: 'Abonelik',
          due_date: addDays(today, 2).toISOString().split('T')[0],
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ];
      
      return NextResponse.json({
        success: true,
        payments: testPayments,
        meta: {
          userId,
          daysRange,
          startDate: todayString,
          endDate: endDateString,
          count: testPayments.length,
          isTestData: true
        },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      payments: data,
      meta: {
        userId,
        daysRange,
        startDate: todayString,
        endDate: endDateString,
        count: data.length
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('API hatası:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Bir sorun oluştu',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 