/**
 * Bakiye360 - Otomatik Bildirim Gönderme Scripti
 * 
 * Bu script, GitHub Actions tarafından düzenli olarak çalıştırılarak
 * yaklaşan ödemeler için bildirim göndermek amacıyla kullanılır.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendNotifications() {
  try {
    // Yarının tarihini al (Türkiye saati)
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 3); // UTC+3 için
    tomorrow.setDate(tomorrow.getDate() + 1); // Yarının tarihi
    
    const formattedDate = tomorrow.toISOString().split('T')[0];
    
    console.log(`${formattedDate} tarihli ödemeler için bildirimler gönderiliyor...`);

    // Yarının ödemelerini bul
    const { data: payments, error: paymentsError } = await supabase
      .from('scheduled_payments')
      .select(`
        *,
        profiles:user_id (
          email,
          first_name
        )
      `)
      .eq('payment_date', formattedDate);

    if (paymentsError) {
      throw new Error(`Ödemeler alınırken hata: ${paymentsError.message}`);
    }

    if (!payments || payments.length === 0) {
      console.log('Yarın için planlanmış ödeme bulunmuyor.');
      return;
    }

    // Kullanıcı bazlı ödemeleri grupla
    const userPayments = payments.reduce((acc, payment) => {
      if (!acc[payment.user_id]) {
        acc[payment.user_id] = {
          payments: [],
          email: payment.profiles.email,
          firstName: payment.profiles.first_name
        };
      }
      acc[payment.user_id].payments.push(payment);
      return acc;
    }, {});

    // Her kullanıcı için email gönder
    for (const [userId, data] of Object.entries(userPayments)) {
      const totalAmount = data.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const { error: emailError } = await supabase
        .from('emails')
        .insert([
          {
            to: data.email,
            subject: `Yarınki Ödemeleriniz - ${formattedDate}`,
            html: `
              <h2>Merhaba ${data.firstName},</h2>
              <p>Yarın için planlanmış ${data.payments.length} adet ödemeniz bulunmaktadır:</p>
              <ul>
                ${data.payments.map(p => `
                  <li>
                    <strong>${p.description || 'Ödeme'}</strong>: 
                    ${p.amount?.toLocaleString('tr-TR')} TL
                  </li>
                `).join('')}
              </ul>
              <p><strong>Toplam Ödenecek Tutar:</strong> ${totalAmount.toLocaleString('tr-TR')} TL</p>
              <p>Ödemelerinizi takip etmek için <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Bakiye360</a>'ı ziyaret edebilirsiniz.</p>
            `,
          },
        ]);

      if (emailError) {
        console.error(`${data.email} adresine email gönderilirken hata:`, emailError);
      } else {
        console.log(`${data.email} adresine bildirim gönderildi.`);
      }
    }

    console.log('Tüm bildirimler gönderildi.');
  } catch (error) {
    console.error('Bildirim gönderme işleminde hata:', error);
    process.exit(1);
  }
}

sendNotifications(); 