-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-screenshots', 'payment-screenshots', false);

-- Create RLS policies for payment screenshots
CREATE POLICY "Users can upload own payment proof"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own payment screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all payment screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-screenshots' AND
  has_role(auth.uid(), 'admin'::app_role)
);