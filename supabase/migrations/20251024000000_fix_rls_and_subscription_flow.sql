-- Fix RLS policies and subscription flow issues
-- This migration addresses the "new row violates row-level security policy" error

-- First, let's ensure all tables have proper RLS policies

-- Fix subscription_requests policies (ensure users can insert their own requests)
DROP POLICY IF EXISTS "Users can insert own requests" ON public.subscription_requests;
CREATE POLICY "Users can insert own requests" ON public.subscription_requests
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own requests" ON public.subscription_requests;
CREATE POLICY "Users can view own requests" ON public.subscription_requests
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure admins can view and update all requests
DROP POLICY IF EXISTS "Admins can view all requests" ON public.subscription_requests;
CREATE POLICY "Admins can view all requests" ON public.subscription_requests
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'::app_role
    )
  );

DROP POLICY IF EXISTS "Admins can update requests" ON public.subscription_requests;
CREATE POLICY "Admins can update requests" ON public.subscription_requests
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'::app_role
    )
  );

-- Fix user_subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'::app_role
    )
  );

-- Add missing INSERT policy for user_subscriptions (for admin panel)
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can insert subscriptions" ON public.user_subscriptions
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'::app_role
    )
  );

DROP POLICY IF EXISTS "Admins can update subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can update subscriptions" ON public.user_subscriptions
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'::app_role
    )
  );

-- Fix profiles update policy to allow admins to update subscription_tier
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'::app_role
    )
  );

-- Ensure storage bucket exists and has correct policies
DO $$
BEGIN
  -- Create bucket if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'payment-screenshots') THEN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('payment-screenshots', 'payment-screenshots', false);
  END IF;
END $$;

-- Fix storage policies for payment screenshots
DROP POLICY IF EXISTS "Users can upload own payment proof" ON storage.objects;
CREATE POLICY "Users can upload own payment proof"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-screenshots' AND
  auth.uid()::text = split_part(name, '/', 1)
);

DROP POLICY IF EXISTS "Users can view own payment screenshots" ON storage.objects;
CREATE POLICY "Users can view own payment screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-screenshots' AND
  auth.uid()::text = split_part(name, '/', 1)
);

DROP POLICY IF EXISTS "Admins can view all payment screenshots" ON storage.objects;
CREATE POLICY "Admins can view all payment screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-screenshots' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'::app_role
  )
);

-- Ensure the has_role function is correct
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

-- Update the handle_new_user function to ensure it creates all necessary records
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
  INSERT INTO public.profiles (id, email, full_name, exam_type, target_year, referral_code, subscription_tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'exam_type')::exam_type, 'Other'),
    COALESCE((NEW.raw_user_meta_data->>'target_year')::INTEGER, EXTRACT(YEAR FROM NOW())::INTEGER + 1),
    ref_code,
    'free'
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
        FROM subscription_plans WHERE name = 'Monthly'
        LIMIT 1;
        
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add helpful indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_requests_user_id ON public.subscription_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON public.subscription_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);

-- Add a comment to track this migration
COMMENT ON MIGRATION '20251024000000_fix_rls_and_subscription_flow' IS 'Fixes RLS policies and subscription flow to resolve payment request insertion errors';
