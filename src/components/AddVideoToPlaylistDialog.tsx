import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddVideoToPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistId: string;
  onVideoAdded: () => void;
}

export const AddVideoToPlaylistDialog = ({
  open,
  onOpenChange,
  playlistId,
  onVideoAdded,
}: AddVideoToPlaylistDialogProps) => {
  const [videoUrl, setVideoUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const extractVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\/]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleAdd = async () => {
    const videoId = extractVideoId(videoUrl);
    
    if (!videoId) {
      toast.error("Invalid YouTube video URL");
      return;
    }

    setIsAdding(true);

    try {
      // Fetch video details via edge function
      const { data: videoData, error: fetchError } = await supabase.functions.invoke(
        "fetch-video-details",
        {
          body: { videoId },
        }
      );

      if (fetchError || !videoData?.success) {
        throw new Error(fetchError?.message || "Failed to fetch video details");
      }

      const videoInfo = videoData.videoInfo;

      // Parse duration
      const parseDuration = (duration: string): number => {
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 0;
        const hours = parseInt(match[1] || "0");
        const minutes = parseInt(match[2] || "0");
        const seconds = parseInt(match[3] || "0");
        return hours * 3600 + minutes * 60 + seconds;
      };

      // Get current video count for position order
      const { count } = await (supabase
        .from("videos" as any)
        .select("*", { count: "exact", head: true })
        .eq("playlist_id", playlistId) as any);

      // Insert video
      const { error: insertError } = await (supabase.from("videos" as any).insert({
        playlist_id: playlistId,
        youtube_video_id: videoId,
        title: videoInfo.snippet.title,
        description: videoInfo.snippet.description || '',
        thumbnail_url:
          videoInfo.snippet.thumbnails?.medium?.url ||
          videoInfo.snippet.thumbnails?.default?.url,
        position_order: count || 0,
        duration_seconds: parseDuration(videoInfo.contentDetails.duration),
      }) as any);

      if (insertError) throw insertError;

      // Update playlist total_videos count
      const { error: updateError } = await (supabase
        .from("playlists" as any)
        .update({ total_videos: (count || 0) + 1 })
        .eq("id", playlistId) as any);

      if (updateError) throw updateError;

      toast.success("Video added successfully! 🎉");
      handleClose();
      onVideoAdded();
    } catch (error: any) {
      console.error("Error adding video:", error);
      toast.error(error.message || "Failed to add video");
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setVideoUrl("");
    setIsAdding(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Video to Playlist
          </DialogTitle>
          <DialogDescription>
            Paste a YouTube video URL to add it to this custom playlist
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="video-url">Video URL</Label>
            <Input
              id="video-url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={isAdding}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isAdding}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!videoUrl.trim() || isAdding}
              className="flex-1"
            >
              {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Video
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
