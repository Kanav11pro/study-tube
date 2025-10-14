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
import { ArrowLeft, Save, User, Settings as SettingsIcon, Bell, Database, Sparkles, Shield, Download, Trash2 } from "lucide-react";
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
      toast.success("Profile updated successfully! ✓");
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
      toast.success("Settings updated successfully! ✓");
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
      {/* Enhanced Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl p-4 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")}
            className="hover:scale-110 transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg">
                <SettingsIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                  Settings
                </h1>
                <p className="text-sm text-muted-foreground">Customize your learning experience</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Profile Settings with Enhanced UI */}
        <Card className="border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl group-hover:scale-110 transition-transform">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Profile Information</CardTitle>
                <CardDescription>Manage your personal details and preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2 group/input">
              <Label htmlFor="full-name" className="text-sm font-medium flex items-center gap-2">
                Full Name
                <Sparkles className="h-3 w-3 text-primary opacity-0 group-hover/input:opacity-100 transition-opacity" />
              </Label>
              <Input
                id="full-name"
                value={profile?.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="h-11 transition-all focus:ring-2 focus:ring-primary/50 hover:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                Email Address
                <Shield className="h-3 w-3 text-green-600" />
              </Label>
              <Input
                id="email"
                value={profile?.email || ''}
                disabled
                className="bg-muted/50 h-11 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed for security reasons</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam-type" className="text-sm font-medium">Exam Preparation</Label>
                <Select
                  value={profile?.exam_type}
                  onValueChange={(value) => setProfile({ ...profile, exam_type: value })}
                >
                  <SelectTrigger id="exam-type" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JEE">JEE (Joint Entrance Exam)</SelectItem>
                    <SelectItem value="NEET">NEET (Medical)</SelectItem>
                    <SelectItem value="Other">Other Exams</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-year" className="text-sm font-medium">Target Year</Label>
                <Input
                  id="target-year"
                  type="number"
                  value={profile?.target_year || new Date().getFullYear()}
                  onChange={(e) => setProfile({ ...profile, target_year: parseInt(e.target.value) })}
                  className="h-11"
                />
              </div>
            </div>

            <Button 
              onClick={handleSaveProfile} 
              disabled={isSaving} 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Playback Settings with Enhanced UI */}
        <Card className="border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl group-hover:scale-110 transition-transform">
                <SettingsIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Playback Preferences</CardTitle>
                <CardDescription>Customize your video watching experience</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all">
              <div className="space-y-1">
                <Label className="font-medium">Auto-play Next Video</Label>
                <p className="text-sm text-muted-foreground">
                  Continue learning without interruption
                </p>
              </div>
              <Switch
                checked={settings?.auto_play_next}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_play_next: checked })}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-500"
              />
            </div>

            <div className="space-y-3">
              <Label className="font-medium">Default Playback Speed</Label>
              <Select
                value={settings?.default_playback_speed?.toString()}
                onValueChange={(value) => setSettings({ ...settings, default_playback_speed: parseFloat(value) })}
              >
                <SelectTrigger className="h-11 bg-gradient-to-r from-primary/5 to-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.75">🐌 0.75x - Slow & Steady</SelectItem>
                  <SelectItem value="1">⚡ 1.0x - Normal</SelectItem>
                  <SelectItem value="1.25">🚀 1.25x - Faster</SelectItem>
                  <SelectItem value="1.5">💨 1.5x - Quick Learning</SelectItem>
                  <SelectItem value="2">🔥 2.0x - Speed Master</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Auto-complete Threshold</Label>
                  <span className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    {settings?.auto_complete_percentage}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Videos are marked complete when you reach this percentage
                </p>
              </div>
              <Slider
                value={[settings?.auto_complete_percentage || 90]}
                onValueChange={([value]) => setSettings({ ...settings, auto_complete_percentage: value })}
                min={80}
                max={100}
                step={5}
                className="w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-amber-500 [&_[role=slider]]:to-orange-500"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>80%</span>
                <span>85%</span>
                <span>90%</span>
                <span>95%</span>
                <span>100%</span>
              </div>
            </div>

            <Button 
              onClick={handleSaveSettings} 
              disabled={isSaving} 
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications with Enhanced UI */}
        <Card className="border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl group-hover:scale-110 transition-transform">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Notifications</CardTitle>
                <CardDescription>Stay updated with your learning progress</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/5 to-orange-500/10 hover:from-amber-500/10 hover:to-orange-500/15 transition-all">
              <div className="space-y-1">
                <Label className="font-medium">Weekly Progress Email</Label>
                <p className="text-sm text-muted-foreground">
                  Get a detailed summary of your week's achievements
                </p>
              </div>
              <Switch
                checked={settings?.weekly_progress_email}
                onCheckedChange={(checked) => setSettings({ ...settings, weekly_progress_email: checked })}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-500"
              />
            </div>

            <Button 
              onClick={handleSaveSettings} 
              disabled={isSaving} 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Notifications"}
            </Button>
          </CardContent>
        </Card>

        {/* Data Management with Enhanced UI */}
        <Card className="border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl group-hover:scale-110 transition-transform">
                <Database className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Data Management</CardTitle>
                <CardDescription>Export, backup, or reset your learning data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-5 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-xl border border-primary/10">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Your Data is Safe</h4>
                  <p className="text-sm text-muted-foreground">
                    Export your notes anytime or reset your progress for a fresh start
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                variant="outline"
                className="h-12 border-2 hover:border-blue-500 hover:bg-blue-500/5 transition-all group/btn"
              >
                <Download className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                Export All Notes
              </Button>
              <Button 
                variant="outline"
                className="h-12 border-2 border-red-200 hover:border-red-500 hover:bg-red-500/5 text-red-600 hover:text-red-700 transition-all group/btn"
              >
                <Trash2 className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                Reset Progress
              </Button>
            </div>

            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-600 flex items-center gap-2">
                <span className="font-bold">⚠️ Warning:</span>
                Resetting progress is permanent and cannot be undone
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
