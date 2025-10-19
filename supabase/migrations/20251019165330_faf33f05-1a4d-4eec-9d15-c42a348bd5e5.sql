-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_inr DECIMAL NOT NULL,
  duration_days INTEGER NOT NULL,
  max_playlists INTEGER,
  max_ai_notes_per_month INTEGER NOT NULL,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
  status TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create subscription requests table (for manual payment verification)
CREATE TABLE public.subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  upi_transaction_id TEXT NOT NULL,
  payment_screenshot_url TEXT NOT NULL,
  payment_date DATE NOT NULL,
  amount_paid DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Create user roles table (for admin panel security)
CREATE TYPE app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create referral codes table
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  referrals_count INTEGER DEFAULT 0,
  free_months_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create referral signups table
CREATE TABLE public.referral_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  premium_granted BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create platform settings table (for dynamic pricing and configuration)
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update profiles table with subscription fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_notes_used_this_month INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_notes_reset_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Create security function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Enable RLS on new tables
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for subscription_requests
CREATE POLICY "Users can insert own requests" ON public.subscription_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own requests" ON public.subscription_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests" ON public.subscription_requests
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update requests" ON public.subscription_requests
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles (CRITICAL: Prevent privilege escalation)
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for referral_codes
CREATE POLICY "Users can view own referral code" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral code" ON public.referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own referral code" ON public.referral_codes
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for referral_signups
CREATE POLICY "Users can view own referrals" ON public.referral_signups
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can insert referral signups" ON public.referral_signups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all referrals" ON public.referral_signups
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for platform_settings
CREATE POLICY "Everyone can read settings" ON public.platform_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage settings" ON public.platform_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, price_inr, duration_days, max_playlists, max_ai_notes_per_month, features) VALUES
('Free', 0, 0, 3, 5, '{"basic_player": true, "manual_notes": true, "study_tips": true, "study_streaks": true}'::jsonb),
('Monthly', 49, 30, NULL, 20, '{"unlimited_playlists": true, "advanced_analytics": true, "break_reminders": true, "video_reordering": true, "premium_badge": true, "priority_support": true}'::jsonb),
('Yearly', 499, 365, NULL, 20, '{"unlimited_playlists": true, "advanced_analytics": true, "break_reminders": true, "video_reordering": true, "premium_badge": true, "priority_support": true, "early_access": true}'::jsonb);

-- Insert default platform settings
INSERT INTO public.platform_settings (setting_key, setting_value) VALUES
('upi_details', '{"upi_id": "7433970111@fam", "display_name": "StudyTube"}'::jsonb),
('pricing', '{"monthly": 49, "yearly": 499}'::jsonb),
('tier_limits', '{"free": {"playlists": 3, "ai_notes": 5}, "premium": {"playlists": null, "ai_notes": 20}}'::jsonb),
('referral_rewards', '{"signups_needed": 3, "reward_months": 1, "referred_user_reward_months": 1}'::jsonb);

-- Function to generate random referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE referral_codes.code = code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Update handle_new_user function to create referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_code TEXT;
BEGIN
  -- Generate referral code
  ref_code := generate_referral_code();
  
  -- Insert profile with referral code
  INSERT INTO public.profiles (id, email, full_name, exam_type, target_year, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'exam_type')::exam_type, 'Other'),
    COALESCE((NEW.raw_user_meta_data->>'target_year')::INTEGER, EXTRACT(YEAR FROM NOW())::INTEGER + 1),
    ref_code
  );
  
  -- Create default settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  -- Create referral code entry
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, ref_code);
  
  -- Create default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Check if user signed up via referral
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    DECLARE
      referrer_user_id UUID;
      signups_count INTEGER;
    BEGIN
      -- Get referrer's user_id
      SELECT user_id INTO referrer_user_id
      FROM referral_codes
      WHERE code = NEW.raw_user_meta_data->>'referral_code';
      
      IF referrer_user_id IS NOT NULL THEN
        -- Record referral signup
        INSERT INTO referral_signups (referrer_id, referred_user_id, referral_code)
        VALUES (referrer_user_id, NEW.id, NEW.raw_user_meta_data->>'referral_code');
        
        -- Grant referred user 1 month free
        INSERT INTO user_subscriptions (user_id, plan_id, status, start_date, end_date)
        SELECT NEW.id, id, 'active', NOW(), NOW() + INTERVAL '30 days'
        FROM subscription_plans WHERE name = 'Monthly';
        
        -- Update referred user's tier
        UPDATE profiles SET subscription_tier = 'premium' WHERE id = NEW.id;
        
        -- Increment referrer's count
        UPDATE referral_codes
        SET referrals_count = referrals_count + 1
        WHERE user_id = referrer_user_id;
        
        -- Check if referrer should get reward
        SELECT referrals_count INTO signups_count
        FROM referral_codes
        WHERE user_id = referrer_user_id;
        
        IF signups_count % 3 = 0 THEN
          -- Grant referrer 1 month free
          INSERT INTO user_subscriptions (user_id, plan_id, status, start_date, end_date)
          SELECT referrer_user_id, id, 'active', NOW(), NOW() + INTERVAL '30 days'
          FROM subscription_plans WHERE name = 'Monthly'
          ON CONFLICT (user_id) DO UPDATE
          SET end_date = user_subscriptions.end_date + INTERVAL '30 days';
          
          -- Update referrer's tier
          UPDATE profiles SET subscription_tier = 'premium' WHERE id = referrer_user_id;
          
          -- Update free months earned
          UPDATE referral_codes
          SET free_months_earned = free_months_earned + 1
          WHERE user_id = referrer_user_id;
        END IF;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;