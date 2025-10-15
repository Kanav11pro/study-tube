import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  StickyNote,
  Bell,
  Shuffle,
  Keyboard,
  Coffee,
  X,
  Zap,
  Award,
  GripVertical,
  Plus,
  Clock,
  Gauge,
  Link as LinkIcon,
  Copy,
  CheckCheck,
  Maximize,
  SkipForward,
  SkipBack,
  PictureInPicture2,
  Focus
} from "lucide-react";
import { toast } from "sonner";
import { GenerateNotesDialog } from "@/components/GenerateNotesDialog";
import { AddVideoToPlaylistDialog } from "@/components/AddVideoToPlaylistDialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const SortableVideoItem = ({ video, index, isActive, onClick, videoProgress, formatTime }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const progressColor = videoProgress.completed 
    ? 'bg-green-500' 
    : getProgressColor(videoProgress.percentage);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full flex items-center gap-2 border-b ${
        isActive ? 'bg-primary/10 border-l-4 border-l-primary' : ''
      }`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="p-2 cursor-grab active:cursor-grabbing hover:bg-muted/50"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <button
        onClick={onClick}
        className="flex-1 p-3 flex gap-3 hover:bg-muted/50 transition text-left group"
      >
        <div className="relative flex-shrink-0 transform group-hover:scale-105 transition-transform">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-32 h-20 object-cover rounded"
          />
          
          {videoProgress.percentage > 0 && !videoProgress.completed && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
              <div 
                className={`h-full ${progressColor}`}
                style={{ width: `${videoProgress.percentage}%` }}
              />
            </div>
          )}

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

          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {formatTime(video.duration_seconds)}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium line-clamp-2 mb-1 ${isActive ? 'text-primary' : ''}`}>
            {video.title}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>#{index + 1}</span>
            {videoProgress.percentage > 0 && !videoProgress.completed && (
              <span className={`font-medium ${
                videoProgress.percentage >= 80 ? 'text-green-600' :
                videoProgress.percentage >= 50 ? 'text-yellow-600' :
                videoProgress.percentage >= 20 ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {Math.round(videoProgress.percentage)}% watched
              </span>
            )}
            {videoProgress.completed && (
              <span className="text-green-600 font-medium">✓ Completed</span>
            )}
          </div>
        </div>
      </button>
    </div>
  );
};

const Player = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoProgressUpdateRef = useRef<NodeJS.Timeout | null>(null);
  
  const [playlist, setPlaylist] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [originalVideos, setOriginalVideos] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [progress, setProgress] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [autoPlay, setAutoPlay] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ytPlayerReady, setYtPlayerReady] = useState(false);
  const [videoProgressPercentage, setVideoProgressPercentage] = useState(0);
  
  // NEW: Playback speed
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // NEW: Theater mode
  const [theaterMode, setTheaterMode] = useState(false);
  
  // NEW: Focus mode
  const [focusMode, setFocusMode] = useState(false);
  
  // NEW: Copy link state
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Quick Notes
  const [showQuickNotes, setShowQuickNotes] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState("");
  const [quickNotes, setQuickNotes] = useState<Array<{ 
    id: string;
    time: number; 
    text: string; 
    timestamp: string;
  }>>([]);
  
  const [breakReminderEnabled, setBreakReminderEnabled] = useState(false);
  const [breakInterval, setBreakInterval] = useState(45);
  const [showBreakDialog, setShowBreakDialog] = useState(false);
  const [studyTimeElapsed, setStudyTimeElapsed] = useState(0);
  const [showBreakSettings, setShowBreakSettings] = useState(false);
  
  const [isShuffled, setIsShuffled] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showAddVideoDialog, setShowAddVideoDialog] = useState(false);
  const [isCustomPlaylist, setIsCustomPlaylist] = useState(false);
  
  const [completedCount, setCompletedCount] = useState(0);
  const [totalWatchTime, setTotalWatchTime] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        setYtPlayerReady(true);
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    };

    loadYouTubeAPI();

    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube API is ready!');
      setYtPlayerReady(true);
    };
  }, []);

  useEffect(() => {
    if (!playlistId) return;
    loadPlaylistData();
  }, [playlistId]);

  useEffect(() => {
    if (ytPlayerReady && videos.length > 0 && currentVideoIndex >= 0) {
      const timer = setTimeout(() => {
        initializePlayer();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [ytPlayerReady, currentVideoIndex, videos]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const time = playerRef.current.getCurrentTime();
          setCurrentTime(time);
          
          if (duration > 0) {
            const percentage = (time / duration) * 100;
            setVideoProgressPercentage(percentage);
          }
        } catch (e) {
          // Player not ready
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [duration]);

  useEffect(() => {
    progressIntervalRef.current = setInterval(() => {
      if (currentTime > 5 && isPlaying) {
        saveProgress(currentTime, false);
      }
    }, 5000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentTime, currentVideoIndex, isPlaying]);

  useEffect(() => {
    videoProgressUpdateRef.current = setInterval(() => {
      if (currentTime > 0 && isPlaying) {
        updatePlaylistProgressBar();
      }
    }, 15000);

    return () => {
      if (videoProgressUpdateRef.current) {
        clearInterval(videoProgressUpdateRef.current);
      }
    };
  }, [currentTime, isPlaying, progress, videos]);

  useEffect(() => {
    if (!breakReminderEnabled) return;

    const studyInterval = setInterval(() => {
      if (isPlaying) {
        setStudyTimeElapsed(prev => {
          const newTime = prev + 1;
          if (newTime >= breakInterval * 60) {
            showBreakReminder();
            return 0;
          }
          return newTime;
        });
      }
    }, 1000);

    return () => clearInterval(studyInterval);
  }, [isPlaying, breakReminderEnabled, breakInterval]);

  useEffect(() => {
    const watchInterval = setInterval(() => {
      if (isPlaying) {
        setTotalWatchTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(watchInterval);
  }, [isPlaying]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

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
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            saveProgress(currentTime, true);
            updatePlaylistProgressBar();
          }
          break;
        case 'q':
          setShowQuickNotes(!showQuickNotes);
          break;
        case 't':
          toggleTheaterMode();
          break;
        case 'f':
          toggleFocusMode();
          break;
        case '?':
          setShowKeyboardHelp(true);
          break;
        case 'arrowright':
          skipForward();
          break;
        case 'arrowleft':
          skipBackward();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTime, isPlaying, showQuickNotes, theaterMode, focusMode]);

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
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.log('Error destroying player:', e);
      }
    }

    const videoToPlay = videos[currentVideoIndex];
    
    try {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: videoToPlay.youtube_video_id,
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });
    } catch (error) {
      console.error('Error creating player:', error);
      toast.error('Failed to load video player');
    }
  };

  const onPlayerReady = (event: any) => {
    try {
      setDuration(event.target.getDuration());
      
      // Set initial playback speed
      if (playbackSpeed !== 1) {
        event.target.setPlaybackRate(playbackSpeed);
      }
      
      const currentProgress = progress.find(
        p => p.video_id === videos[currentVideoIndex]?.id
      );
      
      if (currentProgress && currentProgress.watch_time_seconds > 30 && !currentProgress.is_completed) {
        event.target.seekTo(currentProgress.watch_time_seconds);
        toast.info(`Resuming from ${formatTime(currentProgress.watch_time_seconds)}`);
      }
      
      event.target.playVideo();
    } catch (error) {
      console.error('Error in onPlayerReady:', error);
    }
  };

  const onPlayerStateChange = (event: any) => {
    setIsPlaying(event.data === 1);

    if (event.data === 0) {
      handleVideoEnd();
    }
  };

  const handleVideoEnd = async () => {
    await handleMarkComplete();
    toast.success('Video completed! ✓');
    updatePlaylistProgressBar();
    
    if (autoPlay && currentVideoIndex < videos.length - 1) {
      setTimeout(() => {
        handleNext();
      }, 2000);
    } else if (currentVideoIndex >= videos.length - 1) {
      toast.success('Playlist completed! 🎉');
    }
  };

  // NEW: Playback speed control
  const changePlaybackSpeed = (speed: number) => {
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(speed);
      setPlaybackSpeed(speed);
      toast.success(`Speed: ${speed}x`);
    }
  };

  // NEW: Skip forward/backward
  const skipForward = () => {
    if (playerRef.current && playerRef.current.getCurrentTime) {
      const newTime = playerRef.current.getCurrentTime() + 10;
      playerRef.current.seekTo(newTime);
      toast.info('+10 seconds');
    }
  };

  const skipBackward = () => {
    if (playerRef.current && playerRef.current.getCurrentTime) {
      const newTime = Math.max(0, playerRef.current.getCurrentTime() - 10);
      playerRef.current.seekTo(newTime);
      toast.info('-10 seconds');
    }
  };

  // NEW: Theater mode
  const toggleTheaterMode = () => {
    setTheaterMode(!theaterMode);
    toast.success(theaterMode ? 'Theater mode OFF' : 'Theater mode ON');
  };

  // NEW: Focus mode
  const toggleFocusMode = () => {
    setFocusMode(!focusMode);
    setSidebarCollapsed(!focusMode);
    toast.success(focusMode ? 'Focus mode OFF' : 'Focus mode ON');
  };

  // NEW: Copy video URL with timestamp
  const copyVideoLinkWithTimestamp = () => {
    const videoId = videos[currentVideoIndex].youtube_video_id;
    const timestamp = Math.floor(currentTime);
    const url = `https://www.youtube.com/watch?v=${videoId}&t=${timestamp}s`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    toast.success('Link copied with timestamp!');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // NEW: Jump to note timestamp
  const jumpToNoteTimestamp = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time);
      toast.info(`Jumped to ${formatTime(time)}`);
    }
  };

  // NEW: Picture in Picture
  const enablePiP = async () => {
    try {
      const iframe = document.querySelector('#youtube-player') as HTMLIFrameElement;
      if (iframe && document.pictureInPictureEnabled) {
        // @ts-ignore
        await iframe.requestPictureInPicture();
        toast.success('Picture-in-Picture enabled');
      }
    } catch (error) {
      toast.error('PiP not supported');
    }
  };

  // NEW: Calculate time remaining
  const calculateTimeRemaining = () => {
    const unwatchedVideos = videos.slice(currentVideoIndex + 1);
    const remainingSeconds = unwatchedVideos.reduce((acc, video) => acc + video.duration_seconds, 0);
    return formatTime(remainingSeconds);
  };

  const toggleAutoPlay = () => {
    setAutoPlay(!autoPlay);
    toast.success(`Auto-play ${!autoPlay ? 'enabled' : 'disabled'}`);
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
    if (!isShuffled) {
      toast.success('Shuffle mode ON - Drag to reorder!');
    } else {
      toast.success('Shuffle mode OFF - Order saved!');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = videos.findIndex(v => v.id === active.id);
      const newIndex = videos.findIndex(v => v.id === over.id);

      const newVideos = arrayMove(videos, oldIndex, newIndex);
      setVideos(newVideos);
      toast.success('Video order updated');
    }
  };

  const resetToOriginalOrder = () => {
    setVideos([...originalVideos]);
    setIsShuffled(false);
    toast.success('Reset to original order');
  };

  const updatePlaylistProgressBar = () => {
    const completed = progress.filter(p => p.is_completed).length;
    setCompletedCount(completed);
  };

  const showBreakReminder = () => {
    setShowBreakDialog(true);
    toast.info('Time for a break! ☕');
  };

  const dismissBreak = () => {
    setShowBreakDialog(false);
    setStudyTimeElapsed(0);
  };

  const takeBreak = () => {
    setShowBreakDialog(false);
    setStudyTimeElapsed(0);
    toast.success('Enjoy your break! 🌟');
  };

  const addQuickNote = async () => {
    if (!quickNoteText.trim() || !playerRef.current || !videos[currentVideoIndex]) return;
    
    const currentTime = Math.floor(playerRef.current.getCurrentTime());
    const currentVideo = videos[currentVideoIndex];
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("video_notes")
        .insert({
          user_id: user.id,
          video_id: currentVideo.id,
          playlist_id: playlistId,
          note_text: quickNoteText,
          timestamp_seconds: currentTime,
        })
        .select()
        .single();

      if (error) throw error;

      const note = {
        id: data.id,
        time: currentTime,
        text: quickNoteText,
        timestamp: formatTime(currentTime),
      };

      setQuickNotes(prev => [note, ...prev]);
      setQuickNoteText("");
      toast.success("Note saved successfully! 📝");
    } catch (error: any) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    }
  };

  const deleteQuickNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from("video_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      setQuickNotes(prev => prev.filter(note => note.id !== noteId));
      toast.success("Note deleted");
    } catch (error: any) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
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
      
      setIsCustomPlaylist(playlistData?.youtube_playlist_id?.startsWith('custom_') || false);

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
      setCompletedCount(progressData?.filter((p: any) => p.is_completed).length || 0);

      if (progressData && progressData.length > 0) {
        const lastWatched = progressData.reduce((prev: any, current: any) => 
          new Date(current.last_watched_at) > new Date(prev.last_watched_at) ? current : prev
        );
        const videoIndex = videosData?.findIndex((v: any) => v.id === lastWatched.video_id) || 0;
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

        const updatedProgress = progress.map((p: any) =>
          p.video_id === videos[currentVideoIndex].id
            ? { ...p, watch_time_seconds: Math.floor(time) }
            : p
        );
        setProgress(updatedProgress);
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
        const newCompletedState = !existingProgress.is_completed;
        await supabase
          .from("video_progress")
          .update({ 
            is_completed: newCompletedState,
            watch_time_seconds: videos[currentVideoIndex].duration_seconds 
          })
          .eq("id", existingProgress.id);

        const updatedProgress = progress.map(p =>
          p.video_id === videos[currentVideoIndex].id
            ? { ...p, is_completed: newCompletedState }
            : p
        );
        setProgress(updatedProgress);
        setCompletedCount(updatedProgress.filter(p => p.is_completed).length);
      } else {
        const { data: newProgress } = await supabase
          .from("video_progress")
          .insert({
            user_id: user.id,
            video_id: videos[currentVideoIndex].id,
            playlist_id: playlistId!,
            watch_time_seconds: videos[currentVideoIndex].duration_seconds,
            is_completed: true,
          })
          .select()
          .single();

        if (newProgress) {
          setProgress([...progress, newProgress]);
          setCompletedCount(prev => prev + 1);
        }
      }

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
      setVideoProgressPercentage(0);
      toast.success("Next video");
    } else {
      toast.info("Playlist completed! 🎉");
    }
  };

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
      setCurrentTime(0);
      setVideoProgressPercentage(0);
      toast.success("Previous video");
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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center space-y-3">
          <div className="text-2xl font-bold text-primary">Loading playlist...</div>
          <Progress value={50} className="w-64" />
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
  const progressColor = getProgressColor(playlistProgress);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Focus Mode Overlay */}
      {focusMode && (
        <div className="fixed inset-0 bg-black/90 z-40 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10"
            onClick={toggleFocusMode}
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="w-full max-w-6xl aspect-video">
            <div id="youtube-player" className="w-full h-full" />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b bg-card px-4 py-2 flex items-center gap-3 flex-shrink-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{playlist.title}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{completedCount}/{videos.length} completed</span>
            <span>•</span>
            <span>{formatTime(totalWatchTime)} today</span>
            {/* NEW: Time remaining */}
            {currentVideoIndex < videos.length - 1 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {calculateTimeRemaining()} left
                </span>
              </>
            )}
          </div>
        </div>
        
        {isCustomPlaylist && (
          <Button variant="outline" size="sm" onClick={() => setShowAddVideoDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Video
          </Button>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={focusMode ? "default" : "outline"} 
                size="sm" 
                onClick={toggleFocusMode}
              >
                <Focus className="h-4 w-4 mr-1" />
                Focus
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle focus mode (F)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button variant="outline" size="sm" onClick={() => {
          saveProgress(currentTime, true);
          updatePlaylistProgressBar();
        }}>
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button variant="default" size="sm" onClick={() => setShowNotesDialog(true)}>
          <Sparkles className="h-4 w-4 mr-1" />
          AI Notes
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Video Section */}
        <div className={`flex-1 flex flex-col overflow-y-auto transition-all ${
          theaterMode ? 'max-w-none' : ''
        }`}>
          {/* Video Player */}
          <div className="px-6 pt-4">
            <div className={`relative w-full bg-black rounded-lg overflow-hidden ${
              theaterMode ? 'aspect-[21/9]' : 'aspect-video'
            }`}>
              {!focusMode && <div id="youtube-player" className="w-full h-full" />}

              {/* NEW: Mini progress indicator */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-black/50 z-50">
                <div 
                  className={`h-full ${progressColor} transition-all duration-500`}
                  style={{ width: `${playlistProgress}%` }}
                />
              </div>

              {/* NEW: Skip buttons overlay */}
              <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none z-40">
                <Button
                  variant="secondary"
                  size="icon"
                  className="pointer-events-auto bg-black/60 hover:bg-black/80 text-white"
                  onClick={skipBackward}
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="pointer-events-auto bg-black/60 hover:bg-black/80 text-white"
                  onClick={skipForward}
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              <Button
                variant="secondary"
                size="icon"
                className="absolute top-4 right-4 z-50"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>

              <Button
                variant="secondary"
                size="icon"
                className="absolute top-4 left-4 z-50"
                onClick={() => setShowQuickNotes(!showQuickNotes)}
              >
                <StickyNote className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Video Info & Controls */}
          <div className="bg-card p-6 space-y-4 relative z-10">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold mb-1">{currentVideo.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>{currentVideo.channel_name || 'Unknown Channel'}</span>
                  <span>•</span>
                  <a
                    href={`https://www.youtube.com/watch?v=${currentVideo.youtube_video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    Watch on YouTube <ExternalLink className="h-3 w-3" />
                  </a>
                  {/* NEW: Copy link with timestamp */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyVideoLinkWithTimestamp}
                    className="h-auto p-0 hover:bg-transparent"
                  >
                    <span className="flex items-center gap-1 text-primary hover:underline">
                      {linkCopied ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      Copy link @ {formatTime(currentTime)}
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            {/* NEW: Current video progress */}
            <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Current Video Progress</span>
                <span className={`font-bold ${
                  videoProgressPercentage >= 80 ? 'text-green-600' :
                  videoProgressPercentage >= 50 ? 'text-yellow-600' :
                  videoProgressPercentage >= 20 ? 'text-orange-600' :
                  'text-blue-600'
                }`}>
                  {Math.round(videoProgressPercentage)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(videoProgressPercentage)} transition-all duration-300`}
                  style={{ width: `${videoProgressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playlist Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Playlist Progress</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${
                    playlistProgress >= 80 ? 'text-green-600' :
                    playlistProgress >= 50 ? 'text-yellow-600' :
                    playlistProgress >= 20 ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {Math.round(playlistProgress)}%
                  </span>
                  <span className="text-muted-foreground">
                    ({completedCount}/{videos.length})
                  </span>
                </div>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${progressColor} transition-all duration-500`}
                  style={{ width: `${playlistProgress}%` }}
                />
              </div>

              {/* NEW: Progress color legend */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span>0-20%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span>20-50%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span>50-80%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>80-100%</span>
                </div>
              </div>
            </div>

            {/* NEW: Playback Speed Controls */}
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium mr-2">Playback Speed:</span>
              <div className="flex gap-1">
                {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                  <Button
                    key={speed}
                    variant={playbackSpeed === speed ? "default" : "outline"}
                    size="sm"
                    onClick={() => changePlaybackSpeed(speed)}
                    className="h-8 px-3"
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
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

              <Button
                variant={theaterMode ? "default" : "outline"}
                size="sm"
                onClick={toggleTheaterMode}
              >
                <Maximize className="h-4 w-4 mr-1" />
                Theater
              </Button>

              <Button
                variant={isShuffled ? "default" : "outline"}
                size="sm"
                onClick={toggleShuffle}
              >
                <Shuffle className="h-4 w-4 mr-1" />
                {isShuffled ? 'Shuffled' : 'Shuffle'}
              </Button>

              {/* NEW: Picture in Picture */}
              <Button
                variant="outline"
                size="sm"
                onClick={enablePiP}
              >
                <PictureInPicture2 className="h-4 w-4 mr-1" />
                PiP
              </Button>

              {isShuffled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToOriginalOrder}
                >
                  Reset Order
                </Button>
              )}

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

        {/* Quick Notes Panel */}
        {showQuickNotes && (
          <div className="w-80 border-l bg-card flex flex-col z-40">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Quick Notes
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowQuickNotes(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-3 space-y-2">
              <Textarea
                placeholder="Type your notes here..."
                value={quickNoteText}
                onChange={(e) => setQuickNoteText(e.target.value)}
                className="min-h-[150px]"
              />
              <Button onClick={addQuickNote} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Note
              </Button>
              <p className="text-xs text-muted-foreground">At: {formatTime(currentTime)}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {quickNotes.map((note) => (
                <div key={note.id} className="bg-muted p-3 rounded-lg group">
                  <div className="flex items-center justify-between mb-2">
                    {/* NEW: Clickable timestamp */}
                    <button
                      onClick={() => jumpToNoteTimestamp(note.time)}
                      className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                    >
                      <Clock className="h-3 w-3" />
                      {note.timestamp}
                    </button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteQuickNote(note.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm">{note.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar with Videos */}
        {!sidebarCollapsed && !showQuickNotes && (
          <>
            <div
              className="w-1 bg-border hover:bg-primary cursor-col-resize"
              onMouseDown={() => setIsResizing(true)}
            />

            <div 
              className="border-l bg-card flex flex-col overflow-hidden"
              style={{ width: `${sidebarWidth}px` }}
            >
              <div className="p-3 border-b space-y-2">
                <Input
                  placeholder="Search videos..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="h-9"
                />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/50 rounded p-2">
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Zap className="h-3 w-3" />
                      Streak
                    </div>
                    <div className="font-bold">5 days</div>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Award className="h-3 w-3" />
                      Progress
                    </div>
                    <div className="font-bold">{Math.round(playlistProgress)}%</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isShuffled ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={filteredVideos.map(v => v.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {filteredVideos.map((video, index) => {
                        const videoProgress = getVideoProgress(video.id);
                        const isActive = video.id === currentVideo.id;

                        return (
                          <SortableVideoItem
                            key={video.id}
                            video={video}
                            index={index}
                            isActive={isActive}
                            onClick={() => setCurrentVideoIndex(videos.findIndex(v => v.id === video.id))}
                            videoProgress={videoProgress}
                            formatTime={formatTime}
                          />
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                ) : (
                  filteredVideos.map((video, index) => {
                    const videoProgress = getVideoProgress(video.id);
                    const isActive = video.id === currentVideo.id;
                    const progressColor = videoProgress.completed 
                      ? 'bg-green-500' 
                      : getProgressColor(videoProgress.percentage);

                    return (
                      <button
                        key={video.id}
                        onClick={() => setCurrentVideoIndex(videos.findIndex(v => v.id === video.id))}
                        className={`w-full p-3 flex gap-3 hover:bg-muted/50 transition border-b text-left group ${
                          isActive ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                        }`}
                      >
                        <div className="relative flex-shrink-0 transform group-hover:scale-105 transition-transform">
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-32 h-20 object-cover rounded"
                          />
                          
                          {videoProgress.percentage > 0 && !videoProgress.completed && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                              <div 
                                className={`h-full ${progressColor}`}
                                style={{ width: `${videoProgress.percentage}%` }}
                              />
                            </div>
                          )}

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

                          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                            {formatTime(video.duration_seconds)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium line-clamp-2 mb-1 ${isActive ? 'text-primary' : ''}`}>
                            {video.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <span>#{index + 1}</span>
                            {videoProgress.percentage > 0 && !videoProgress.completed && (
                              <span className={`font-medium ${
                                videoProgress.percentage >= 80 ? 'text-green-600' :
                                videoProgress.percentage >= 50 ? 'text-yellow-600' :
                                videoProgress.percentage >= 20 ? 'text-orange-600' :
                                'text-red-600'
                              }`}>
                                {Math.round(videoProgress.percentage)}% watched
                              </span>
                            )}
                            {videoProgress.completed && (
                              <span className="text-green-600 font-medium">✓ Completed</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={showBreakDialog} onOpenChange={setShowBreakDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Time for a Break!
            </DialogTitle>
            <DialogDescription>
              You've been studying for {breakInterval} minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button onClick={takeBreak} className="flex-1">Take Break</Button>
            <Button variant="outline" onClick={dismissBreak} className="flex-1">Continue</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBreakSettings} onOpenChange={setShowBreakSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Break Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Reminders</Label>
              <Switch checked={breakReminderEnabled} onCheckedChange={setBreakReminderEnabled} />
            </div>
            {breakReminderEnabled && (
              <div className="space-y-2">
                <Label>Interval (minutes)</Label>
                <Select value={breakInterval.toString()} onValueChange={(v) => setBreakInterval(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 (Pomodoro)</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="45">45</SelectItem>
                    <SelectItem value="60">60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button onClick={() => setShowBreakSettings(false)}>Save</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>N</span><span>Next video</span></div>
            <div className="flex justify-between"><span>P</span><span>Previous</span></div>
            <div className="flex justify-between"><span>M</span><span>Mark complete</span></div>
            <div className="flex justify-between"><span>A</span><span>Toggle auto-play</span></div>
            <div className="flex justify-between"><span>Q</span><span>Quick notes</span></div>
            <div className="flex justify-between"><span>T</span><span>Theater mode</span></div>
            <div className="flex justify-between"><span>F</span><span>Focus mode</span></div>
            <div className="flex justify-between"><span>→</span><span>Skip forward 10s</span></div>
            <div className="flex justify-between"><span>←</span><span>Skip backward 10s</span></div>
            <div className="flex justify-between"><span>Ctrl+S</span><span>Save progress</span></div>
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

      {isCustomPlaylist && (
        <AddVideoToPlaylistDialog
          open={showAddVideoDialog}
          onOpenChange={setShowAddVideoDialog}
          playlistId={playlistId!}
          onVideoAdded={loadPlaylistData}
        />
      )}
    </div>
  );
};

export default Player;
