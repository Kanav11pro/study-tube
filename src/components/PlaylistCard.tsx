import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, PlayCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlaylistCardProps {
  playlist: any;
}

export const PlaylistCard = ({ playlist }: PlaylistCardProps) => {
  const navigate = useNavigate();
  const completionPercentage = 0; // Will be calculated based on progress

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer">
      <div className="relative aspect-video overflow-hidden bg-muted">
        {playlist.thumbnail_url ? (
          <img
            src={playlist.thumbnail_url}
            alt={playlist.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlayCircle className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90"
            onClick={() => navigate(`/player/${playlist.id}`)}
          >
            <Play className="h-5 w-5 mr-2" />
            {completionPercentage > 0 ? "Continue" : "Start"}
          </Button>
        </div>
      </div>

      <CardHeader className="space-y-2">
        <CardTitle className="line-clamp-2 text-lg">{playlist.title}</CardTitle>
        <CardDescription className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <PlayCircle className="h-4 w-4" />
            {playlist.total_videos} videos
          </span>
          {playlist.channel_name && (
            <span className="truncate">{playlist.channel_name}</span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Last accessed {formatDate(playlist.last_accessed_at)}
        </div>
      </CardContent>
    </Card>
  );
};