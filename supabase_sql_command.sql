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

-- 3. Verify that the column exists
SELECT 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_name = 'user_settings' 
ORDER BY 
  ordinal_position;
