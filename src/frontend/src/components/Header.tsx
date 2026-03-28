import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Bell, ChevronDown, Globe, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Page } from "../App";
import type { Notification } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { LANGUAGES, useTranslation } from "../i18n";
import type { Language } from "../i18n";
import { MobileMenuButton } from "./Sidebar";

function timeAgo(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

interface HeaderProps {
  title: string;
  onMobileMenuOpen: () => void;
  onNavigate: (page: Page) => void;
  onSearch?: (query: string) => void;
}

export function Header({
  title,
  onMobileMenuOpen,
  onNavigate,
  onSearch,
}: HeaderProps) {
  const { language, setLanguage, t } = useTranslation();
  const { actor, isFetching } = useActor();
  const currentLang = LANGUAGES.find((l) => l.code === language);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState<Notification[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const fetchNotifData = useCallback(async () => {
    if (!actor) return;
    try {
      const [count, notifs] = await Promise.all([
        (actor as any).getUnreadNotificationCount(),
        (actor as any).getMyNotifications(0n, 5n),
      ]);
      setUnreadCount(Number(count));
      setRecentNotifs(notifs);
    } catch {
      /* ignore */
    }
  }, [actor]);

  useEffect(() => {
    if (actor && !isFetching) {
      fetchNotifData();
      const interval = setInterval(fetchNotifData, 30000);
      return () => clearInterval(interval);
    }
  }, [actor, isFetching, fetchNotifData]);

  const handleSearch = (value: string) => {
    if (value.trim() && onSearch) {
      onSearch(value.trim());
      setMobileSearchOpen(false);
    }
  };

  return (
    <header className="relative border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <MobileMenuButton onClick={onMobileMenuOpen} />
          <h1 className="font-display font-semibold text-base text-foreground">
            {title}
          </h1>
        </div>
        {/* Desktop search bar */}
        {onSearch && (
          <div className="hidden sm:flex items-center flex-1 max-w-xs mx-4">
            <form
              className="relative w-full"
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(searchValue);
              }}
            >
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                data-ocid="header.search.search_input"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-8 h-8 text-xs bg-muted/30 border-border/40 focus-visible:ring-primary/30"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => setSearchValue("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </form>
          </div>
        )}
        <div className="flex items-center gap-1">
          {/* Mobile search toggle */}
          {onSearch && (
            <button
              type="button"
              data-ocid="header.mobile_search.button"
              aria-label={mobileSearchOpen ? "Close search" : "Open search"}
              aria-expanded={mobileSearchOpen}
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="sm:hidden flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {mobileSearchOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger
              data-ocid="header.notifications.button"
              aria-label={
                unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : "Notifications"
              }
              className="relative flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 text-[9px] bg-primary text-primary-foreground flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              data-ocid="header.notifications.dropdown_menu"
              align="end"
              className="bg-popover border-border w-80"
            >
              <div className="px-3 py-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {t("notifications")}
                </p>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {unreadCount} {t("unread")}
                  </Badge>
                )}
              </div>
              <DropdownMenuSeparator className="bg-border/50" />
              {recentNotifs.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {t("noNotifications")}
                </div>
              ) : (
                recentNotifs.map((n, i) => (
                  <DropdownMenuItem
                    key={n.id}
                    data-ocid={`header.notif.item.${i + 1}`}
                    onClick={() => onNavigate("notificationsCenter")}
                    className="px-3 py-2.5 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        )}
                        <p className="text-xs font-medium text-foreground truncate">
                          {n.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-auto">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5 pl-3.5">
                        {n.body}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem
                data-ocid="header.view_all_notifs.button"
                onClick={() => onNavigate("notificationsCenter")}
                className="px-3 py-2 text-xs text-primary hover:text-primary cursor-pointer justify-center font-medium"
              >
                {t("viewAllNotifications")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language selector */}
          <DropdownMenu>
            <DropdownMenuTrigger
              data-ocid="header.language.button"
              aria-label={`Language: ${currentLang?.label}`}
              aria-haspopup="listbox"
              className="flex items-center gap-1 px-2 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-xs"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentLang?.label}</span>
              <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              data-ocid="header.language.dropdown_menu"
              align="end"
              className="bg-popover border-border"
            >
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  data-ocid={`header.language.${lang.code}.button`}
                  onClick={() => setLanguage(lang.code as Language)}
                  className={cn(
                    "text-xs cursor-pointer",
                    language === lang.code && "text-primary font-medium",
                  )}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile search bar – expands below header */}
      {mobileSearchOpen && onSearch && (
        <div className="sm:hidden px-4 pb-3">
          <form
            className="relative"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchValue);
            }}
          >
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              data-ocid="header.mobile_search.search_input"
              autoFocus
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search..."
              className="pl-8 h-9 text-sm bg-muted/30 border-border/40"
            />
          </form>
        </div>
      )}
    </header>
  );
}
