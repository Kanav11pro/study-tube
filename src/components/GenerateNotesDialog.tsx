import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Copy, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenerateNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  videoTitle: string;
  youtubeVideoId: string;
  onNotesGenerated: () => void;
}

export const GenerateNotesDialog = ({
  open,
  onOpenChange,
  videoId,
  videoTitle,
  youtubeVideoId,
  onNotesGenerated,
}: GenerateNotesDialogProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [notes, setNotes] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-notes", {
        body: { videoId, youtubeVideoId, videoTitle },
      });

      if (error) throw error;

      setNotes(data.notes);
      toast.success("Notes generated successfully!");
      onNotesGenerated();
    } catch (error: any) {
      console.error("Error generating notes:", error);
      toast.error(error.message || "Failed to generate notes");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!notes) return;
    
    const text = `${videoTitle}\n\nSummary:\n${notes.summary}\n\nKey Points:\n${notes.key_points.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!notes) return;

    const text = `${videoTitle}\n\nSummary:\n${notes.summary}\n\nKey Points:\n${notes.key_points.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${videoTitle.replace(/[^a-z0-9]/gi, '_')}_notes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Notes downloaded!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Generated Notes</DialogTitle>
          <DialogDescription>
            Get a summary and key points from this video
          </DialogDescription>
        </DialogHeader>

        {!notes && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <p className="text-center text-muted-foreground">
              Generate AI-powered notes for this video to help you study better
            </p>
            <Button
              onClick={handleGenerate}
              className="bg-gradient-primary"
              disabled={isGenerating}
            >
              Generate Notes
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">
              Analyzing video content...
            </p>
          </div>
        )}

        {notes && !isGenerating && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground">{notes.summary}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Key Points</h3>
                <ul className="space-y-2">
                  {notes.key_points.map((point: string, index: number) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCopy}
                className="flex-1"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
