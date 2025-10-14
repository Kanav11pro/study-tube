import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Save, User, Settings as SettingsIcon, Bell, Database } from "lucide-react";
import { toast } from "sonner";

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <div className="text-2xl font-bold text-primary">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-xl">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>Update your personal information</CardDescription>
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-gradient-primary">
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Playback Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              <CardTitle>Playback Preferences</CardTitle>
            </div>
            <CardDescription>Customize your video player experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto-play Next Video</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically play the next video when current one ends
                </p>
              </div>
              <Switch
                checked={settings?.auto_play_next}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_play_next: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Default Playback Speed</Label>
              <Select
                value={settings?.default_playback_speed?.toString()}
                onValueChange={(value) => setSettings({ ...settings, default_playback_speed: parseFloat(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.75">0.75x</SelectItem>
                  <SelectItem value="1">1.0x (Normal)</SelectItem>
                  <SelectItem value="1.25">1.25x</SelectItem>
                  <SelectItem value="1.5">1.5x</SelectItem>
                  <SelectItem value="2">2.0x</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Auto-complete at {settings?.auto_complete_percentage}%</Label>
                <p className="text-sm text-muted-foreground">
                  Mark video as complete when you reach this percentage
                </p>
              </div>
              <Slider
                value={[settings?.auto_complete_percentage || 90]}
                onValueChange={([value]) => setSettings({ ...settings, auto_complete_percentage: value })}
                min={80}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-gradient-primary">
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Weekly Progress Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receive a summary of your learning progress every week
                </p>
              </div>
              <Switch
                checked={settings?.weekly_progress_email}
                onCheckedChange={(checked) => setSettings({ ...settings, weekly_progress_email: checked })}
              />
            </div>

            <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-gradient-primary">
              <Save className="h-4 w-4 mr-2" />
              Save Notifications
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Data Management</CardTitle>
            </div>
            <CardDescription>Manage your data and progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Export your notes and progress data, or reset your learning history
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline">
                Export All Notes
              </Button>
              <Button variant="destructive">
                Reset Progress
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
