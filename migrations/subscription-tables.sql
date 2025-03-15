-- Abonelik ve fiyatlandırma tabloları
-- Bu SQL dosyası Supabase Studio'da veya migration aracıyla çalıştırılmalıdır

-- Ürünler tablosu (Stripe ürünleriyle senkronize)
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  active boolean,
  name text,
  description text,
  image text,
  metadata jsonb
);

-- Fiyatlar tablosu (Stripe fiyatlarıyla senkronize)
CREATE TABLE IF NOT EXISTS prices (
  id text PRIMARY KEY,
  product_id text REFERENCES products(id),
  active boolean,
  description text,
  unit_amount bigint,
  currency text,
  type text,
  interval text,
  interval_count integer,
  trial_period_days integer,
  metadata jsonb
);

-- Abonelikler tablosu (Stripe abonelikleriyle senkronize)
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  status text,
  price_id text REFERENCES prices(id),
  quantity integer,
  cancel_at_period_end boolean,
  created timestamp with time zone DEFAULT timezone('utc'::text, now()),
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  ended_at timestamp with time zone,
  cancel_at timestamp with time zone,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  stripe_customer_id text,
  stripe_subscription_id text
);

-- Abonelik sorgulama fonksiyonu (Row Level Security için)
CREATE OR REPLACE FUNCTION is_subscribed(user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = is_subscribed.user_id
    AND status IN ('active', 'trialing')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS (Row Level Security) politikaları
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi aboneliklerini görüntüleyebilir
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Veri eklemek için (örnek ürün)
INSERT INTO products (id, active, name, description, metadata)
VALUES (
  'prod_buzdolabi_premium',
  true,
  'Buzdolabı Asistanı Premium',
  'Buzdolabı Asistanı uygulamasının premium özellikleri',
  '{}'
) ON CONFLICT (id) DO NOTHING;

-- Veri eklemek için (örnek fiyat)
INSERT INTO prices (id, product_id, active, description, unit_amount, currency, type, interval, interval_count, trial_period_days, metadata)
VALUES (
  'price_1QSdLHGUPk4i0W9u9P0iOA2W',
  'prod_buzdolabi_premium',
  true,
  'Aylık Premium Abonelik',
  14999, -- 149.99 TL (kuruş cinsinden)
  'try',
  'recurring',
  'month',
  1,
  null,
  '{}'
) ON CONFLICT (id) DO NOTHING; 