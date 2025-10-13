import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, Clock, CheckCircle, Flame } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { StatsCard } from "@/components/StatsCard";

const Analytics = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<any>(null);
  const [timeRange, setTimeRange] = useState("7");
  const [stats, setStats] = useState({
    totalWatchTime: 0,
    videosCompleted: 0,
    currentStreak: 0,
    totalVideos: 0,
  });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (playlistId) {
      loadAnalytics();
    }
  }, [playlistId, timeRange]);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch playlist
      const { data: playlistData } = await supabase
        .from("playlists" as any)
        .select("*")
        .eq("id", playlistId)
        .eq("user_id", user.id)
        .single();

      setPlaylist(playlistData);

      // Fetch videos count
      const { data: videosData, count } = await supabase
        .from("videos" as any)
        .select("*", { count: 'exact' })
        .eq("playlist_id", playlistId);

      // Fetch progress
      const { data: progressData } = await supabase
        .from("video_progress" as any)
        .select("*, videos(*)")
        .eq("user_id", user.id)
        .eq("playlist_id", playlistId);

      // Calculate stats
      const completed = progressData?.filter((p: any) => p.is_completed).length || 0;
      const totalWatchTime = progressData?.reduce((acc: number, p: any) => acc + (p.watch_time_seconds || 0), 0) || 0;

      // Fetch streaks
      const { data: streaksData } = await supabase
        .from("study_streaks" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("study_date", { ascending: false })
        .limit(30);

      // Calculate current streak
      let currentStreak = 0;
      if (streaksData && streaksData.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < streaksData.length; i++) {
          const streakDate = new Date(streaksData[i].study_date);
          streakDate.setHours(0, 0, 0, 0);
          
          const daysDiff = Math.floor((today.getTime() - streakDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === i) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      setStats({
        totalWatchTime: Math.floor(totalWatchTime / 3600), // Convert to hours
        videosCompleted: completed,
        currentStreak,
        totalVideos: count || 0,
      });

      // Generate daily data for chart
      const days = parseInt(timeRange);
      const chartData = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dateStr = date.toISOString().split('T')[0];
        const dayStreaks = streaksData?.filter((s: any) => s.study_date === dateStr) || [];
        const watchTime = dayStreaks.reduce((acc: number, s: any) => acc + (s.watch_time_seconds || 0), 0);
        
        chartData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          hours: parseFloat((watchTime / 3600).toFixed(1)),
        });
      }

      setDailyData(chartData);

    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoading(false);
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

  const completionPercentage = stats.totalVideos > 0 
    ? Math.round((stats.videosCompleted / stats.totalVideos) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-xl">Analytics</h1>
            <p className="text-sm text-muted-foreground">{playlist?.title}</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Watch Time"
            value={stats.totalWatchTime.toString()}
            unit="hours"
            icon={Clock}
            variant="primary"
          />
          <StatsCard
            title="Videos Completed"
            value={stats.videosCompleted.toString()}
            unit={`of ${stats.totalVideos}`}
            icon={CheckCircle}
            variant="success"
          />
          <StatsCard
            title="Completion"
            value={completionPercentage.toString()}
            unit="%"
            icon={TrendingUp}
            variant="accent"
          />
          <StatsCard
            title="Current Streak"
            value={stats.currentStreak.toString()}
            unit="days"
            icon={Flame}
            variant="warning"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Watch Time */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Watch Time</CardTitle>
              <CardDescription>Hours spent studying each day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Watch Time (hours)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Overview</CardTitle>
              <CardDescription>Completion status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: stats.videosCompleted },
                      { name: 'Remaining', value: stats.totalVideos - stats.videosCompleted },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    <Cell fill="hsl(var(--success))" />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-success/10 text-success rounded-lg">
              <p className="font-medium">Great progress!</p>
              <p className="text-sm opacity-90">
                You've completed {completionPercentage}% of this playlist. Keep up the good work!
              </p>
            </div>
            
            {stats.currentStreak > 0 && (
              <div className="p-4 bg-warning/10 text-warning rounded-lg">
                <p className="font-medium">🔥 {stats.currentStreak} day streak!</p>
                <p className="text-sm opacity-90">
                  You're on a roll! Don't break your streak.
                </p>
              </div>
            )}

            {stats.totalWatchTime > 0 && (
              <div className="p-4 bg-primary/10 text-primary rounded-lg">
                <p className="font-medium">Total study time: {stats.totalWatchTime} hours</p>
                <p className="text-sm opacity-90">
                  That's {(stats.totalWatchTime / stats.totalVideos).toFixed(1)} hours per video on average
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Analytics;
