import { Home, Search, User, Settings, LogIn } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

interface NavItem {
  path: string;
  labelKey: string;
  icon: typeof Home;
  roles?: string[];
}

const allNavItems: NavItem[] = [
  { path: "/", labelKey: "nav.home", icon: Home },
  { path: "/book", labelKey: "nav.workers", icon: Search },
  { path: "/worker", labelKey: "nav.profile", icon: User, roles: ["worker"] },
  { path: "/admin", labelKey: "nav.admin", icon: Settings, roles: ["admin"] },
];

export function BottomNav() {
  const [location] = useLocation();
  const { t } = useI18n();
  const { user } = useAuth();

  const navItems = allNavItems.filter(item => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  if (!user) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-card-border safe-area-pb">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              location === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="nav-home"
          >
            <Home className={`h-6 w-6 ${location === "/" ? "stroke-[2.5]" : ""}`} />
            <span className="text-xs font-medium">{t("nav.home")}</span>
          </Link>
          <Link
            href="/book"
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              location === "/book" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="nav-workers"
          >
            <Search className={`h-6 w-6 ${location === "/book" ? "stroke-[2.5]" : ""}`} />
            <span className="text-xs font-medium">{t("nav.workers")}</span>
          </Link>
          <Link
            href="/login"
            className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            data-testid="nav-login"
          >
            <LogIn className="h-6 w-6" />
            <span className="text-xs font-medium">{t("nav.login")}</span>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-card-border safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.path || 
            (item.path !== "/" && location.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`nav-${item.labelKey.split('.')[1]}`}
            >
              <Icon className={`h-6 w-6 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-xs font-medium">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
