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
import { User, Settings as SettingsIcon, Bell, Save, Shield } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
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
