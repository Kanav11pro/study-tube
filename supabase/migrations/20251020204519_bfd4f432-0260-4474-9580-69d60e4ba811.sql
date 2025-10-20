-- Fix function search path for generate_referral_code
ALTER FUNCTION generate_referral_code() SET search_path = public;

-- Enable RLS on subscription_plans table (missing from initial migration)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read subscription plans
CREATE POLICY "Anyone can read subscription plans"
ON subscription_plans FOR SELECT
TO authenticated
USING (true);