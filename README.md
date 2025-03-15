# Bakiye360 - Kişisel Bütçe ve Harcama Yönetimi

## Otomatik Bildirim Sistemi

Bakiye360, GitHub Actions kullanarak günlük otomatik bildirim sistemi içerir. Bu sistem her gün belirli bir saatte çalışarak (Türkiye saati 21:15) kullanıcılara yaklaşan ödemeleri hakkında e-posta bildirimleri gönderir.

### GitHub Actions Bildirimleri Nasıl Çalışır?

1. `.github/workflows/daily-notifications.yml` dosyası, otomatik bildirim zamanlamasını tanımlar
2. Sistem her gün otomatik olarak çalışarak `https://[APP_URL]/api/cron/send-notifications` adresini çağırır
3. API'ye güvenli erişim için `x-api-key` başlığı kullanılır
4. Bildirim servisi, tüm kullanıcılar için yarınki ödemeleri kontrol eder
5. Sadece yaklaşan ödemesi olan kullanıcılara bildirim e-postası gönderilir

### Kurulum Gereksinimleri

GitHub deposunuza aşağıdaki secret'ları eklemeniz gerekiyor:

- `APP_URL`: Uygulamanızın çalıştığı URL (ör. `https://bakiye360.vercel.app`)
- `CRON_API_KEY`: `.env` dosyanızda tanımladığınız `CRON_API_KEY` değeri

### GitHub Secrets Nasıl Eklenir?

1. GitHub'da projenizin sayfasına gidin
2. "Settings" sekmesine tıklayın
3. Soldaki menüden "Secrets and variables" > "Actions" seçeneğine tıklayın
4. "New repository secret" butonuna tıklayın
5. İstenilen bilgileri ekleyin:
   - İsim: `APP_URL`, Değer: `https://bakiye360.vercel.app`
   - İsim: `CRON_API_KEY`, Değer: `.env` dosyasındaki API anahtarı

### Manuel Test

Bildirimleri manuel olarak test etmek için:

1. GitHub'da projenizin sayfasına gidin
2. "Actions" sekmesine tıklayın
3. Sol menüden "Günlük Ödeme Bildirimleri" workflow'unu seçin
4. "Run workflow" butonuna tıklayın
5. "Run workflow" butonunu onaylayın

Bu işlem, beklemeden anında bildirimleri test etmenizi sağlar.

# Bakiye360 - Finansal Yönetim Uygulaması

Bakiye360, kişisel finans yönetimi ve bütçe takibi için geliştirilmiş modern bir web uygulamasıdır.

## Abonelik Sistemini Ayarlama

Abonelik sistemi için Stripe ve gerekli veritabanı tablolarının kurulması gerekmektedir.

### Veritabanı Tabloları

Aşağıdaki tablolar gereklidir:

1. **user_settings**
2. **subscriptions**
3. **notifications**

Bu tabloları oluşturmak için:

```bash
npm run setup-db
```

Bu komut size gerekli SQL kodlarını gösterecektir. Bu SQL kodlarını Supabase Studio'da çalıştırmanız gerekmektedir.

### Stripe Webhook Ayarları

1. Stripe Dashboard'da bir webhook oluşturun:
   - URL: `https://yourdomain.com/api/webhook`
   - Events: 
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`

2. Webhook oluşturulduğunda verilen gizli anahtarını `.env` dosyasına ekleyin:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Çevre Değişkenleri

`.env` dosyasında aşağıdaki değişkenleri ayarlayın:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Abonelik Sistemi Sorun Giderme

Eğer kullanıcılar ödeme yaptıktan sonra premium özelliklere erişemiyorsa, şu adımları izleyin:

1. Supabase veritabanında gerekli tabloların (`user_settings`, `subscriptions`, `notifications`) ve RPC fonksiyonlarının (`update_user_subscription_status`) kurulu olduğundan emin olun.

2. Stripe webhook ayarlarının doğru olduğunu ve webhook olaylarının doğru URL'ye gönderildiğini kontrol edin.

3. Çevre değişkenlerinin doğru ayarlandığından emin olun.

4. Uygulamadaki "Abonelik Sorun Giderme" panelini kullanarak kullanıcı abonelik durumunu manuel olarak güncelleyin.

## Geliştirme

```bash
npm run dev
```

## Dağıtım

```bash
npm run build
npm run start
```

## Lisans

Bu proje özel lisans altında dağıtılmaktadır. Tüm hakları saklıdır.

## İletişim

Sorularınız için: support@bakiye360.com 