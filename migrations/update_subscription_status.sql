-- Fonksiyon tanımı: Kullanıcının abonelik durumunu günceller
CREATE OR REPLACE FUNCTION update_user_subscription_status(
  p_user_id UUID,
  p_status TEXT,
  p_stripe_subscription_id TEXT DEFAULT NULL,
  p_stripe_customer_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Bu önemli, fonksiyonu yüksek izinlerle çalıştırır
AS $$
DECLARE
  v_exists BOOLEAN;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Kullanıcı ayarları var mı kontrol et
  SELECT EXISTS (
    SELECT 1 FROM user_settings 
    WHERE user_id = p_user_id
  ) INTO v_exists;
  
  -- Durum kontrolü
  IF p_status NOT IN ('premium', 'free') THEN
    RAISE EXCEPTION 'Geçersiz abonelik durumu. Kabul edilen değerler: premium, free';
  END IF;
  
  -- Eğer kayıt varsa güncelle
  IF v_exists THEN
    UPDATE user_settings
    SET 
      subscription_status = p_status,
      updated_at = v_now,
      stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
      stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id)
    WHERE user_id = p_user_id;
  ELSE
    -- Kayıt yoksa oluştur
    INSERT INTO user_settings (
      user_id,
      subscription_status,
      stripe_subscription_id,
      stripe_customer_id,
      email_notifications,
      budget_alerts,
      monthly_reports,
      app_preferences,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_status,
      p_stripe_subscription_id,
      p_stripe_customer_id,
      TRUE, -- email_notifications
      TRUE, -- budget_alerts
      TRUE, -- monthly_reports
      '{"currency": "TRY", "language": "tr"}', -- app_preferences
      v_now,
      v_now
    );
  END IF;
  
  -- Bildirim ekle
  INSERT INTO notifications (
    user_id,
    title,
    content,
    read,
    created_at,
    link
  ) VALUES (
    p_user_id,
    CASE 
      WHEN p_status = 'premium' THEN 'Premium Aboneliğiniz Aktif' 
      ELSE 'Abonelik Durumunuz Güncellendi' 
    END,
    CASE 
      WHEN p_status = 'premium' THEN 'Premium aboneliğiniz başarıyla aktif edildi. Tüm premium özelliklere erişebilirsiniz.'
      ELSE 'Abonelik durumunuz güncellendi. Şu anda ücretsiz sürümü kullanıyorsunuz.'
    END,
    FALSE,
    v_now,
    '/dashboard/subscription'
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Abonelik durumu güncellenirken hata: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Abonelik durumunu premium'a çeviren fonksiyon
CREATE OR REPLACE FUNCTION set_user_premium(
  p_user_id UUID,
  p_stripe_subscription_id TEXT DEFAULT NULL,
  p_stripe_customer_id TEXT DEFAULT NULL
) 
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN update_user_subscription_status(p_user_id, 'premium', p_stripe_subscription_id, p_stripe_customer_id);
END;
$$;

-- Abonelik durumunu free'ye çeviren fonksiyon
CREATE OR REPLACE FUNCTION set_user_free(
  p_user_id UUID
) 
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN update_user_subscription_status(p_user_id, 'free');
END;
$$;

-- Aboneliği kontrol et ve gerekirse güncelle
CREATE OR REPLACE FUNCTION check_subscription_expiry() 
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Eğer eklenen/güncellenen abonelik active değilse ve süresi dolmuşsa
  IF (NEW.status <> 'active' AND NEW.current_period_end < NOW()) THEN
    -- Kullanıcıyı free yap
    PERFORM update_user_subscription_status(NEW.user_id, 'free');
  -- Eğer eklenen/güncellenen abonelik active ise
  ELSIF (NEW.status = 'active') THEN
    -- Kullanıcıyı premium yap
    PERFORM update_user_subscription_status(
      NEW.user_id, 
      'premium', 
      NEW.stripe_subscription_id, 
      NEW.stripe_customer_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Subscription tablosundaki değişiklikleri izleyen trigger
DROP TRIGGER IF EXISTS after_subscription_change ON subscriptions;
CREATE TRIGGER after_subscription_change
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_expiry(); 