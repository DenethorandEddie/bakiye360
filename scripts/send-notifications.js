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

// Kategori ID'leri ve isimlerini veritabanından çeken fonksiyon
async function fetchCategories() {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, type');
    
    if (error) {
      console.error('Kategorileri çekerken hata:', error);
      return {};
    }
    
    // Kategori ID'lerine göre isimleri ve emojileri saklayan objeler
    const categoryNames = {};
    const categoryEmojis = {};
    
    // Kategori tiplerine göre emoji belirleme
    const typeEmojis = {
      'expense': {
        'Yiyecek': '🍔',
        'Ulaşım': '🚗',
        'Faturalar': '📄',
        'Konut': '🏠',
        'Eğlence': '🎬',
        'Giyim': '👕',
        'Eğitim': '📚',
        'Sağlık': '🏥',
        'Diğer Gider': '📦',
        'Banka': '🏦',
        'Hediye': '🎁',
        default: '📋'
      },
      'income': {
        'Maaş': '💰',
        'Freelance': '💻',
        'Yatırım': '📈',
        'Diğer Gelir': '💼',
        'Hediye': '🎁',
        default: '💲'
      }
    };
    
    // Tüm kategorileri döngüye al
    categories.forEach(category => {
      categoryNames[category.id] = category.name;
      
      // Kategori tipine ve ismine göre uygun emoji seç
      const typeEmoji = typeEmojis[category.type] || {};
      categoryEmojis[category.id] = typeEmoji[category.name] || typeEmoji.default || '❓';
    });
    
    console.log('Kategoriler başarıyla yüklendi:', categories.length);
    
    return { categoryNames, categoryEmojis };
  } catch (error) {
    console.error('Kategori bilgilerini çekerken beklenmeyen hata:', error);
    return {};
  }
}

// Kategori ID'den kategori adını almak için yardımcı fonksiyon
function getCategoryNameById(categoryId, categoryNames) {
  return categoryNames[categoryId] || 'Diğer';
}

// Yaklaşan ödemeleri bulan fonksiyon
async function getUpcomingPayments() {
  // Yarının tarihini hesapla
  const tomorrow = addDays(new Date(), 1);
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
  
  console.log(`${tomorrowStr} tarihi için yaklaşan ödemeleri kontrol ediyorum...`);
  
  try {
    // Önce kategorileri çek
    const { categoryNames, categoryEmojis } = await fetchCategories();
    
    // Supabase'den yaklaşan ödemeleri çek
    // transactions tablosunu kullan
    const { data: payments, error } = await supabase
      .from('transactions')
      .select(`
        id,
        user_id,
        description,
        amount,
        category_id,
        date,
        type
      `)
      .eq('date', tomorrowStr)
      // Hem gelir hem de gider işlemlerini bildirelim
    
    if (error) {
      console.error('Yaklaşan ödemeleri alırken hata:', error);
      return { payments: [], categoryNames, categoryEmojis };
    }
    
    console.log('Bulunan işlemler:', payments);
    
    // Bulunan işlemlerin kategori ID'lerini ve dönüşümlerini kontrol et
    if (payments && payments.length > 0) {
      console.log('Kategori ID kontrolleri:');
      payments.forEach(payment => {
        console.log(`İşlem: ${payment.description}, Kategori ID: ${payment.category_id}, Kategori Adı: ${getCategoryNameById(payment.category_id, categoryNames)}`);
      });
    }
    
    return { 
      payments: payments || [],
      categoryNames,
      categoryEmojis
    };
  } catch (err) {
    console.error('Yaklaşan ödemeleri alırken beklenmeyen hata:', err);
    return { payments: [], categoryNames: {}, categoryEmojis: {} };
  }
}

// Bildirim gönderen fonksiyon
async function sendNotifications(paymentsData) {
  const { payments, categoryNames, categoryEmojis } = paymentsData;
  
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
    
    // Kullanıcı e-posta adresini auth.users tablosundan al
    const { data: userData, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error) {
      console.error(`${userId} ID'li kullanıcı için e-posta adresi bulunamadı:`, error);
      continue; // Bu kullanıcı için bildirim göndermeyi atla ve diğerine geç
    }
    
    if (!userData || !userData.user || !userData.user.email) {
      console.error(`${userId} ID'li kullanıcı için e-posta adresi bulunamadı.`);
      continue;
    }
    
    const email = userData.user.email;
    console.log(`${userId} kullanıcısına bildirim gönderiliyor (${email})...`);
    
    try {
      await sendPaymentNotification(email, userPayments, categoryNames, categoryEmojis);
      console.log(`${email} adresine bildirim gönderildi.`);
    } catch (error) {
      console.error(`${email} adresine bildirim gönderilirken hata:`, error);
    }
  }
}

// E-posta bildirimi gönderen fonksiyon
async function sendPaymentNotification(email, payments, categoryNames, categoryEmojis) {
  // Sadece EXPENSE tipindeki ödemeleri filtrele
  const expensePayments = payments.filter(payment => payment.type === 'expense');
  
  // Eğer gösterilecek gider yoksa, e-posta gönderme
  if (expensePayments.length === 0) {
    console.log(`${email} için yarınki gider bulunamadı, e-posta gönderilmiyor.`);
    return;
  }

  // Toplam ödeme tutarını hesapla
  const totalAmount = expensePayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toFixed(2);
  
  // Kategori bazında ödemeleri grupla
  const expensesByCategory = expensePayments.reduce((acc, payment) => {
    const categoryName = getCategoryNameById(payment.category_id, categoryNames);
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(payment);
    return acc;
  }, {});

  // E-posta içeriği
  let emailContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Bakiye360 - Yarınki Ödemeleriniz</title>
    <style>
      /* E-posta istemcileri için temel reset */
      body, div, dl, dt, dd, ul, ol, li, h1, h2, h3, h4, h5, h6, pre, form, fieldset, input, p, blockquote, table, th, td, embed, object {
        margin: 0;
        padding: 0;
      }
      /* E-posta istemcileri desteklemeyen CSS özelliklerini görmezden gelir */
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9; color: #333; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      .header { text-align: center; padding: 10px 0 20px; }
      .logo { height: 60px; margin-bottom: 10px; }
      h1 { color: #2557a7; font-size: 24px; margin-bottom: 20px; }
      .date-banner { background-color: #f2f7ff; padding: 10px; border-radius: 6px; margin-bottom: 20px; text-align: center; font-weight: bold; color: #2557a7; }
      .message { margin-bottom: 20px; line-height: 1.5; }
      .payment-list { margin-bottom: 20px; }
      .category-section { margin-bottom: 15px; }
      .category-header { display: flex; align-items: center; background-color: #f2f7ff; padding: 10px; border-radius: 6px; margin-bottom: 10px; }
      .category-emoji { font-size: 20px; margin-right: 10px; }
      .category-name { font-weight: bold; color: #2557a7; }
      .payment-item { padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
      .payment-item:last-child { border-bottom: none; }
      .payment-details { flex: 1; }
      .payment-title { font-weight: bold; margin-bottom: 5px; }
      .payment-date { color: #6c757d; font-size: 0.9em; }
      .payment-amount { font-weight: bold; color: #e63946; white-space: nowrap; }
      .total-section { background-color: #f8f9fa; padding: 15px; border-radius: 6px; text-align: right; margin-bottom: 20px; }
      .total-amount { font-size: 1.2em; font-weight: bold; color: #e63946; }
      .button-container { text-align: center; margin: 30px 0; }
      .button { display: inline-block; background-color: #2557a7; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; }
      .button:hover { background-color: #1c4585; }
      .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #6c757d; font-size: 0.9em; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Bakiye360 Logo" style="height: 60px; margin-bottom: 10px; border: 0; display: inline-block;">
      </div>
      
      <h1>Yarınki Ödemeleriniz</h1>
      
      <div class="date-banner">
        ${format(parseISO(expensePayments[0].date), 'd MMMM yyyy - EEEE', { locale: tr })}
      </div>
      
      <div class="message">
        <p>Merhaba,</p>
        <p>Yarın için planlanmış <strong>${expensePayments.length} adet ödemeniz</strong> bulunmaktadır. Aşağıda ödeme detaylarınızı görebilirsiniz:</p>
      </div>

      <div class="payment-list">`;

  // Kategori bazında ödemeleri listele
  for (const category in expensesByCategory) {
    const categoryPayments = expensesByCategory[category];
    const emoji = categoryEmojis[categoryPayments[0].category_id] || '📊';

    emailContent += `
        <div class="category-section">
          <div class="category-header">
            <span class="category-emoji">${emoji}</span>
            <span class="category-name">${category}</span>
          </div>`;

    categoryPayments.forEach(payment => {
      emailContent += `
          <div class="payment-item">
            <div class="payment-details">
              <div class="payment-title">${payment.description}</div>
              <div class="payment-date">İşlem Tarihi: ${format(parseISO(payment.date), 'd MMMM yyyy', { locale: tr })}</div>
            </div>
            <div class="payment-amount">${parseFloat(payment.amount).toLocaleString('tr-TR')} TL</div>
          </div>`;
    });

    emailContent += `
        </div>`;
  }

  emailContent += `
      </div>
      
      <div class="total-section">
        Toplam Ödenecek Tutar: <span class="total-amount">${parseFloat(totalAmount).toLocaleString('tr-TR')} TL</span>
      </div>
      
      <div class="button-container">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transactions" 
           style="display: inline-block; background-color: #2557a7; color: #ffffff; font-weight: bold; font-size: 16px; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          ▶ ÖDEMELERİMİ GÖRÜNTÜLE
        </a>
      </div>
      
      <div class="footer">
        <p>Bu e-posta Bakiye360 otomatik bildirim sistemi tarafından gönderilmiştir.</p>
        <p>© ${new Date().getFullYear()} Bakiye360. Tüm hakları saklıdır.</p>
      </div>
    </div>
  </body>
  </html>`;

  // E-postayı gönder
  const info = await transporter.sendMail({
    from: `"Bakiye360" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Yarın İçin ${expensePayments.length} Ödemeniz Var - Bakiye360`,
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
    const paymentsData = await getUpcomingPayments();
    const { payments, categoryNames, categoryEmojis } = paymentsData;
    
    console.log(`Toplam ${payments.length} adet yaklaşan işlem bulundu.`);
    
    if (payments.length === 0) {
      console.log('Yarın için planlanmış işlem bulunamadı.');
      return;
    }
    
    // Bildirimleri gönder
    await sendNotifications({ payments, categoryNames, categoryEmojis });
    console.log('Tüm bildirimler başarıyla gönderildi.');
  } catch (error) {
    console.error('Bildirim gönderme işlemi sırasında hata:', error);
    process.exit(1);
  }
}

// Scripti çalıştır
main(); 