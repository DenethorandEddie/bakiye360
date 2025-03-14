-- Run this in the Supabase SQL Editor

-- 1. Add app_preferences column to user_settings table
DO $$ 
BEGIN
  -- Check if column exists before adding
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name = 'app_preferences'
  ) THEN
    -- Add app_preferences column as JSONB type
    ALTER TABLE user_settings ADD COLUMN app_preferences JSONB DEFAULT NULL;
    RAISE NOTICE 'app_preferences column added to user_settings table';
  ELSE
    RAISE NOTICE 'app_preferences column already exists';
  END IF;
END $$;

-- 2. Create the function to add the column
-- (can be called from application code if needed)
CREATE OR REPLACE FUNCTION add_app_preferences_column()
RETURNS void AS $$
BEGIN
  -- Check if column exists before adding
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name = 'app_preferences'
  ) THEN
    -- Add app_preferences column as JSONB type
    EXECUTE 'ALTER TABLE user_settings ADD COLUMN app_preferences JSONB DEFAULT NULL';
    RAISE NOTICE 'app_preferences column added to user_settings table';
  ELSE
    RAISE NOTICE 'app_preferences column already exists';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Add subscription_info columns to user_settings table
DO $$ 
BEGIN
  -- Check if columns exist before adding them
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name = 'subscription_status'
  ) THEN
    -- Add subscription_status column
    ALTER TABLE user_settings ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'free';
    RAISE NOTICE 'subscription_status column added to user_settings table';
  ELSE
    RAISE NOTICE 'subscription_status column already exists';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name = 'subscription_start_date'
  ) THEN
    -- Add subscription_start_date column
    ALTER TABLE user_settings ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    RAISE NOTICE 'subscription_start_date column added to user_settings table';
  ELSE
    RAISE NOTICE 'subscription_start_date column already exists';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name = 'subscription_end_date'
  ) THEN
    -- Add subscription_end_date column
    ALTER TABLE user_settings ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    RAISE NOTICE 'subscription_end_date column added to user_settings table';
  ELSE
    RAISE NOTICE 'subscription_end_date column already exists';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name = 'stripe_customer_id'
  ) THEN
    -- Add stripe_customer_id column
    ALTER TABLE user_settings ADD COLUMN stripe_customer_id VARCHAR(255) DEFAULT NULL;
    RAISE NOTICE 'stripe_customer_id column added to user_settings table';
  ELSE
    RAISE NOTICE 'stripe_customer_id column already exists';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name = 'stripe_subscription_id'
  ) THEN
    -- Add stripe_subscription_id column
    ALTER TABLE user_settings ADD COLUMN stripe_subscription_id VARCHAR(255) DEFAULT NULL;
    RAISE NOTICE 'stripe_subscription_id column added to user_settings table';
  ELSE
    RAISE NOTICE 'stripe_subscription_id column already exists';
  END IF;
END $$;

-- 4. Verify that the columns exist
SELECT 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_name = 'user_settings' 
ORDER BY 
  ordinal_position;
