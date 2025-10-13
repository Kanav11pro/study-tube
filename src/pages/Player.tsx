import { useEffect, useState } from "react";
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
  Maximize,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { GenerateNotesDialog } from "@/components/GenerateNotesDialog";

const Player = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [progress, setProgress] = useState<any[]>([]);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!playlistId) return;
    loadPlaylistData();
  }, [playlistId]);

  // Keyboard shortcuts - ENHANCED
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
          setAutoPlay(!autoPlay);
          toast.success(`Auto-play ${!autoPlay ? 'enabled' : 'disabled'}`);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentVideoIndex, videos, autoPlay]);

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
          .update({ is_completed: !existingProgress.is_completed })
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

      loadPlaylistData();
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
      toast.success("Next video loaded");
    } else {
      toast.info("This is the last video!");
    }
  };

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
      toast.success("Previous video loaded");
    } else {
      toast.info("This is the first video!");
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
        <div className="animate-pulse text-center">
          <div className="text-2xl font-bold text-primary">Loading playlist...</div>
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

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Minimal Header */}
      <header className="border-b bg-card px-4 py-2 flex items-center gap-3 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{playlist.title}</p>
          <p className="text-xs text-muted-foreground">
            {completedCount} / {videos.length} completed
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowNotesDialog(true)}
          className="bg-primary"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          AI Notes
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Video Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Player - NO PADDING */}
          <div className="flex-1 bg-black flex items-center justify-center">
            <div className="w-full h-full max-w-[1800px]">
              <iframe
                src={`https://www.youtube.com/embed/${currentVideo.youtube_video_id}?autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={currentVideo.title}
              />
            </div>
          </div>

          {/* Video Info & Controls - Clean like ThinkTube */}
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

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentVideoIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground px-3">
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

              <Button
                variant={autoPlay ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setAutoPlay(!autoPlay);
                  toast.success(`Auto-play ${!autoPlay ? 'enabled' : 'disabled'}`);
                }}
              >
                <Play className="h-4 w-4 mr-1" />
                Auto-play: {autoPlay ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar - Clean & Compact */}
        <div className="w-80 border-l bg-card flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="pl-9 h-9"
              />
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
                  onClick={() => setCurrentVideoIndex(videos.findIndex(v => v.id === video.id))}
                  className={`w-full p-3 flex gap-3 hover:bg-muted/50 transition-colors border-b text-left ${
                    isActive ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-28 h-16 object-cover rounded"
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
                        <span className="text-primary">{Math.round(videoProgress.percentage)}% watched</span>
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
