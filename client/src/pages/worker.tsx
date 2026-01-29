import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, CheckCircle, MapPin, Sparkles, Shirt, Flame, Square, Phone, Loader2, Briefcase, FileText, Camera, Shield } from "lucide-react";
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
import { getReliabilityLevel } from "@shared/schema";

const skillIcons: Record<string, typeof Sparkles> = {
  general_cleaning: Sparkles,
  laundry: Shirt,
  ironing: Flame,
  windows: Square,
  deep_clean: Sparkles,
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
  const pendingJobs = jobs.filter(j => j.status === "pending" || j.status === "assigned");

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <span className="font-semibold">{t("worker.myProfile")}</span>
          <LanguageSwitcher />
        </div>
      </header>

      <section className="px-4 pt-6 max-w-lg mx-auto">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={worker.photo || undefined} alt={worker.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {worker.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-xl font-bold truncate">{worker.name}</h2>
                {worker.isVerified && (
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-1 text-muted-foreground mb-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{worker.area}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">{averageRating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{worker.jobsCompleted} {t("worker.jobs")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2 mb-4">
              {worker.skills.map((skill) => {
                const Icon = skillIcons[skill] || Sparkles;
                return (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    <Icon className="h-3 w-3" />
                    {t(`task.${skill}`)}
                  </Badge>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t("worker.toggleAvailability")}</span>
                {worker.isAvailable ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {t("worker.available")}
                  </Badge>
                ) : (
                  <Badge variant="secondary">{t("worker.unavailable")}</Badge>
                )}
              </div>
              <Switch
                checked={worker.isAvailable}
                onCheckedChange={(checked) => toggleAvailabilityMutation.mutate(checked)}
                disabled={toggleAvailabilityMutation.isPending}
                data-testid="switch-availability"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{worker.consistencyScore}%</div>
              <div className="text-sm text-muted-foreground">{t("worker.consistency")}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">
                  {worker.subscriptionActive ? t("worker.subscriptionActive") : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="px-4 pt-6 max-w-lg mx-auto">
        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="jobs" data-testid="tab-jobs">
              <Briefcase className="h-4 w-4 mr-2" />
              {t("worker.jobHistory")}
            </TabsTrigger>
            <TabsTrigger value="rules" data-testid="tab-rules">
              <FileText className="h-4 w-4 mr-2" />
              {t("worker.rules")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="mt-4">
            {pendingJobs.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2 text-primary">{t("worker.newJob")}</h3>
                {pendingJobs.map((job) => (
                  <Card key={job.id} className="p-4 mb-3 border-primary/50">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Badge>{t(`book.houseSize${job.houseSize.charAt(0).toUpperCase() + job.houseSize.slice(1)}`)}</Badge>
                        <span className="font-bold text-primary">{t("common.rands")}{job.workerPayout || Math.round(job.price * 0.7)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {job.tasks.map(task => t(`task.${task}`)).join(", ")}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">{job.date}</span>
                        {" • "}
                        <span>{t(`window.${job.availabilityWindow}`)}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1" data-testid={`button-accept-${job.id}`}>
                          {t("worker.accept")}
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" data-testid={`button-decline-${job.id}`}>
                          {t("worker.decline")}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {completedJobs.length > 0 ? (
              <div className="space-y-3">
                {completedJobs.map((job) => (
                  <Card key={job.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{job.tasks.map(task => t(`task.${task}`)).join(", ")}</div>
                        <div className="text-sm text-muted-foreground">{job.date}</div>
                      </div>
                      {job.employerRating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span className="font-medium">{job.employerRating}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {t("status.completed")}
                      </Badge>
                      <span className="text-sm font-medium">{t("common.rands")}{job.workerPayout || Math.round(job.price * 0.7)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">{t("worker.noJobs")}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rules" className="mt-4">
            <Card className="p-4">
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">Before each job</h4>
                  <p className="text-muted-foreground">Take a photo of the area before you start</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">After each job</h4>
                  <p className="text-muted-foreground">Take a photo of your completed work</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">On time arrival</h4>
                  <p className="text-muted-foreground">Always arrive within your availability window</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Quality work</h4>
                  <p className="text-muted-foreground">Complete all tasks to the best standard</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Respect</h4>
                  <p className="text-muted-foreground">Treat employers and their homes with respect</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
