import { ArrowRight, Shield, Clock, Star, Users } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">MS</span>
            </div>
            <span className="font-bold text-lg">MaidSync</span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 pt-8 pb-6 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3 leading-tight">
            {t("employer.findWorker")}
          </h1>
          <p className="text-muted-foreground text-lg">
            Safe, trusted, reliable domestic workers
          </p>
        </div>

        <Link href="/book">
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold gap-2"
            data-testid="button-book-now"
          >
            {t("nav.book")}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Trust Indicators */}
      <section className="px-4 py-6 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">{t("worker.verified")}</h3>
            <p className="text-sm text-muted-foreground">ID checked workers</p>
          </Card>

          <Card className="p-4 text-center">
            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="font-semibold mb-1">Fast Booking</h3>
            <p className="text-sm text-muted-foreground">Book in 1 minute</p>
          </Card>

          <Card className="p-4 text-center">
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
              <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-semibold mb-1">{t("worker.rating")}</h3>
            <p className="text-sm text-muted-foreground">Rated by employers</p>
          </Card>

          <Card className="p-4 text-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold mb-1">Replacement</h3>
            <p className="text-sm text-muted-foreground">Guaranteed backup</p>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-4 py-6 max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-4">How it Works</h2>
        <div className="space-y-3">
          {[
            { step: "1", title: t("employer.selectService"), desc: "Choose what you need" },
            { step: "2", title: t("employer.selectDate"), desc: "Pick a date" },
            { step: "3", title: t("employer.selectWorker"), desc: "View 2-3 matched workers" },
            { step: "4", title: t("employer.confirm"), desc: "Confirm your booking" },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-6 max-w-lg mx-auto">
        <Card className="p-6 bg-primary text-primary-foreground text-center">
          <h2 className="text-xl font-bold mb-2">Ready to book?</h2>
          <p className="opacity-90 mb-4">Find your trusted worker today</p>
          <Link href="/book">
            <Button 
              variant="secondary" 
              size="lg" 
              className="w-full gap-2"
              data-testid="button-find-worker-cta"
            >
              {t("employer.findWorker")}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </Card>
      </section>
    </div>
  );
}
