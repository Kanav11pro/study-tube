import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Sparkles, TrendingUp, Users, Zap, ArrowLeft } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

export default function Pricing() {
  const navigate = useNavigate();
  const { tier, isLoading: subLoading } = useSubscription();
  const [isYearly, setIsYearly] = useState(false);
  const [pricing, setPricing] = useState({ monthly: 49, yearly: 499 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    const { data } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'pricing')
      .single();

    if (data?.setting_value) {
      setPricing(data.setting_value as any);
    }
    setIsLoading(false);
  };

  const handleUpgrade = () => {
    navigate('/subscription-request', { state: { planType: isYearly ? 'yearly' : 'monthly' } });
  };

  const features = {
    free: [
      'Up to 3 playlists',
      'Unlimited videos per playlist',
      'Basic video player',
      'Manual note-taking (unlimited)',
      '5 AI notes per month',
      'Basic analytics (7-day)',
      'Study tips & streaks',
    ],
    premium: [
      'Unlimited playlists & videos',
      '20 AI notes per month',
      'Advanced analytics (90-day)',
      'Break reminders & study timer',
      'Video reordering (drag & drop)',
      'Up to 2x playback speed',
      'Premium badge & priority support',
      'Early access to new features',
    ],
  };

  if (isLoading || subLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading pricing...</div>
      </div>
    );
  }

  const monthlyCost = isYearly ? (pricing.yearly / 12).toFixed(0) : pricing.monthly;
  const savings = pricing.monthly * 12 - pricing.yearly;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
            <Sparkles className="h-3 w-3 mr-1" />
            Trusted by 1000+ Students
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Your JEE/NEET Prep Partner
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Just <span className="font-bold text-primary">₹{monthlyCost}/month</span> — Less than 2 samosas per day! 🥟
          </p>
        </div>

        {/* Social Proof */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-primary/20">
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">1000+</p>
              <p className="text-sm text-muted-foreground">Active Students</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold">95%</p>
              <p className="text-sm text-muted-foreground">Score Improvement</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardContent className="pt-6 text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-warning" />
              <p className="text-2xl font-bold">50k+</p>
              <p className="text-sm text-muted-foreground">Study Hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm ${!isYearly ? 'font-bold' : 'text-muted-foreground'}`}>Monthly</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsYearly(!isYearly)}
            className="relative w-16 h-8"
          >
            <div className={`absolute w-6 h-6 bg-primary rounded-full transition-all ${isYearly ? 'right-1' : 'left-1'}`} />
          </Button>
          <span className={`text-sm ${isYearly ? 'font-bold' : 'text-muted-foreground'}`}>
            Yearly
            {isYearly && <Badge className="ml-2 bg-success text-white border-0">Save ₹{savings}</Badge>}
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Perfect for trying out</CardDescription>
              <div className="text-4xl font-bold mt-4">₹0</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              <ul className="space-y-3">
                {features.free.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                disabled={tier === 'free'}
              >
                {tier === 'free' ? 'Current Plan' : 'Downgrade'}
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="relative overflow-hidden border-2 border-primary shadow-xl">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-bl-lg text-sm font-bold">
              MOST POPULAR
            </div>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                Premium
                <Sparkles className="h-5 w-5 text-amber-500" />
              </CardTitle>
              <CardDescription>Unlock your full potential</CardDescription>
              <div className="text-4xl font-bold mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ₹{isYearly ? pricing.yearly : pricing.monthly}
                <span className="text-lg font-normal text-muted-foreground">
                  /{isYearly ? 'year' : 'month'}
                </span>
              </div>
              {isYearly && (
                <p className="text-sm text-success font-medium">That's only ₹{monthlyCost}/month!</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              <ul className="space-y-3">
                {features.premium.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                size="lg"
                disabled={tier === 'premium'}
              >
                {tier === 'premium' ? '✓ Current Plan' : 'Upgrade Now'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Testimonials */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-lg italic">"This platform helped me organize 50+ lectures perfectly. The AI notes are a game-changer during revision!"</p>
              <p className="font-bold">— Rahul S., JEE 2024 (AIR 234)</p>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Have questions? Contact us at support@studytube.com</p>
        </div>
      </div>
    </div>
  );
}
