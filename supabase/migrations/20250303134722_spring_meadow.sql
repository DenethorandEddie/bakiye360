/*
  # Create budget goals table

  1. New Tables
    - `budget_goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users.id)
      - `category_id` (uuid, references categories.id)
      - `name` (text, not null)
      - `target_amount` (numeric, not null)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `budget_goals` table
    - Add policies for authenticated users to manage their own budget goals
*/

CREATE TABLE IF NOT EXISTS budget_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id),
  name text NOT NULL,
  target_amount numeric(12, 2) NOT NULL CHECK (target_amount > 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budget_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own budget goals"
  ON budget_goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget goals"
  ON budget_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget goals"
  ON budget_goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget goals"
  ON budget_goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS budget_goals_user_id_idx ON budget_goals(user_id);
CREATE INDEX IF NOT EXISTS budget_goals_category_id_idx ON budget_goals(category_id);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    budget_alerts BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS on notification_settings table
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_settings
CREATE POLICY "Users can view their own notification settings"
ON notification_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
ON notification_settings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
ON notification_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for notification_settings
CREATE INDEX IF NOT EXISTS notification_settings_user_id_idx ON notification_settings(user_id);