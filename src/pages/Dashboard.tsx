import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Flame, Clock, BookOpen, Sparkles, LogOut } from "lucide-react";
import { toast } from "sonner";
import { StatsCard } from "@/components/StatsCard";
import { PlaylistCard } from "@/components/PlaylistCard";
import { AddPlaylistDialog } from "@/components/AddPlaylistDialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);

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

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      // Fetch playlists
      const { data: playlistsData } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("last_accessed_at", { ascending: false });

      setPlaylists(playlistsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
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
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              StudyTube
            </h1>
          </div>
          
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2 animate-fade-in">
          <h2 className="text-3xl font-bold">
            Welcome back, {profile?.full_name}! 👋
          </h2>
          <p className="text-muted-foreground">
            Continue your journey towards {profile?.exam_type} {profile?.target_year}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up">
          <StatsCard
            title="Current Streak"
            value="0"
            unit="days"
            icon={Flame}
            variant="success"
          />
          <StatsCard
            title="Week Watch Time"
            value="0"
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
            value="0"
            icon={Sparkles}
            variant="accent"
          />
        </div>

        {/* Playlists Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h3 className="text-2xl font-bold">Your Playlists</h3>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search playlists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Playlist
              </Button>
            </div>
          </div>

          {playlists.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-muted rounded-full">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <CardTitle>No playlists yet</CardTitle>
                <CardDescription>
                  Add your first YouTube playlist to start learning
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Playlist
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists
                .filter((playlist) =>
                  playlist.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} />
                ))}
            </div>
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