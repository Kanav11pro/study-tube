import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Download, CheckCircle, BookOpen } from "lucide-react";
import { toast } from "sonner";

const Notes = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: notesData } = await (supabase
        .from("ai_notes" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }) as any);

      setNotes(notesData || []);
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (note: any) => {
    const text = `${note.video_title}\n\nSummary:\n${note.summary}\n\nKey Points:\n${note.key_points.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.video_title.replace(/[^a-z0-9]/gi, '_')}_notes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Notes downloaded!");
  };

  const filteredNotes = notes.filter((note) =>
    note.video_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.summary.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-xl">AI Notes Library</h1>
            <p className="text-sm text-muted-foreground">
              {notes.length} notes generated
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-muted rounded-full">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <CardTitle>
                {searchQuery ? "No notes found" : "No notes yet"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try a different search term"
                  : "Generate notes from videos to see them here"}
              </p>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base line-clamp-2">
                    {note.video_title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {note.summary}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Key Points:
                    </p>
                    <ul className="space-y-1">
                      {note.key_points.slice(0, 3).map((point: string, index: number) => (
                        <li key={index} className="flex gap-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-success flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{point}</span>
                        </li>
                      ))}
                      {note.key_points.length > 3 && (
                        <li className="text-xs text-muted-foreground">
                          +{note.key_points.length - 3} more points
                        </li>
                      )}
                    </ul>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(note)}
                    className="w-full"
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notes;
