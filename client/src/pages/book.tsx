import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Calendar, MapPin, Sparkles, Shirt, Flame, ChefHat, Baby, Heart, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { WorkerCard } from "@/components/worker-card";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Worker, Job } from "@shared/schema";
import { SERVICES, AREAS } from "@shared/schema";

const serviceIcons: Record<string, typeof Sparkles> = {
  cleaning: Sparkles,
  laundry: Shirt,
  ironing: Flame,
  cooking: ChefHat,
  childcare: Baby,
  eldercare: Heart,
};

type BookingStep = "service" | "date" | "area" | "workers" | "confirm" | "success";

interface BookingState {
  service: string;
  date: string;
  area: string;
  workerId: string;
}

export default function Book() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [step, setStep] = useState<BookingStep>("service");
  const [booking, setBooking] = useState<BookingState>({
    service: "",
    date: "",
    area: "",
    workerId: "",
  });

  const workersQueryUrl = booking.area && booking.service 
    ? `/api/workers?area=${encodeURIComponent(booking.area)}&skill=${encodeURIComponent(booking.service)}`
    : "/api/workers";

  const { data: workers = [], isLoading: isLoadingWorkers } = useQuery<Worker[]>({
    queryKey: [workersQueryUrl],
    enabled: step === "workers" && !!booking.area && !!booking.service,
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: { service: string; date: string; area: string; workerId: string }) => {
      return apiRequest("POST", "/api/jobs", {
        employerId: "temp-employer",
        workerId: data.workerId,
        service: data.service,
        date: data.date,
        area: data.area,
        status: "confirmed",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setStep("success");
    },
    onError: () => {
      toast({
        title: t("common.error"),
        variant: "destructive",
      });
    },
  });

  const selectedWorker = workers.find((w) => w.id === booking.workerId);

  const dates = [
    { key: "today", label: t("common.today"), value: new Date().toISOString().split("T")[0] },
    { key: "tomorrow", label: t("common.tomorrow"), value: new Date(Date.now() + 86400000).toISOString().split("T")[0] },
    { key: "week", label: t("common.thisWeek"), value: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0] },
  ];

  const handleNext = () => {
    const steps: BookingStep[] = ["service", "date", "area", "workers", "confirm"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: BookingStep[] = ["service", "date", "area", "workers", "confirm"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleConfirm = () => {
    createJobMutation.mutate(booking);
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t("employer.bookingConfirmed")}</h1>
          <p className="text-muted-foreground mb-8">{t("employer.workerWillContact")}</p>
          <Link href="/">
            <Button size="lg" className="w-full" data-testid="button-back-home">
              {t("nav.home")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            {step !== "service" ? (
              <Button variant="ghost" size="icon" onClick={handleBack} data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : (
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-home">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <span className="font-semibold">{t("employer.findWorker")}</span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 py-3 max-w-lg mx-auto">
        <div className="flex gap-1">
          {["service", "date", "area", "workers", "confirm"].map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= ["service", "date", "area", "workers", "confirm"].indexOf(step)
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="px-4 py-4 max-w-lg mx-auto">
        {/* Step 1: Service */}
        {step === "service" && (
          <div>
            <h2 className="text-xl font-bold mb-6">{t("employer.selectService")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {SERVICES.map((service) => {
                const Icon = serviceIcons[service] || Sparkles;
                const isSelected = booking.service === service;
                return (
                  <Card
                    key={service}
                    className={`p-4 cursor-pointer hover-elevate active-elevate-2 ${
                      isSelected ? "ring-2 ring-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setBooking((prev) => ({ ...prev, service }))}
                    data-testid={`card-service-${service}`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="font-medium">{t(`skill.${service}`)}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Date */}
        {step === "date" && (
          <div>
            <h2 className="text-xl font-bold mb-6">{t("employer.selectDate")}</h2>
            <div className="space-y-3">
              {dates.map((date) => {
                const isSelected = booking.date === date.value;
                return (
                  <Card
                    key={date.key}
                    className={`p-4 cursor-pointer hover-elevate active-elevate-2 ${
                      isSelected ? "ring-2 ring-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setBooking((prev) => ({ ...prev, date: date.value }))}
                    data-testid={`card-date-${date.key}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        <Calendar className="h-6 w-6" />
                      </div>
                      <span className="font-medium text-lg">{date.label}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Area */}
        {step === "area" && (
          <div>
            <h2 className="text-xl font-bold mb-6">{t("employer.selectArea")}</h2>
            <div className="space-y-3">
              {AREAS.map((area) => {
                const isSelected = booking.area === area;
                return (
                  <Card
                    key={area}
                    className={`p-4 cursor-pointer hover-elevate active-elevate-2 ${
                      isSelected ? "ring-2 ring-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setBooking((prev) => ({ ...prev, area }))}
                    data-testid={`card-area-${area.replace(/\s/g, "-")}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        <MapPin className="h-5 w-5" />
                      </div>
                      <span className="font-medium">{area}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Workers */}
        {step === "workers" && (
          <div>
            <h2 className="text-xl font-bold mb-6">{t("employer.selectWorker")}</h2>
            {isLoadingWorkers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : workers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">{t("employer.noWorkersFound")}</p>
                <Button variant="outline" onClick={handleBack}>
                  {t("employer.tryDifferentArea")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {workers.slice(0, 3).map((worker) => (
                  <WorkerCard
                    key={worker.id}
                    worker={worker}
                    selected={booking.workerId === worker.id}
                    onClick={() => setBooking((prev) => ({ ...prev, workerId: worker.id }))}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === "confirm" && selectedWorker && (
          <div>
            <h2 className="text-xl font-bold mb-6">{t("employer.confirmBooking")}</h2>
            
            <Card className="p-4 mb-4">
              <h3 className="font-semibold mb-3">Booking Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{t(`skill.${booking.service}`)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{new Date(booking.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Area</span>
                  <span className="font-medium">{booking.area}</span>
                </div>
              </div>
            </Card>

            <div className="mb-4">
              <h3 className="font-semibold mb-3">Selected Worker</h3>
              <WorkerCard worker={selectedWorker} compact />
            </div>
          </div>
        )}
      </main>

      {/* Bottom Action */}
      {step !== "success" && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="max-w-lg mx-auto">
            {step === "confirm" ? (
              <Button
                size="lg"
                className="w-full h-14 text-lg"
                onClick={handleConfirm}
                disabled={createJobMutation.isPending}
                data-testid="button-confirm"
              >
                {createJobMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {t("employer.confirm")}
                    <Check className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full h-14 text-lg"
                onClick={handleNext}
                disabled={
                  (step === "service" && !booking.service) ||
                  (step === "date" && !booking.date) ||
                  (step === "area" && !booking.area) ||
                  (step === "workers" && !booking.workerId)
                }
                data-testid="button-next"
              >
                {t("employer.next")}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
