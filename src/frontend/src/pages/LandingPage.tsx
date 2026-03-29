import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  FileText,
  Globe,
  Loader2,
  Megaphone,
  Music,
  Shield,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { LANGUAGES, useTranslation } from "../i18n";
import type { Language } from "../i18n";

interface LandingPageProps {
  onLogin: () => void;
  isLoggingIn: boolean;
  onNavigate?: (page: string) => void;
}

const features = [
  { key: "feature1", icon: Shield },
  { key: "feature2", icon: Users },
  { key: "feature3", icon: FileText },
  { key: "feature4", icon: Globe },
];

export function LandingPage({
  onLogin,
  isLoggingIn,
  onNavigate,
}: LandingPageProps) {
  const { t, language, setLanguage } = useTranslation();
  const currentLang = LANGUAGES.find((l) => l.code === language);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Music className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">DecibelChain</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            data-ocid="landing.language.select"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border border-border"
          >
            <span>{currentLang?.flag}</span>
            <span>{currentLang?.label}</span>
            <ChevronDown className="w-3 h-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                data-ocid={`landing.language.${lang.code}.item`}
                onClick={() => setLanguage(lang.code as Language)}
                className={language === lang.code ? "text-primary" : ""}
              >
                <span className="mr-2">{lang.flag}</span>
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Campaign Banner */}
      {onNavigate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-6 mb-2 rounded-xl bg-primary/10 border border-primary/30 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <Megaphone className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                The Music Industry Owes You More
              </p>
              <p className="text-xs text-muted-foreground">
                Discover why thousands of creators are switching to self-managed
                PRO rights.
              </p>
            </div>
          </div>
          <Button
            data-ocid="landing.campaign.primary_button"
            size="sm"
            onClick={() => onNavigate("industryHub")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold flex-shrink-0"
          >
            See Why Thousands Are Switching \u2192
          </Button>
        </motion.div>
      )}

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-8 w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center glow-gold"
          >
            <Music className="w-10 h-10 text-primary" />
          </motion.div>

          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            <span className="gold-shimmer">DecibelChain</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-3 font-display">
            {t("tagline")}
          </p>
          <p className="text-sm text-muted-foreground/70 mb-10 max-w-lg mx-auto leading-relaxed">
            {t("landingDesc")}
          </p>

          <Button
            data-ocid="landing.login.primary_button"
            size="lg"
            onClick={onLogin}
            disabled={isLoggingIn}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 font-semibold text-base glow-gold"
          >
            {isLoggingIn ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Shield className="mr-2 h-5 w-5" />
            )}
            {t("loginWithII")}
          </Button>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl w-full"
        >
          {features.map(({ key, icon: Icon }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border"
            >
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground font-medium">
                {t(key)}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-muted-foreground/50">
        \u00a9 {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground transition-colors"
        >
          Built with \u2665 using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
