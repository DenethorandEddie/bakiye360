-- Bakiye360 Stripe Webhook Tabloları
-- Bu script, Stripe webhooks'un ihtiyaç duyduğu tüm tabloları oluşturur

-- Eğer varsa önceki tabloları temizle (isteğe bağlı, dikkatli kullanın)
-- DROP TABLE IF EXISTS "notifications";
-- DROP TABLE IF EXISTS "subscriptions";
-- DROP TABLE IF EXISTS "user_settings";

-- Kullanıcı Ayarları Tablosu
CREATE TABLE IF NOT EXISTS "user_settings" (
  "id" SERIAL PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "subscription_status" TEXT NOT NULL DEFAULT 'free' CHECK ("subscription_status" IN ('free', 'premium')),
  "stripe_customer_id" TEXT,
  "stripe_subscription_id" TEXT,
  "subscription_period_start" TIMESTAMP WITH TIME ZONE,
  "subscription_period_end" TIMESTAMP WITH TIME ZONE,
  "subscription_start" TIMESTAMP WITH TIME ZONE,
  "app_preferences" JSONB DEFAULT '{"currency": "TRY", "language": "tr"}',
  "email_notifications" BOOLEAN DEFAULT false,
  "app_notifications" BOOLEAN DEFAULT true,
  "budget_alerts" BOOLEAN DEFAULT false,
  "monthly_reports" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE ("user_id")
);

-- Abonelikler Tablosu
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "stripe_customer_id" TEXT NOT NULL,
  "stripe_subscription_id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "plan" TEXT NOT NULL DEFAULT 'premium',
  "cancel_at_period_end" BOOLEAN DEFAULT false,
  "current_period_start" TIMESTAMP WITH TIME ZONE,
  "current_period_end" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE ("stripe_subscription_id")
);

-- Bildirimler Tablosu
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" SERIAL PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'general',
  "link" TEXT,
  "read" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Abone durumu güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_user_subscription_status(
  p_user_id UUID,
  p_status TEXT DEFAULT 'free',
  p_stripe_subscription_id TEXT DEFAULT NULL,
  p_stripe_customer_id TEXT DEFAULT NULL,
  p_subscription_period_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_subscription_period_end TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_settings RECORD;
  v_notification_title TEXT;
  v_notification_content TEXT;
BEGIN
  -- Kullanıcının varlığını kontrol et
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Kullanıcı bulunamadı: %', p_user_id;
  END IF;
  
  -- Abonelik durumunu doğrula
  IF p_status NOT IN ('free', 'premium') THEN
    RAISE EXCEPTION 'Geçersiz abonelik durumu: %', p_status;
  END IF;
  
  -- Mevcut kullanıcı ayarlarını kontrol et
  SELECT * FROM user_settings WHERE user_id = p_user_id INTO v_existing_settings;
  
  -- Eğer kayıt varsa güncelle, yoksa yeni kayıt oluştur
  IF v_existing_settings.id IS NULL THEN
    -- Yeni kayıt oluştur
    INSERT INTO user_settings (
      user_id,
      subscription_status,
      stripe_subscription_id,
      stripe_customer_id,
      subscription_period_start,
      subscription_period_end,
      updated_at
    ) VALUES (
      p_user_id,
      p_status,
      p_stripe_subscription_id,
      p_stripe_customer_id,
      p_subscription_period_start,
      p_subscription_period_end,
      NOW()
    );
  ELSE
    -- Mevcut kaydı güncelle
    UPDATE user_settings SET
      subscription_status = p_status,
      updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Eğer stripe bilgileri verilmişse onları da güncelle
    IF p_stripe_subscription_id IS NOT NULL THEN
      UPDATE user_settings SET
        stripe_subscription_id = p_stripe_subscription_id
      WHERE user_id = p_user_id;
    END IF;
    
    IF p_stripe_customer_id IS NOT NULL THEN
      UPDATE user_settings SET
        stripe_customer_id = p_stripe_customer_id
      WHERE user_id = p_user_id;
    END IF;
    
    -- Eğer dönem tarihleri verilmişse onları da güncelle
    IF p_subscription_period_start IS NOT NULL THEN
      UPDATE user_settings SET
        subscription_period_start = p_subscription_period_start
      WHERE user_id = p_user_id;
    END IF;
    
    IF p_subscription_period_end IS NOT NULL THEN
      UPDATE user_settings SET
        subscription_period_end = p_subscription_period_end
      WHERE user_id = p_user_id;
    END IF;
    
    -- Premium'a geçiş yapılıyorsa bildirim ayarlarını aç
    IF p_status = 'premium' AND v_existing_settings.subscription_status = 'free' THEN
      UPDATE user_settings SET
        email_notifications = true,
        budget_alerts = true,
        monthly_reports = true
      WHERE user_id = p_user_id;
    END IF;
  END IF;
  
  -- Abonelik durum değişikliği bildirimi oluştur
  IF p_status = 'premium' THEN
    v_notification_title := 'Premium Aboneliğiniz Aktif';
    v_notification_content := 'Premium aboneliğiniz başarıyla aktif edildi. Tüm premium özelliklere erişebilirsiniz.';
  ELSE
    v_notification_title := 'Premium Aboneliğiniz Sona Erdi';
    v_notification_content := 'Premium aboneliğinizin süresi doldu. Premium özelliklere erişiminiz kısıtlandı.';
  END IF;
  
  -- Bildirim ekle
  INSERT INTO notifications (
    user_id,
    title,
    content,
    type,
    link,
    read,
    created_at
  ) VALUES (
    p_user_id,
    v_notification_title,
    v_notification_content,
    'subscription',
    '/dashboard/subscription',
    false,
    NOW()
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Abonelik durumu güncellenirken hata: %', SQLERRM;
    RETURN false;
END;
$$;

-- RLS (Row Level Security) kuralları
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Kullanıcıların sadece kendi verilerini görmesini sağlayan politikalar
CREATE POLICY "Kullanıcılar kendi ayarlarını görebilir" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi aboneliklerini görebilir" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi bildirimlerini görebilir" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi bildirimlerini güncelleyebilir" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- İndexler
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Veritabanı tetikleyicileri

-- Kullanıcı oluşturulduğunda otomatik ayarlar oluştur
CREATE OR REPLACE FUNCTION create_user_settings_on_user_create()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcı silme tetikleyicisi
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_settings_on_user_create(); 