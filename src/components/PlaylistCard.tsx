import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, PlayCircle, Clock, Trash2, MoreVertical, CheckCircle2, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DeletePlaylistDialog } from "./DeletePlaylistDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PlaylistCardProps {
  playlist: any;
  onDelete?: () => void;
}

export const PlaylistCard = ({ playlist, onDelete }: PlaylistCardProps) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [completedVideos, setCompletedVideos] = useState(0);

  useEffect(() => {
    loadProgress();
  }, [playlist.id]);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get total videos count
      const { count: videosCount } = await supabase
        .from("videos")
        .select("*", { count: 'exact', head: true })
        .eq("playlist_id", playlist.id);

      setTotalVideos(videosCount || 0);

      // Get completed videos count
      const { data: progressData } = await supabase
        .from("video_progress")
        .select("is_completed")
        .eq("user_id", user.id)
        .eq("playlist_id", playlist.id)
        .eq("is_completed", true);

      const completed = progressData?.length || 0;
      setCompletedVideos(completed);

      // Calculate percentage
      if (videosCount && videosCount > 0) {
        const percentage = Math.round((completed / videosCount) * 100);
        setCompletionPercentage(percentage);
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 24) {
      if (diffInHours < 1) return "Just now";
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getProgressColor = () => {
    if (completionPercentage >= 80) return "bg-green-500";
    if (completionPercentage >= 50) return "bg-yellow-500";
    if (completionPercentage >= 20) return "bg-orange-500";
    return "bg-blue-500";
  };

  const getProgressTextColor = () => {
    if (completionPercentage >= 80) return "text-green-600";
    if (completionPercentage >= 50) return "text-yellow-600";
    if (completionPercentage >= 20) return "text-orange-600";
    return "text-blue-600";
  };

  const handleDelete = async () => {
    try {
      await supabase
        .from("video_progress")
        .delete()
        .eq("playlist_id", playlist.id);

      await supabase
        .from("videos")
        .delete()
        .eq("playlist_id", playlist.id);

      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", playlist.id);

      if (error) throw error;

      toast.success("Playlist deleted successfully");
      onDelete?.();
    } catch (error: any) {
      console.error("Error deleting playlist:", error);
      toast.error("Failed to delete playlist");
      throw error;
    }
  };

  return (
    <>
      <Card 
        className="group hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border-2 hover:border-primary/50 relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top Status Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
        
        {/* Thumbnail Section */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
          {playlist.thumbnail_url ? (
            <>
              <img
                src={playlist.thumbnail_url}
                alt={playlist.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <PlayCircle className="h-20 w-20 text-white/40" />
            </div>
          )}

          {/* Progress Badge on Thumbnail */}
          {completionPercentage > 0 && (
            <div className="absolute top-3 left-3 z-10">
              <Badge className={`${getProgressColor()} text-white border-0 shadow-lg`}>
                {completionPercentage >= 100 ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {completionPercentage}%
                  </>
                )}
              </Badge>
            </div>
          )}

          {/* Three Dots Menu - Top Right */}
          <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 bg-black/80 backdrop-blur-md hover:bg-black/90 shadow-xl border border-white/20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer font-medium focus:text-red-700 focus:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-white/90 shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/player/${playlist.id}`);
              }}
            >
              <Play className="h-5 w-5 mr-2 fill-black" />
              {completionPercentage > 0 ? "Continue Watching" : "Start Learning"}
            </Button>
          </div>

          {/* Video Count Badge - Bottom Right */}
          <div className="absolute bottom-3 right-3">
            <Badge variant="secondary" className="bg-black/70 text-white backdrop-blur-sm border-0">
              <PlayCircle className="h-3 w-3 mr-1" />
              {totalVideos} videos
            </Badge>
          </div>
        </div>

        {/* Content Section */}
        <div onClick={() => navigate(`/player/${playlist.id}`)}>
          <CardHeader className="space-y-3 pb-3">
            <CardTitle className="line-clamp-2 text-lg leading-tight group-hover:text-primary transition-colors">
              {playlist.title}
            </CardTitle>
            {playlist.channel_name && (
              <CardDescription className="flex items-center gap-2 text-sm">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {playlist.channel_name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{playlist.channel_name}</span>
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {/* Progress Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Progress</span>
                <span className={`font-bold ${getProgressTextColor()}`}>
                  {completionPercentage}% ({completedVideos}/{totalVideos})
                </span>
              </div>
              <div className="relative">
                <Progress value={completionPercentage} className="h-2 bg-gray-200" />
                <div 
                  className={`absolute top-0 left-0 h-2 ${getProgressColor()} rounded-full transition-all duration-500`}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDate(playlist.last_accessed_at)}</span>
              </div>
              {completionPercentage >= 100 && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  ✓ Done
                </Badge>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      <DeletePlaylistDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        playlistTitle={playlist.title}
        onConfirm={handleDelete}
      />
    </>
  );
};
