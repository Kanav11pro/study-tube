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

const Player = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (!playlistId) return;
    loadPlaylistData();
  }, [playlistId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
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
        case 'm':
          handleMarkComplete();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentVideoIndex, videos, theaterMode, focusMode, showKeyboardHelp]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-700">
        <div className="container mx-auto flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base truncate text-white">{currentVideo.title}</h1>
            <p className="text-xs text-slate-400">
              Video {currentVideoIndex + 1} of {videos.length}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheaterMode(!theaterMode)}
              title="Theater Mode (T)"
              className="hover:bg-slate-800"
            >
              {theaterMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowKeyboardHelp(true)}
              title="Keyboard Shortcuts (?)"
              className="hover:bg-slate-800"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video Player Section */}
        <div 
          className={`flex-1 flex flex-col transition-all duration-300 ${theaterMode ? 'lg:w-[85%]' : ''} ${focusMode ? 'w-full' : ''}`}
        >
          <div className="flex-1 flex items-center justify-center p-4 lg:p-6">
            <div className="w-full max-w-7xl space-y-4">
              {/* YouTube Player - FIXED! */}
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                <iframe
                  src={`https://www.youtube.com/embed/${currentVideo.youtube_video_id}?autoplay=1&rel=0&modestbranding=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={currentVideo.title}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => setShowNotesDialog(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-1 sm:flex-initial"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Notes
                </Button>
                
                <Button
                  variant={currentProgress.completed ? "default" : "outline"}
                  onClick={handleMarkComplete}
                  className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 border-slate-600"
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
                  className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 border-slate-600"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setFocusMode(!focusMode)}
                  className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 border-slate-600"
                  title="Focus Mode (F)"
                >
                  {focusMode ? "Exit Focus" : "Focus Mode"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Playlist Sidebar */}
        {!focusMode && (
          <div 
            className={`${theaterMode ? 'lg:w-[400px]' : 'lg:w-96'} w-full border-t lg:border-t-0 lg:border-l border-slate-700 bg-slate-900/95 backdrop-blur-lg flex flex-col transition-all duration-300`}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-700 space-y-3 sticky top-0 z-10 bg-slate-900/95 backdrop-blur-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold truncate text-white">{playlist.title}</h2>
                  <p className="text-sm text-slate-400">
                    {completedCount} / {videos.length} completed
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setFocusMode(true)}
                  className="lg:hidden hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search videos..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="pl-9 h-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                />
              </div>

              <Progress value={(completedCount / videos.length) * 100} className="h-2 bg-slate-800" />
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
                    className={`w-full p-3 flex gap-3 hover:bg-slate-800/50 transition-all duration-200 border-b border-slate-800 ${
                      isActive ? 'bg-blue-900/30 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-32 h-20 object-cover rounded shadow-lg"
                      />
                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded">
                          <Play className="h-8 w-8 text-white fill-white" />
                        </div>
                      )}
                      {!isActive && videoProgress.completed && (
                        <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-slate-500 font-mono mt-1">
                          #{index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium line-clamp-2 ${isActive ? 'text-blue-400' : 'text-white'}`}>
                            {video.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatTime(video.duration_seconds)}
                          </p>
                        </div>
                      </div>
                      {!videoProgress.completed && videoProgress.percentage > 0 && (
                        <Progress value={videoProgress.percentage} className="h-1 mt-2 bg-slate-800" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Dialog */}
      {showKeyboardHelp && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowKeyboardHelp(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Card className="p-6 max-w-md bg-slate-900 border-slate-700">
              <h3 className="text-xl font-bold mb-4 text-white">Keyboard Shortcuts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white">
                  <span className="text-slate-400">N</span>
                  <span>Next video</span>
                </div>
                <div className="flex justify-between text-white">
                  <span className="text-slate-400">P</span>
                  <span>Previous video</span>
                </div>
                <div className="flex justify-between text-white">
                  <span className="text-slate-400">M</span>
                  <span>Mark complete</span>
                </div>
                <div className="flex justify-between text-white">
                  <span className="text-slate-400">T</span>
                  <span>Theater mode</span>
                </div>
                <div className="flex justify-between text-white">
                  <span className="text-slate-400">F</span>
                  <span>Focus mode</span>
                </div>
                <div className="flex justify-between text-white">
                  <span className="text-slate-400">?</span>
                  <span>Show shortcuts</span>
                </div>
              </div>
              <Button 
                onClick={() => setShowKeyboardHelp(false)} 
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Got it!
              </Button>
            </Card>
          </div>
        </div>
      )}

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
