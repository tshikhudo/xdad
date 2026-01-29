import { Star, CheckCircle, MapPin, Sparkles, Shirt, Flame, ChefHat, Baby, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/lib/i18n";
import type { Worker } from "@shared/schema";

const skillIcons: Record<string, typeof Sparkles> = {
  cleaning: Sparkles,
  laundry: Shirt,
  ironing: Flame,
  cooking: ChefHat,
  childcare: Baby,
  eldercare: Heart,
};

interface WorkerCardProps {
  worker: Worker;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}

export function WorkerCard({ worker, onClick, selected, compact }: WorkerCardProps) {
  const { t } = useI18n();
  const averageRating = worker.ratingCount > 0 
    ? (worker.rating / worker.ratingCount).toFixed(1) 
    : "5.0";

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover-elevate active-elevate-2 ${
        selected ? "ring-2 ring-primary" : ""
      } ${compact ? "p-3" : ""}`}
      onClick={onClick}
      data-testid={`card-worker-${worker.id}`}
    >
      <div className="flex items-start gap-4">
        <Avatar className={compact ? "h-12 w-12" : "h-16 w-16"}>
          <AvatarImage src={worker.photo || undefined} alt={worker.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
            {worker.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-semibold truncate ${compact ? "text-base" : "text-lg"}`}>
              {worker.name}
            </h3>
            {worker.isVerified && (
              <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-0">
                <CheckCircle className="h-3 w-3" />
                {t("worker.verified")}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 text-muted-foreground mt-1">
            <MapPin className="h-3.5 w-3.5" />
            <span className="text-sm">{worker.area}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {worker.skills.slice(0, compact ? 3 : 6).map((skill) => {
              const Icon = skillIcons[skill] || Sparkles;
              return (
                <Badge
                  key={skill}
                  variant="outline"
                  className="gap-1 text-xs px-2 py-0.5"
                >
                  <Icon className="h-3 w-3" />
                  {t(`skill.${skill}`)}
                </Badge>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-sm">{averageRating}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{worker.jobsCompleted}</span>
              {" "}{t("worker.jobs")}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
