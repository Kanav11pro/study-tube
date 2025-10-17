import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Flame, Clock, BookOpen, Sparkles, LogOut, FileText, TrendingUp, Target, Zap, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { StatsCard } from "@/components/StatsCard";
import { PlaylistCard } from "@/components/PlaylistCard";
import { AddPlaylistDialog } from "@/components/AddPlaylistDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [stats, setStats] = useState({
    currentStreak: 0,
    weekWatchTime: 0,
    aiNotesCount: 0,
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      const { data: profileData } = await (supabase
        .from("profiles" as any)
        .select("*")
        .eq("id", user.id)
        .single() as any);

      setProfile(profileData);

      const { data: playlistsData } = await (supabase
        .from("playlists" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("last_accessed_at", { ascending: false }) as any);

      setPlaylists(playlistsData || []);

      // Calculate stats
      await calculateStats(user.id);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = async (userId: string) => {
    try {
      // Calculate current streak
      const { data: streakData } = await (supabase
        .from("study_streaks" as any)
        .select("study_date")
        .eq("user_id", userId)
        .order("study_date", { ascending: false }) as any);

      let currentStreak = 0;
      if (streakData && streakData.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < streakData.length; i++) {
          const streakDate = new Date(streakData[i].study_date);
          streakDate.setHours(0, 0, 0, 0);
          
          const expectedDate = new Date(today);
          expectedDate.setDate(expectedDate.getDate() - i);
          expectedDate.setHours(0, 0, 0, 0);
          
          if (streakDate.getTime() === expectedDate.getTime()) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Calculate week watch time (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: weekData } = await (supabase
        .from("study_streaks" as any)
        .select("watch_time_seconds")
        .eq("user_id", userId)
        .gte("study_date", weekAgo.toISOString().split('T')[0]) as any);

      const weekWatchTime = weekData
        ? Math.round(weekData.reduce((sum: number, day: any) => sum + (day.watch_time_seconds || 0), 0) / 3600)
        : 0;

      // Count AI notes
      const { count: aiNotesCount } = await (supabase
        .from("ai_notes" as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId) as any);

      setStats({
        currentStreak,
        weekWatchTime,
        aiNotesCount: aiNotesCount || 0,
      });
    } catch (error) {
      console.error("Error calculating stats:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <BookOpen className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
          </div>
          <div className="text-xl font-semibold text-foreground">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-50" />
                <div className="relative p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  StudyTube
                </h1>
                <p className="text-xs text-muted-foreground">Learn Smarter, Not Harder</p>
              </div>
            </div>
            
            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              
              <Button 
                variant="outline" 
                onClick={() => navigate("/notes")}
                className="hidden sm:flex"
              >
                <FileText className="h-4 w-4 mr-2" />
                Notes
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                        {getInitials(profile?.full_name || "User")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2">
                    <p className="font-semibold">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <UserIcon className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/notes")} className="sm:hidden">
                    <FileText className="h-4 w-4 mr-2" />
                    Notes
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                {getCurrentGreeting()} 👋
              </Badge>
            </div>
            <h2 className="text-4xl font-black">
              {profile?.full_name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-blue-100">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="font-medium">{profile?.exam_type}</span>
              </div>
              <div className="w-1 h-1 bg-blue-200 rounded-full" />
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Target: {profile?.target_year}</span>
              </div>
              <div className="w-1 h-1 bg-blue-200 rounded-full" />
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="font-medium">{playlists.length} Playlists</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Current Streak"
            value={stats.currentStreak.toString()}
            unit="days"
            icon={Flame}
            variant="success"
          />
          <StatsCard
            title="Week Watch Time"
            value={stats.weekWatchTime.toString()}
            unit="hours"
            icon={Clock}
            variant="primary"
          />
          <StatsCard
            title="Total Playlists"
            value={playlists.length.toString()}
            icon={BookOpen}
            variant="secondary"
          />
          <StatsCard
            title="AI Notes"
            value={stats.aiNotesCount.toString()}
            icon={Sparkles}
            variant="accent"
          />
        </div>

        {/* Playlists Section */}
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Your Playlists</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {playlists.length > 0 
                  ? `${playlists.length} playlist${playlists.length > 1 ? 's' : ''} in your library`
                  : 'Get started by adding your first playlist'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search playlists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                onClick={() => setShowAddDialog(true)} 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Playlist
              </Button>
            </div>
          </div>

          {/* Playlists Grid */}
          {playlists.length === 0 ? (
            <Card className="border-2 border-dashed border-muted-foreground/25 bg-muted/30">
              <CardHeader className="text-center py-12">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-xl opacity-20" />
                    <div className="relative p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full">
                      <BookOpen className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                </div>
                <CardTitle className="text-2xl mb-2">No playlists yet</CardTitle>
                <CardDescription className="text-base max-w-md mx-auto">
                  Start your learning journey by adding your first YouTube playlist. Import educational content and track your progress.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-12">
                <Button 
                  onClick={() => setShowAddDialog(true)} 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Playlist
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {playlists.filter((playlist) =>
                playlist.title.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <CardTitle className="text-xl mb-2">No results found</CardTitle>
                    <CardDescription>
                      Try searching with different keywords
                    </CardDescription>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {playlists
                    .filter((playlist) =>
                      playlist.title.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((playlist) => (
                      <PlaylistCard 
                        key={playlist.id} 
                        playlist={playlist}
                        onDelete={() => checkUser()}
                      />
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <AddPlaylistDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onPlaylistAdded={checkUser}
      />
    </div>
  );
};

export default Dashboard;
