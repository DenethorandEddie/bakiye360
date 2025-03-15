-- Abonelik Sistemi Tabloları ve Fonksiyonları
-- Bu SQL dosyasını Supabase Studio'da çalıştırın (SQL Editör bölümünde)

-- 1. user_settings tablosu
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  subscription_status TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  subscription_type TEXT,
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ
);

-- 2. subscriptions tablosu
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  stripe_subscription_id TEXT UNIQUE,
  status TEXT,
  plan TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. notifications tablosu
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  type TEXT DEFAULT 'system',
  link TEXT
);

-- 4. Abonelik güncelleme SQL fonksiyonu
CREATE OR REPLACE FUNCTION public.update_user_subscription_status(
  p_user_id UUID,
  p_status TEXT DEFAULT 'premium',
  p_stripe_subscription_id TEXT DEFAULT NULL,
  p_stripe_customer_id TEXT DEFAULT NULL,
  p_subscription_period_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_subscription_period_end TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_cancel_at_period_end BOOLEAN DEFAULT false
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Kullanıcının var olup olmadığını kontrol et
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_exists;
  
  IF NOT v_exists THEN
    RAISE EXCEPTION 'Kullanıcı bulunamadı: %', p_user_id;
    RETURN FALSE;
  END IF;
  
  -- Abonelik durumu geçerli mi kontrol et
  IF p_status NOT IN ('premium', 'free') THEN
    RAISE EXCEPTION 'Geçersiz abonelik durumu: %', p_status;
    RETURN FALSE;
  END IF;
  
  -- Kullanıcı ayarları var mı kontrol et ve güncelle ya da oluştur
  UPDATE public.user_settings
  SET 
    subscription_status = p_status,
    stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
    stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
    subscription_period_start = COALESCE(p_subscription_period_start, subscription_period_start),
    subscription_period_end = COALESCE(p_subscription_period_end, subscription_period_end),
    cancel_at_period_end = COALESCE(p_cancel_at_period_end, cancel_at_period_end),
    updated_at = CURRENT_TIMESTAMP,
    email_notifications = CASE WHEN p_status = 'premium' THEN TRUE ELSE email_notifications END,
    budget_alerts = CASE WHEN p_status = 'premium' THEN TRUE ELSE budget_alerts END,
    monthly_reports = CASE WHEN p_status = 'premium' THEN TRUE ELSE monthly_reports END
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Yeni kullanıcı ayarları oluştur
    INSERT INTO public.user_settings (
      user_id, 
      subscription_status, 
      stripe_subscription_id, 
      stripe_customer_id,
      subscription_period_start,
      subscription_period_end,
      cancel_at_period_end, 
      email_notifications, 
      budget_alerts, 
      monthly_reports,
      app_preferences,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id, 
      p_status, 
      p_stripe_subscription_id, 
      p_stripe_customer_id,
      p_subscription_period_start,
      p_subscription_period_end,
      p_cancel_at_period_end, 
      CASE WHEN p_status = 'premium' THEN TRUE ELSE FALSE END,
      CASE WHEN p_status = 'premium' THEN TRUE ELSE FALSE END,
      CASE WHEN p_status = 'premium' THEN TRUE ELSE FALSE END,
      '{"currency": "TRY", "language": "tr"}'::jsonb,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
  END IF;
  
  -- Premium'a geçen kullanıcılara bildirim ekle
  IF p_status = 'premium' THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      content,
      read,
      created_at,
      type,
      link
    )
    VALUES (
      p_user_id,
      'Premium Üyelik Aktifleştirildi',
      'Premium üyeliğiniz başarıyla aktifleştirildi. Artık tüm premium özelliklere erişebilirsiniz.',
      FALSE,
      CURRENT_TIMESTAMP,
      'subscription',
      '/dashboard/subscription'
    );
  END IF;

  RETURN TRUE;
END;
$$;

-- 5. RLS (Row Level Security) Politikaları
-- user_settings tablosu için RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Var olan politikaları sil (gerekiyorsa)
DROP POLICY IF EXISTS "user_settings_select_policy" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_update_policy" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_insert_policy" ON public.user_settings;

-- RLS Politikalarını yeniden yapılandıralım
DO $$
BEGIN
    -- user_settings tablosu için politikalar
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_settings' 
        AND policyname = 'user_settings_select_policy'
    ) THEN
        CREATE POLICY user_settings_select_policy
        ON public.user_settings
        FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_settings' 
        AND policyname = 'user_settings_update_policy'
    ) THEN
        CREATE POLICY user_settings_update_policy
        ON public.user_settings
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_settings' 
        AND policyname = 'user_settings_insert_policy'
    ) THEN
        CREATE POLICY user_settings_insert_policy
        ON public.user_settings
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- subscriptions tablosu için politikalar
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'subscriptions' 
        AND policyname = 'subscriptions_select_policy'
    ) THEN
        CREATE POLICY subscriptions_select_policy
        ON public.subscriptions
        FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- notifications tablosu için politikalar
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'notifications' 
        AND policyname = 'notifications_select_policy'
    ) THEN
        CREATE POLICY notifications_select_policy
        ON public.notifications
        FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'notifications' 
        AND policyname = 'notifications_update_policy'
    ) THEN
        CREATE POLICY notifications_update_policy
        ON public.notifications
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Transaction desteği ekleyen yeni fonksiyon
CREATE OR REPLACE FUNCTION public.handle_subscription_update(
  p_user_id UUID,
  p_subscription_data JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE public.user_settings SET
    subscription_status = CASE 
      WHEN p_subscription_data->>'status' = 'active' THEN 'premium' 
      ELSE 'free' 
    END,
    subscription_period_end = TO_TIMESTAMP((p_subscription_data->'current_period_end')::bigint)
  WHERE user_id = p_user_id;

  INSERT INTO public.subscriptions (
    user_id, 
    stripe_subscription_id, 
    status, 
    current_period_end
  ) VALUES (
    p_user_id,
    p_subscription_data->>'id',
    p_subscription_data->>'status',
    TO_TIMESTAMP((p_subscription_data->'current_period_end')::bigint)
  ) ON CONFLICT (stripe_subscription_id) DO UPDATE SET
    status = EXCLUDED.status,
    current_period_end = EXCLUDED.current_period_end;
END;
$$ LANGUAGE plpgsql; 