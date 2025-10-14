import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountUpCardProps {
  title: string;
  value: number;
  unit?: string;
  icon: LucideIcon;
  variant?: "success" | "primary" | "secondary" | "accent" | "warning";
  prefix?: string;
  decimals?: number;
}

export const CountUpCard = ({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  variant = "primary",
  prefix = "",
  decimals = 0
}: CountUpCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  const variantStyles = {
    success: "bg-success/10 text-success",
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary-foreground",
    accent: "bg-accent/10 text-accent-foreground",
    warning: "bg-warning/10 text-warning",
  };

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepValue = value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setDisplayValue(stepValue * currentStep);
      } else {
        setDisplayValue(value);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-bold">
                {prefix}
                {displayValue.toFixed(decimals)}
              </h3>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
          </div>
          <div className={cn("p-3 rounded-lg transition-transform hover:scale-110", variantStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
