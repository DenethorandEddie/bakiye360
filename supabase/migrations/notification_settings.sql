-- Eğer user_settings tablosu yoksa oluştur
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  budget_alerts BOOLEAN DEFAULT TRUE,
  monthly_reports BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Eğer payments tablosu yoksa oluştur
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT,
  category TEXT,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) Kuralları
-- user_settings için
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_settings_select_policy ON user_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY user_settings_insert_policy ON user_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_settings_update_policy ON user_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- payments için
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_select_policy ON payments 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY payments_insert_policy ON payments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY payments_update_policy ON payments 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY payments_delete_policy ON payments 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Yeni kayıt olan kullanıcılar için otomatik user_settings kaydı oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user(); 