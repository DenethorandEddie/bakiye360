import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import format from 'date-fns/format';
import tr from 'date-fns/locale/tr';
import addDays from 'date-fns/addDays';
import isWithinInterval from 'date-fns/isWithinInterval';
import compareAsc from 'date-fns/compareAsc';

// Supabase istemcisi
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// E-posta transporter'ı
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: Boolean(process.env.EMAIL_SERVER_SECURE),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

// Tüm kullanıcılar için bildirim tercihlerini getir
export async function getUsersWithEmailNotificationsEnabled() {
  try {
    console.log('E-posta bildirimleri etkin kullanıcıları getiriyorum...');
    
    // Admin yetkilerine sahip supabase istemcisi oluştur
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Auth API'sini kullanarak tüm kullanıcıları getir
    const { data: authUsers, error: authError } = await adminSupabase.auth.admin.listUsers();

    if (authError) {
      console.error('Auth API kullanıcıları getirirken hata:', authError);
      throw authError;
    }

    if (!authUsers || !authUsers.users || authUsers.users.length === 0) {
      console.warn('Hiç kullanıcı bulunamadı veya Auth API erişilemez');
      return [];
    }

    // User metadata veya app metadata'dan e-posta bildirim tercihlerini kontrol et
    // Eğer metadata'da bu bilgi yoksa, varsayılan olarak bildirimleri etkin kabul et
    const userList = authUsers.users.filter(user => {
      // E-posta adresi olmayanları filtrele
      if (!user.email) return false;
      
      // Kullanıcı metadatasını kontrol et
      // Varsayılan olarak bildirimleri etkin kabul ediyoruz
      // Eğer kullanıcı açıkça bildirimleri kapatmışsa (notification_enabled: false) filtrele
      const userMeta = user.user_metadata || {};
      const appMeta = user.app_metadata || {};
      
      // Metadatada açıkça bildirimler kapatılmışsa, bu kullanıcıyı dahil etme
      if (userMeta.notifications_enabled === false || appMeta.notifications_enabled === false) {
        return false;
      }
      
      return true;
    }).map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at
    }));

    console.log(`${userList.length} adet bildirim alacak kullanıcı bulundu`);
    return userList;
  } catch (error) {
    console.error('Kullanıcıları getirirken hata:', error);
    return [];
  }
}

// Bir kullanıcının yaklaşan ödemelerini getir (tam olarak yarın olanlar)
export async function getUpcomingPaymentsForUser(userId: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .eq('due_date', tomorrowString)
    .eq('status', 'pending');

  if (error) {
    console.error(`Error fetching upcoming payments for user ${userId}:`, error);
    return [];
  }

  return data;
}

// Belirli bir tarih aralığındaki ödemeleri getir (test ve gerçek senaryolar için)
export async function getPaymentsInDateRange(userId: string, daysRange: number = 7) {
  const today = new Date();
  const endDate = addDays(today, daysRange);
  
  const todayString = today.toISOString().split('T')[0];
  const endDateString = endDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gte('due_date', todayString)
    .lte('due_date', endDateString)
    .order('due_date', { ascending: true });

  if (error) {
    console.error(`Error fetching payments in date range for user ${userId}:`, error);
    return [];
  }

  return data;
}

// Tüm kullanıcıların tüm yaklaşan ödemelerini getir
export async function getAllUpcomingPayments(daysRange: number = 7) {
  const today = new Date();
  const endDate = addDays(today, daysRange);
  
  const todayString = today.toISOString().split('T')[0];
  const endDateString = endDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('payments')
    .select('*, user:users(email)')
    .eq('status', 'pending')
    .gte('due_date', todayString)
    .lte('due_date', endDateString)
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error fetching all upcoming payments:', error);
    return [];
  }

  return data;
}

// Yaklaşan ödemeler için bildirim e-postası gönder
export async function sendPaymentReminderEmail(userEmail: string, payments: any[]) {
  if (!payments || payments.length === 0) return;

  let formattedDate;
  try {
    formattedDate = format(new Date(payments[0].due_date), 'd MMMM yyyy', { locale: tr });
  } catch (error) {
    console.error('Error formatting date:', error);
    // Fallback to a simpler date format
    const paymentDate = new Date(payments[0].due_date);
    formattedDate = `${paymentDate.getDate()}.${paymentDate.getMonth() + 1}.${paymentDate.getFullYear()}`;
  }

  // Ödemeleri kategoriye göre gruplayalım
  const paymentsByCategory: Record<string, any[]> = {};
  payments.forEach(payment => {
    const category = payment.category || 'Kategorisiz';
    if (!paymentsByCategory[category]) {
      paymentsByCategory[category] = [];
    }
    paymentsByCategory[category].push(payment);
  });

  // Kategorilere göre tablo oluşturalım
  const categorySections = Object.entries(paymentsByCategory).map(([category, categoryPayments]) => {
    const categoryTotal = categoryPayments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2);
    
    const paymentRows = categoryPayments.map(payment => {
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${payment.description || 'Belirtilmemiş'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${payment.amount.toFixed(2)} ₺</td>
        </tr>
      `;
    }).join('');
    
    return `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; margin-bottom: 10px;">${category}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            ${paymentRows}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 10px; font-weight: bold; text-align: right;">Kategori Toplamı:</td>
              <td style="padding: 10px; font-weight: bold; text-align: right; color: #4f46e5;">${categoryTotal} ₺</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }).join('');

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2);

  // Logo URL'ini ayarlayalım
  // Geliştirme ortamında localhost, üretimde gerçek domain kullanılır
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const logoUrl = `${baseUrl}/logo.png`;

  const emailContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="text-align: center; padding: 20px 0; background-color: #f5f7ff; border-radius: 8px 8px 0 0;">
        <img src="${logoUrl}" alt="Bakiye360 Logo" style="max-width: 180px; height: auto;">
      </div>

      <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
        <h2 style="color: #4f46e5; margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">Yaklaşan Ödemeleriniz Var!</h2>
        
        <div style="background-color: #f5f7ff; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 16px;">
            <span style="font-weight: bold;">${formattedDate}</span> tarihi için 
            <span style="font-weight: bold; color: #4f46e5;">${payments.length} adet</span> 
            ödeme planlanmış.
          </p>
          <p style="margin: 10px 0 0 0; font-size: 16px;">
            Toplam: <span style="font-weight: bold; color: #4f46e5;">${totalAmount} ₺</span>
          </p>
        </div>

        <div style="margin: 25px 0;">
          ${categorySections}
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <a href="https://bakiye360.com/dashboard/payments" 
             style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; 
             text-decoration: none; border-radius: 6px; font-weight: 500; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);">
             Ödemeleri Görüntüle
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666;">
          <p>
            <strong>Neden bu bildirimi alıyorum?</strong><br>
            Bakiye360 üzerinde bildirim tercihleriniz aktif olduğu için yaklaşan ödemeleriniz hakkında bilgilendiriliyorsunuz.
          </p>
          <p>
            Gelecekte bu bildirimleri almak istemiyorsanız, <a href="https://bakiye360.com/dashboard/settings" style="color: #4f46e5; text-decoration: none;">hesap ayarlarınızdan</a> e-posta bildirimlerini kapatabilirsiniz.
          </p>
        </div>
      </div>

      <div style="margin-top: 20px; padding: 15px; font-size: 12px; text-align: center; color: #888;">
        <p>&copy; ${new Date().getFullYear()} Bakiye360. Tüm hakları saklıdır.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Bakiye360" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: "Bakiye360 - Yaklaşan Ödemeleriniz Var!",
      html: emailContent,
    });

    console.log(`Payment reminder email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`Error sending payment reminder email to ${userEmail}:`, error);
    return false;
  }
}

// Yaklaşan ödemeleri kontrol et ve bildirimleri gönder
export async function checkAndSendPaymentReminders() {
  console.log('Ödeme hatırlatıcıları kontrol ediliyor...');
  
  try {
    // Bildirim alması gereken kullanıcıları getir
    const users = await getUsersWithEmailNotificationsEnabled();
    console.log(`${users.length} adet kullanıcı için bildirim kontrolü yapılacak`);
    
    let sentCount = 0;
    let userCount = 0;
    let errorCount = 0;
    
    // Her kullanıcı için yaklaşan ödemeleri kontrol et
    for (const user of users) {
      userCount++;
      try {
        // Kullanıcının yaklaşan ödemelerini al
        const payments = await getUpcomingPaymentsForUser(user.id);
        
        if (payments && payments.length > 0) {
          console.log(`${user.email} için ${payments.length} adet yaklaşan ödeme bulundu`);
          
          // E-posta gönder
          if (user.email) {
            await sendPaymentReminderEmail(user.email, payments);
            sentCount++;
            console.log(`${user.email} adresine bildirim e-postası gönderildi`);
          }
        } else {
          console.log(`${user.email} için yaklaşan ödeme bulunamadı`);
        }
      } catch (error) {
        errorCount++;
        console.error(`${user.email} için bildirim gönderirken hata:`, error);
      }
    }
    
    console.log(`
      Bildirim özeti:
      ---------------
      Toplam kullanıcı: ${userCount}
      Gönderilen bildirim: ${sentCount}
      Hata sayısı: ${errorCount}
    `);
    
    return {
      success: true,
      userCount,
      sentCount,
      errorCount,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Bildirim gönderirken genel hata:', error);
    return {
      success: false,
      error: 'Bildirimler kontrol edilirken bir hata oluştu',
      timestamp: new Date().toISOString()
    };
  }
} 