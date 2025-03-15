# Bakiye360 Stripe Webhook Entegrasyonu

Bu belge, Bakiye360 uygulamasında Stripe webhook'larının nasıl çalıştığını ve sorun giderme yöntemlerini açıklar.

## Genel Bakış

Webhook'lar, Stripe'tan uygulamamıza gelen gerçek zamanlı olaylardır. Örneğin, bir kullanıcı bir abonelik satın aldığında, Stripe bize bir `checkout.session.completed` olayı gönderir ve biz de kullanıcının premium durumunu güncelleriz.

## Stripe Webhook URL

```
https://bakiye360.com/api/webhook
```

## İzlenen Olaylar

Stripe Dashboard'da aşağıdaki olayları dinlemek için webhook'u yapılandırın:

- `checkout.session.completed`: Ödeme tamamlandığında
- `customer.subscription.updated`: Abonelik güncellendiğinde
- `customer.subscription.deleted`: Abonelik iptal edildiğinde
- `invoice.payment_failed`: Fatura ödemesi başarısız olduğunda

## Webhook İşlem Süreci

1. Stripe olayı webhook URL'mize gönderir
2. İmzayı doğrularız (STRIPE_WEBHOOK_SECRET kullanarak)
3. Olay tipine göre işlem yaparız
4. user_settings, subscriptions ve notifications tablolarını güncelleriz

## Webhook Sorun Giderme

### Bekleyen (Pending) Webhook'lar

Eğer webhook'lar "Pending" durumunda kalıyorsa:

1. Sunucu yanıt veriyor mu kontrol edin (uygulama çalışıyor mu?)
2. Webhook handler'ın 2 saniye içinde yanıt vermesi gerekir, uzun işlemler için erken yanıt verip arka planda işlem yapın
3. Sunucu loglarını kontrol edin

### Başarısız (Failed) Webhook'lar

Başarısız webhook'lar için:

1. Stripe Dashboard'daki hata mesajını kontrol edin
2. Sunucu loglarında hata ayrıntılarını arayın
3. Gerekli veritabanı tablolarının mevcut olduğundan emin olun
4. STRIPE_WEBHOOK_SECRET değerinizin doğru olduğunu onaylayın

## Supabase Veritabanı Kurulumu

Stripe webhook'ları düzgün çalışması için aşağıdaki Supabase tablolarının oluşturulması gerekir:

1. `user_settings`: Kullanıcı abonelik durumunu ve tercihlerini saklar
2. `subscriptions`: Abonelik ayrıntılarını saklar
3. `notifications`: Kullanıcılara gönderilen bildirimleri saklar

Bu tabloları oluşturmak için `scripts/subscription-tables.sql` dosyasını Supabase SQL Editör'ünde çalıştırın.

## Webhook İmza Doğrulama

Stripe, webhook'ların gerçekten Stripe'tan geldiğinden emin olmak için her isteği imzalar. Doğrulama, `STRIPE_WEBHOOK_SECRET` anahtarı ile yapılır.

`.env` dosyanızda bu değerin doğru olduğundan emin olun:

```
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
```

Bu değeri Stripe Dashboard > Developers > Webhooks > Endpoint details > Signing secret bölümünden alabilirsiniz.

## Webhook Olayları ve İşlemleri

### checkout.session.completed

Bu olay, kullanıcı başarılı bir ödeme yaptığında tetiklenir.

İşlem:
1. Kullanıcı ID'sini metadata veya client_reference_id'den alın
2. Stripe'tan abonelik detaylarını alın
3. user_settings tablosunu güncelleyin (subscription_status = premium)
4. subscriptions tablosuna yeni kayıt ekleyin
5. notifications tablosuna bildirim ekleyin

### customer.subscription.updated

Bu olay, abonelik güncellendiğinde tetiklenir (örn. yenilendi, ödeme yöntemi değişti).

İşlem:
1. Abonelik ID ile kullanıcıyı bulun
2. Abonelik durumunu kontrol edin
3. Gerekirse user_settings tablosunu güncelleyin
4. subscriptions tablosunu güncelleyin

### customer.subscription.deleted

Bu olay, abonelik iptal edildiğinde tetiklenir.

İşlem:
1. Abonelik ID ile kullanıcıyı bulun
2. Dönem sonu kontrolü yapın (dönem bitmemişse premium kalır)
3. Dönem bittiyse subscription_status'u free yapın
4. subscriptions tablosunu güncelleyin
5. Bildirim ekleyin

### invoice.payment_failed

Bu olay, yenileme ödemesi başarısız olduğunda tetiklenir.

İşlem:
1. Abonelik ID ile kullanıcıyı bulun
2. Abonelik durumunu kontrol edin
3. Gerekirse subscription_status'u free yapın

## Test Etme

Webhook'ları test etmek için:

1. Stripe CLI kullanabilirsiniz: `stripe listen --forward-to localhost:3000/api/webhook`
2. Test bir ödeme yapın: `stripe trigger checkout.session.completed`
3. Veritabanı tablolarını kontrol edin

## Canlı Ortamda İzleme

Canlı ortamda webhook olaylarını izlemek için:

1. Stripe Dashboard > Developers > Webhooks > bölümüne gidin
2. Recent events'i kontrol edin
3. Başarısız webhook'lar için "View logs"a tıklayın

## Sık Karşılaşılan Sorunlar ve Çözümleri

1. **Webhook Olayları "Pending" Durumunda Kalıyor**
   - Sorun: Sunucu, webhook isteğine yanıt vermiyor veya 2 saniyeden uzun sürüyor.
   - Çözüm: POST işleyicisinde işlemlerin asenkron yapıldığından ve erken yanıt döndüğünden emin olun.

2. **"No such table" Hatası**
   - Sorun: Gerekli veritabanı tabloları oluşturulmamış.
   - Çözüm: `scripts/subscription-tables.sql` betiğini Supabase SQL Editör'ünde çalıştırın.

3. **İmza Doğrulama Hatası**
   - Sorun: STRIPE_WEBHOOK_SECRET yanlış veya eksik.
   - Çözüm: Stripe Dashboard'dan doğru değeri alın ve .env dosyasını güncelleyin.

4. **userId Bulunamadı Hatası**
   - Sorun: Checkout session metadata veya client_reference_id içinde userId yok.
   - Çözüm: Checkout session oluştururken metadata olarak userId'yi doğru şekilde gönderdiğinizden emin olun.

## Geliştirici Rehberi

Webhook işleyiciyi (`app/api/webhook/route.ts`) değiştirirken şu hususlara dikkat edin:

1. Event imza doğrulamasını asla kaldırmayın
2. Uzun sürecek işlemleri asenkron yapın
3. Veritabanı hatalarını düzgün şekilde yakalayın ve günlüğe kaydedin
4. Test ederken Stripe CLI kullanın

## Bakiye360 Webhook Mimarisi

```
+---------------+           +-------------------+           +-----------------+
|               |  Olaylar  |                   |  Güncel.  |                 |
|    Stripe     +---------->+  /api/webhook    +---------->+    Supabase     |
|               |           |                   |           |                 |
+---------------+           +-------------------+           +-----------------+
                                     |
                                     | Bildirim
                                     v
                            +-------------------+
                            |                   |
                            |     Kullanıcı     |
                            |                   |
                            +-------------------+
```

## Yardım ve Destek

Daha fazla yardıma ihtiyacınız varsa:
- Stripe Webhook dokümantasyonu: https://stripe.com/docs/webhooks
- Supabase dokümantasyonu: https://supabase.com/docs
- Bakiye360 geliştiricileri: support@bakiye360.com 