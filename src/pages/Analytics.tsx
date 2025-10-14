import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, Clock, CheckCircle, Flame, Target, Award, Calendar } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CountUpCard } from "@/components/CountUpCard";
import { AnalyticsHeatmap } from "@/components/AnalyticsHeatmap";
import { Skeleton } from "@/components/ui/skeleton";

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
      const { data: playlistData } = await (supabase
        .from("playlists" as any)
        .select("*")
        .eq("id", playlistId)
        .eq("user_id", user.id)
        .single() as any);

      setPlaylist(playlistData);

      // Fetch videos count
      const { data: videosData, count } = await (supabase
        .from("videos" as any)
        .select("*", { count: 'exact' })
        .eq("playlist_id", playlistId) as any);

      // Fetch progress
      const { data: progressData } = await (supabase
        .from("video_progress" as any)
        .select("*, videos(*)")
        .eq("user_id", user.id)
        .eq("playlist_id", playlistId) as any);

      // Calculate stats
      const completed = progressData?.filter((p: any) => p.is_completed).length || 0;
      const totalWatchTime = progressData?.reduce((acc: number, p: any) => acc + (p.watch_time_seconds || 0), 0) || 0;

      // Fetch streaks
      const { data: streaksData } = await (supabase
        .from("study_streaks" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("study_date", { ascending: false })
        .limit(90) as any);

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
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card p-4 sticky top-0 z-50">
          <div className="container mx-auto flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </main>
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
        {/* Stats Cards with Count Up Animation */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <CountUpCard
            title="Watch Time"
            value={stats.totalWatchTime}
            unit="hours"
            icon={Clock}
            variant="primary"
            decimals={0}
          />
          <CountUpCard
            title="Videos Completed"
            value={stats.videosCompleted}
            icon={CheckCircle}
            variant="success"
          />
          <CountUpCard
            title="Completion"
            value={completionPercentage}
            unit="%"
            icon={TrendingUp}
            variant="accent"
          />
          <CountUpCard
            title="Current Streak"
            value={stats.currentStreak}
            unit="days"
            icon={Flame}
            variant="warning"
          />
          <CountUpCard
            title="Daily Goal"
            value={Math.min(100, Math.round((stats.totalWatchTime / (parseInt(timeRange) * 2)) * 100))}
            unit="%"
            icon={Target}
            variant="primary"
          />
        </div>

        {/* Study Heatmap */}
        <AnalyticsHeatmap data={dailyData} />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Watch Time Bar Chart */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Daily Breakdown</CardTitle>
              <CardDescription>Hours per day (last {timeRange} days)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar 
                    dataKey="hours" 
                    fill="hsl(var(--primary))" 
                    radius={[8, 8, 0, 0]}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Trends Line Chart */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Weekly Trends</CardTitle>
              <CardDescription>Study time comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={3}
                    name="Study Hours"
                    dot={{ fill: "hsl(var(--success))", r: 4 }}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Progress Donut Chart */}
          <Card className="animate-scale-in">
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
                      { name: 'Remaining', value: Math.max(0, stats.totalVideos - stats.videosCompleted) },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    labelLine={false}
                    label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                    dataKey="value"
                    animationDuration={800}
                  >
                    <Cell fill="hsl(var(--success))" />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Your study statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-success" />
                  <div>
                    <p className="font-medium">Consistency Score</p>
                    <p className="text-sm text-muted-foreground">Based on study regularity</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-success">
                  {Math.min(100, Math.round((stats.currentStreak / parseInt(timeRange)) * 100))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average Session Length</span>
                  <span className="font-medium">
                    {stats.videosCompleted > 0 
                      ? `${(stats.totalWatchTime / stats.videosCompleted).toFixed(1)}h` 
                      : "0h"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Best Study Day</span>
                  <span className="font-medium">
                    {dailyData.length > 0 
                      ? dailyData.reduce((max, day) => day.hours > max.hours ? day : max).date
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Completion Rate</span>
                  <span className="font-medium">{completionPercentage}%</span>
                </div>
              </div>
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
