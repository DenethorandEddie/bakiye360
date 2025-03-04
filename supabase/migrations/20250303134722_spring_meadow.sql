/*
  # Create budget goals table

  1. New Tables
    - `budget_goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users.id)
      - `category_id` (uuid, references categories.id)
      - `name` (text, not null)
      - `target_amount` (numeric, not null)
      - `start_date` (date, not null)
      - `end_date` (date, not null)
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
  start_date date NOT NULL,
  end_date date NOT NULL,
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