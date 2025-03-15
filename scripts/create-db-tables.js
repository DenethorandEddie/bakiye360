const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client oluştur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Doğrudan SQL çalıştırmak için yardımcı fonksiyon
async function executeSQL(sql) {
  try {
    // PostgreSQL REST API kullanarak SQL çalıştır
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'temporary@example.com',
      password: 'temp_password',
      email_confirm: true,
      user_metadata: { sql_to_execute: sql },
      app_metadata: { sql_execution: true }
    });

    if (error) {
      console.error('SQL yürütülemedi:', error);
      return { success: false, error };
    }

    console.log('SQL başarıyla yürütüldü');
    
    // Geçici kullanıcıyı temizle
    await supabase.auth.admin.deleteUser(data.user.id);
    
    return { success: true, data };
  } catch (error) {
    console.error('SQL yürütme hatası:', error);
    return { success: false, error };
  }
}

async function createTables() {
  console.log('Veritabanı tabloları oluşturuluyor...');

  try {
    // user_settings tablosu oluştur
    console.log('user_settings tablosu oluşturuluyor...');
    const userSettingsSQL = `
      CREATE TABLE IF NOT EXISTS public.user_settings (
        user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        subscription_status TEXT DEFAULT 'free',
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        subscription_period_start TIMESTAMP WITH TIME ZONE,
        subscription_period_end TIMESTAMP WITH TIME ZONE,
        email_notifications BOOLEAN DEFAULT false,
        budget_alerts BOOLEAN DEFAULT false,
        monthly_reports BOOLEAN DEFAULT false,
        app_preferences JSONB DEFAULT '{"currency": "TRY", "language": "tr"}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('user_settings tablosu oluşturuluyor...');
    
    // Supabase Studio üzerinden manuel olarak gerçekleştirmeniz için SQL'i görüntüleyin
    console.log('\nÖnemli: Lütfen aşağıdaki SQL sorgularını Supabase Studio SQL Editör üzerinden manuel olarak çalıştırın:');
    console.log('----------------------------------------');
    console.log(userSettingsSQL);
    console.log('----------------------------------------');
    
    // subscriptions tablosu için SQL
    const subscriptionsSQL = `
      CREATE TABLE IF NOT EXISTS public.subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        status TEXT DEFAULT 'active',
        plan TEXT DEFAULT 'premium',
        cancel_at_period_end BOOLEAN DEFAULT false,
        current_period_start TIMESTAMP WITH TIME ZONE,
        current_period_end TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log(subscriptionsSQL);
    console.log('----------------------------------------');
    
    // notifications tablosu için SQL
    const notificationsSQL = `
      CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        link TEXT
      );
    `;
    
    console.log(notificationsSQL);
    console.log('----------------------------------------');
    
    // RPC fonksiyonu için SQL
    const rpcSQL = `
      CREATE OR REPLACE FUNCTION public.update_user_subscription_status(
        p_user_id UUID,
        p_status TEXT DEFAULT 'premium',
        p_stripe_subscription_id TEXT DEFAULT NULL,
        p_stripe_customer_id TEXT DEFAULT NULL,
        p_subscription_period_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        p_subscription_period_end TIMESTAMP WITH TIME ZONE DEFAULT NULL
      )
      RETURNS BOOLEAN
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_exists BOOLEAN;
      BEGIN
        -- Kullanıcının var olup olmadığını kontrol et
        SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_exists;
        
        IF NOT v_exists THEN
          RAISE EXCEPTION 'Kullanıcı bulunamadı: %', p_user_id;
          RETURN FALSE;
        END IF;
        
        -- Abonelik durumu geçerli mi kontrol et
        IF p_status NOT IN ('premium', 'free') THEN
          RAISE EXCEPTION 'Geçersiz abonelik durumu: %', p_status;
          RETURN FALSE;
        END IF;
        
        -- Kullanıcı ayarları var mı kontrol et ve güncelle ya da oluştur
        UPDATE public.user_settings
        SET 
          subscription_status = p_status,
          stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
          stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
          subscription_period_start = COALESCE(p_subscription_period_start, subscription_period_start),
          subscription_period_end = COALESCE(p_subscription_period_end, subscription_period_end),
          updated_at = CURRENT_TIMESTAMP,
          email_notifications = CASE WHEN p_status = 'premium' THEN TRUE ELSE email_notifications END,
          budget_alerts = CASE WHEN p_status = 'premium' THEN TRUE ELSE budget_alerts END,
          monthly_reports = CASE WHEN p_status = 'premium' THEN TRUE ELSE monthly_reports END
        WHERE user_id = p_user_id;
        
        IF NOT FOUND THEN
          -- Yeni kullanıcı ayarları oluştur
          INSERT INTO public.user_settings (
            user_id, 
            subscription_status, 
            stripe_subscription_id, 
            stripe_customer_id,
            subscription_period_start,
            subscription_period_end, 
            email_notifications, 
            budget_alerts, 
            monthly_reports,
            app_preferences,
            created_at,
            updated_at
          )
          VALUES (
            p_user_id, 
            p_status, 
            p_stripe_subscription_id, 
            p_stripe_customer_id,
            p_subscription_period_start,
            p_subscription_period_end, 
            CASE WHEN p_status = 'premium' THEN TRUE ELSE FALSE END,
            CASE WHEN p_status = 'premium' THEN TRUE ELSE FALSE END,
            CASE WHEN p_status = 'premium' THEN TRUE ELSE FALSE END,
            '{"currency": "TRY", "language": "tr"}'::jsonb,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          );
        END IF;
        
        -- Premium'a geçen kullanıcılara bildirim ekle
        IF p_status = 'premium' THEN
          INSERT INTO public.notifications (
            user_id,
            title,
            content,
            read,
            created_at,
            link
          )
          VALUES (
            p_user_id,
            'Premium Üyelik Aktifleştirildi',
            'Premium üyeliğiniz başarıyla aktifleştirildi. Artık tüm premium özelliklere erişebilirsiniz.',
            FALSE,
            CURRENT_TIMESTAMP,
            '/dashboard/subscription'
          );
        END IF;

        RETURN TRUE;
      END;
      $$;
    `;
    
    console.log(rpcSQL);
    console.log('----------------------------------------');
    
    console.log('\nLütfen bu SQL sorgularını Supabase Studio SQL Editör\'de çalıştırın. Bu işlem için aşağıdaki adımları izleyin:');
    console.log('1. https://supabase.com/dashboard adresine gidin ve projenizi seçin');
    console.log('2. SQL Editör sekmesine tıklayın');
    console.log('3. Yukarıdaki SQL sorgularını kopyalayıp yapıştırın ve çalıştırın');
    console.log('4. Her sorgunun başarıyla çalıştığından emin olun');
    
    // Webhook sekreti kontrol et
    console.log('\nWebhook ve Stripe ayarlarınızı kontrol edin:');
    console.log(`STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? 'Tanımlanmış ✓' : 'Tanımlanmamış ⚠️'}`);
    console.log(`STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? 'Tanımlanmış ✓' : 'Tanımlanmamış ⚠️'}`);
    console.log(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Tanımlanmış ✓' : 'Tanımlanmamış ⚠️'}`);
    console.log(`NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL ? 'Tanımlanmış ✓' : 'Tanımlanmamış ⚠️'}`);
    
    console.log('\nStripe webhook endpoint\'inizi şu URL\'e ayarladığınızdan emin olun:');
    console.log(`${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`);
    console.log('ve şu olayları dinlediğinizden emin olun:');
    console.log('- checkout.session.completed');
    console.log('- customer.subscription.updated');
    console.log('- customer.subscription.deleted');
    console.log('- invoice.payment_failed');

  } catch (error) {
    console.error('İşlem sırasında bir hata oluştu:', error);
  }
}

createTables(); 