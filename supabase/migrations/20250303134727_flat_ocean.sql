/*
  # Create recurring transactions table

  1. New Tables
    - `recurring_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users.id)
      - `category_id` (uuid, references categories.id)
      - `amount` (numeric, not null)
      - `type` (text, not null) - 'income' or 'expense'
      - `description` (text, not null)
      - `frequency` (text, not null) - 'daily', 'weekly', 'monthly', 'yearly'
      - `start_date` (date, not null)
      - `end_date` (date)
      - `last_generated` (date)
      - `notes` (text)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `recurring_transactions` table
    - Add policies for authenticated users to manage their own recurring transactions
*/

CREATE TABLE IF NOT EXISTS recurring_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  description text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date date NOT NULL,
  end_date date,
  last_generated date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own recurring transactions"
  ON recurring_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring transactions"
  ON recurring_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring transactions"
  ON recurring_transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring transactions"
  ON recurring_transactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS recurring_transactions_user_id_idx ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS recurring_transactions_category_id_idx ON recurring_transactions(category_id);