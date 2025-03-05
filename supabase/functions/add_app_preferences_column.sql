-- Function to add app_preferences column to user_settings table if it doesn't exist
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
  END IF;
END;
$$ LANGUAGE plpgsql; 