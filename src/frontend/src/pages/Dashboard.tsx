import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  DollarSign,
  FileMusic,
  Mic2,
  Store,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Page } from "../App";
import { useBranding } from "../contexts/BrandingContext";
import { useActor } from "../hooks/useActor";
import {
  formatTimestamp,
  useAllVendors,
  useAllWorks,
  useAuditLog,
  useOrganizations,
  useRevenueStats,
} from "../hooks/useQueries";
import { useTranslation } from "../i18n";

interface DashboardProps {
  onNavigate: (page: Page) => void;
  displayName?: string;
}

export function Dashboard({ onNavigate, displayName }: DashboardProps) {
  const { t } = useTranslation();
  const { welcomeMessage, accentColor } = useBranding();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { data: orgs, isLoading: orgsLoading } = useOrganizations();
  const { data: works, isLoading: worksLoading } = useAllWorks();
  const { data: vendors, isLoading: vendorsLoading } = useAllVendors();
  const { data: auditEntries, isLoading: auditLoading } = useAuditLog(0, 5);
  const firstOrgId = orgs?.[0]?.id ?? null;
  const { actor } = useActor();
  const { data: revenueStats, isLoading: revenueLoading } =
    useRevenueStats(firstOrgId);

  const { data: disputes } = useQuery<any[]>({
    queryKey: ["disputes"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getDisputes();
    },
    enabled: !!actor,
  });

  const { data: performances } = useQuery<any[]>({
    queryKey: ["performances", ""],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listAllPerformances();
    },
    enabled: !!actor,
  });

  const { data: latestValuation } = useQuery<any>({
    queryKey: ["valuation-latest", firstOrgId],
    queryFn: async () => {
      if (!actor || !firstOrgId) return null;
      return (actor as any).getLatestValuation(firstOrgId);
    },
    enabled: !!actor && !!firstOrgId,
  });

  const openDisputeCount =
    disputes?.filter(
      (d: any) => !("closed" in d.status) && !("resolved" in d.status),
    ).length ?? 0;
  const upcomingPerfCount =
    performances?.filter((p: any) => !p.verified).length ?? 0;
  const latestValue = latestValuation
    ? `$${(Number(latestValuation.estimatedValueCents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

  const stats = [
    {
      key: "totalOrgs",
      value: orgs?.length ?? 0,
      icon: Building2,
      loading: orgsLoading,
      page: "organizations" as Page,
    },
    {
      key: "totalWorks",
      value: works?.length ?? 0,
      icon: FileMusic,
      loading: worksLoading,
      page: "creativeWorks" as Page,
    },
    {
      key: "totalVendors",
      value: vendors?.length ?? 0,
      icon: Store,
      loading: vendorsLoading,
      page: "vendorDirectory" as Page,
    },
    {
      key: "totalRevenue",
      value: revenueStats
        ? `$${(Number(revenueStats.totalRevenueCents) / 100).toFixed(2)}`
        : "$0.00",
      icon: DollarSign,
      loading: revenueLoading,
      page: "revenueDashboard" as Page,
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl" data-ocid="dashboard.page">
      {/* Welcome Message Banner */}
      {welcomeMessage && !bannerDismissed && (
        <div
          data-ocid="dashboard.welcome_banner.card"
          className="flex items-start gap-3 rounded-lg border px-4 py-3"
          style={{
            borderColor: `${accentColor}60`,
            borderLeftColor: accentColor,
            borderLeftWidth: "4px",
            backgroundColor: `${accentColor}0f`,
          }}
        >
          <p className="flex-1 text-sm text-foreground">{welcomeMessage}</p>
          <button
            type="button"
            data-ocid="dashboard.welcome_banner.close_button"
            onClick={() => setBannerDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
            aria-label="Dismiss welcome message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Welcome */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          {t("welcomeBack")}
          {displayName ? `, ${displayName}` : ""}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">{t("overview")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ key, value, icon: Icon, loading, page }) => (
          <Card
            key={key}
            className="bg-card border-border cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => onNavigate(page)}
          >
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {t(key)}
                  </p>
                  {loading ? (
                    <Skeleton className="h-8 w-12 mt-1 bg-muted" />
                  ) : (
                    <p className="text-3xl font-display font-bold text-foreground mt-1">
                      {value}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              {t("quickActions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              data-ocid="dashboard.register_work.primary_button"
              variant="outline"
              className="w-full justify-between border-border hover:border-primary/40 hover:bg-primary/5"
              onClick={() => onNavigate("creativeWorks")}
            >
              <span className="flex items-center gap-2">
                <FileMusic className="w-4 h-4 text-primary" />
                {t("registerWork")}
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              data-ocid="dashboard.add_org.secondary_button"
              variant="outline"
              className="w-full justify-between border-border hover:border-primary/40 hover:bg-primary/5"
              onClick={() => onNavigate("organizations")}
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                {t("addOrg")}
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              data-ocid="dashboard.add_vendor.secondary_button"
              variant="outline"
              className="w-full justify-between border-border hover:border-primary/40 hover:bg-primary/5"
              onClick={() => onNavigate("vendorDirectory")}
            >
              <span className="flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                {t("addVendor")}
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="font-display text-base">
              {t("recentActivity")}
            </CardTitle>
            <Button
              data-ocid="dashboard.view_audit.button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => onNavigate("auditTrail")}
            >
              {t("viewAudit")}
            </Button>
          </CardHeader>
          <CardContent>
            {auditLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full bg-muted" />
                ))}
              </div>
            ) : !auditEntries?.length ? (
              <p
                className="text-sm text-muted-foreground"
                data-ocid="dashboard.activity.empty_state"
              >
                {t("noActivity")}
              </p>
            ) : (
              <div className="space-y-2">
                {auditEntries.map((entry, i) => (
                  <div
                    key={Number(entry.id)}
                    data-ocid={`dashboard.activity.item.${i + 1}`}
                    className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {entry.action}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {entry.entityType} • {formatTimestamp(entry.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Phase 4 Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className="bg-card border-border cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => onNavigate("disputeCenter")}
        >
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("openDisputes")}
                </p>
                <p className="text-3xl font-display font-bold text-foreground mt-1">
                  {openDisputeCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className="bg-card border-border cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => onNavigate("performanceTracker")}
        >
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("upcomingPerformances")}
                </p>
                <p className="text-3xl font-display font-bold text-foreground mt-1">
                  {upcomingPerfCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Mic2 className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className="bg-card border-border cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => onNavigate("catalogValuation")}
        >
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("latestCatalogValue")}
                </p>
                <p className="text-xl font-display font-bold text-primary mt-1">
                  {latestValue}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
