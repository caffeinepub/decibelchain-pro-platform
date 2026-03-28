import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Compass, DollarSign, LayoutDashboard, Menu, Rss } from "lucide-react";
import type { Page } from "../App";

interface MobileBottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onMoreOpen: () => void;
  unreadCount?: number;
}

const tabs: {
  label: string;
  page: Page | null;
  icon: React.ComponentType<{ className?: string }>;
  ocid: string;
}[] = [
  {
    label: "Home",
    page: "dashboard",
    icon: LayoutDashboard,
    ocid: "bottom_nav.dashboard.tab",
  },
  {
    label: "Royalties",
    page: "revenueDashboard",
    icon: DollarSign,
    ocid: "bottom_nav.royalties.tab",
  },
  {
    label: "Community",
    page: "activityFeed",
    icon: Rss,
    ocid: "bottom_nav.community.tab",
  },
  {
    label: "Discovery",
    page: "publicCatalog",
    icon: Compass,
    ocid: "bottom_nav.discovery.tab",
  },
  { label: "More", page: null, icon: Menu, ocid: "bottom_nav.more.button" },
];

export function MobileBottomNav({
  currentPage,
  onNavigate,
  onMoreOpen,
  unreadCount = 0,
}: MobileBottomNavProps) {
  return (
    <nav
      data-ocid="bottom_nav.panel"
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-sidebar border-t border-sidebar-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
    >
      <div className="flex items-stretch h-[60px]">
        {tabs.map((tab) => {
          const isActive = tab.page !== null && currentPage === tab.page;
          const Icon = tab.icon;
          const isMore = tab.page === null;
          return (
            <button
              key={tab.ocid}
              type="button"
              data-ocid={tab.ocid}
              aria-label={isMore ? "Open more navigation" : tab.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                if (tab.page !== null) {
                  onNavigate(tab.page);
                } else {
                  onMoreOpen();
                }
              }}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-sidebar-foreground",
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.page === "activityFeed" && unreadCount > 0 && (
                  <Badge className="absolute -top-1.5 -right-2 h-4 min-w-4 px-0.5 text-[9px] bg-primary text-primary-foreground flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
