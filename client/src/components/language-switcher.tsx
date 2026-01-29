import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();
  const currentLang = LANGUAGES.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="default"
          className="gap-2 px-3"
          data-testid="button-language-switcher"
        >
          <Globe className="h-5 w-5" />
          <span className="text-sm font-medium">{currentLang?.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`gap-2 cursor-pointer ${
              language === lang.code ? "bg-accent" : ""
            }`}
            data-testid={`menu-item-lang-${lang.code}`}
          >
            <span className="font-medium">{lang.nativeName}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
