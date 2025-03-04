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