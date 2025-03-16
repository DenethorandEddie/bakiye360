-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions"
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON public.subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_payment_date_idx ON public.subscriptions(payment_date);

-- Create function to send email notifications
CREATE OR REPLACE FUNCTION notify_subscription_payment()
RETURNS trigger AS $$
DECLARE
  user_email text;
BEGIN
  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Send email notification one day before payment
  IF NEW.payment_date = CURRENT_DATE + INTERVAL '1 day' THEN
    PERFORM net.http_post(
      'https://api.resend.com/emails',
      jsonb_build_object(
        'from', 'Bakiye360 <bildirim@bakiye360.com>',
        'to', user_email,
        'subject', 'Yarın Ödeme Günü: ' || NEW.name,
        'html', '<p>Merhaba,</p>' ||
                '<p>' || NEW.name || ' aboneliğiniz için yarın ' || 
                to_char(NEW.amount, 'FM999,999,999.00') || ' TL ödeme yapmanız gerekiyor.</p>' ||
                '<p>İyi günler dileriz,<br>Bakiye360</p>'
      )::jsonb,
      '{
        "Authorization": "Bearer ' || current_setting('app.resend_api_key') || '",
        "Content-Type": "application/json"
      }'::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email notifications
CREATE TRIGGER subscription_payment_notification
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_subscription_payment(); 