import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Upload, CheckCircle, Clock } from 'lucide-react';
import { z } from 'zod';

const requestSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  upiTransactionId: z.string().min(12, 'Transaction ID must be at least 12 characters'),
  paymentDate: z.string().min(1, 'Payment date is required'),
});

export default function SubscriptionRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const planType = (location.state as any)?.planType || 'monthly';
  
  const [isLoading, setIsLoading] = useState(false);
  const [upiDetails, setUpiDetails] = useState({ upi_id: '', display_name: '' });
  const [pricing, setPricing] = useState({ monthly: 49, yearly: 499 });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    upiTransactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadSettings();
    loadUserData();
  }, []);

  const loadSettings = async () => {
    const [upiData, pricingData] = await Promise.all([
      supabase.from('platform_settings').select('setting_value').eq('setting_key', 'upi_details').single(),
      supabase.from('platform_settings').select('setting_value').eq('setting_key', 'pricing').single(),
    ]);

    if (upiData.data?.setting_value) setUpiDetails(upiData.data.setting_value as any);
    if (pricingData.data?.setting_value) setPricing(pricingData.data.setting_value as any);
  };

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    if (profile) {
      setFormData(prev => ({
        ...prev,
        fullName: profile.full_name || '',
        email: profile.email || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      requestSchema.parse(formData);
    } catch (error: any) {
      toast.error(error.errors[0]?.message || 'Please fill all fields correctly');
      return;
    }

    if (!screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload screenshot
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, screenshot);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(fileName);

      // Get plan ID
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('name', planType === 'yearly' ? 'Yearly' : 'Monthly')
        .single();

      if (!plan) throw new Error('Plan not found');

      // Create subscription request
      const { error: requestError } = await supabase
        .from('subscription_requests')
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          full_name: formData.fullName,
          email: formData.email,
          phone_number: formData.phoneNumber,
          upi_transaction_id: formData.upiTransactionId,
          payment_screenshot_url: publicUrl,
          payment_date: formData.paymentDate,
          amount_paid: planType === 'yearly' ? pricing.yearly : pricing.monthly,
          status: 'pending',
        });

      if (requestError) throw requestError;

      setSubmitted(true);
      toast.success('Payment request submitted! We will verify and activate within 24 hours.');
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-2xl">Request Submitted!</CardTitle>
            <CardDescription>Your payment is under verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              We'll verify your payment and activate Premium within <span className="font-bold text-primary">24 hours</span>.
              You'll receive an email confirmation once activated.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Status: Pending Verification</span>
            </div>
            <Button onClick={() => navigate('/dashboard')} className="w-full mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const amount = planType === 'yearly' ? pricing.yearly : pricing.monthly;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate('/pricing')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pricing
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Instructions */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Step 1: Make Payment</CardTitle>
              <CardDescription>Pay via UPI and submit proof below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg text-center space-y-4">
                <p className="text-sm opacity-90">Pay to UPI ID</p>
                <p className="text-2xl font-bold font-mono">{upiDetails.upi_id}</p>
                <div className="bg-white/20 p-4 rounded">
                  <p className="text-3xl font-bold">₹{amount}</p>
                  <p className="text-sm opacity-90">{planType === 'yearly' ? 'Yearly' : 'Monthly'} Plan</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <p>Open any UPI app (PhonePe, GPay, Paytm)</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <p>Send ₹{amount} to <span className="font-mono font-bold">{upiDetails.upi_id}</span></p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <p>Take a screenshot of the transaction</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">4</span>
                  </div>
                  <p>Fill the form and upload screenshot</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submission Form */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Submit Payment Proof</CardTitle>
              <CardDescription>We'll verify and activate within 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="10-digit mobile number"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="upiTransactionId">UPI Transaction ID *</Label>
                  <Input
                    id="upiTransactionId"
                    placeholder="e.g., 123456789012"
                    value={formData.upiTransactionId}
                    onChange={(e) => setFormData({ ...formData, upiTransactionId: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="paymentDate">Payment Date *</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="screenshot">Payment Screenshot *</Label>
                  <div className="mt-2">
                    <label
                      htmlFor="screenshot"
                      className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-accent/50 transition"
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-sm">
                        {screenshot ? screenshot.name : 'Click to upload screenshot'}
                      </span>
                    </label>
                    <input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                      className="hidden"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Submitting...' : 'Submit Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
