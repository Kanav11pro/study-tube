import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Sparkles,
  Play,
  BarChart3
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

  useEffect(() => {
    if (!playlistId) return;
    loadPlaylistData();
    
    // Auto-save progress every 10 seconds
    const interval = setInterval(() => {
      if (currentVideoIndex >= 0) {
        saveProgress();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [playlistId, currentVideoIndex]);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        handleNext();
      } else if (e.key === 'p' && !e.ctrlKey && !e.metaKey) {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentVideoIndex, videos]);

  const loadPlaylistData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch playlist
      const { data: playlistData, error: playlistError } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", playlistId)
        .eq("user_id", user.id)
        .single();

      if (playlistError) throw playlistError;
      setPlaylist(playlistData);

      // Fetch videos
      const { data: videosData, error: videosError } = await supabase
        .from("videos")
        .select("*")
        .eq("playlist_id", playlistId)
        .order("position_order", { ascending: true });

      if (videosError) throw videosError;
      setVideos(videosData || []);

      // Fetch progress
      const { data: progressData } = await supabase
        .from("video_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("playlist_id", playlistId);

      setProgress(progressData || []);

      // Find last watched video
      if (progressData && progressData.length > 0) {
        const lastWatched = progressData.reduce((prev, current) => 
          new Date(current.last_watched_at) > new Date(prev.last_watched_at) ? current : prev
        );
        const videoIndex = videosData?.findIndex(v => v.id === lastWatched.video_id) || 0;
        setCurrentVideoIndex(Math.max(0, videoIndex));
      }

      // Update last accessed
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

  const saveProgress = async () => {
    if (!videos[currentVideoIndex]) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const iframe = document.querySelector('iframe');
    if (!iframe) return;

    try {
      // Get current time would require YouTube Player API
      // For now, just update last watched
      const existingProgress = progress.find(
        p => p.video_id === videos[currentVideoIndex].id
      );

      if (existingProgress) {
        await supabase
          .from("video_progress")
          .update({
            last_watched_at: new Date().toISOString(),
          })
          .eq("id", existingProgress.id);
      } else {
        await supabase
          .from("video_progress")
          .insert({
            user_id: user.id,
            video_id: videos[currentVideoIndex].id,
            playlist_id: playlistId!,
            watch_time_seconds: 0,
            is_completed: false,
          });
        loadPlaylistData();
      }
    } catch (error) {
      console.error("Error saving progress:", error);
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
        existingProgress?.is_completed ? "Marked as incomplete" : "Marked as complete"
      );
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    }
  };

  const handleNext = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const getVideoProgress = (videoId: string) => {
    const prog = progress.find(p => p.video_id === videoId);
    if (!prog) return { completed: false, percentage: 0 };
    
    const percentage = prog.is_completed 
      ? 100 
      : (prog.watch_time_seconds / videos.find(v => v.id === videoId)?.duration_seconds || 0) * 100;
    
    return { completed: prog.is_completed, percentage };
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-lg truncate">{currentVideo.title}</h1>
            <p className="text-sm text-muted-foreground">
              Video {currentVideoIndex + 1} of {videos.length}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Video Player Section */}
        <div className="flex-1 p-4 lg:p-6">
          <div className="max-w-5xl mx-auto space-y-4">
            {/* YouTube Player */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${currentVideo.youtube_video_id}?autoplay=1&rel=0&modestbranding=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowNotesDialog(true)}
                className="bg-gradient-primary flex-1 sm:flex-initial"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Notes
              </Button>
              
              <Button
                variant={currentProgress.completed ? "default" : "outline"}
                onClick={handleMarkComplete}
                className="flex-1 sm:flex-initial"
              >
                {currentProgress.completed ? (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                ) : (
                  <Circle className="h-4 w-4 mr-2" />
                )}
                {currentProgress.completed ? "Completed" : "Mark Complete"}
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate(`/analytics/${playlistId}`)}
                className="flex-1 sm:flex-initial"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        </div>

        {/* Playlist Sidebar */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l bg-card">
          <div className="p-4 border-b sticky top-0 bg-card z-10">
            <h2 className="font-semibold">{playlist.title}</h2>
            <p className="text-sm text-muted-foreground">
              {videos.filter(v => getVideoProgress(v.id).completed).length} / {videos.length} completed
            </p>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-8rem)]">
            {videos.map((video, index) => {
              const videoProgress = getVideoProgress(video.id);
              const isActive = index === currentVideoIndex;

              return (
                <button
                  key={video.id}
                  onClick={() => setCurrentVideoIndex(index)}
                  className={`w-full p-3 flex gap-3 hover:bg-muted/50 transition-colors border-b ${
                    isActive ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-24 h-16 object-cover rounded"
                    />
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                        <Play className="h-6 w-6 text-white fill-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-start gap-2">
                      {videoProgress.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{video.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                    {!videoProgress.completed && videoProgress.percentage > 0 && (
                      <Progress value={videoProgress.percentage} className="h-1 mt-2" />
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
