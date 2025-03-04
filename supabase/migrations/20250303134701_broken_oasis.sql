/*
  # Create categories table

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `type` (text, not null) - 'income' or 'expense'
      - `user_id` (uuid, references auth.users.id)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `categories` table
    - Add policies for authenticated users to manage their own categories
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Silip yeniden oluşturalım
DROP POLICY IF EXISTS "Users can read own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

-- Değiştirilmiş politikalar
CREATE POLICY "Authenticated users can read all categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default categories for both income and expense
DO $$
BEGIN
  -- Default income categories
  INSERT INTO categories (name, type, user_id) VALUES
    ('Maaş', 'income', NULL),
    ('Freelance', 'income', NULL),
    ('Yatırım', 'income', NULL),
    ('Hediye', 'income', NULL),
    ('Diğer Gelir', 'income', NULL);

  -- Default expense categories
  INSERT INTO categories (name, type, user_id) VALUES
    ('Yiyecek', 'expense', NULL),
    ('Ulaşım', 'expense', NULL),
    ('Konut', 'expense', NULL),
    ('Faturalar', 'expense', NULL),
    ('Eğlence', 'expense', NULL),
    ('Sağlık', 'expense', NULL),
    ('Giyim', 'expense', NULL),
    ('Eğitim', 'expense', NULL),
    ('Diğer Gider', 'expense', NULL);
END $$;