import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Users, Briefcase, CheckCircle, XCircle, Star, Edit, Trash2, Loader2, Shield, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Worker, Job, InsertWorker } from "@shared/schema";
import { SERVICES, AREAS } from "@shared/schema";

export default function AdminDashboard() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [newWorker, setNewWorker] = useState<Partial<InsertWorker>>({
    name: "",
    phone: "",
    area: "",
    skills: [],
    isVerified: false,
    isAvailable: true,
  });

  const { data: workers = [], isLoading: isLoadingWorkers } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const createWorkerMutation = useMutation({
    mutationFn: async (data: Partial<InsertWorker>) => {
      return apiRequest("POST", "/api/workers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      setIsAddWorkerOpen(false);
      resetNewWorker();
      toast({ title: t("common.success") });
    },
  });

  const updateWorkerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Worker> }) => {
      return apiRequest("PATCH", `/api/workers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      setEditingWorker(null);
      toast({ title: t("common.success") });
    },
  });

  const deleteWorkerMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/workers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      toast({ title: t("common.success") });
    },
  });

  const completeJobMutation = useMutation({
    mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
      return apiRequest("PATCH", `/api/jobs/${id}`, { 
        status: "completed", 
        rating,
        completedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      toast({ title: t("common.success") });
    },
  });

  const resetNewWorker = () => {
    setNewWorker({
      name: "",
      phone: "",
      area: "",
      skills: [],
      isVerified: false,
      isAvailable: true,
    });
  };

  const filteredWorkers = workers.filter((worker) =>
    worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingJobs = jobs.filter((job) => job.status === "pending" || job.status === "confirmed");
  const completedJobs = jobs.filter((job) => job.status === "completed");
  const verifiedWorkers = workers.filter((w) => w.isVerified);

  const handleAddWorker = () => {
    if (!newWorker.name || !newWorker.phone || !newWorker.area) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createWorkerMutation.mutate(newWorker);
  };

  const handleUpdateWorker = () => {
    if (!editingWorker) return;
    updateWorkerMutation.mutate({ id: editingWorker.id, data: editingWorker });
  };

  const toggleSkill = (skill: string, isEdit: boolean = false) => {
    if (isEdit && editingWorker) {
      const skills = editingWorker.skills.includes(skill)
        ? editingWorker.skills.filter((s) => s !== skill)
        : [...editingWorker.skills, skill];
      setEditingWorker({ ...editingWorker, skills });
    } else {
      const skills = (newWorker.skills || []).includes(skill)
        ? (newWorker.skills || []).filter((s) => s !== skill)
        : [...(newWorker.skills || []), skill];
      setNewWorker({ ...newWorker, skills });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto">
          <span className="font-semibold">{t("admin.dashboard")}</span>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Stats */}
      <section className="px-4 pt-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{workers.length}</div>
                <div className="text-xs text-muted-foreground">{t("admin.totalWorkers")}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{verifiedWorkers.length}</div>
                <div className="text-xs text-muted-foreground">{t("admin.verifiedWorkers")}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingJobs.length}</div>
                <div className="text-xs text-muted-foreground">{t("admin.pendingJobs")}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{completedJobs.length}</div>
                <div className="text-xs text-muted-foreground">{t("admin.completedJobs")}</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4 pt-6 max-w-4xl mx-auto">
        <Tabs defaultValue="workers" className="w-full">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="workers" className="flex-1 gap-1.5" data-testid="tab-admin-workers">
              <Users className="h-4 w-4" />
              {t("admin.workers")}
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex-1 gap-1.5" data-testid="tab-admin-jobs">
              <Briefcase className="h-4 w-4" />
              {t("admin.jobs")}
            </TabsTrigger>
          </TabsList>

          {/* Workers Tab */}
          <TabsContent value="workers" className="mt-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-workers"
                />
              </div>
              <Button onClick={() => setIsAddWorkerOpen(true)} className="gap-1.5" data-testid="button-add-worker">
                <Plus className="h-4 w-4" />
                {t("admin.addWorker")}
              </Button>
            </div>

            {isLoadingWorkers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredWorkers.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No workers found</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredWorkers.map((worker) => (
                  <Card key={worker.id} className="p-4" data-testid={`card-admin-worker-${worker.id}`}>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={worker.photo || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {worker.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{worker.name}</h3>
                          {worker.isVerified && (
                            <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-0">
                              <CheckCircle className="h-3 w-3" />
                              {t("worker.verified")}
                            </Badge>
                          )}
                          <Badge variant={worker.isAvailable ? "secondary" : "outline"}>
                            {worker.isAvailable ? t("worker.available") : t("worker.unavailable")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {worker.area}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {worker.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            {worker.ratingCount > 0 ? (worker.rating / worker.ratingCount).toFixed(1) : "5.0"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {worker.jobsCompleted} jobs
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingWorker(worker)}
                          data-testid={`button-edit-worker-${worker.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this worker?")) {
                              deleteWorkerMutation.mutate(worker.id);
                            }
                          }}
                          data-testid={`button-delete-worker-${worker.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="mt-4">
            {isLoadingJobs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : jobs.length === 0 ? (
              <Card className="p-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No jobs found</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => {
                  const worker = workers.find((w) => w.id === job.workerId);
                  return (
                    <Card key={job.id} className="p-4" data-testid={`card-admin-job-${job.id}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge variant="secondary">{t(`skill.${job.service}`)}</Badge>
                            <Badge
                              variant={
                                job.status === "completed" ? "secondary" :
                                job.status === "confirmed" ? "default" : "outline"
                              }
                              className={job.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""}
                            >
                              {t(`status.${job.status}`)}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {job.area}
                            </div>
                            <div>{new Date(job.date).toLocaleDateString()}</div>
                            {worker && (
                              <div className="flex items-center gap-2 mt-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {worker.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-foreground">{worker.name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {job.status === "confirmed" && (
                          <div className="flex gap-2">
                            {[5, 4, 3].map((rating) => (
                              <Button
                                key={rating}
                                variant="outline"
                                size="sm"
                                onClick={() => completeJobMutation.mutate({ id: job.id, rating })}
                                disabled={completeJobMutation.isPending}
                                data-testid={`button-complete-job-${job.id}-rating-${rating}`}
                              >
                                <Star className="h-3 w-3 mr-1" />
                                {rating}
                              </Button>
                            ))}
                          </div>
                        )}

                        {job.status === "completed" && job.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                            <span className="font-semibold">{job.rating}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* Add Worker Dialog */}
      <Dialog open={isAddWorkerOpen} onOpenChange={setIsAddWorkerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.addWorker")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("admin.workerName")}</Label>
              <Input
                value={newWorker.name}
                onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                placeholder="Enter name"
                data-testid="input-worker-name"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.workerPhone")}</Label>
              <Input
                value={newWorker.phone}
                onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                placeholder="Enter phone"
                data-testid="input-worker-phone"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.workerArea")}</Label>
              <Select
                value={newWorker.area}
                onValueChange={(value) => setNewWorker({ ...newWorker, area: value })}
              >
                <SelectTrigger data-testid="select-worker-area">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((area) => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.workerSkills")}</Label>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map((skill) => (
                  <Badge
                    key={skill}
                    variant={(newWorker.skills || []).includes(skill) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSkill(skill)}
                    data-testid={`badge-skill-${skill}`}
                  >
                    {t(`skill.${skill}`)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={newWorker.isVerified}
                onCheckedChange={(checked) => setNewWorker({ ...newWorker, isVerified: checked as boolean })}
                data-testid="checkbox-verified"
              />
              <Label>{t("worker.verified")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddWorkerOpen(false)}>
              {t("employer.cancel")}
            </Button>
            <Button
              onClick={handleAddWorker}
              disabled={createWorkerMutation.isPending}
              data-testid="button-save-worker"
            >
              {createWorkerMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("admin.save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Worker Dialog */}
      <Dialog open={!!editingWorker} onOpenChange={(open) => !open && setEditingWorker(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.editWorker")}</DialogTitle>
          </DialogHeader>
          {editingWorker && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("admin.workerName")}</Label>
                <Input
                  value={editingWorker.name}
                  onChange={(e) => setEditingWorker({ ...editingWorker, name: e.target.value })}
                  data-testid="input-edit-worker-name"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.workerPhone")}</Label>
                <Input
                  value={editingWorker.phone}
                  onChange={(e) => setEditingWorker({ ...editingWorker, phone: e.target.value })}
                  data-testid="input-edit-worker-phone"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.workerArea")}</Label>
                <Select
                  value={editingWorker.area}
                  onValueChange={(value) => setEditingWorker({ ...editingWorker, area: value })}
                >
                  <SelectTrigger data-testid="select-edit-worker-area">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((area) => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("admin.workerSkills")}</Label>
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map((skill) => (
                    <Badge
                      key={skill}
                      variant={editingWorker.skills.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleSkill(skill, true)}
                      data-testid={`badge-edit-skill-${skill}`}
                    >
                      {t(`skill.${skill}`)}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingWorker.isVerified}
                    onCheckedChange={(checked) => setEditingWorker({ ...editingWorker, isVerified: checked })}
                    data-testid="switch-edit-verified"
                  />
                  <Label>{t("worker.verified")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingWorker.isAvailable}
                    onCheckedChange={(checked) => setEditingWorker({ ...editingWorker, isAvailable: checked })}
                    data-testid="switch-edit-available"
                  />
                  <Label>{t("worker.available")}</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingWorker(null)}>
              {t("employer.cancel")}
            </Button>
            <Button
              onClick={handleUpdateWorker}
              disabled={updateWorkerMutation.isPending}
              data-testid="button-update-worker"
            >
              {updateWorkerMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("admin.save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
