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
import { Loader2, Youtube, CheckCircle, Link as LinkIcon, PlayCircle, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaylistAdded: () => void;
}

type Step = 'input' | 'validating' | 'importing' | 'success' | 'create-custom';

export const AddPlaylistDialog = ({ open, onOpenChange, onPlaylistAdded }: AddPlaylistDialogProps) => {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [step, setStep] = useState<Step>('input');
  const [playlistData, setPlaylistData] = useState<any>(null);
  const [customPlaylistName, setCustomPlaylistName] = useState("");
  const [detectedVideoId, setDetectedVideoId] = useState<string | null>(null);

  const extractPlaylistId = (url: string) => {
    const regex = /[?&]list=([^&]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const extractVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\/]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleValidate = async () => {
    const playlistId = extractPlaylistId(playlistUrl);
    const videoId = extractVideoId(playlistUrl);
    
    // Check if it's a single video
    if (videoId && !playlistId) {
      setDetectedVideoId(videoId);
      setStep('create-custom');
      return;
    }
    
    if (!playlistId) {
      toast.error("Invalid YouTube URL. Please provide a playlist or video URL.");
      return;
    }

    setStep('validating');

    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock playlist data - replace with actual API call if needed
    setPlaylistData({
      title: "YouTube Playlist",
      videoCount: "Loading...",
      thumbnail: null
    });

    setStep('importing');
    handleImport(playlistId);
  };

  const handleCreateCustomPlaylist = async () => {
    if (!customPlaylistName.trim() || !detectedVideoId) {
      toast.error("Please enter a playlist name");
      return;
    }

    setStep('importing');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      // Fetch video details via edge function
      const { data: videoData, error: fetchError } = await supabase.functions.invoke(
        "fetch-video-details",
        {
          body: { videoId: detectedVideoId },
        }
      );

      if (fetchError || !videoData?.success) {
        throw new Error(fetchError?.message || "Failed to fetch video details");
      }

      const videoInfo = videoData.videoInfo;

      // Create custom playlist
      const { data: playlist, error: playlistError } = await (supabase
        .from("playlists" as any)
        .insert({
          user_id: user.id,
          youtube_playlist_id: `custom_${Date.now()}`,
          title: customPlaylistName,
          description: "Custom playlist",
          channel_name: videoInfo.snippet.channelTitle,
          thumbnail_url:
            videoInfo.snippet.thumbnails?.medium?.url ||
            videoInfo.snippet.thumbnails?.default?.url,
          total_videos: 1,
        })
        .select()
        .single() as any);

      if (playlistError || !playlist) throw playlistError;

      // Parse duration
      const parseDuration = (duration: string): number => {
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 0;
        const hours = parseInt(match[1] || "0");
        const minutes = parseInt(match[2] || "0");
        const seconds = parseInt(match[3] || "0");
        return hours * 3600 + minutes * 60 + seconds;
      };

      // Insert video
      const { error: videoError } = await (supabase.from("videos" as any).insert({
        playlist_id: playlist.id,
        youtube_video_id: detectedVideoId,
        title: videoInfo.snippet.title,
        description: videoInfo.snippet.description || '',
        thumbnail_url:
          videoInfo.snippet.thumbnails?.medium?.url ||
          videoInfo.snippet.thumbnails?.default?.url,
        position_order: 0,
        duration_seconds: parseDuration(videoInfo.contentDetails.duration),
      }) as any);

      if (videoError) throw videoError;

      setStep('success');
      
      setTimeout(() => {
        toast.success("Custom playlist created successfully! 🎉");
        handleClose();
        onPlaylistAdded();
      }, 2000);
    } catch (error: any) {
      console.error("Error creating custom playlist:", error);
      toast.error(error.message || "Failed to create custom playlist");
      setStep('create-custom');
    }
  };

  const handleImport = async (playlistId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("import-playlist", {
        body: { playlistId },
      });

      if (error) throw error;

      setStep('success');
      
      setTimeout(() => {
        toast.success("Playlist imported successfully! 🎉");
        handleClose();
        onPlaylistAdded();
      }, 2000);
    } catch (error: any) {
      console.error("Error importing playlist:", error);
      toast.error(error.message || "Failed to import playlist");
      setStep('input');
    }
  };

  const handleClose = () => {
    setPlaylistUrl("");
    setStep('input');
    setPlaylistData(null);
    setCustomPlaylistName("");
    setDetectedVideoId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ 
              width: step === 'input' ? '25%' : 
                     step === 'validating' ? '50%' : 
                     step === 'importing' ? '75%' : '100%' 
            }}
          />
        </div>

        <DialogHeader className="pt-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
              <Youtube className="h-6 w-6 text-white" />
            </div>
            Import YouTube Playlist
          </DialogTitle>
          <DialogDescription className="text-base">
            {step === 'input' && "Paste your YouTube playlist or video URL to get started"}
            {step === 'create-custom' && "Create a custom playlist with this video"}
            {step === 'validating' && "Validating your playlist..."}
            {step === 'importing' && "Importing videos to your library..."}
            {step === 'success' && "Successfully added to your library!"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* STEP 1: Input URL */}
          {step === 'input' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="space-y-3">
                <Label htmlFor="playlist-url" className="text-base font-semibold">
                  Playlist URL
                </Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="playlist-url"
                    placeholder="Playlist or Video URL..."
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    className="pl-10 h-12 text-base"
                    autoFocus
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium mb-1">💡 Supports:</p>
                  <p className="text-xs text-blue-700">
                    • Full YouTube playlists<br />
                    • Single YouTube videos (creates custom playlist)<br />
                    • Just paste any YouTube URL
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleValidate}
                  className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                  disabled={!playlistUrl.trim()}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
           )}

          {/* STEP 1.5: Create Custom Playlist */}
          {step === 'create-custom' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-1">📹 Single Video Detected</p>
                <p className="text-xs text-blue-700">
                  This is a single video. Create a custom playlist to organize it!
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="playlist-name" className="text-base font-semibold">
                  Custom Playlist Name
                </Label>
                <Input
                  id="playlist-name"
                  placeholder="e.g., Physics Revision, JEE Prep..."
                  value={customPlaylistName}
                  onChange={(e) => setCustomPlaylistName(e.target.value)}
                  className="h-12 text-base"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateCustomPlaylist}
                  className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                  disabled={!customPlaylistName.trim()}
                >
                  Create Playlist
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Validating */}
          {step === 'validating' && (
            <div className="space-y-6 animate-fadeIn text-center py-8">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <LinkIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">Validating Playlist</h3>
                <p className="text-gray-600">Checking URL and fetching details...</p>
              </div>
            </div>
          )}

          {/* STEP 3: Importing */}
          {step === 'importing' && (
            <div className="space-y-6 animate-fadeIn text-center py-8">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  <PlayCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-indigo-600" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">Importing Videos</h3>
                <p className="text-gray-600">Adding videos to your library...</p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span>This might take a few moments</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success */}
          {step === 'success' && (
            <div className="space-y-6 animate-fadeIn text-center py-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-scaleIn">
                  <CheckCircle className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">All Set! 🎉</h3>
                <p className="text-gray-600">Your playlist has been imported successfully</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✓ Videos added to your library<br />
                  ✓ Ready to start learning<br />
                  ✓ Progress tracking enabled
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out;
        }
      `}</style>
    </Dialog>
  );
};
