import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface DeletePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistTitle: string;
  onConfirm: () => Promise<void>;
}

export const DeletePlaylistDialog = ({
  open,
  onOpenChange,
  playlistTitle,
  onConfirm,
}: DeletePlaylistDialogProps) => {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      handleClose();
    } catch (error) {
      console.error("Error deleting playlist:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    setIsDeleting(false);
    onOpenChange(false);
  };

  const isConfirmValid = confirmText === "DELETE";

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-[500px] bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold">
            Delete Playlist
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300 text-base space-y-3 pt-2">
            <p>
              Are you sure you want to delete the playlist{" "}
              <span className="font-semibold text-white">"{playlistTitle}"</span>?
              This will permanently remove the playlist and all its tracked progress.
              This action cannot be undone.
            </p>
            <div className="pt-2 space-y-2">
              <p className="text-sm font-medium">
                To confirm, please type{" "}
                <span className="text-red-400 font-bold">DELETE</span> below:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:border-red-500"
                disabled={isDeleting}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmValid || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Playlist
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
