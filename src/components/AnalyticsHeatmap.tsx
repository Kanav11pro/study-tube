import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface HeatmapDay {
  date: string;
  hours: number;
}

interface AnalyticsHeatmapProps {
  data: HeatmapDay[];
}

export const AnalyticsHeatmap = ({ data }: AnalyticsHeatmapProps) => {
  const getColor = (hours: number) => {
    if (hours === 0) return "bg-muted";
    if (hours < 0.5) return "bg-success/20";
    if (hours < 1) return "bg-success/40";
    if (hours < 2) return "bg-success/60";
    if (hours < 3) return "bg-success/80";
    return "bg-success";
  };

  const getIntensityLabel = (hours: number) => {
    if (hours === 0) return "No activity";
    if (hours < 1) return "Light activity";
    if (hours < 2) return "Moderate activity";
    if (hours < 3) return "Heavy activity";
    return "Very heavy activity";
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Study Heatmap</CardTitle>
        <CardDescription>Your study activity over the last 90 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-13 gap-1">
            {data.slice(-91).map((day, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-sm transition-all hover:scale-125 cursor-pointer ${getColor(day.hours)}`}
                title={`${day.date}: ${day.hours.toFixed(1)} hours - ${getIntensityLabel(day.hours)}`}
              />
            ))}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="h-3 w-3 rounded-sm bg-muted" />
              <div className="h-3 w-3 rounded-sm bg-success/20" />
              <div className="h-3 w-3 rounded-sm bg-success/40" />
              <div className="h-3 w-3 rounded-sm bg-success/60" />
              <div className="h-3 w-3 rounded-sm bg-success/80" />
              <div className="h-3 w-3 rounded-sm bg-success" />
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
