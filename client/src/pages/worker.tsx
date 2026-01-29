import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, CheckCircle, MapPin, Sparkles, Shirt, Flame, ChefHat, Baby, Heart, Phone, Loader2, Briefcase, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Worker, Job } from "@shared/schema";

const skillIcons: Record<string, typeof Sparkles> = {
  cleaning: Sparkles,
  laundry: Shirt,
  ironing: Flame,
  cooking: ChefHat,
  childcare: Baby,
  eldercare: Heart,
};

export default function WorkerProfile() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [workerId] = useState("demo-worker");

  const { data: worker, isLoading } = useQuery<Worker>({
    queryKey: [`/api/workers/${workerId}`],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: [`/api/jobs?workerId=${workerId}`],
    enabled: !!worker,
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async (isAvailable: boolean) => {
      return apiRequest("PATCH", `/api/workers/${workerId}`, { isAvailable });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workers/${workerId}`] });
      toast({
        title: t("common.success"),
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
            <span className="font-semibold">{t("worker.myProfile")}</span>
            <LanguageSwitcher />
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <p className="text-muted-foreground mb-4">No worker profile found</p>
          <p className="text-sm text-center text-muted-foreground">
            Contact admin to set up your profile
          </p>
        </div>
      </div>
    );
  }

  const averageRating = worker.ratingCount > 0 
    ? (worker.rating / worker.ratingCount).toFixed(1) 
    : "5.0";

  const completedJobs = jobs.filter(j => j.status === "completed");

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <span className="font-semibold">{t("worker.myProfile")}</span>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Profile Card */}
      <section className="px-4 pt-6 max-w-lg mx-auto">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={worker.photo || undefined} alt={worker.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {worker.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-xl font-bold">{worker.name}</h2>
                {worker.isVerified && (
                  <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-0">
                    <CheckCircle className="h-3 w-3" />
                    {t("worker.verified")}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1 text-muted-foreground mb-2">
                <MapPin className="h-4 w-4" />
                <span>{worker.area}</span>
              </div>

              <div className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{worker.phone}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-2xl font-bold">{averageRating}</span>
              </div>
              <span className="text-sm text-muted-foreground">{t("worker.rating")}</span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">{worker.jobsCompleted}</div>
              <span className="text-sm text-muted-foreground">{t("worker.jobs")}</span>
            </div>
          </div>

          {/* Skills */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-3">{t("worker.skills")}</h3>
            <div className="flex flex-wrap gap-2">
              {worker.skills.map((skill) => {
                const Icon = skillIcons[skill] || Sparkles;
                return (
                  <Badge key={skill} variant="outline" className="gap-1.5 px-3 py-1.5">
                    <Icon className="h-4 w-4" />
                    {t(`skill.${skill}`)}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{t("worker.toggleAvailability")}</h3>
                <p className="text-sm text-muted-foreground">
                  {worker.isAvailable ? t("worker.available") : t("worker.unavailable")}
                </p>
              </div>
              <Switch
                checked={worker.isAvailable}
                onCheckedChange={(checked) => toggleAvailabilityMutation.mutate(checked)}
                disabled={toggleAvailabilityMutation.isPending}
                data-testid="switch-availability"
              />
            </div>
          </div>
        </Card>
      </section>

      {/* Tabs */}
      <section className="px-4 pt-6 max-w-lg mx-auto">
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="history" className="flex-1 gap-1.5" data-testid="tab-history">
              <Briefcase className="h-4 w-4" />
              {t("worker.jobHistory")}
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex-1 gap-1.5" data-testid="tab-rules">
              <FileText className="h-4 w-4" />
              {t("worker.rules")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-4">
            {completedJobs.length === 0 ? (
              <Card className="p-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t("worker.noJobs")}</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {completedJobs.map((job) => (
                  <Card key={job.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{t(`skill.${job.service}`)}</Badge>
                      {job.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{job.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.area}
                      </div>
                      <div className="mt-1">{new Date(job.date).toLocaleDateString()}</div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rules" className="mt-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Platform Rules</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Always arrive on time or notify employer of delays</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Complete all assigned tasks to the best of your ability</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Maintain professional and respectful communication</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Keep your availability status up to date</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Report any issues or concerns to admin immediately</span>
                </li>
              </ul>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
