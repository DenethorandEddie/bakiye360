import { NextResponse } from 'next/server';
import { sendPaymentReminderEmail } from '@/lib/services/notification-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// API endpoint'i işlevi
export async function POST(request: Request) {
  try {
    // Request gövdesinden verileri al
    const { email, payments } = await request.json();
    
    if (!email || !payments || !Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json(
        { error: 'Geçersiz veri. Email ve en az bir ödeme detayı gerekli.' },
        { status: 400 }
      );
    }
    
    // Test ödemelerini kullanarak e-posta gönder
    const result = await sendPaymentReminderEmail(email, payments);
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: `E-posta başarıyla gönderildi: ${email}`,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'E-posta gönderme başarısız oldu',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Manuel bildirim testi hatası:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'İşlem başarısız oldu',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 