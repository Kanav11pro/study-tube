import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Zap,
  Award,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  X,
  StickyNote,
  Bell,
  Shuffle,
  Keyboard,
  Coffee
} from "lucide-react";
import { toast } from "sonner";
import { GenerateNotesDialog } from "@/components/GenerateNotesDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const breakReminderRef = useRef<NodeJS.Timeout | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
  const [playlist, setPlaylist] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [originalVideos, setOriginalVideos] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [progress, setProgress] = useState<any[]>([]);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [autoPlay, setAutoPlay] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [resumeTime, setResumeTime] = useState(0);
  const [ytPlayerReady, setYtPlayerReady] = useState(false);
  
  // Quick Notes
  const [showQuickNotes, setShowQuickNotes] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState("");
  const [savedNotes, setSavedNotes] = useState<any[]>([]);
  
  // Break Reminders
  const [breakReminderEnabled, setBreakReminderEnabled] = useState(false);
  const [breakInterval, setBreakInterval] = useState(45); // minutes
  const [showBreakDialog, setShowBreakDialog] = useState(false);
  const [studyTimeElapsed, setStudyTimeElapsed] = useState(0);
  const [showBreakSettings, setShowBreakSettings] = useState(false);
  
  // Shuffle Mode
  const [isShuffled, setIsShuffled] = useState(false);
  
  // Keyboard Shortcuts
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  
  // Stats
  const [completedCount, setCompletedCount] = useState(0);
  const [totalWatchTime, setTotalWatchTime] = useState(0);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube IFrame API Ready');
        setYtPlayerReady(true);
      };
    } else {
      setYtPlayerReady(true);
    }
  }, []);

  useEffect(() => {
    if (!playlistId) return;
    loadPlaylistData();
  }, [playlistId]);

  useEffect(() => {
    if (ytPlayerReady && videos.length > 0 && !playerRef.current) {
      initializePlayer();
    }
  }, [ytPlayerReady, videos, currentVideoIndex]);

  // Update progress every second
  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 1000);

    return () => clearInterval(updateInterval);
  }, []);

  // Auto-save progress every 5 seconds
  useEffect(() => {
    progressIntervalRef.current = setInterval(() => {
      if (currentTime > 0 && isPlaying) {
        saveProgress(currentTime, false);
      }
    }, 5000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentTime, currentVideoIndex, isPlaying]);

  // Study time tracker for break reminders
  useEffect(() => {
    if (!breakReminderEnabled) return;

    const studyInterval = setInterval(() => {
      if (isPlaying) {
        setStudyTimeElapsed(prev => {
          const newTime = prev + 1;
          if (newTime >= breakInterval * 60) {
            showBreakReminder();
            return 0; // Reset after showing reminder
          }
          return newTime;
        });
      }
    }, 1000);

    return () => clearInterval(studyInterval);
  }, [isPlaying, breakReminderEnabled, breakInterval]);

  // Total watch time tracker
  useEffect(() => {
    const watchInterval = setInterval(() => {
      if (isPlaying) {
        setTotalWatchTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(watchInterval);
  }, [isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch(e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
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
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            saveProgress(currentTime, true);
          }
          break;
        case 'q':
          setShowQuickNotes(!showQuickNotes);
          break;
        case 'arrowleft':
          seek(-10);
          break;
        case 'arrowright':
          seek(10);
          break;
        case 'arrowup':
          e.preventDefault();
          changeVolume(10);
          break;
        case 'arrowdown':
          e.preventDefault();
          changeVolume(-10);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case '?':
          setShowKeyboardHelp(true);
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
  }, [currentTime, isPlaying, showQuickNotes, sidebarWidth]);

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

  const initializePlayer = () => {
    if (!videos[currentVideoIndex]) return;
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    const videoToPlay = videos[currentVideoIndex];
    
    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: videoToPlay.youtube_video_id,
      playerVars: {
        autoplay: 1,
        controls: 0, // Hide default controls
        rel: 0,
        modestbranding: 1,
        fs: 0, // Disable fullscreen button (we'll add custom)
        disablekb: 1, // Disable keyboard (we handle it)
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  };

  const onPlayerReady = (event: any) => {
    setDuration(event.target.getDuration());
    setVolume(event.target.getVolume());
    
    // Check for resume point
    const currentProgress = progress.find(
      p => p.video_id === videos[currentVideoIndex]?.id
    );
    
    if (currentProgress && currentProgress.watch_time_seconds > 30 && !currentProgress.is_completed) {
      setResumeTime(currentProgress.watch_time_seconds);
      setShowResumePrompt(true);
      event.target.pauseVideo();
    }
  };

  const onPlayerStateChange = (event: any) => {
    // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: video cued
    setIsPlaying(event.data === 1);

    if (event.data === 0) { // Video ended
      handleVideoEnd();
    }
  };

  const handleVideoEnd = async () => {
    await handleMarkComplete();
    toast.success('Video completed! ✓');
    
    if (autoPlay && currentVideoIndex < videos.length - 1) {
      setTimeout(() => {
        handleNext();
      }, 2000);
    } else if (currentVideoIndex >= videos.length - 1) {
      toast.success('Playlist completed! 🎉');
    }
  };

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const seek = (seconds: number) => {
    if (!playerRef.current) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    playerRef.current.seekTo(newTime);
    setCurrentTime(newTime);
  };

  const changeVolume = (delta: number) => {
    if (!playerRef.current) return;
    const newVolume = Math.max(0, Math.min(100, volume + delta));
    playerRef.current.setVolume(newVolume);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (!playerRef.current) return;
    playerRef.current.setPlaybackRate(rate);
    setPlaybackRate(rate);
    toast.success(`Speed: ${rate}x`);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleResume = () => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(resumeTime);
    playerRef.current.playVideo();
    setShowResumePrompt(false);
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

  const toggleShuffle = () => {
    if (isShuffled) {
      // Restore original order
      setVideos([...originalVideos]);
      setIsShuffled(false);
      toast.success('Shuffle disabled - Original order restored');
    } else {
      // Shuffle videos
      const shuffled = [...videos].sort(() => Math.random() - 0.5);
      setVideos(shuffled);
      setIsShuffled(true);
      toast.success('Shuffle enabled - Videos randomized!');
    }
  };

  const showBreakReminder = () => {
    setShowBreakDialog(true);
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
    toast.info('Time for a break! ☕');
  };

  const dismissBreak = () => {
    setShowBreakDialog(false);
    setStudyTimeElapsed(0);
  };

  const takeBreak = () => {
    setShowBreakDialog(false);
    setStudyTimeElapsed(0);
    toast.success('Enjoy your break! Come back refreshed 🌟');
  };

  const saveQuickNote = async () => {
    if (!quickNoteText.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const note = {
        user_id: user.id,
        video_id: videos[currentVideoIndex].id,
        playlist_id: playlistId!,
        note_text: quickNoteText,
        timestamp_seconds: Math.floor(currentTime),
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('video_notes')
        .insert(note)
        .select()
        .single();

      if (error) throw error;

      setSavedNotes([...savedNotes, data]);
      setQuickNoteText("");
      toast.success('Note saved! 📝');
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
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
      setOriginalVideos(videosData || []);

      const { data: progressData } = await supabase
        .from("video_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("playlist_id", playlistId);

      setProgress(progressData || []);
      setCompletedCount(progressData?.filter(p => p.is_completed).length || 0);

      if (progressData && progressData.length > 0) {
        const lastWatched = progressData.reduce((prev, current) => 
          new Date(current.last_watched_at) > new Date(prev.last_watched_at) ? current : prev
        );
        const videoIndex = videosData?.findIndex(v => v.id === lastWatched.video_id) || 0;
        setCurrentVideoIndex(Math.max(0, videoIndex));
      }

      // Load notes
      const { data: notesData } = await supabase
        .from('video_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('playlist_id', playlistId)
        .order('created_at', { ascending: false });

      if (notesData) {
        setSavedNotes(notesData);
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
      setCurrentTime(0);
      setShowResumePrompt(false);
      toast.success("Next video loaded");
    } else {
      toast.info("Playlist completed! 🎉");
    }
  };

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
      setCurrentTime(0);
      setShowResumePrompt(false);
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
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
  const playlistProgress = (completedCount / videos.length) * 100;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
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
            {breakReminderEnabled && (
              <span className="flex items-center gap-1 text-primary">
                <Bell className="h-3 w-3" />
                Break in {Math.max(0, Math.ceil((breakInterval * 60 - studyTimeElapsed) / 60))}m
              </span>
            )}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => saveProgress(currentTime, true)}
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
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Video Player */}
          <div 
            ref={playerContainerRef}
            className="relative bg-black flex items-center justify-center"
            style={{ minHeight: '60vh' }}
          >
            <div className="w-full max-w-[1920px] mx-auto" style={{ aspectRatio: '16/9' }}>
              <div id="youtube-player" className="w-full h-full" />
            </div>

            {/* Resume Prompt */}
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
                      onClick={() => {
                        setShowResumePrompt(false);
                        if (playerRef.current) playerRef.current.playVideo();
                      }}
                      className="flex-1"
                    >
                      Start Over
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
              {/* Progress Bar */}
              <div className="mb-3">
                <Progress 
                  value={duration > 0 ? (currentTime / duration) * 100 : 0} 
                  className="h-1 cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = x / rect.width;
                    const newTime = percentage * duration;
                    if (playerRef.current) {
                      playerRef.current.seekTo(newTime);
                    }
                  }}
                />
                <div className="flex justify-between text-xs text-white/80 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>

                <span className="text-white text-sm">
                  Video {currentVideoIndex + 1} / {videos.length}
                </span>

                <div className="flex-1" />

                <Select value={playbackRate.toString()} onValueChange={(v) => changePlaybackRate(parseFloat(v))}>
                  <SelectTrigger className="w-20 h-8 text-white border-white/20 bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="0.75">0.75x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="1.25">1.25x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="1.75">1.75x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Sidebar Toggle */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 z-40"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>

            {/* Quick Notes Toggle */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 left-4 z-40"
              onClick={() => setShowQuickNotes(!showQuickNotes)}
            >
              <StickyNote className="h-4 w-4" />
            </Button>
          </div>

          {/* Video Info & Controls */}
          <div className="bg-card border-t p-4 space-y-4">
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

              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handleMarkComplete}>
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

                <Button variant="outline" size="sm" onClick={() => navigate(`/analytics/${playlistId}`)}>
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Analytics
                </Button>

                <Button
                  variant={isShuffled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleShuffle}
                >
                  <Shuffle className="h-4 w-4 mr-1" />
                  Shuffle
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKeyboardHelp(true)}
                >
                  <Keyboard className="h-4 w-4 mr-1" />
                  Shortcuts
                </Button>

                <Button
                  variant={breakReminderEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowBreakSettings(true)}
                >
                  <Bell className="h-4 w-4 mr-1" />
                  Breaks
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Playlist Progress</span>
                <span className="font-medium">{Math.round(playlistProgress)}%</span>
              </div>
              <Progress value={playlistProgress} className="h-2" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handlePrevious} disabled={currentVideoIndex === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground px-2">
                Video {currentVideoIndex + 1} of {videos.length}
              </span>

              <Button variant="outline" size="sm" onClick={handleNext} disabled={currentVideoIndex === videos.length - 1}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>

              <div className="flex-1" />

              <Button variant={autoPlay ? "default" : "outline"} size="sm" onClick={toggleAutoPlay}>
                <Play className="h-4 w-4 mr-1" />
                Auto: {autoPlay ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Notes Panel */}
        {showQuickNotes && (
          <div className="w-80 border-l bg-card flex flex-col">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Quick Notes
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowQuickNotes(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-3 border-b space-y-2">
              <Textarea
                placeholder="Type your notes here..."
                value={quickNoteText}
                onChange={(e) => setQuickNoteText(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <div className="flex gap-2">
                <Button onClick={saveQuickNote} className="flex-1">
                  <Save className="h-4 w-4 mr-1" />
                  Save Note
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                At: {formatTime(currentTime)}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {savedNotes
                .filter(n => n.video_id === currentVideo.id)
                .map((note, idx) => (
                  <div key={idx} className="bg-muted/50 p-3 rounded text-sm space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {formatTime(note.timestamp_seconds)}
                    </p>
                    <p className="whitespace-pre-wrap">{note.note_text}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Sidebar */}
        {!sidebarCollapsed && !showQuickNotes && (
          <>
            <div
              className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors"
              onMouseDown={() => setIsResizing(true)}
            />

            <div 
              className="border-l bg-card flex flex-col overflow-hidden"
              style={{ width: `${sidebarWidth}px` }}
            >
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

      {/* Break Reminder Dialog */}
      <Dialog open={showBreakDialog} onOpenChange={setShowBreakDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Time for a Break!
            </DialogTitle>
            <DialogDescription>
              You've been studying for {breakInterval} minutes. Taking regular breaks improves focus and retention!
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button onClick={takeBreak} className="flex-1">
              Take 5-min Break
            </Button>
            <Button variant="outline" onClick={dismissBreak} className="flex-1">
              Continue Studying
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Break Settings Dialog */}
      <Dialog open={showBreakSettings} onOpenChange={setShowBreakSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Break Reminder Settings</DialogTitle>
            <DialogDescription>
              Configure your study break reminders
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="break-enabled">Enable Break Reminders</Label>
              <Switch
                id="break-enabled"
                checked={breakReminderEnabled}
                onCheckedChange={setBreakReminderEnabled}
              />
            </div>

            {breakReminderEnabled && (
              <div className="space-y-2">
                <Label>Reminder Interval (minutes)</Label>
                <Select value={breakInterval.toString()} onValueChange={(v) => setBreakInterval(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 minutes (Pomodoro)</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button onClick={() => setShowBreakSettings(false)}>
            Save Settings
          </Button>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Master these shortcuts for faster navigation
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Playback</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Space</span><span className="text-muted-foreground">Play/Pause</span></div>
                <div className="flex justify-between"><span>← →</span><span className="text-muted-foreground">Seek ±10s</span></div>
                <div className="flex justify-between"><span>↑ ↓</span><span className="text-muted-foreground">Volume</span></div>
                <div className="flex justify-between"><span>F</span><span className="text-muted-foreground">Fullscreen</span></div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Navigation</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>N</span><span className="text-muted-foreground">Next video</span></div>
                <div className="flex justify-between"><span>P</span><span className="text-muted-foreground">Previous video</span></div>
                <div className="flex justify-between"><span>M</span><span className="text-muted-foreground">Mark complete</span></div>
                <div className="flex justify-between"><span>A</span><span className="text-muted-foreground">Toggle auto-play</span></div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Features</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Q</span><span className="text-muted-foreground">Quick notes</span></div>
                <div className="flex justify-between"><span>Ctrl+S</span><span className="text-muted-foreground">Save progress</span></div>
                <div className="flex justify-between"><span>[ ]</span><span className="text-muted-foreground">Resize sidebar</span></div>
                <div className="flex justify-between"><span>?</span><span className="text-muted-foreground">Show shortcuts</span></div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
