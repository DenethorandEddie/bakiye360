import { NextResponse } from 'next/server';
import { checkAndSendPaymentReminders } from '@/lib/services/notification-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// API anahtarını doğrulama fonksiyonu
const validateApiKey = (request: Request) => {
  const apiKey = request.headers.get('x-api-key');
  const validApiKey = process.env.CRON_API_KEY;
  
  return apiKey === validApiKey;
};

// API endpoint'i işlevi
export async function GET(request: Request) {
  // API anahtarını doğrula
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid API key' },
      { status: 401 }
    );
  }

  try {
    // Yarın için ödemeleri kontrol et ve bildirimleri gönder
    const result = await checkAndSendPaymentReminders();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully sent payment reminders. Sent ${result.sentCount} notifications.`,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send payment reminders',
          error: result.error,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in notification cron job:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Notification process failed',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 