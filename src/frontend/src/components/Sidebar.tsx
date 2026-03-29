import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Award,
  BarChart2,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Compass,
  DollarSign,
  FileMusic,
  GitMerge,
  Globe,
  Key,
  Layers,
  LayoutDashboard,
  LineChart,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  Mic2,
  Music,
  Package,
  Paintbrush,
  PieChart,
  Rocket,
  Rss,
  Scale,
  ScrollText,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Store,
  TrendingUp,
  User,
  Users,
  Webhook,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Page } from "../App";
import { useBranding } from "../contexts/BrandingContext";
import { useActor } from "../hooks/useActor";
import { useTranslation } from "../i18n";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  displayName?: string;
  isMobile?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  isLoggedIn?: boolean;
  onLogin?: () => void;
}

const setupNavItems: {
  page: Page;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
}[] = [{ page: "adminSetup", icon: Settings, key: "adminSetup" }];

const navItems: {
  page: Page;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
}[] = [
  { page: "dashboard", icon: LayoutDashboard, key: "dashboard" },
  { page: "organizations", icon: Building2, key: "organizations" },
  { page: "creativeWorks", icon: FileMusic, key: "creativeWorks" },
  { page: "ownershipSplits", icon: PieChart, key: "ownershipSplits" },
  { page: "vendorDirectory", icon: Store, key: "vendorDirectory" },
  { page: "auditTrail", icon: ClipboardList, key: "auditTrail" },
  { page: "profile", icon: User, key: "profile" },
];

const royaltyNavItems: {
  page: Page;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
}[] = [
  { page: "revenueDashboard", icon: DollarSign, key: "revenueDashboard" },
  {
    page: "distributionStatements",
    icon: BarChart3,
    key: "distributionStatements",
  },
];

const licensingNavItems: {
  page: Page;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
}[] = [{ page: "licensingManager", icon: Scale, key: "licensingManager" }];

const financingNavItems: {
  page: Page;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
}[] = [
  { page: "financingOffers", icon: TrendingUp, key: "financingOffers" },
  { page: "investmentPortfolio", icon: Briefcase, key: "investmentPortfolio" },
];

const analyticsNavItems: {
  page: Page;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
}[] = [
  { page: "reports", icon: BarChart2, key: "reports" },
  { page: "searchResults", icon: Search, key: "searchResults" },
  {
    page: "intelligenceDashboard",
    icon: LineChart,
    key: "intelligenceDashboard",
  },
  { page: "crossOrgRoyalties", icon: GitMerge, key: "crossOrgRoyalties" },
];

const complianceNavItems: {
  page: Page;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
}[] = [{ page: "disputeCenter", icon: Shield, key: "disputeCenter" }];

const platformNavItems: {
  page: Page;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
}[] = [
  { page: "territoryManager", icon: Globe, key: "territoryManager" },
  { page: "performanceTracker", icon: Mic2, key: "performanceTracker" },
  { page: "catalogValuation", icon: TrendingUp, key: "catalogValuation" },
  { page: "dspLookup", icon: Search, key: "dspLookup" },
  { page: "batchOperations", icon: Layers, key: "batchOperations" },
  { page: "certificates", icon: Award, key: "certificates" },
];

const onboardingNavItems: {
  page: Page;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
}[] = [{ page: "tenantOnboarding", icon: Rocket, key: "tenantOnboarding" }];

const vendorPortalNavItems: {
  page: Page;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
}[] = [{ page: "vendorPortal", icon: Package, key: "vendorPortal" }];

function NavSection({
  items,
  currentPage,
  onNavigate,
  onMobileClose,
  collapsed,
  isMobile,
  t,
  badges,
}: {
  items: {
    page: Page;
    icon: React.ComponentType<{ className?: string }>;
    key: string;
  }[];
  currentPage: Page;
  onNavigate: (p: Page) => void;
  onMobileClose?: () => void;
  collapsed: boolean;
  isMobile?: boolean;
  t: (key: string) => string;
  badges?: Record<string, number>;
}) {
  return (
    <>
      {items.map(({ page, icon: Icon, key }) => (
        <button
          type="button"
          key={page}
          data-ocid={`nav.${key}.link`}
          aria-current={currentPage === page ? "page" : undefined}
          onClick={() => {
            onNavigate(page);
            onMobileClose?.();
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all",
            collapsed && !isMobile && "justify-center px-2",
            currentPage === page
              ? "bg-sidebar-accent text-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          )}
        >
          <Icon
            className={cn(
              "w-4 h-4 flex-shrink-0",
              currentPage === page && "text-primary",
            )}
          />
          {(!collapsed || isMobile) && (
            <span className="flex-1 text-left">{t(key)}</span>
          )}
          {(!collapsed || isMobile) && badges?.[page] ? (
            <Badge className="h-4 min-w-4 px-1 text-[9px] bg-primary text-primary-foreground">
              {badges[page] > 9 ? "9+" : badges[page]}
            </Badge>
          ) : null}
          {collapsed && !isMobile && badges?.[page] ? (
            <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-primary" />
          ) : null}
        </button>
      ))}
    </>
  );
}

export function Sidebar({
  currentPage,
  onNavigate,
  onLogout,
  collapsed,
  onToggleCollapse,
  displayName,
  isMobile,
  mobileOpen,
  onMobileClose,
  isLoggedIn = false,
  onLogin,
}: SidebarProps) {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();
  const { logoUrl } = useBranding();
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const fetchBadges = useCallback(async () => {
    if (!actor) return;
    try {
      const [convs, notifCount, adminCheck] = await Promise.all([
        (actor as any).getMyConversations(),
        (actor as any).getUnreadNotificationCount(),
        (actor as any).isCallerAdmin(),
      ]);
      setIsAdmin(Boolean(adminCheck));
      const totalUnread = convs.reduce(
        (sum, c) => sum + Number(c.unreadCount),
        0,
      );
      setUnreadMsgs(totalUnread);
      setUnreadNotifs(Number(notifCount));
    } catch {
      /* ignore */
    }
  }, [actor]);

  useEffect(() => {
    if (actor && !isFetching) {
      fetchBadges();
      const interval = setInterval(fetchBadges, 30000);
      return () => clearInterval(interval);
    }
  }, [actor, isFetching, fetchBadges]);

  // Focus management for mobile sidebar
  useEffect(() => {
    if (!isMobile) return;
    if (mobileOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      const focusable = sidebarRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    } else {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    }
  }, [isMobile, mobileOpen]);

  const communityNavItems: {
    page: Page;
    icon: React.ComponentType<{ className?: string }>;
    key: string;
  }[] = [
    { page: "activityFeed", icon: Rss, key: "activityFeed" },
    { page: "messages", icon: MessageCircle, key: "messages" },
    { page: "memberDirectory", icon: Users, key: "memberDirectory" },
    { page: "notificationsCenter", icon: Bell, key: "notificationsCenter" },
  ];

  const discoveryNavItems: {
    page: Page;
    icon: React.ComponentType<{ className?: string }>;
    key: string;
  }[] = [
    { page: "publicCatalog", icon: Compass, key: "publicCatalog" },
    {
      page: "certificateVerification",
      icon: ShieldCheck,
      key: "certificateVerify",
    },
  ];

  const marketplaceNavItems: {
    page: Page;
    icon: React.ComponentType<{ className?: string }>;
    key: string;
  }[] = [
    {
      page: "marketplaceListings",
      icon: ShoppingBag,
      key: "marketplaceListings",
    },
  ];

  const contractsNavItems: {
    page: Page;
    icon: React.ComponentType<{ className?: string }>;
    key: string;
  }[] = [
    { page: "contractGenerator", icon: ScrollText, key: "contractGenerator" },
  ];

  const helpNavItems: {
    page: Page;
    icon: React.ComponentType<{ className?: string }>;
    key: string;
  }[] = [{ page: "helpCenter", icon: BookOpen, key: "helpCenter" }];

  const adminNavItems: {
    page: Page;
    icon: React.ComponentType<{ className?: string }>;
    key: string;
  }[] = [
    { page: "platformAdmin", icon: ShieldCheck, key: "platformAdmin" },
    { page: "apiKeyManager", icon: Key, key: "apiKeyManager" },
    { page: "webhookManager", icon: Webhook, key: "webhookManager" },
    { page: "marketplaceAdmin", icon: Store, key: "marketplaceAdmin" },
    { page: "brandingSettings", icon: Paintbrush, key: "brandingSettings" },
  ];

  const communityBadges: Record<string, number> = {};
  if (unreadMsgs > 0) communityBadges.messages = unreadMsgs;
  if (unreadNotifs > 0) communityBadges.notificationsCenter = unreadNotifs;

  const sidebarContent = (
    <div
      ref={sidebarRef}
      className="flex flex-col h-full bg-sidebar border-r border-sidebar-border"
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border",
          collapsed && !isMobile && "justify-center px-2",
        )}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Organization logo"
            className="flex-shrink-0 h-8 w-auto max-w-[32px] object-contain"
          />
        ) : (
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Music className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
        {(!collapsed || isMobile) && (
          <div className="overflow-hidden">
            <p className="font-display font-bold text-sm text-sidebar-foreground truncate">
              DecibelChain
            </p>
            <p className="text-xs text-muted-foreground truncate">
              PRO Platform
            </p>
          </div>
        )}
        {!isMobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="ml-auto text-muted-foreground hover:text-sidebar-foreground transition-colors"
            data-ocid="sidebar.toggle"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
        {isMobile && onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto text-muted-foreground hover:text-sidebar-foreground"
            aria-label="Close navigation"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav
        aria-label="Main navigation"
        className="flex-1 p-2 space-y-0.5 overflow-y-auto"
      >
        <NavSection
          items={navItems}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onMobileClose={onMobileClose}
          collapsed={collapsed}
          isMobile={isMobile}
          t={t}
        />

        {/* Vendors section */}
        {(!collapsed || isMobile) && (
          <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            Vendors
          </p>
        )}
        <NavSection
          items={vendorPortalNavItems}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onMobileClose={onMobileClose}
          collapsed={collapsed}
          isMobile={isMobile}
          t={t}
        />

        {/* Royalties section */}
        {(!collapsed || isMobile) && (
          <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            {t("royalties")}
          </p>
        )}
        <NavSection
          items={royaltyNavItems}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onMobileClose={onMobileClose}
          collapsed={collapsed}
          isMobile={isMobile}
          t={t}
        />

        {/* Licensing section */}
        {(!collapsed || isMobile) && (
          <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            {t("licensing")}
          </p>
        )}
        <NavSection
          items={licensingNavItems}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onMobileClose={onMobileClose}
          collapsed={collapsed}
          isMobile={isMobile}
          t={t}
        />

        {/* Financing section */}
        {(!collapsed || isMobile) && (
          <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            {t("financing")}
          </p>
        )}
        <NavSection
          items={financingNavItems}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onMobileClose={onMobileClose}
          collapsed={collapsed}
          isMobile={isMobile}
          t={t}
        />

        {/* Analytics / Reports section */}
        {(!collapsed || isMobile) && (
          <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            {t("intelligence")}
          </p>
        )}
        <NavSection
          items={analyticsNavItems}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onMobileClose={onMobileClose}
          collapsed={collapsed}
          isMobile={isMobile}
          t={t}
        />

        {/* Compliance section */}
        {(!collapsed || isMobile) && (
          <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            {t("compliance")}
          </p>
        )}
        <NavSection
          items={complianceNavItems}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onMobileClose={onMobileClose}
          collapsed={collapsed}
          isMobile={isMobile}
          t={t}
        />

        {/* Platform section */}
        {(!collapsed || isMobile) && (
          <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            {t("platform")}
          </p>
        )}
        <NavSection
          items={platformNavItems}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onMobileClose={onMobileClose}
          collapsed={collapsed}
          isMobile={isMobile}
          t={t}
        />

        {/* Community section */}
        {(!collapsed || isMobile) && (
          <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            {t("community")}
          </p>
        )}
        <NavSection
          items={communityNavItems}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onMobileClose={onMobileClose}
          collapsed={collapsed}
          isMobile={isMobile}
          t={t}
          badges={communityBadges}
        />
        {/* Discovery section */}
        {(!collapsed || isMobile) && (
          <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            {t("discovery")}
          </p>
        )}
        <NavSection
          items={discoveryNavItems}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onMobileClose={onMobileClose}
          collapsed={collapsed}
          isMobile={isMobile}
          t={t}
        />
        {/* Marketplace section */}
        {(!collapsed || isMobile) && (
          <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            {t("marketplaceSection")}
          </p>
        )}
        <NavSection
          items={marketplaceNavItems}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onMobileClose={onMobileClose}
          collapsed={collapsed}
          isMobile={isMobile}
          t={t}
        />
        {/* Contracts section */}
        {(!collapsed || isMobile) && (
          <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            {t("contracts")}
          </p>
        )}
        <NavSection
          items={contractsNavItems}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onMobileClose={onMobileClose}
          collapsed={collapsed}
          isMobile={isMobile}
          t={t}
        />
        {/* Help section */}
        {(!collapsed || isMobile) && (
          <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            Help
          </p>
        )}
        <NavSection
          items={helpNavItems}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onMobileClose={onMobileClose}
          collapsed={collapsed}
          isMobile={isMobile}
          t={t}
        />
        {/* Onboarding section */}
        {(!collapsed || isMobile) && (
          <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            Onboarding
          </p>
        )}
        <NavSection
          items={onboardingNavItems}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onMobileClose={onMobileClose}
          collapsed={collapsed}
          isMobile={isMobile}
          t={t}
        />
        {/* Admin section */}
        {isAdmin && (
          <>
            {(!collapsed || isMobile) && (
              <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-primary/70">
                {t("adminSection")}
              </p>
            )}
            <NavSection
              items={adminNavItems}
              currentPage={currentPage}
              onNavigate={onNavigate}
              onMobileClose={onMobileClose}
              collapsed={collapsed}
              isMobile={isMobile}
              t={t}
            />
          </>
        )}
      </nav>

      {/* Setup section */}
      {(!collapsed || isMobile) && (
        <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
          Setup
        </p>
      )}
      <NavSection
        items={setupNavItems}
        currentPage={currentPage}
        onNavigate={onNavigate}
        onMobileClose={onMobileClose}
        collapsed={collapsed}
        isMobile={isMobile}
        t={t}
      />

      {/* User / logout */}
      <div
        className={cn(
          "p-3 border-t border-sidebar-border",
          collapsed && !isMobile && "flex justify-center",
        )}
      >
        {isLoggedIn ? (
          <>
            {(!collapsed || isMobile) && displayName && (
              <p className="text-xs text-muted-foreground mb-2 px-1 truncate">
                {displayName}
              </p>
            )}
            <button
              type="button"
              data-ocid="nav.logout.button"
              onClick={onLogout}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all",
                collapsed && !isMobile && "justify-center",
              )}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {(!collapsed || isMobile) && <span>{t("logout")}</span>}
            </button>
          </>
        ) : (
          <button
            type="button"
            data-ocid="nav.signin.button"
            onClick={onLogin}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all",
              collapsed && !isMobile && "justify-center",
            )}
          >
            <LogIn className="w-4 h-4 flex-shrink-0" />
            {(!collapsed || isMobile) && <span>Sign In</span>}
          </button>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={onMobileClose}
            onKeyDown={(e) => {
              if (e.key === "Escape") onMobileClose?.();
            }}
          />
        )}
        <div
          aria-modal="true"
          aria-label="Navigation menu"
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 lg:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  return (
    <div
      className={cn(
        "hidden lg:flex flex-col transition-all duration-200 flex-shrink-0",
        collapsed ? "w-14" : "w-56",
      )}
    >
      {sidebarContent}
    </div>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-ocid="nav.mobile_menu.button"
      onClick={onClick}
      aria-label="Open navigation menu"
      className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
