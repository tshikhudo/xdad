import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Users, Briefcase, CheckCircle, XCircle, Star, Edit, Trash2, Loader2, Shield, MapPin, Phone, Settings, DollarSign, Camera, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Worker, Job, InsertWorker, PricingRule } from "@shared/schema";
import { TASKS, AREAS, HOUSE_SIZES, AVAILABILITY_WINDOWS } from "@shared/schema";

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
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    employerName: "",
    employerPhone: "",
    houseSize: "",
    tasks: [] as string[],
    availabilityWindow: "",
    date: "",
    area: "",
  });
  const [jobToRate, setJobToRate] = useState<Job | null>(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [workerDocuments, setWorkerDocuments] = useState<string[]>([]);
  const [workerPhoto, setWorkerPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setWorkerDocuments(prev => [...prev, response.objectPath]);
      toast({ title: t("admin.documentUploaded") });
    },
    onError: () => {
      toast({ title: t("common.error"), variant: "destructive" });
    },
  });

  const { uploadFile: uploadPhoto, isUploading: isUploadingPhoto } = useUpload({
    onSuccess: (response) => {
      setWorkerPhoto(response.objectPath);
      toast({ title: t("admin.photoUploaded") });
    },
    onError: () => {
      toast({ title: t("common.error"), variant: "destructive" });
    },
  });

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadPhoto(file);
      e.target.value = "";
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
      e.target.value = "";
    }
  };

  const { data: workers = [], isLoading: isLoadingWorkers } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: pricingRules } = useQuery<PricingRule>({
    queryKey: ["/api/pricing"],
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

  const assignWorkerMutation = useMutation({
    mutationFn: async ({ jobId, workerId }: { jobId: string; workerId: string }) => {
      return apiRequest("PATCH", `/api/jobs/${jobId}`, { 
        workerId, 
        status: "assigned" 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: t("common.success") });
    },
  });

  const completeJobMutation = useMutation({
    mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
      return apiRequest("PATCH", `/api/jobs/${id}`, { 
        status: "completed", 
        employerRating: rating,
        completedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      setJobToRate(null);
      setSelectedRating(5);
      toast({ title: t("common.success") });
    },
  });

  const handleCompleteWithRating = () => {
    if (jobToRate) {
      completeJobMutation.mutate({ id: jobToRate.id, rating: selectedRating });
    }
  };

  const createJobMutation = useMutation({
    mutationFn: async (data: typeof newJob) => {
      return apiRequest("POST", "/api/jobs", {
        employerId: "admin-created-" + Date.now(),
        houseSize: data.houseSize,
        tasks: data.tasks,
        availabilityWindow: data.availabilityWindow,
        date: data.date,
        area: data.area,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setIsAddJobOpen(false);
      resetNewJob();
      toast({ title: t("common.success") });
    },
  });

  const resetNewJob = () => {
    setNewJob({
      employerName: "",
      employerPhone: "",
      houseSize: "",
      tasks: [],
      availabilityWindow: "",
      date: "",
      area: "",
    });
  };

  const handleAddJob = () => {
    if (!newJob.houseSize || newJob.tasks.length === 0 || !newJob.availabilityWindow || !newJob.date || !newJob.area) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createJobMutation.mutate(newJob);
  };

  const toggleJobTask = (taskKey: string) => {
    setNewJob(prev => ({
      ...prev,
      tasks: prev.tasks.includes(taskKey)
        ? prev.tasks.filter(t => t !== taskKey)
        : [...prev.tasks, taskKey]
    }));
  };

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

  const pendingJobs = jobs.filter((job) => job.status === "pending" || job.status === "assigned");
  const completedJobs = jobs.filter((job) => job.status === "completed");
  const verifiedWorkers = workers.filter((w) => w.isVerified);

  const totalRevenue = completedJobs.reduce((sum, job) => sum + (job.price || 0), 0);

  const handleAddWorker = () => {
    if (!newWorker.name || !newWorker.phone || !newWorker.area) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createWorkerMutation.mutate(newWorker);
  };

  const handleUpdateWorker = () => {
    if (!editingWorker) return;
    updateWorkerMutation.mutate({ 
      id: editingWorker.id, 
      data: { 
        ...editingWorker, 
        documents: workerDocuments,
        photo: workerPhoto 
      } 
    });
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
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto">
          <span className="font-semibold">{t("admin.dashboard")}</span>
          <LanguageSwitcher />
        </div>
      </header>

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
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">R{totalRevenue}</div>
                <div className="text-xs text-muted-foreground">{t("admin.revenue")}</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="px-4 pt-6 max-w-4xl mx-auto">
        <Tabs defaultValue="workers" className="w-full">
          <TabsList className="w-full max-w-lg">
            <TabsTrigger value="workers" className="flex-1 gap-1.5" data-testid="tab-admin-workers">
              <Users className="h-4 w-4" />
              {t("admin.workers")}
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex-1 gap-1.5" data-testid="tab-admin-jobs">
              <Briefcase className="h-4 w-4" />
              {t("admin.jobs")}
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex-1 gap-1.5" data-testid="tab-admin-pricing">
              <Settings className="h-4 w-4" />
              {t("admin.pricing")}
            </TabsTrigger>
          </TabsList>

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
                        <AvatarImage src={worker.photo ? `/objects/${worker.photo}` : undefined} />
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
                          variant={worker.isVerified ? "secondary" : "default"}
                          size="sm"
                          onClick={() => updateWorkerMutation.mutate({ id: worker.id, data: { isVerified: !worker.isVerified } })}
                          disabled={updateWorkerMutation.isPending}
                          data-testid={`button-verify-worker-${worker.id}`}
                          className="gap-1"
                        >
                          {worker.isVerified ? (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              {t("admin.unverify")}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" />
                              {t("admin.verify")}
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingWorker(worker);
                            setWorkerDocuments(worker.documents || []);
                            setWorkerPhoto(worker.photo || null);
                          }}
                          data-testid={`button-edit-worker-${worker.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteWorkerMutation.mutate(worker.id)}
                          disabled={deleteWorkerMutation.isPending}
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

          <TabsContent value="jobs" className="mt-4">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setIsAddJobOpen(true)} className="gap-1.5" data-testid="button-add-job">
                <Plus className="h-4 w-4" />
                {t("admin.addJob")}
              </Button>
            </div>
            {isLoadingJobs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingJobs.length === 0 && completedJobs.length === 0 ? (
              <Card className="p-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No jobs found</p>
                <Button onClick={() => setIsAddJobOpen(true)} className="mt-4 gap-1.5" data-testid="button-add-job-empty">
                  <Plus className="h-4 w-4" />
                  {t("admin.addJob")}
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {pendingJobs.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      {t("admin.pendingJobs")} ({pendingJobs.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingJobs.map((job) => (
                        <Card key={job.id} className="p-4" data-testid={`card-admin-job-${job.id}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Badge className="mb-2">{t(`book.houseSize${job.houseSize.charAt(0).toUpperCase() + job.houseSize.slice(1)}`)}</Badge>
                              <div className="text-sm">{job.tasks.map(task => t(`task.${task}`)).join(", ")}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {job.date} • {t(`window.${job.availabilityWindow}`)} • {job.area}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-primary">R{job.price}</div>
                              <Badge variant={job.workerId ? "secondary" : "outline"}>
                                {job.workerId ? t("status.assigned") : t("status.pending")}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2">
                              <Select 
                                key={`assign-${job.id}-${job.workerId || 'none'}`}
                                onValueChange={(workerId) => assignWorkerMutation.mutate({ jobId: job.id, workerId })}
                              >
                                <SelectTrigger data-testid={`select-assign-worker-${job.id}`} className="flex-1">
                                  <SelectValue placeholder={job.workerId ? t("admin.reassignWorker") : t("admin.assignWorker")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {workers.filter(w => w.isAvailable && w.id !== job.workerId).map((worker) => (
                                    <SelectItem key={worker.id} value={worker.id}>
                                      {worker.name} - {worker.area}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {job.workerId && job.status === "assigned" && (
                                <Button
                                  size="sm"
                                  onClick={() => setJobToRate(job)}
                                  disabled={completeJobMutation.isPending}
                                  data-testid={`button-complete-job-${job.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  {t("admin.completeJob")}
                                </Button>
                              )}
                            </div>
                            {job.workerId && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {t("admin.currentWorker")}: {workers.find(w => w.id === job.workerId)?.name || job.workerId}
                              </p>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {completedJobs.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {t("admin.completedJobs")} ({completedJobs.length})
                    </h3>
                    <div className="space-y-3">
                      {completedJobs.slice(0, 5).map((job) => (
                        <Card key={job.id} className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium">{job.tasks.map(task => t(`task.${task}`)).join(", ")}</div>
                              <div className="text-sm text-muted-foreground">{job.date} • {job.area}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">R{job.price}</div>
                              {job.employerRating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  <span className="text-sm">{job.employerRating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pricing" className="mt-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">{t("admin.pricing")}</h3>
              
              <div className="space-y-6">
                <div>
                  <Label>{t("admin.basePrice")}</Label>
                  <div className="text-2xl font-bold text-primary mt-1">
                    R{pricingRules?.basePrice || 150}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">{t("admin.houseSizeWeights")}</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {["small", "medium", "large"].map((size) => {
                      const multipliers = pricingRules?.houseSizeMultipliers 
                        ? JSON.parse(pricingRules.houseSizeMultipliers) 
                        : { small: 1, medium: 1.5, large: 2 };
                      return (
                        <Card key={size} className="p-3 text-center">
                          <div className="text-sm text-muted-foreground capitalize">{size}</div>
                          <div className="text-lg font-bold">{multipliers[size]}x</div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">{t("admin.taskWeights")}</Label>
                  <div className="space-y-2">
                    {TASKS.map((task) => {
                      const taskWeights = pricingRules?.taskWeights 
                        ? JSON.parse(pricingRules.taskWeights) 
                        : { general_cleaning: 1, ironing: 0.5, laundry: 0.6, windows: 0.4, deep_clean: 1.2 };
                      return (
                        <div key={task.key} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span>{t(`task.${task.key}`)}</span>
                          <span className="font-medium">{taskWeights[task.key] || task.weight}x</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label>{t("admin.workerPayout")}</Label>
                    <div className="text-xl font-bold text-primary">{pricingRules?.workerPayoutPercent || 70}%</div>
                  </div>
                  <div>
                    <Label>{t("admin.platformFee")}</Label>
                    <div className="text-xl font-bold">{pricingRules?.platformFeePercent || 30}%</div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <Dialog open={isAddWorkerOpen} onOpenChange={setIsAddWorkerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.addWorker")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">{t("admin.workerName")}</Label>
              <Input
                id="name"
                value={newWorker.name || ""}
                onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                data-testid="input-worker-name"
              />
            </div>
            <div>
              <Label htmlFor="phone">{t("admin.workerPhone")}</Label>
              <Input
                id="phone"
                value={newWorker.phone || ""}
                onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                data-testid="input-worker-phone"
              />
            </div>
            <div>
              <Label htmlFor="area">{t("admin.workerArea")}</Label>
              <Select
                value={newWorker.area || ""}
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
            <div>
              <Label>{t("admin.workerSkills")}</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {TASKS.map((task) => (
                  <div key={task.key} className="flex items-center gap-2">
                    <Checkbox
                      id={`skill-${task.key}`}
                      checked={(newWorker.skills || []).includes(task.key)}
                      onCheckedChange={() => toggleSkill(task.key)}
                    />
                    <Label htmlFor={`skill-${task.key}`} className="text-sm">
                      {t(`task.${task.key}`)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="verified"
                checked={newWorker.isVerified || false}
                onCheckedChange={(checked) => setNewWorker({ ...newWorker, isVerified: !!checked })}
              />
              <Label htmlFor="verified">{t("admin.verifyWorker")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddWorkerOpen(false)}>
              {t("book.back")}
            </Button>
            <Button onClick={handleAddWorker} disabled={createWorkerMutation.isPending}>
              {createWorkerMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("admin.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingWorker} onOpenChange={(open) => !open && setEditingWorker(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.editWorker")}</DialogTitle>
          </DialogHeader>
          {editingWorker && (
            <div className="space-y-4 py-4">
              <div>
                <Label>{t("admin.profilePhoto")}</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={workerPhoto ? `/objects/${workerPhoto}` : undefined} />
                    <AvatarFallback className="text-lg">
                      {editingWorker.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      ref={photoInputRef}
                      onChange={handlePhotoSelect}
                      accept="image/*"
                      className="hidden"
                      data-testid="input-profile-photo"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="gap-1"
                      data-testid="button-upload-photo"
                    >
                      {isUploadingPhoto ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {t("admin.uploadPhoto")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.capture = 'user';
                        input.onchange = (e) => handlePhotoSelect(e as any);
                        input.click();
                      }}
                      disabled={isUploadingPhoto}
                      className="gap-1"
                      data-testid="button-camera-photo"
                    >
                      <Camera className="h-4 w-4" />
                      {t("admin.takePhoto")}
                    </Button>
                    {workerPhoto && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setWorkerPhoto(null)}
                        className="gap-1 text-destructive"
                        data-testid="button-remove-photo"
                      >
                        <XCircle className="h-4 w-4" />
                        {t("admin.removePhoto")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-name">{t("admin.workerName")}</Label>
                <Input
                  id="edit-name"
                  value={editingWorker.name}
                  onChange={(e) => setEditingWorker({ ...editingWorker, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">{t("admin.workerPhone")}</Label>
                <Input
                  id="edit-phone"
                  value={editingWorker.phone}
                  onChange={(e) => setEditingWorker({ ...editingWorker, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-area">{t("admin.workerArea")}</Label>
                <Select
                  value={editingWorker.area}
                  onValueChange={(value) => setEditingWorker({ ...editingWorker, area: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((area) => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("admin.workerSkills")}</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {TASKS.map((task) => (
                    <div key={task.key} className="flex items-center gap-2">
                      <Checkbox
                        id={`edit-skill-${task.key}`}
                        checked={editingWorker.skills.includes(task.key)}
                        onCheckedChange={() => toggleSkill(task.key, true)}
                      />
                      <Label htmlFor={`edit-skill-${task.key}`} className="text-sm">
                        {t(`task.${task.key}`)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-verified"
                  checked={editingWorker.isVerified}
                  onCheckedChange={(checked) => setEditingWorker({ ...editingWorker, isVerified: !!checked })}
                />
                <Label htmlFor="edit-verified">{t("admin.verifyWorker")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-available"
                  checked={editingWorker.isAvailable}
                  onCheckedChange={(checked) => setEditingWorker({ ...editingWorker, isAvailable: !!checked })}
                />
                <Label htmlFor="edit-available">{t("worker.available")}</Label>
              </div>

              <div>
                <Label>{t("admin.documents")}</Label>
                <div className="mt-2 space-y-2">
                  {workerDocuments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {workerDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                          <FileText className="h-3.5 w-3.5" />
                          <span className="max-w-[120px] truncate">{doc.split('/').pop()}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => setWorkerDocuments(prev => prev.filter((_, i) => i !== index))}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                      data-testid="input-document-file"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="gap-1"
                      data-testid="button-upload-document"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {t("admin.uploadDocument")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.capture = 'environment';
                        input.onchange = (e) => handleFileSelect(e as any);
                        input.click();
                      }}
                      disabled={isUploading}
                      className="gap-1"
                      data-testid="button-camera-document"
                    >
                      <Camera className="h-4 w-4" />
                      {t("admin.takePhoto")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingWorker(null)}>
              {t("book.back")}
            </Button>
            <Button onClick={handleUpdateWorker} disabled={updateWorkerMutation.isPending}>
              {updateWorkerMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("admin.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddJobOpen} onOpenChange={setIsAddJobOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.addJob")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{t("book.houseSize")}</Label>
              <Select
                value={newJob.houseSize}
                onValueChange={(value) => setNewJob({ ...newJob, houseSize: value })}
              >
                <SelectTrigger data-testid="select-job-housesize">
                  <SelectValue placeholder="Select house size" />
                </SelectTrigger>
                <SelectContent>
                  {HOUSE_SIZES.map((size) => (
                    <SelectItem key={size.key} value={size.key}>
                      {t(`book.houseSize${size.key.charAt(0).toUpperCase() + size.key.slice(1)}`)} ({size.bedrooms})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("book.selectTasks")}</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {TASKS.map((task) => (
                  <div key={task.key} className="flex items-center gap-2">
                    <Checkbox
                      id={`job-task-${task.key}`}
                      checked={newJob.tasks.includes(task.key)}
                      onCheckedChange={() => toggleJobTask(task.key)}
                    />
                    <Label htmlFor={`job-task-${task.key}`} className="text-sm">
                      {t(`task.${task.key}`)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>{t("book.selectWindow")}</Label>
              <Select
                value={newJob.availabilityWindow}
                onValueChange={(value) => setNewJob({ ...newJob, availabilityWindow: value })}
              >
                <SelectTrigger data-testid="select-job-window">
                  <SelectValue placeholder="Select time window" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_WINDOWS.map((window) => (
                    <SelectItem key={window.key} value={window.key}>
                      {t(`window.${window.key}`)} ({window.label})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="job-date">{t("book.selectDate")}</Label>
              <Input
                id="job-date"
                type="date"
                value={newJob.date}
                onChange={(e) => setNewJob({ ...newJob, date: e.target.value })}
                data-testid="input-job-date"
              />
            </div>
            <div>
              <Label>{t("worker.area")}</Label>
              <Select
                value={newJob.area}
                onValueChange={(value) => setNewJob({ ...newJob, area: value })}
              >
                <SelectTrigger data-testid="select-job-area">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((area) => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddJobOpen(false)}>
              {t("book.back")}
            </Button>
            <Button onClick={handleAddJob} disabled={createJobMutation.isPending} data-testid="button-submit-job">
              {createJobMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("admin.addJob")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!jobToRate} onOpenChange={(open) => !open && setJobToRate(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("admin.rateJob")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">{t("admin.rateJobDesc")}</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant={selectedRating >= rating ? "default" : "outline"}
                  size="icon"
                  onClick={() => setSelectedRating(rating)}
                  data-testid={`button-rating-${rating}`}
                >
                  <Star className={`h-5 w-5 ${selectedRating >= rating ? "fill-current" : ""}`} />
                </Button>
              ))}
            </div>
            <p className="text-center mt-2 font-semibold">{selectedRating} / 5</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJobToRate(null)}>
              {t("book.back")}
            </Button>
            <Button onClick={handleCompleteWithRating} disabled={completeJobMutation.isPending} data-testid="button-confirm-complete">
              {completeJobMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("admin.completeJob")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
