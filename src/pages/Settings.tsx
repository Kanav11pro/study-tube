import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { User, Settings as SettingsIcon, Bell, Sparkles, Copy, Check, Gift, Calendar, Save, Shield } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const Settings = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState({ count: 0, freeMonths: 0 });
  const [copied, setCopied] = useState(false);
  const { tier, limits, usage, subscription } = useSubscription();

  useEffect(() => {
    loadData();
    loadReferralData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await (supabase
        .from("profiles" as any)
        .select("*")
        .eq("id", user.id)
        .single() as any);

      setProfile(profileData);

      const { data: settingsData } = await (supabase
        .from("user_settings" as any)
        .select("*")
        .eq("user_id", user.id)
        .single() as any);

      setSettings(settingsData);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReferralData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: refData } = await supabase
      .from('referral_codes')
      .select('code, referrals_count, free_months_earned')
      .eq('user_id', user.id)
      .single();

    if (refData) {
      setReferralCode(refData.code);
      setReferralStats({
        count: refData.referrals_count,
        freeMonths: refData.free_months_earned,
      });
    }
  };

  const handleCopyReferralLink = () => {
    const link = `${window.location.origin}/?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const { error } = await (supabase
        .from("profiles" as any)
        .update({
          full_name: profile.full_name,
          exam_type: profile.exam_type,
          target_year: profile.target_year,
        })
        .eq("id", profile.id) as any);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      const { error } = await (supabase
        .from("user_settings" as any)
        .update({
          auto_play_next: settings.auto_play_next,
          default_playback_speed: settings.default_playback_speed,
          auto_complete_percentage: settings.auto_complete_percentage,
          weekly_progress_email: settings.weekly_progress_email,
        })
        .eq("id", settings.id) as any);

      if (error) throw error;
      toast.success("Settings updated successfully!");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
          </div>
          <div className="text-xl font-bold text-primary animate-pulse">Loading Settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")}
          >
            <SettingsIcon className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-xl">Settings</h1>
            <p className="text-sm text-muted-foreground">Customize your learning experience</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Subscription Section */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Subscription Status</CardTitle>
                  <CardDescription>Manage your premium membership</CardDescription>
                </div>
              </div>
              <Badge className={tier === 'premium' ? 'bg-gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}>
                {tier === 'premium' ? (
                  <><Sparkles className="h-3 w-3 mr-1" /> Premium</>
                ) : (
                  'Free'
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Plan */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-card border border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                <p className="text-2xl font-bold text-foreground capitalize">{tier}</p>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">AI Notes</p>
                <p className="text-2xl font-bold text-foreground">
                  {usage.aiNotesUsed}/{limits.aiNotes}
                </p>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Playlists</p>
                <p className="text-2xl font-bold text-foreground">
                  {usage.playlists}/{limits.playlists || '∞'}
                </p>
              </div>
            </div>

            {subscription && tier === 'premium' && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Premium Valid Until</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(subscription.end_date).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {tier === 'free' && (
              <Button 
                onClick={() => navigate('/pricing')}
                className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade to Premium - ₹49/month
              </Button>
            )}

            {tier === 'premium' && (
              <Button 
                onClick={() => navigate('/pricing')}
                variant="outline"
                className="w-full"
              >
                Renew Subscription
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Referral Section */}
        <Card className="border-success/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Gift className="h-5 w-5 text-success" />
              </div>
              <div>
                <CardTitle>Refer & Earn</CardTitle>
                <CardDescription>Get 1 month free for every 3 friends who join!</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Your Referral Progress</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {referralStats.count} referrals · {referralStats.freeMonths} free months earned
                  </p>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                  {referralStats.count}/3
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-success to-success/70 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((referralStats.count / 3) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referral-link">Your Referral Link</Label>
              <div className="flex gap-2">
                <Input
                  id="referral-link"
                  value={`${window.location.origin}/?ref=${referralCode}`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleCopyReferralLink}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with friends. When they sign up, they get 1 month Premium free, 
                and you get 1 month free after every 3 successful referrals!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Manage your personal details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                value={profile?.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={profile?.email || ''}
                disabled
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam-type">Exam Type</Label>
                <Select
                  value={profile?.exam_type}
                  onValueChange={(value) => setProfile({ ...profile, exam_type: value })}
                >
                  <SelectTrigger id="exam-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JEE">JEE</SelectItem>
                    <SelectItem value="NEET">NEET</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-year">Target Year</Label>
                <Input
                  id="target-year"
                  type="number"
                  value={profile?.target_year || new Date().getFullYear()}
                  onChange={(e) => setProfile({ ...profile, target_year: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Rest of existing settings cards... */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Bell className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Control your notification preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            Coming Soon!
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Shield className="h-5 w-5 text-warning" />
              </div>
              <div>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>Manage your account security and privacy settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            Coming Soon!
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
