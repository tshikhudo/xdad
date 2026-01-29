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

type Step = "login" | "signup" | "role";

export default function Login() {
  const { t } = useI18n();
  const { login, signup } = useAuth();
  const [, setLocation] = useLocation();
  
  const [step, setStep] = useState<Step>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError(t("auth.enterUsername"));
      return;
    }
    if (!password.trim()) {
      setError(t("auth.enterPassword"));
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    const result = await login(username, password);
    setIsLoading(false);
    
    if (result.success) {
      setLocation("/");
    } else if (result.needsSignup) {
      setStep("signup");
    } else {
      setError(result.error || t("auth.loginFailed"));
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("auth.enterName"));
      return;
    }
    setStep("role");
  };

  const handleRoleSelect = async (role: "worker" | "employer") => {
    setIsLoading(true);
    setError("");
    
    const result = await signup(username, password, name, role);
    setIsLoading(false);
    
    if (result.success) {
      if (role === "worker") {
        setLocation("/worker");
      } else {
        setLocation("/");
      }
    } else {
      setError(result.error || t("auth.signupFailed"));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 flex justify-between items-center">
        <img src="/logo.jpg" alt="Febreeze Clean" className="h-12 w-12 rounded-lg object-cover" />
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

          {step === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">{t("auth.username")}</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("auth.usernamePlaceholder")}
                  className="mt-1"
                  autoFocus
                  data-testid="input-username"
                />
              </div>
              <div>
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  className="mt-1"
                  data-testid="input-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("auth.login")}
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">{t("auth.or")}</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-google-login"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t("auth.signInWithGoogle")}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground mt-4">
                {t("auth.noAccount")}{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setStep("signup")}
                >
                  {t("auth.signup")}
                </button>
              </div>
            </form>
          )}

          {step === "signup" && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <Label htmlFor="signup-username">{t("auth.username")}</Label>
                <Input
                  id="signup-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("auth.usernamePlaceholder")}
                  className="mt-1"
                  data-testid="input-signup-username"
                />
              </div>
              <div>
                <Label htmlFor="signup-password">{t("auth.password")}</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  className="mt-1"
                  data-testid="input-signup-password"
                />
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
                {t("book.next")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep("login")}
              >
                {t("book.back")}
              </Button>
            </form>
          )}

          {step === "role" && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground mb-4">
                {t("auth.chooseRole")}
              </p>
              <Button
                className="w-full h-16 text-lg"
                variant="outline"
                onClick={() => handleRoleSelect("employer")}
                disabled={isLoading}
                data-testid="button-role-employer"
              >
                <Briefcase className="h-6 w-6 mr-3" />
                {t("auth.continueAsEmployer")}
              </Button>
              <Button
                className="w-full h-16 text-lg"
                variant="outline"
                onClick={() => handleRoleSelect("worker")}
                disabled={isLoading}
                data-testid="button-role-worker"
              >
                <User className="h-6 w-6 mr-3" />
                {t("auth.continueAsWorker")}
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
