import { createClient } from '@supabase/supabase-js';

// Supabase client singleton
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wemufsahwsnmeyuedczw.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlbXVmc2Fod3NubWV5dWVkY3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMDUxNjEsImV4cCI6MjA1NjU4MTE2MX0.KTI_UnPKmCCq6N72EUx1DK4KIriyXAFtiW5l7_xRhSw';

  return createClient(supabaseUrl, supabaseAnonKey);
};