-- Abonelik Sistemi Tabloları ve Fonksiyonları
-- Bu SQL dosyasını Supabase Studio'da çalıştırın (SQL Editör bölümünde)

-- 1. user_settings tablosu
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_status TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_period_start TIMESTAMP WITH TIME ZONE,
  subscription_period_end TIMESTAMP WITH TIME ZONE,
  email_notifications BOOLEAN DEFAULT false,
  budget_alerts BOOLEAN DEFAULT false,
  monthly_reports BOOLEAN DEFAULT false,
  app_preferences JSONB DEFAULT '{"currency": "TRY", "language": "tr"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false
);

-- 2. subscriptions tablosu
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  plan TEXT DEFAULT 'premium',
  cancel_at_period_end BOOLEAN DEFAULT false,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

CREATE POLICY "Kullanıcılar kendi ayarlarını görebilir"
  ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi ayarlarını güncelleyebilir"
  ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi ayarlarını ekleyebilir"
  ON public.user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- subscriptions tablosu için RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi aboneliklerini görebilir"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Abonelikler webhook tarafından güncellendiği için INSERT ve UPDATE politikaları kapatıldı

-- notifications tablosu için RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi bildirimlerini görebilir"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi bildirimlerini güncelleyebilir"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id); 