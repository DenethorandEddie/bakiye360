# Bakiye360 Stripe Abonelik Sistemi Kılavuzu

Bu kılavuz, Bakiye360 uygulamasının Stripe ile entegre abonelik sisteminin kurulumu, yönetimi ve sorun giderme süreçlerini açıklar.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kurulum](#kurulum)
3. [Webhook Entegrasyonu](#webhook-entegrasyonu)
4. [Kullanıcı Deneyimi](#kullanıcı-deneyimi)
5. [Test Etme](#test-etme)
6. [Güvenlik ve Uyumluluk](#güvenlik-ve-uyumluluk)
7. [Sorun Giderme](#sorun-giderme)
8. [API Referansı](#api-referansı)

## Genel Bakış

Bakiye360 abonelik sistemi, kullanıcılara premium özelliklere erişim sağlar. Sistem, Stripe ödeme işlemcisi kullanılarak aylık abonelik modeli üzerine kurulmuştur. Bu entegrasyon şunları içerir:

- Kullanıcı kaydı ve doğrulama
- Abonelik oluşturma ve yönetme
- Otomatik yenileme
- Fatura oluşturma ve indirme
- Abonelik iptal etme ve yeniden aktifleştirme

## Kurulum

### Gereksinimler

- Node.js (v16+)
- PostgreSQL (Supabase)
- Stripe Hesabı

### Ortam Değişkenleri

`.env` dosyasında aşağıdaki ayarları yapılandırın:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://bakiye360.com
```

### Veritabanı Tabloları

Gerekli tabloları oluşturmak için:

```bash
node scripts/create-db-tables.js
```

Bu script aşağıdaki tabloları oluşturur:

- `user_settings`: Kullanıcı tercihleri ve abonelik durumu
- `subscriptions`: Abonelik kayıtları
- `notifications`: Kullanıcı bildirimleri
- `api_logs`: API çağrıları için güvenlik logları

## Webhook Entegrasyonu

### Webhook Ayarları

Stripe Dashboard'da (https://dashboard.stripe.com/webhooks) bir webhook oluşturun:

1. **Endpoint URL**: `https://bakiye360.com/api/webhook`
2. **Events to listen**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

### Webhook Güvenliği

Webhook imzalama, webhook gizli anahtarınız kullanılarak tüm istekleri doğrular. Bu, istemci tarafından gönderilen isteklerin Stripe'dan geldiğini ve değiştirilmediğini garanti eder.

```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
);
```

## Kullanıcı Deneyimi

### Abonelik Sayfası

Abonelik sayfası (`/dashboard/subscription`) aşağıdaki özellikleri içerir:

- Ücretsiz ve premium paket karşılaştırması
- Mevcut abonelik durumu gösterimi
- Premium'a yükseltme butonu
- Abonelik iptal etme ve yenileme
- Fatura geçmişi ve indirme

### Kullanıcı Bilgilendirme

- Sistem, abonelik durumu değiştiğinde otomatik olarak bildirimler gönderir
- Abonelik yenilendiğinde, iptal edildiğinde veya ödeme başarısız olduğunda e-posta bildirimlerini yapılandırabilirsiniz

## Test Etme

### Test Kartları

Stripe test ortamında aşağıdaki kartları kullanabilirsiniz:

- **Başarılı Ödeme**: `4242 4242 4242 4242`
- **Doğrulama Başarısız**: `4000 0000 0000 0101`
- **Yetersiz Bakiye**: `4000 0000 0000 9995`

### Test Scripti

Abonelik olaylarını test etmek için test script'ini kullanabilirsiniz:

```bash
# Başarılı abonelik testi
node scripts/test-subscription.js checkout [user-id]

# Abonelik iptali testi
node scripts/test-subscription.js cancel [user-id]

# Ödeme başarısız testi
node scripts/test-subscription.js fail [user-id]
```

## Güvenlik ve Uyumluluk

### API Güvenliği

Tüm Stripe API çağrıları, `app/api/security-policy.ts` içindeki güvenlik politikaları kullanılarak korunur:

- Rate limiting
- IP maskeleme (KVKK uyumu)
- Kimlik doğrulama
- Güvenlik başlıkları
- İşlem loglama

### KVKK / GDPR Uyumluluğu

- Kullanıcı verileri, kişisel bilgileri en aza indirilerek işlenir
- Ödeme bilgileri Stripe tarafında saklanır, uygulama yalnızca referansları kullanır
- Veri silme işlemleri, kullanıcı talebi üzerine tam olarak uygulanır

## Sorun Giderme

### Yaygın Sorunlar

1. **Webhook Olayları Alınmıyor**
   - Webhook URL'nin doğru olduğunu kontrol edin
   - Webhook secret'ın doğru şekilde ayarlandığını doğrulayın
   - Stripe Dashboard'dan webhook event loglarını inceleyin

2. **Abonelik Durumu Güncellenmiyor**
   - `user_settings` tablosunda ilgili kullanıcının kaydının var olduğundan emin olun
   - Webhook event'inde userId'nin doğru gönderildiğini kontrol edin

3. **Abonelik İptali Çalışmıyor**
   - Stripe Dashboard'dan aboneliğin durumunu kontrol edin
   - RPC fonksiyonunun doğru şekilde çalıştığını doğrulayın

### Abonelik Durumunu Manuel Güncelleme

Acil durumlarda abonelik durumunu manuel olarak güncellemek için:

```bash
node scripts/update-user-subscription.js [userId] premium [stripe_subscription_id] [stripe_customer_id]
```

## API Referansı

### `/api/webhook`

Stripe'dan gelen webhook olaylarını işler.

### `/api/invoices`

Kullanıcının fatura geçmişini getirir.

### `/api/reactivate-subscription`

İptal edilmiş bir aboneliği yeniden aktifleştirir.

### `/api/create-checkout-session`

Yeni bir abonelik ödemesi için Stripe Checkout oturumu oluşturur.

### `/api/cancel-subscription`

Mevcut bir aboneliği iptal eder.

---

Bu dokümantasyon, Bakiye360 Stripe entegrasyonunun güncel bir özetidir. Sorunlarınız veya sorularınız için: destek@bakiye360.com 