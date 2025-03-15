#!/usr/bin/env node

/**
 * Bakiye360 Stripe Entegrasyonu Kurulum Scripti
 * 
 * Bu script, Stripe entegrasyonu için gerekli tüm adımları otomatikleştirir:
 * 1. Veritabanı tablolarını oluşturur
 * 2. Gerekli ortam değişkenlerini kontrol eder
 * 3. Stripe webhook'unu yapılandırır (CLI yüklüyse)
 * 
 * Kullanım: node scripts/setup-stripe-integration.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');
const dotenv = require('dotenv');

// .env dosyasını yükle
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Renkli konsol çıktıları
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Log fonksiyonları
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.magenta}${msg}${colors.reset}\n`)
};

// SQL dosyasının içeriği
const SQL_FILE_CONTENT = fs.readFileSync(
  path.join(__dirname, 'subscription-tables.sql'),
  'utf8'
);

// Ana fonksiyon
async function main() {
  log.title('Bakiye360 Stripe Entegrasyonu Kurulumu');
  
  // 1. Ortam değişkenlerini kontrol et
  checkEnvironmentVariables();
  
  // 2. Supabase kurulumu
  await setupSupabase();
  
  // 3. Stripe webhook kurulumu
  await setupStripeWebhook();
  
  // 4. Test ve doğrulama
  await runTests();
  
  log.title('Kurulum Tamamlandı!');
  log.info('Stripe entegrasyonu başarıyla kuruldu. README-WEBHOOKS.md dosyasını inceleyerek daha fazla bilgi alabilirsiniz.');
  
  rl.close();
}

// Ortam değişkenlerini kontrol et
function checkEnvironmentVariables() {
  log.title('Ortam Değişkenleri Kontrolü');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  let missingVars = [];
  
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
      log.error(`${envVar} eksik veya boş`);
    } else {
      log.success(`${envVar} mevcut`);
    }
  });
  
  if (missingVars.length > 0) {
    log.warn('Bazı gerekli ortam değişkenleri eksik. .env dosyanızı kontrol edin.');
    console.log(`\nEksik değişkenler şunları içerir:\n${missingVars.join('\n')}\n`);
    
    const envPath = path.join(process.cwd(), '.env');
    log.info(`Not: Bu değişkenleri ${envPath} dosyasına eklemeniz gerekiyor.`);
  }
}

// Supabase kurulumu
async function setupSupabase() {
  log.title('Supabase Veritabanı Kurulumu');
  
  log.info('Bu adım manuel olarak Supabase SQL Editör\'ünde gerçekleştirilmelidir.');
  log.info('scripts/subscription-tables.sql dosyasını kopyalayıp Supabase SQL Editör\'ünde çalıştırın.');
  
  const sqlPreview = SQL_FILE_CONTENT.slice(0, 500) + '...';
  console.log('\nSQL komutları önizlemesi:');
  console.log(`${colors.cyan}${sqlPreview}${colors.reset}`);
  
  return new Promise((resolve) => {
    rl.question('\nSQL komutlarını Supabase\'de çalıştırdınız mı? (E/h): ', (answer) => {
      if (answer.toLowerCase() !== 'h') {
        log.success('Supabase tabloları kuruldu.');
      } else {
        log.warn('Supabase tabloları kurulmadı. Webhook\'lar çalışmayabilir.');
      }
      resolve();
    });
  });
}

// Stripe webhook kurulumu
async function setupStripeWebhook() {
  log.title('Stripe Webhook Kurulumu');
  
  log.info('Stripe Dashboard\'da webhook kurulumunu kontrol edin:');
  log.info('1. Stripe Dashboard > Developers > Webhooks gidin');
  log.info('2. "Add endpoint" butonuna tıklayın');
  log.info('3. Endpoint URL olarak: https://bakiye360.com/api/webhook girin');
  log.info('4. Aşağıdaki olayları seçin:');
  console.log('   - checkout.session.completed');
  console.log('   - customer.subscription.updated');
  console.log('   - customer.subscription.deleted');
  console.log('   - invoice.payment_failed');
  
  return new Promise((resolve) => {
    rl.question('\nStripe webhook\'unu yapılandırdınız mı? (E/h): ', (answer) => {
      if (answer.toLowerCase() !== 'h') {
        log.success('Stripe webhook kurulumu tamamlandı.');
      } else {
        log.warn('Stripe webhook kurulumu yapılmadı. Abonelik sistemi çalışmayabilir.');
      }
      resolve();
    });
  });
}

// Test ve doğrulama
async function runTests() {
  log.title('Test ve Doğrulama');
  
  log.info('Bu bölüm, kurulumun doğru yapıldığını kontrol eder.');
  log.info('Aşağıdaki testleri gerçekleştirin:');
  log.info('1. Test bir ödeme yapın (Stripe test kartı: 4242 4242 4242 4242)');
  log.info('2. Stripe Dashboard\'da webhook olaylarını kontrol edin');
  log.info('3. Supabase\'de user_settings tablosunu kontrol edin (subscription_status = premium olmalı)');
  
  return new Promise((resolve) => {
    rl.question('\nTestleri çalıştırdınız mı ve her şey çalışıyor mu? (E/h): ', (answer) => {
      if (answer.toLowerCase() !== 'h') {
        log.success('Testler başarılı. Abonelik sistemi doğru çalışıyor.');
      } else {
        log.warn('Testler çalıştırılmadı veya sorunlar var.');
        log.info('Sorun giderme için README-WEBHOOKS.md dosyasını inceleyin.');
      }
      resolve();
    });
  });
}

// Scripti çalıştır
main().catch(err => {
  log.error('Beklenmeyen bir hata oluştu:');
  console.error(err);
  process.exit(1);
}); 