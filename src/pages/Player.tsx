import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Sparkles,
  Play,
  BarChart3,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Save,
  PanelLeftClose,
  PanelLeftOpen,
  BookmarkPlus,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Zap,
  Award
} from "lucide-react";
import { toast } from "sonner";
import { GenerateNotesDialog } from "@/components/GenerateNotesDialog";

const Player = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [playlist, setPlaylist] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [progress, setProgress] = useState<any[]>([]);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [autoPlay, setAutoPlay] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(384); // Default 384px (w-96)
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [totalWatchTime, setTotalWatchTime] = useState(0);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [resumeTime, setResumeTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [dailyGoal, setDailyGoal] = useState(120); // 2 hours in minutes
  const [todayWatchTime, setTodayWatchTime] = useState(0);

  useEffect(() => {
    if (!playlistId) return;
    loadPlaylistData();
    loadTodayProgress();
  }, [playlistId]);

  useEffect(() => {
    if (currentVideoIndex >= 0 && videos.length > 0) {
      checkResumePoint();
    }
  }, [currentVideoIndex, videos, progress]);

  // Auto-save progress every 5 seconds
  useEffect(() => {
    progressIntervalRef.current = setInterval(() => {
      if (currentTimestamp > 0) {
        saveProgress(currentTimestamp, false);
      }
    }, 5000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentTimestamp, currentVideoIndex]);

  // Track total watch time
  useEffect(() => {
    const watchInterval = setInterval(() => {
      setTotalWatchTime(prev => prev + 1);
      setTodayWatchTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(watchInterval);
  }, []);

  // Listen to YouTube player events via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'infoDelivery' && data.info?.currentTime) {
          setCurrentTimestamp(data.info.currentTime);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch(e.key.toLowerCase()) {
        case 'n':
          handleNext();
          break;
        case 'p':
          handlePrevious();
          break;
        case 'm':
          handleMarkComplete();
          break;
        case 'a':
          toggleAutoPlay();
          break;
        case 's':
          saveProgress(currentTimestamp, true);
          break;
        case 'b':
          addBookmark();
          break;
        case '[':
          adjustSidebarWidth(-50);
          break;
        case ']':
          adjustSidebarWidth(50);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentVideoIndex, videos, autoPlay, currentTimestamp, sidebarWidth]);

  // Resizable sidebar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const checkResumePoint = async () => {
    const currentProgress = progress.find(
      p => p.video_id === videos[currentVideoIndex]?.id
    );
    
    if (currentProgress && currentProgress.watch_time_seconds > 30 && !currentProgress.is_completed) {
      setResumeTime(currentProgress.watch_time_seconds);
      setShowResumePrompt(true);
    }
  };

  const loadTodayProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('video_progress')
      .select('watch_time_seconds')
      .eq('user_id', user.id)
      .gte('last_watched_at', today);

    if (data) {
      const totalSeconds = data.reduce((sum, item) => sum + (item.watch_time_seconds || 0), 0);
      setTodayWatchTime(totalSeconds);
    }
  };

  const adjustSidebarWidth = (delta: number) => {
    const newWidth = sidebarWidth + delta;
    if (newWidth >= 300 && newWidth <= 600) {
      setSidebarWidth(newWidth);
    }
  };

  const toggleAutoPlay = () => {
    setAutoPlay(!autoPlay);
    toast.success(`Auto-play ${!autoPlay ? 'enabled' : 'disabled'}`);
  };

  const addBookmark = () => {
    const bookmark = {
      videoId: videos[currentVideoIndex]?.id,
      timestamp: currentTimestamp,
      note: `Bookmark at ${formatTime(currentTimestamp)}`,
      createdAt: new Date(),
    };
    setBookmarks([...bookmarks, bookmark]);
    toast.success('Bookmark added! 📌');
  };

  const loadPlaylistData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: playlistData, error: playlistError } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", playlistId)
        .eq("user_id", user.id)
        .single();

      if (playlistError) throw playlistError;
      setPlaylist(playlistData);

      const { data: videosData, error: videosError } = await supabase
        .from("videos")
        .select("*")
        .eq("playlist_id", playlistId)
        .order("position_order", { ascending: true });

      if (videosError) throw videosError;
      setVideos(videosData || []);

      const { data: progressData } = await supabase
        .from("video_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("playlist_id", playlistId);

      setProgress(progressData || []);

      if (progressData && progressData.length > 0) {
        const lastWatched = progressData.reduce((prev, current) => 
          new Date(current.last_watched_at) > new Date(prev.last_watched_at) ? current : prev
        );
        const videoIndex = videosData?.findIndex(v => v.id === lastWatched.video_id) || 0;
        setCurrentVideoIndex(Math.max(0, videoIndex));
      }

      await supabase
        .from("playlists")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", playlistId);

    } catch (error) {
      console.error("Error loading playlist:", error);
      toast.error("Failed to load playlist");
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async (time: number, manual: boolean = false) => {
    if (!videos[currentVideoIndex]) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const existingProgress = progress.find(
        p => p.video_id === videos[currentVideoIndex].id
      );

      if (existingProgress) {
        await supabase
          .from("video_progress")
          .update({
            watch_time_seconds: Math.floor(time),
            last_watched_at: new Date().toISOString(),
          })
          .eq("id", existingProgress.id);
      } else {
        const { data: newProgress } = await supabase
          .from("video_progress")
          .insert({
            user_id: user.id,
            video_id: videos[currentVideoIndex].id,
            playlist_id: playlistId!,
            watch_time_seconds: Math.floor(time),
            is_completed: false,
          })
          .select()
          .single();

        if (newProgress) {
          setProgress([...progress, newProgress]);
        }
      }

      if (manual) {
        toast.success('Progress saved! ✓');
      }
    } catch (error) {
      console.error("Error saving progress:", error);
      if (manual) {
        toast.error("Failed to save progress");
      }
    }
  };

  const handleMarkComplete = async () => {
    if (!videos[currentVideoIndex]) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const existingProgress = progress.find(
        p => p.video_id === videos[currentVideoIndex].id
      );

      if (existingProgress) {
        await supabase
          .from("video_progress")
          .update({ 
            is_completed: !existingProgress.is_completed,
            watch_time_seconds: videos[currentVideoIndex].duration_seconds 
          })
          .eq("id", existingProgress.id);
      } else {
        await supabase
          .from("video_progress")
          .insert({
            user_id: user.id,
            video_id: videos[currentVideoIndex].id,
            playlist_id: playlistId!,
            watch_time_seconds: videos[currentVideoIndex].duration_seconds,
            is_completed: true,
          });
      }

      await loadPlaylistData();
      toast.success(
        existingProgress?.is_completed ? "Marked as incomplete" : "Marked as complete ✓"
      );
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    }
  };

  const handleNext = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
      setCurrentTimestamp(0);
      setShowResumePrompt(false);
      toast.success("Next video loaded");
    } else {
      toast.info("Playlist completed! 🎉");
    }
  };

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
      setCurrentTimestamp(0);
      setShowResumePrompt(false);
      toast.success("Previous video loaded");
    } else {
      toast.info("This is the first video!");
    }
  };

  const handleResume = () => {
    setShowResumePrompt(false);
    // YouTube iframe will handle seeking via URL parameter
    const iframe = iframeRef.current;
    if (iframe) {
      const currentSrc = iframe.src;
      const newSrc = currentSrc.includes('&start=') 
        ? currentSrc.replace(/&start=\d+/, `&start=${Math.floor(resumeTime)}`)
        : `${currentSrc}&start=${Math.floor(resumeTime)}`;
      iframe.src = newSrc;
    }
  };

  const getVideoProgress = (videoId: string) => {
    const prog = progress.find(p => p.video_id === videoId);
    if (!prog) return { completed: false, percentage: 0 };
    
    const video = videos.find(v => v.id === videoId);
    const percentage = prog.is_completed 
      ? 100 
      : video ? (prog.watch_time_seconds / video.duration_seconds) * 100 : 0;
    
    return { completed: prog.is_completed, percentage };
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center space-y-3">
          <div className="text-2xl font-bold text-primary">Loading playlist...</div>
          <Progress value={33} className="w-64" />
        </div>
      </div>
    );
  }

  if (!playlist || videos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Playlist not found</h2>
          <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex];
  const currentProgress = getVideoProgress(currentVideo.id);
  const completedCount = videos.filter(v => getVideoProgress(v.id).completed).length;
  const playlistProgress = (completedCount / videos.length) * 100;
  const dailyGoalProgress = (todayWatchTime / (dailyGoal * 60)) * 100;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Enhanced Header with Stats */}
      <header className="border-b bg-card px-4 py-2 flex items-center gap-3 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{playlist.title}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {completedCount}/{videos.length}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(totalWatchTime)} today
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Daily: {Math.min(100, Math.round(dailyGoalProgress))}%
            </span>
          </div>
        </div>
        
        {/* Quick Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => saveProgress(currentTimestamp, true)}
        >
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowNotesDialog(true)}
        >
          <Sparkles className="h-4 w-4 mr-1" />
          AI Notes
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Video Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Player - Proper 16:9 Aspect Ratio */}
          <div className="flex-1 bg-black flex items-center justify-center relative">
            <div className="w-full h-full max-w-[1920px] max-h-[1080px] flex items-center justify-center">
              <div className="w-full" style={{ aspectRatio: '16/9' }}>
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube.com/embed/${currentVideo.youtube_video_id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1${showResumePrompt ? '' : resumeTime > 0 ? `&start=${Math.floor(resumeTime)}` : ''}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={currentVideo.title}
                />
              </div>
            </div>

            {/* Resume Prompt Overlay */}
            {showResumePrompt && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-card p-6 rounded-lg shadow-xl space-y-4 max-w-md">
                  <h3 className="text-lg font-semibold">Continue watching?</h3>
                  <p className="text-sm text-muted-foreground">
                    You watched {Math.round((resumeTime / currentVideo.duration_seconds) * 100)}% of this video
                  </p>
                  <p className="text-primary font-medium">Resume from {formatTime(resumeTime)}</p>
                  <div className="flex gap-3">
                    <Button onClick={handleResume} className="flex-1">
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowResumePrompt(false)}
                      className="flex-1"
                    >
                      Start Over
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Sidebar Toggle Button */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 z-40"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          {/* Video Info & Controls */}
          <div className="bg-card border-t p-4 space-y-4">
            {/* Title & Actions */}
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold leading-tight mb-1">
                  {currentVideo.title}
                </h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Circle className="h-3 w-3" />
                    {currentVideo.channel_name || 'Unknown Channel'}
                  </span>
                  <a
                    href={`https://www.youtube.com/watch?v=${currentVideo.youtube_video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    Watch on YouTube
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkComplete}
                >
                  {currentProgress.completed ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
                      Watched
                    </>
                  ) : (
                    <>
                      <Circle className="h-4 w-4 mr-1" />
                      Mark Watched
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addBookmark}
                >
                  <BookmarkPlus className="h-4 w-4 mr-1" />
                  Bookmark
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/analytics/${playlistId}`)}
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Analytics
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Playlist Progress</span>
                <span className="font-medium">{Math.round(playlistProgress)}%</span>
              </div>
              <Progress value={playlistProgress} className="h-2" />
            </div>

            {/* Navigation & Features */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentVideoIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground px-2">
                Video {currentVideoIndex + 1} of {videos.length}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentVideoIndex === videos.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>

              <div className="flex-1" />

              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium">{completedCount} completed</span>
              </div>

              <Button
                variant={autoPlay ? "default" : "outline"}
                size="sm"
                onClick={toggleAutoPlay}
              >
                <Play className="h-4 w-4 mr-1" />
                Auto: {autoPlay ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
        </div>

        {/* Resizable Sidebar */}
        {!sidebarCollapsed && (
          <>
            {/* Resize Handle */}
            <div
              className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors"
              onMouseDown={() => setIsResizing(true)}
            />

            <div 
              className="border-l bg-card flex flex-col overflow-hidden"
              style={{ width: `${sidebarWidth}px` }}
            >
              {/* Search & Stats */}
              <div className="p-3 border-b space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search videos..."
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/50 rounded p-2">
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Zap className="h-3 w-3" />
                      <span>Streak</span>
                    </div>
                    <div className="font-bold text-sm">5 days</div>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Award className="h-3 w-3" />
                      <span>Progress</span>
                    </div>
                    <div className="font-bold text-sm">{Math.round(playlistProgress)}%</div>
                  </div>
                </div>
              </div>

              {/* Video List */}
              <div className="flex-1 overflow-y-auto">
                {filteredVideos.map((video, index) => {
                  const videoProgress = getVideoProgress(video.id);
                  const isActive = video.id === currentVideo.id;

                  return (
                    <button
                      key={video.id}
                      onClick={() => {
                        setCurrentVideoIndex(videos.findIndex(v => v.id === video.id));
                        setShowResumePrompt(false);
                      }}
                      className={`w-full p-3 flex gap-3 hover:bg-muted/50 transition-colors border-b text-left ${
                        isActive ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className={`${sidebarWidth > 450 ? 'w-32 h-18' : 'w-24 h-14'} object-cover rounded transition-all`}
                        />
                        {videoProgress.completed && (
                          <div className="absolute top-1 right-1 bg-green-600 rounded-full p-0.5">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded">
                            <Play className="h-6 w-6 text-white fill-white" />
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                          {formatTime(video.duration_seconds)}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium line-clamp-2 mb-1 ${isActive ? 'text-primary' : ''}`}>
                          {video.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>#{index + 1}</span>
                          {videoProgress.percentage > 0 && !videoProgress.completed && (
                            <span className="text-primary">{Math.round(videoProgress.percentage)}%</span>
                          )}
                        </div>
                        {videoProgress.percentage > 0 && !videoProgress.completed && (
                          <Progress value={videoProgress.percentage} className="h-1 mt-1" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <GenerateNotesDialog
        open={showNotesDialog}
        onOpenChange={setShowNotesDialog}
        videoId={currentVideo.id}
        videoTitle={currentVideo.title}
        youtubeVideoId={currentVideo.youtube_video_id}
        onNotesGenerated={loadPlaylistData}
      />
    </div>
  );
};

export default Player;
