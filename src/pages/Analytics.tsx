import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Flame, 
  Target, 
  Award, 
  Calendar,
  TrendingDown,
  Zap,
  Brain,
  Trophy,
  Star,
  Activity,
  BarChart3,
  Download
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart
} from "recharts";
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
    longestStreak: 0,
    averageSessionTime: 0,
  });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [weeklyComparison, setWeeklyComparison] = useState<any[]>([]);
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

      const { data: playlistData } = await (supabase
        .from("playlists" as any)
        .select("*")
        .eq("id", playlistId)
        .eq("user_id", user.id)
        .single() as any);

      setPlaylist(playlistData);

      const { data: videosData, count } = await (supabase
        .from("videos" as any)
        .select("*", { count: 'exact' })
        .eq("playlist_id", playlistId) as any);

      const { data: progressData } = await (supabase
        .from("video_progress" as any)
        .select("*, videos(*)")
        .eq("user_id", user.id)
        .eq("playlist_id", playlistId) as any);

      const completed = progressData?.filter((p: any) => p.is_completed).length || 0;
      const totalWatchTime = progressData?.reduce((acc: number, p: any) => acc + (p.watch_time_seconds || 0), 0) || 0;

      const { data: streaksData } = await (supabase
        .from("study_streaks" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("study_date", { ascending: false })
        .limit(90) as any);

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      if (streaksData && streaksData.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < streaksData.length; i++) {
          const streakDate = new Date(streaksData[i].study_date);
          streakDate.setHours(0, 0, 0, 0);
          
          const daysDiff = Math.floor((today.getTime() - streakDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === i) {
            currentStreak++;
            tempStreak++;
          } else {
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            tempStreak = 1;
          }
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      }

      setStats({
        totalWatchTime: Math.floor(totalWatchTime / 3600),
        videosCompleted: completed,
        currentStreak,
        totalVideos: count || 0,
        longestStreak,
        averageSessionTime: completed > 0 ? totalWatchTime / completed / 3600 : 0,
      });

      // Generate daily data
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
          videos: dayStreaks.length,
        });
      }

      setDailyData(chartData);

      // Weekly comparison data
      const weeklyData = [
        { day: 'Mon', thisWeek: chartData.slice(-7)[0]?.hours || 0, lastWeek: chartData.slice(-14, -7)[0]?.hours || 0 },
        { day: 'Tue', thisWeek: chartData.slice(-7)[1]?.hours || 0, lastWeek: chartData.slice(-14, -7)[1]?.hours || 0 },
        { day: 'Wed', thisWeek: chartData.slice(-7)[2]?.hours || 0, lastWeek: chartData.slice(-14, -7)[2]?.hours || 0 },
        { day: 'Thu', thisWeek: chartData.slice(-7)[3]?.hours || 0, lastWeek: chartData.slice(-14, -7)[3]?.hours || 0 },
        { day: 'Fri', thisWeek: chartData.slice(-7)[4]?.hours || 0, lastWeek: chartData.slice(-14, -7)[4]?.hours || 0 },
        { day: 'Sat', thisWeek: chartData.slice(-7)[5]?.hours || 0, lastWeek: chartData.slice(-14, -7)[5]?.hours || 0 },
        { day: 'Sun', thisWeek: chartData.slice(-7)[6]?.hours || 0, lastWeek: chartData.slice(-14, -7)[6]?.hours || 0 },
      ];
      
      setWeeklyComparison(weeklyData);

    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⭐';
    if (streak >= 3) return '✨';
    return '💪';
  };

  const getMotivationalMessage = () => {
    const completion = completionPercentage;
    if (completion === 100) return { message: "🎉 Perfect! You've mastered this playlist!", color: "text-green-600" };
    if (completion >= 80) return { message: "🚀 Almost there! Keep pushing!", color: "text-blue-600" };
    if (completion >= 50) return { message: "💪 Great progress! You're halfway there!", color: "text-yellow-600" };
    if (completion >= 20) return { message: "🌟 Good start! Keep the momentum going!", color: "text-orange-600" };
    return { message: "🎯 Let's get started! Your journey begins here.", color: "text-red-600" };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <header className="border-b bg-card/80 backdrop-blur-xl p-4 sticky top-0 z-50">
          <div className="container mx-auto flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
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

  const motivationalMsg = getMotivationalMessage();
  const thisWeekTotal = weeklyComparison.reduce((acc, day) => acc + day.thisWeek, 0);
  const lastWeekTotal = weeklyComparison.reduce((acc, day) => acc + day.lastWeek, 0);
  const weeklyGrowth = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl p-4 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-black text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">{playlist?.title}</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Motivational Banner */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className={`text-2xl font-bold ${motivationalMsg.color}`}>
                  {motivationalMsg.message}
                </h2>
                <p className="text-muted-foreground">
                  You're doing great! Keep up the amazing work.
                </p>
              </div>
              <div className="text-6xl">
                {getStreakEmoji(stats.currentStreak)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <CountUpCard
            title="Watch Time"
            value={stats.totalWatchTime}
            unit="hours"
            icon={Clock}
            variant="primary"
            decimals={0}
          />
          <CountUpCard
            title="Videos Done"
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
            title="Longest Streak"
            value={stats.longestStreak}
            unit="days"
            icon={Trophy}
            variant="success"
          />
        </div>

        {/* Weekly Performance Comparison */}
        <Card className="border-2 border-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weekly Performance</CardTitle>
                <CardDescription>Comparison with last week</CardDescription>
              </div>
              <Badge 
                variant={weeklyGrowth >= 0 ? "default" : "destructive"}
                className="text-lg px-3 py-1"
              >
                {weeklyGrowth >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {Math.abs(weeklyGrowth).toFixed(1)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyComparison}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
                <Bar dataKey="lastWeek" fill="hsl(var(--muted-foreground))" name="Last Week" radius={[4, 4, 0, 0]} opacity={0.5} />
                <Bar dataKey="thisWeek" fill="hsl(var(--primary))" name="This Week" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Study Heatmap */}
        <AnalyticsHeatmap data={dailyData} />

        {/* Tabs for Different Views */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Watch Time */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Daily Breakdown</CardTitle>
                  <CardDescription>Study hours per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11 }}
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
                      <Area 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorHours)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Progress Donut */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Completion Status</CardTitle>
                  <CardDescription>Overall progress</CardDescription>
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
                        innerRadius={70}
                        outerRadius={110}
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        dataKey="value"
                      >
                        <Cell fill="hsl(var(--success))" />
                        <Cell fill="hsl(var(--muted))" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="text-center mt-4">
                    <p className="text-4xl font-black">{completionPercentage}%</p>
                    <p className="text-muted-foreground">Complete</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Study Trends</CardTitle>
                <CardDescription>Your learning pattern over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="hours" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      name="Study Hours"
                      dot={{ fill: "hsl(var(--primary))", r: 5 }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="videos" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={3}
                      name="Videos Watched"
                      dot={{ fill: "hsl(var(--success))", r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Your study statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <Award className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-semibold">Consistency Score</p>
                        <p className="text-xs text-muted-foreground">Based on study regularity</p>
                      </div>
                    </div>
                    <div className="text-3xl font-black text-green-600">
                      {Math.min(100, Math.round((stats.currentStreak / parseInt(timeRange)) * 100))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Avg Session</span>
                      <span className="font-bold">{stats.averageSessionTime.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Best Day</span>
                      <span className="font-bold">
                        {dailyData.length > 0 
                          ? dailyData.reduce((max, day) => day.hours > max.hours ? day : max).date
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Total Videos</span>
                      <span className="font-bold">{stats.totalVideos}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                  <CardDescription>Your milestones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.currentStreak >= 7 && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
                      <Flame className="h-8 w-8 text-orange-600" />
                      <div>
                        <p className="font-semibold">Week Warrior</p>
                        <p className="text-xs text-muted-foreground">7+ day streak achieved!</p>
                      </div>
                    </div>
                  )}
                  
                  {completionPercentage >= 50 && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
                      <Star className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-semibold">Halfway Hero</p>
                        <p className="text-xs text-muted-foreground">50% playlist completed!</p>
                      </div>
                    </div>
                  )}

                  {stats.totalWatchTime >= 10 && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                      <Brain className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className="font-semibold">Knowledge Seeker</p>
                        <p className="text-xs text-muted-foreground">10+ hours of learning!</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Insights Cards */}
            <div className="space-y-4">
              <Card className="border-l-4 border-l-green-500 bg-green-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400">
                        Great progress!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        You've completed {completionPercentage}% of this playlist. Keep up the excellent work!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {stats.currentStreak > 0 && (
                <Card className="border-l-4 border-l-orange-500 bg-orange-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Flame className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-orange-700 dark:text-orange-400">
                          {stats.currentStreak} day streak! {getStreakEmoji(stats.currentStreak)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          You're on fire! Don't break your momentum.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {weeklyGrowth > 0 && (
                <Card className="border-l-4 border-l-blue-500 bg-blue-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-700 dark:text-blue-400">
                          Weekly improvement: +{weeklyGrowth.toFixed(1)}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          You studied {Math.abs(weeklyGrowth).toFixed(1)}% more this week compared to last week!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {stats.totalWatchTime > 0 && (
                <Card className="border-l-4 border-l-purple-500 bg-purple-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-purple-700 dark:text-purple-400">
                          Total dedication: {stats.totalWatchTime} hours
                        </p>
                        <p className="text-sm text-muted-foreground">
                          That's {(stats.totalWatchTime / stats.totalVideos * 60).toFixed(0)} minutes per video on average
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Analytics;
