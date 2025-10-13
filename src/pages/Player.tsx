import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Sparkles,
  Play,
  BarChart3,
  Maximize2,
  Minimize2,
  Search,
  X,
  Keyboard,
  Pause
} from "lucide-react";
import { toast } from "sonner";
import { GenerateNotesDialog } from "@/components/GenerateNotesDialog";
import { motion, AnimatePresence } from "framer-motion";

// YouTube Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const Player = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef<any>(null);
  const [playlist, setPlaylist] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [progress, setProgress] = useState<any[]>([]);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [theaterMode, setTheaterMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [resumeTime, setResumeTime] = useState(0);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API Ready');
      };
    }
  }, []);

  useEffect(() => {
    if (!playlistId) return;
    loadPlaylistData();
  }, [playlistId]);

  useEffect(() => {
    if (videos.length > 0 && window.YT && window.YT.Player) {
      initializePlayer();
    }
  }, [currentVideoIndex, videos]);

  // Auto-save progress every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && currentTime > 0) {
        saveProgress(currentTime);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentTime, currentVideoIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement) return;

      switch(e.key.toLowerCase()) {
        case 'n':
          if (!e.ctrlKey && !e.metaKey) handleNext();
          break;
        case 'p':
          if (!e.ctrlKey && !e.metaKey) handlePrevious();
          break;
        case 't':
          setTheaterMode(!theaterMode);
          break;
        case 'f':
          setFocusMode(!focusMode);
          break;
        case '?':
          setShowKeyboardHelp(!showKeyboardHelp);
          break;
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'arrowleft':
          seekBackward();
          break;
        case 'arrowright':
          seekForward();
          break;
        case 'm':
          handleMarkComplete();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentVideoIndex, videos, theaterMode, focusMode, showKeyboardHelp]);

  const initializePlayer = () => {
    if (!videos[currentVideoIndex]) return;

    // Destroy existing player
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: videos[currentVideoIndex].youtube_video_id,
      playerVars: {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        fs: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  };

  const onPlayerReady = (event: any) => {
    setDuration(event.target.getDuration());
    
    // Check for resume point
    const currentProgress = progress.find(
      p => p.video_id === videos[currentVideoIndex].id
    );
    
    if (currentProgress && currentProgress.watch_time_seconds > 30 && !currentProgress.is_completed) {
      setResumeTime(currentProgress.watch_time_seconds);
      setShowResumePrompt(true);
    }

    // Update time every second
    setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 1000);
  };

  const onPlayerStateChange = (event: any) => {
    // 1 = playing, 2 = paused
    setIsPlaying(event.data === 1);

    // Auto-play next video when current ends
    if (event.data === 0) { // Video ended
      handleMarkComplete();
      setTimeout(handleNext, 2000);
    }
  };

  const handleResume = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(resumeTime);
      setShowResumePrompt(false);
    }
  };

  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const seekForward = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(currentTime + 10);
    }
  };

  const seekBackward = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(Math.max(0, currentTime - 10));
    }
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

  const saveProgress = async (time: number) => {
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
        await supabase
          .from("video_progress")
          .insert({
            user_id: user.id,
            video_id: videos[currentVideoIndex].id,
            playlist_id: playlistId!,
            watch_time_seconds: Math.floor(time),
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
    
    const video = videos.find(v => v.id === videoId);
    const percentage = prog.is_completed 
      ? 100 
      : video ? (prog.watch_time_seconds / video.duration_seconds) * 100 : 0;
    
    return { completed: prog.is_completed, percentage };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

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
  const completedCount = videos.filter(v => getVideoProgress(v.id).completed).length;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <motion.header 
        className="bg-card/95 backdrop-blur border-b"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="container mx-auto flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base truncate">{currentVideo.title}</h1>
            <p className="text-xs text-muted-foreground">
              Video {currentVideoIndex + 1} of {videos.length} • {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheaterMode(!theaterMode)}
              title="Theater Mode (T)"
            >
              {theaterMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowKeyboardHelp(true)}
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video Player Section */}
        <motion.div 
          className={`flex-1 flex flex-col ${theaterMode ? 'lg:w-[90%]' : ''} ${focusMode ? 'w-full' : ''}`}
          layout
          transition={{ duration: 0.3 }}
        >
          <div className="flex-1 flex items-center justify-center bg-black p-4 lg:p-6">
            <div className="w-full max-w-7xl space-y-4">
              {/* YouTube Player */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                <div id="youtube-player" className="w-full h-full" />
                
                {/* Resume Prompt */}
                <AnimatePresence>
                  {showResumePrompt && (
                    <motion.div
                      className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Card className="p-6 space-y-4 bg-card/95 backdrop-blur">
                        <h3 className="text-lg font-semibold">Continue watching?</h3>
                        <p className="text-sm text-muted-foreground">
                          Resume from {formatTime(resumeTime)}
                        </p>
                        <div className="flex gap-3">
                          <Button onClick={handleResume} className="flex-1">
                            Resume
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowResumePrompt(false)}
                            className="flex-1"
                          >
                            Start from beginning
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress 
                  value={duration > 0 ? (currentTime / duration) * 100 : 0} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <motion.div 
                className="flex flex-wrap gap-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
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

                <Button
                  variant="outline"
                  onClick={() => setFocusMode(!focusMode)}
                  className="flex-1 sm:flex-initial"
                  title="Focus Mode (F)"
                >
                  {focusMode ? "Exit Focus" : "Focus Mode"}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Playlist Sidebar */}
        <AnimatePresence>
          {!focusMode && (
            <motion.div 
              className={`${theaterMode ? 'lg:w-[400px]' : 'lg:w-96'} w-full border-t lg:border-t-0 lg:border-l bg-card flex flex-col`}
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b space-y-3 bg-card/95 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold truncate">{playlist.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {completedCount} / {videos.length} completed
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setFocusMode(true)}
                    className="lg:hidden"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search videos..."
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                <Progress value={(completedCount / videos.length) * 100} className="h-2" />
              </div>

              {/* Video List */}
              <div className="flex-1 overflow-y-auto">
                {filteredVideos.map((video, index) => {
                  const videoProgress = getVideoProgress(video.id);
                  const isActive = video.id === currentVideo.id;

                  return (
                    <motion.button
                      key={video.id}
                      onClick={() => setCurrentVideoIndex(videos.findIndex(v => v.id === video.id))}
                      className={`w-full p-3 flex gap-3 hover:bg-muted/50 transition-colors border-b ${
                        isActive ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                      }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-32 h-20 object-cover rounded shadow-md"
                        />
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded">
                            {isPlaying ? (
                              <Pause className="h-8 w-8 text-white fill-white" />
                            ) : (
                              <Play className="h-8 w-8 text-white fill-white" />
                            )}
                          </div>
                        )}
                        {!isActive && videoProgress.completed && (
                          <div className="absolute top-1 right-1 bg-success rounded-full p-1">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-muted-foreground font-mono mt-1">
                            #{index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium line-clamp-2 ${isActive ? 'text-primary' : ''}`}>
                              {video.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
                            </p>
                          </div>
                        </div>
                        {!videoProgress.completed && videoProgress.percentage > 0 && (
                          <Progress value={videoProgress.percentage} className="h-1 mt-2" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <AnimatePresence>
        {showKeyboardHelp && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowKeyboardHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="p-6 max-w-md">
                <h3 className="text-xl font-bold mb-4">Keyboard Shortcuts</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Space</span>
                    <span>Play / Pause</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">N</span>
                    <span>Next video</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">P</span>
                    <span>Previous video</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">M</span>
                    <span>Mark complete</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">T</span>
                    <span>Theater mode</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">F</span>
                    <span>Focus mode</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">← →</span>
                    <span>Seek ±10s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">?</span>
                    <span>Show shortcuts</span>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowKeyboardHelp(false)} 
                  className="w-full mt-4"
                >
                  Got it!
                </Button>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
