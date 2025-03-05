/* Bakiye360 Veritabanı Şeması */

-- Abonelik tablosu
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  plan TEXT NOT NULL DEFAULT 'free',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Abonelik RLS (Row Level Security) politikaları
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi aboneliklerini görebilir
CREATE POLICY subscriptions_select_policy ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar kendi abonelik kayıtlarını güncelleyemez (Stripe webhook ile güncellenir)
CREATE POLICY subscriptions_insert_policy ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- İşlemler tablosu 
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- İşlemler RLS politikaları
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi işlemlerini görebilir
CREATE POLICY transactions_select_policy ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar kendi işlemlerini ekleyebilir
CREATE POLICY transactions_insert_policy ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi işlemlerini güncelleyebilir
CREATE POLICY transactions_update_policy ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcılar kendi işlemlerini silebilir
CREATE POLICY transactions_delete_policy ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Kategoriler tablosu
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Kategoriler RLS politikaları
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar tüm kategorileri görebilir (genel + kendi oluşturdukları)
CREATE POLICY categories_select_policy ON public.categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

-- Kullanıcılar kendi kategorilerini ekleyebilir
CREATE POLICY categories_insert_policy ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi kategorilerini güncelleyebilir
CREATE POLICY categories_update_policy ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcılar kendi kategorilerini silebilir
CREATE POLICY categories_delete_policy ON public.categories
  FOR DELETE USING (auth.uid() = user_id); 