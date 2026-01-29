import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Home, Sparkles, Flame, Shirt, Square, Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { HOUSE_SIZES, TASKS, AVAILABILITY_WINDOWS, AREAS } from "@shared/schema";
import type { PricingRule } from "@shared/schema";

const taskIcons: Record<string, typeof Sparkles> = {
  general_cleaning: Sparkles,
  ironing: Flame,
  laundry: Shirt,
  windows: Square,
  deep_clean: Sparkles,
};

type BookingStep = "houseSize" | "tasks" | "window" | "date" | "area" | "review" | "success";

interface BookingState {
  houseSize: string;
  tasks: string[];
  availabilityWindow: string;
  date: string;
  area: string;
}

export default function Book() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [step, setStep] = useState<BookingStep>("houseSize");
  const [booking, setBooking] = useState<BookingState>({
    houseSize: "",
    tasks: [],
    availabilityWindow: "",
    date: "",
    area: "",
  });
  const [price, setPrice] = useState<number>(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined);

  // Fetch pricing rules from server
  const { data: pricingRules } = useQuery<PricingRule>({
    queryKey: ["/api/pricing"],
  });

  // Calculate price using server pricing rules when house size or tasks change
  useEffect(() => {
    const calculateServerPrice = async () => {
      if (booking.houseSize && booking.tasks.length > 0) {
        try {
          const response = await apiRequest("POST", "/api/pricing/calculate", {
            houseSize: booking.houseSize,
            tasks: booking.tasks,
          });
          const data = await response.json();
          setPrice(data.price);
        } catch (error) {
          console.error("Failed to calculate price:", error);
        }
      }
    };
    calculateServerPrice();
  }, [booking.houseSize, booking.tasks]);

  const createJobMutation = useMutation({
    mutationFn: async () => {
      // Price is calculated server-side, we don't send it
      return apiRequest("POST", "/api/jobs", {
        employerId: "temp-employer-" + Date.now(),
        houseSize: booking.houseSize,
        tasks: booking.tasks,
        availabilityWindow: booking.availabilityWindow,
        date: booking.date,
        area: booking.area,
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

  const todayValue = new Date().toISOString().split("T")[0];
  const tomorrowValue = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  
  const dates = [
    { key: "today", label: t("common.today"), value: todayValue },
    { key: "tomorrow", label: t("common.tomorrow"), value: tomorrowValue },
  ];

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedCalendarDate(date);
      const dateValue = date.toISOString().split("T")[0];
      setBooking(prev => ({ ...prev, date: dateValue }));
      setShowCalendar(false);
    }
  };

  const isCustomDate = booking.date && booking.date !== todayValue && booking.date !== tomorrowValue;

  const steps: BookingStep[] = ["houseSize", "tasks", "window", "date", "area", "review"];
  const currentIndex = steps.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case "houseSize": return !!booking.houseSize;
      case "tasks": return booking.tasks.length > 0;
      case "window": return !!booking.availabilityWindow;
      case "date": return !!booking.date;
      case "area": return !!booking.area;
      case "review": return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step === "review") {
      createJobMutation.mutate();
    } else {
      const nextIndex = currentIndex + 1;
      if (nextIndex < steps.length) {
        setStep(steps[nextIndex]);
      }
    }
  };

  const handleBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const toggleTask = (taskKey: string) => {
    setBooking(prev => ({
      ...prev,
      tasks: prev.tasks.includes(taskKey)
        ? prev.tasks.filter(t => t !== taskKey)
        : [...prev.tasks, taskKey]
    }));
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 bg-background border-b p-4 flex items-center justify-between">
          <div className="w-10" />
          <h1 className="text-lg font-semibold">{t("book.confirmed")}</h1>
          <LanguageSwitcher />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t("book.confirmed")}</h2>
          <p className="text-muted-foreground mb-8 max-w-xs">{t("book.weWillHandle")}</p>
          
          <Card className="w-full max-w-sm p-4 mb-8">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("book.houseSize")}</span>
                <span className="font-medium">{t(`book.houseSize${booking.houseSize.charAt(0).toUpperCase() + booking.houseSize.slice(1)}`)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("book.selectTasks")}</span>
                <span className="font-medium">{booking.tasks.length} tasks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("book.selectDate")}</span>
                <span className="font-medium">{booking.date}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-semibold">{t("book.yourPrice")}</span>
                <span className="font-bold text-primary text-lg">{t("common.rands")}{price}</span>
              </div>
            </div>
          </Card>

          <Link href="/">
            <Button size="lg" data-testid="button-go-home">
              <Home className="w-5 h-5 mr-2" />
              {t("nav.home")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <header className="sticky top-0 z-50 bg-background border-b p-4 flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back-home">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">{t("nav.book")}</h1>
        <LanguageSwitcher />
      </header>

      <div className="p-4">
        <div className="flex gap-1 mb-6">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i <= currentIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === "houseSize" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{t("book.houseSize")}</h2>
            <div className="grid gap-3">
              {HOUSE_SIZES.map((size) => (
                <Card
                  key={size.key}
                  data-testid={`card-housesize-${size.key}`}
                  className={`p-6 cursor-pointer transition-all hover-elevate ${
                    booking.houseSize === size.key
                      ? "ring-2 ring-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => setBooking(prev => ({ ...prev, houseSize: size.key }))}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {t(`book.houseSize${size.key.charAt(0).toUpperCase() + size.key.slice(1)}`)}
                      </h3>
                      <p className="text-muted-foreground">{size.bedrooms} {t("book.bedrooms")}</p>
                    </div>
                    {booking.houseSize === size.key && (
                      <Check className="w-6 h-6 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === "tasks" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{t("book.selectTasks")}</h2>
            <p className="text-muted-foreground text-sm">Select all that apply</p>
            <div className="grid gap-3">
              {TASKS.map((task) => {
                const Icon = taskIcons[task.key] || Sparkles;
                const isSelected = booking.tasks.includes(task.key);
                return (
                  <Card
                    key={task.key}
                    data-testid={`card-task-${task.key}`}
                    className={`p-4 cursor-pointer transition-all hover-elevate ${
                      isSelected ? "ring-2 ring-primary bg-primary/5" : ""
                    }`}
                    onClick={() => toggleTask(task.key)}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={() => toggleTask(task.key)}
                        className="pointer-events-none"
                      />
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-medium">{t(`task.${task.key}`)}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {step === "window" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{t("book.selectWindow")}</h2>
            <div className="grid gap-3">
              {AVAILABILITY_WINDOWS.map((window) => (
                <Card
                  key={window.key}
                  data-testid={`card-window-${window.key}`}
                  className={`p-5 cursor-pointer transition-all hover-elevate ${
                    booking.availabilityWindow === window.key
                      ? "ring-2 ring-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => setBooking(prev => ({ ...prev, availabilityWindow: window.key }))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{t(`window.${window.key}`)}</h3>
                        <p className="text-sm text-muted-foreground">{t(`window.${window.key}Desc`)}</p>
                      </div>
                    </div>
                    {booking.availabilityWindow === window.key && (
                      <Check className="w-6 h-6 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === "date" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{t("book.selectDate")}</h2>
            <div className="grid gap-3">
              {dates.map((date) => (
                <Card
                  key={date.key}
                  data-testid={`card-date-${date.key}`}
                  className={`p-5 cursor-pointer transition-all hover-elevate ${
                    booking.date === date.value
                      ? "ring-2 ring-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => setBooking(prev => ({ ...prev, date: date.value }))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CalendarIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{date.label}</h3>
                        <p className="text-sm text-muted-foreground">{date.value}</p>
                      </div>
                    </div>
                    {booking.date === date.value && (
                      <Check className="w-6 h-6 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
              
              <Card
                data-testid="card-date-choose"
                className={`p-5 cursor-pointer transition-all hover-elevate ${
                  isCustomDate
                    ? "ring-2 ring-primary bg-primary/5"
                    : ""
                }`}
                onClick={() => setShowCalendar(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t("book.chooseDate")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {isCustomDate ? booking.date : t("book.pickFromCalendar")}
                      </p>
                    </div>
                  </div>
                  {isCustomDate && (
                    <Check className="w-6 h-6 text-primary" />
                  )}
                </div>
              </Card>
            </div>

            <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>{t("book.chooseDate")}</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center py-4">
                  <Calendar
                    mode="single"
                    selected={selectedCalendarDate}
                    onSelect={handleCalendarSelect}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="rounded-md border"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {step === "area" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{t("worker.area")}</h2>
            <div className="grid gap-3">
              {AREAS.map((area) => (
                <Card
                  key={area}
                  data-testid={`card-area-${area.replace(/\s+/g, "-")}`}
                  className={`p-5 cursor-pointer transition-all hover-elevate ${
                    booking.area === area
                      ? "ring-2 ring-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => setBooking(prev => ({ ...prev, area }))}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{area}</span>
                    {booking.area === area && (
                      <Check className="w-6 h-6 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{t("book.reviewPay")}</h2>
            
            <Card className="p-5">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground">{t("book.houseSize")}</span>
                  <span className="font-medium">
                    {t(`book.houseSize${booking.houseSize.charAt(0).toUpperCase() + booking.houseSize.slice(1)}`)}
                  </span>
                </div>
                
                <div className="pb-3 border-b">
                  <span className="text-muted-foreground block mb-2">{t("book.selectTasks")}</span>
                  <div className="flex flex-wrap gap-2">
                    {booking.tasks.map(task => (
                      <span key={task} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        {t(`task.${task}`)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground">{t("book.selectWindow")}</span>
                  <span className="font-medium">{t(`window.${booking.availabilityWindow}`)}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground">{t("book.selectDate")}</span>
                  <span className="font-medium">{booking.date}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground">{t("worker.area")}</span>
                  <span className="font-medium">{booking.area}</span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-bold">{t("book.yourPrice")}</span>
                  <span className="text-2xl font-bold text-primary">{t("common.rands")}{price}</span>
                </div>
              </div>
            </Card>

            <p className="text-center text-sm text-muted-foreground px-4">
              {t("book.weWillHandle")}
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex gap-3 safe-area-inset-bottom">
        {currentIndex > 0 && (
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={handleBack}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t("book.back")}
          </Button>
        )}
        <Button
          size="lg"
          className="flex-1"
          disabled={!canProceed() || createJobMutation.isPending}
          onClick={handleNext}
          data-testid={step === "review" ? "button-pay" : "button-next"}
        >
          {createJobMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : step === "review" ? (
            <>
              {t("book.payNow")}
              <Check className="w-5 h-5 ml-2" />
            </>
          ) : (
            <>
              {t("book.next")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
