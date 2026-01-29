import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Loader2, User, Briefcase } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

type Step = "email" | "signup" | "role";

export default function Login() {
  const { t } = useI18n();
  const { login, signup } = useAuth();
  const [, setLocation] = useLocation();
  
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    const result = await login(email);
    setIsLoading(false);
    
    if (result.success) {
      setLocation("/");
    } else if (result.needsSignup) {
      setStep("signup");
    } else {
      setError("Login failed. Please try again.");
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setStep("role");
  };

  const handleRoleSelect = async (role: "worker" | "employer") => {
    setIsLoading(true);
    setError("");
    
    const result = await signup(email, name, role);
    setIsLoading(false);
    
    if (result.success) {
      if (role === "worker") {
        setLocation("/worker");
      } else {
        setLocation("/");
      }
    } else {
      setError(result.error || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">MaidSync</h1>
        <LanguageSwitcher />
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">{t("auth.welcome")}</h2>
            <p className="text-muted-foreground mt-2">{t("auth.loginToContinue")}</p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  className="mt-1"
                  autoFocus
                  data-testid="input-email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("auth.login")}
              </Button>
            </form>
          )}

          {step === "signup" && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <Label>{t("auth.email")}</Label>
                <div className="text-sm text-muted-foreground mt-1">{email}</div>
              </div>
              <div>
                <Label htmlFor="name">{t("auth.name")}</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("auth.namePlaceholder")}
                  className="mt-1"
                  autoFocus
                  data-testid="input-name"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-continue">
                {t("auth.createAccount")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep("email")}
              >
                {t("book.back")}
              </Button>
            </form>
          )}

          {step === "role" && (
            <div className="space-y-4">
              <div>
                <Label>{t("auth.name")}</Label>
                <div className="text-sm text-muted-foreground mt-1">{name}</div>
              </div>
              
              <Button
                onClick={() => handleRoleSelect("employer")}
                className="w-full h-16 text-left justify-start gap-4"
                variant="outline"
                disabled={isLoading}
                data-testid="button-employer"
              >
                <Briefcase className="h-6 w-6" />
                <span>{t("auth.continueAsEmployer")}</span>
              </Button>
              
              <Button
                onClick={() => handleRoleSelect("worker")}
                className="w-full h-16 text-left justify-start gap-4"
                variant="outline"
                disabled={isLoading}
                data-testid="button-worker"
              >
                <User className="h-6 w-6" />
                <span>{t("auth.continueAsWorker")}</span>
              </Button>

              {isLoading && (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep("signup")}
              >
                {t("book.back")}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
