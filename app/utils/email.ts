import { createClient } from '@supabase/supabase-js';

// Environment değişkenlerini manuel olarak tanımla
const supabaseUrl = 'https://wemufsahwsnmeyuedczw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlbXVmc2Fod3NubWV5dWVkY3p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTAwNTE2MSwiZXhwIjoyMDU2NTgxMTYxfQ.0QjyKX4iaS8IX7BFMeE-I7WeYc1FilThLseDZp8vAVo';

// Supabase admin client oluştur
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

export async function sendBudgetAlertEmail(
  userId: string,
  budgetName: string,
  categoryName: string,
  currentAmount: number,
  targetAmount: number
) {
  try {
    // Kullanıcı bilgilerini al
    const { data: userData, error: userError } = await adminSupabase
      .from('profiles')
      .select('email, first_name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Kullanıcı bilgileri alınamadı:', userError);
      return;
    }

    // Premium üyelik kontrolü
    const { data: subscriptionData, error: subscriptionError } = await adminSupabase
      .from('subscriptions')
      .select('status, plan_id')
      .eq('user_id', userId)
      .single();

    if (subscriptionError || !subscriptionData || subscriptionData.status !== 'active' || subscriptionData.plan_id !== 'premium') {
      console.log('Kullanıcı premium üye değil veya aboneliği aktif değil');
      return;
    }

    // Bildirim ayarlarını kontrol et
    const { data: notificationSettings, error: notificationError } = await adminSupabase
      .from('notification_settings')
      .select('budget_alerts')
      .eq('user_id', userId)
      .single();

    if (notificationError || !notificationSettings || !notificationSettings.budget_alerts) {
      console.log('Bütçe uyarıları kapalı veya ayarlar bulunamadı');
      return;
    }

    // Email gönderme
    const { error: emailError } = await adminSupabase
      .from('emails')
      .insert([
        {
          to: userData.email,
          subject: '⚠️ Bütçe Aşımı Uyarısı',
          html: `
            <h2>Merhaba ${userData.first_name},</h2>
            <p>Bir bütçe hedefinde aşım tespit edildi:</p>
            <ul>
              <li><strong>Bütçe Adı:</strong> ${budgetName}</li>
              <li><strong>Kategori:</strong> ${categoryName}</li>
              <li><strong>Mevcut Harcama:</strong> ₺${currentAmount.toLocaleString('tr-TR')}</li>
              <li><strong>Hedef Bütçe:</strong> ₺${targetAmount.toLocaleString('tr-TR')}</li>
              <li><strong>Aşım Miktarı:</strong> ₺${(currentAmount - targetAmount).toLocaleString('tr-TR')}</li>
            </ul>
            <p>Bütçenizi daha iyi yönetmek için harcamalarınızı gözden geçirmenizi öneririz.</p>
            <p>Bakiye360 uygulamasında detaylı analiz ve önerileri inceleyebilirsiniz.</p>
          `,
        },
      ]);

    if (emailError) {
      console.error('Email gönderilirken hata oluştu:', emailError);
      return;
    }

    console.log('Bütçe aşımı email bildirimi gönderildi');
  } catch (error) {
    console.error('Email gönderme işleminde hata:', error);
  }
} 