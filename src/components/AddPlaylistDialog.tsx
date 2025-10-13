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
import { Loader2, Youtube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaylistAdded: () => void;
}

export const AddPlaylistDialog = ({ open, onOpenChange, onPlaylistAdded }: AddPlaylistDialogProps) => {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const extractPlaylistId = (url: string) => {
    const regex = /[?&]list=([^&]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const playlistId = extractPlaylistId(playlistUrl);
    
    if (!playlistId) {
      toast.error("Invalid YouTube playlist URL");
      return;
    }

    setIsLoading(true);

    try {
      // Call edge function to import playlist
      const { data, error } = await supabase.functions.invoke("import-playlist", {
        body: { playlistId },
      });

      if (error) throw error;

      toast.success("Playlist imported successfully!");
      setPlaylistUrl("");
      onOpenChange(false);
      onPlaylistAdded();
    } catch (error: any) {
      console.error("Error importing playlist:", error);
      toast.error(error.message || "Failed to import playlist");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-destructive" />
            Import YouTube Playlist
          </DialogTitle>
          <DialogDescription>
            Paste a YouTube playlist URL to add it to your learning library
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-url">Playlist URL</Label>
            <Input
              id="playlist-url"
              placeholder="https://www.youtube.com/playlist?list=..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Example: https://www.youtube.com/playlist?list=PLxxxxxxxxxxx
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Playlist"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};