/**
 * Bakiye360 - Otomatik Bildirim Gönderme Scripti
 * 
 * Bu script, GitHub Actions tarafından düzenli olarak çalıştırılarak
 * yaklaşan ödemeler için bildirim göndermek amacıyla kullanılır.
 */

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const { addDays, format, parseISO } = require('date-fns');
const { tr } = require('date-fns/locale');

// Supabase bağlantısı
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL veya Service Role Key eksik!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// E-posta gönderimi için transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Kategorileri emoji formatında gösterme
const categoryEmojis = {
  'Yiyecek': '🍔',
  'Ulaşım': '🚗',
  'Faturalar': '📝',
  'Konut': '🏠',
  'Eğlence': '🎬',
  'Giyim': '👕',
  'Eğitim': '📚',
  'Sağlık': '🏥',
  'Diğer Gider': '📦',
  'Freelance': '💻',
  'Maaş': '💰',
  'Yatırım': '📈',
  'Diğer Gelir': '💼'
};

// Yaklaşan ödemeleri bulan fonksiyon
async function getUpcomingPayments() {
  // Yarının tarihini hesapla
  const tomorrow = addDays(new Date(), 1);
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
  
  console.log(`${tomorrowStr} tarihi için yaklaşan ödemeleri kontrol ediyorum...`);
  
  try {
    // Supabase'den yaklaşan ödemeleri çek
    // transactions tablosunu kullan
    const { data: payments, error } = await supabase
      .from('transactions')
      .select(`
        id,
        user_id,
        title,
        amount,
        category,
        date
      `)
      .eq('date', tomorrowStr)
    
    if (error) {
      console.error('Yaklaşan ödemeleri alırken hata:', error);
      return [];
    }
    
    console.log('Bulunan işlemler:', payments);
    return payments || [];
  } catch (err) {
    console.error('Yaklaşan ödemeleri alırken beklenmeyen hata:', err);
    return [];
  }
}

// Bildirim gönderen fonksiyon
async function sendNotifications(payments) {
  // Kullanıcı ID'sine göre ödemeleri grupla
  const paymentsByUser = payments.reduce((acc, payment) => {
    if (!acc[payment.user_id]) {
      acc[payment.user_id] = [];
    }
    acc[payment.user_id].push(payment);
    return acc;
  }, {});
  
  // Her kullanıcı için bildirim gönder
  for (const userId in paymentsByUser) {
    const userPayments = paymentsByUser[userId];
    
    // Kullanıcı e-posta adresini ayrı bir sorgu ile al
    const { data: userData, error } = await supabase
      .from('profiles')  // veya users, hangisi varsa
      .select('email')
      .eq('id', userId)
      .single();
    
    if (error || !userData) {
      console.warn(`${userId} ID'li kullanıcı için e-posta adresi bulunamadı:`, error);
      continue;
    }
    
    const userEmail = userData.email;
    
    if (!userEmail) {
      console.warn(`${userId} ID'li kullanıcı için e-posta adresi bulunamadı.`);
      continue;
    }
    
    try {
      await sendPaymentNotification(userEmail, userPayments);
      console.log(`${userEmail} adresine bildirim gönderildi.`);
    } catch (error) {
      console.error(`${userEmail} adresine bildirim gönderilirken hata:`, error);
    }
  }
}

// E-posta bildirimi gönderen fonksiyon
async function sendPaymentNotification(email, payments) {
  // Toplam ödeme miktarını hesapla
  const totalAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toFixed(2);
  
  // Ödemeleri kategorilere göre grupla
  const paymentsByCategory = payments.reduce((acc, payment) => {
    const category = payment.category || 'Diğer';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(payment);
    return acc;
  }, {});
  
  // E-posta içeriğini oluştur
  let emailContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yarınki İşlemleriniz - Bakiye360</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; margin-bottom: 20px; }
      .logo { max-width: 200px; height: auto; }
      .container { background-color: #f9f9f9; border-radius: 10px; padding: 20px; }
      .payment-list { margin: 20px 0; }
      .payment-item { padding: 10px; border-bottom: 1px solid #eee; }
      .payment-title { font-weight: bold; }
      .payment-amount { color: #e63946; font-weight: bold; }
      .payment-category { color: #6c757d; font-size: 0.9em; }
      .total { font-size: 1.2em; margin-top: 20px; text-align: right; }
      .footer { margin-top: 30px; font-size: 0.9em; color: #6c757d; text-align: center; }
      .button { display: inline-block; background-color: #2557a7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      h2 { color: #2557a7; }
      .category-title { background-color: #f0f0f0; padding: 8px; border-radius: 5px; margin-top: 15px; margin-bottom: 10px; }
    </style>
  </head>
  <body>
    <div class="header">
      <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Bakiye360 Logo" class="logo">
    </div>
    <div class="container">
      <h2>Yarın Gerçekleşecek İşlemleriniz</h2>
      <p>Merhaba,</p>
      <p>Yarın için planlanmış ${payments.length} adet işleminiz bulunmaktadır. Toplam tutar: <strong>${totalAmount} TL</strong></p>
      
      <div class="payment-list">`;
      
  // Her kategori için ödemeleri listele
  for (const category in paymentsByCategory) {
    const categoryPayments = paymentsByCategory[category];
    const emoji = categoryEmojis[category] || '📝';
    
    emailContent += `
        <div class="category-title">${emoji} ${category}</div>`;
    
    categoryPayments.forEach(payment => {
      emailContent += `
        <div class="payment-item">
          <div class="payment-title">${payment.title}</div>
          <div class="payment-amount">${parseFloat(payment.amount).toFixed(2)} TL</div>
          <div class="payment-category">İşlem Tarihi: ${format(parseISO(payment.date), 'd MMMM yyyy', { locale: tr })}</div>
        </div>`;
    });
  }
  
  emailContent += `
      </div>
      
      <div class="total">
        <strong>Toplam: ${totalAmount} TL</strong>
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments" class="button">Ödemelerimi Görüntüle</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Bu e-posta Bakiye360 otomatik bildirim sistemi tarafından gönderilmiştir.</p>
      <p>© ${new Date().getFullYear()} Bakiye360. Tüm hakları saklıdır.</p>
    </div>
  </body>
  </html>`;
  
  // E-postayı gönder
  const info = await transporter.sendMail({
    from: `"Bakiye360" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Yarın İçin ${payments.length} Ödemeniz Var - Bakiye360`,
    html: emailContent,
  });
  
  return info;
}

// Ana fonksiyon
async function main() {
  console.log('Bakiye360 Otomatik Bildirim İşlemi Başlatılıyor...');
  console.log(new Date().toISOString());
  
  try {
    // Yaklaşan ödemeleri al
    const upcomingPayments = await getUpcomingPayments();
    console.log(`Toplam ${upcomingPayments.length} adet yaklaşan işlem bulundu.`);
    
    if (upcomingPayments.length === 0) {
      console.log('Yarın için planlanmış işlem bulunamadı.');
      return;
    }
    
    // Bildirimleri gönder
    await sendNotifications(upcomingPayments);
    console.log('Tüm bildirimler başarıyla gönderildi.');
  } catch (error) {
    console.error('Bildirim gönderme işlemi sırasında hata:', error);
    process.exit(1);
  }
}

// Scripti çalıştır
main(); 