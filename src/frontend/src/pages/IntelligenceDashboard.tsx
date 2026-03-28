import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertCircle,
  BarChart2,
  FileText,
  Globe,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type {
  CreativeWork,
  DistributionStatement,
  LicenseRecord,
  Organization,
  PayoutRecord,
  RevenueSource,
  TerritoryRecord,
} from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useTranslation } from "../i18n";

const CHART_COLORS = [
  "oklch(0.72 0.18 50)",
  "oklch(0.6 0.15 220)",
  "oklch(0.65 0.16 150)",
  "oklch(0.7 0.14 300)",
  "oklch(0.68 0.13 30)",
  "oklch(0.62 0.17 180)",
];

// Simple linear regression forecast
function linearForecast(
  data: { month: string; amountCents: number }[],
  steps: number,
): { month: string; amountCents: number; forecast: boolean }[] {
  const n = data.length;
  if (n < 2) return [];
  const xs = data.map((_, i) => i);
  const ys = data.map((d) => d.amountCents);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const slope =
    xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0) /
    xs.reduce((s, x) => s + (x - meanX) ** 2, 1);
  const intercept = meanY - slope * meanX;

  // Parse the last month to generate future labels
  const lastMonthStr = data[data.length - 1].month;
  const [yearStr, monthStr] = lastMonthStr.split("-");
  let year = Number(yearStr);
  let month = Number(monthStr);

  const forecasted: {
    month: string;
    amountCents: number;
    forecast: boolean;
  }[] = [];
  for (let i = 0; i < steps; i++) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    const label = `${year}-${String(month).padStart(2, "0")}`;
    const predicted = Math.max(0, Math.round(intercept + slope * (n + i)));
    forecasted.push({ month: label, amountCents: predicted, forecast: true });
  }
  return forecasted;
}

function ForecastBarChart({
  data,
}: {
  data: { month: string; amountCents: number; forecast?: boolean }[];
}) {
  if (data.length === 0)
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No data available
      </div>
    );
  const max = Math.max(...data.map((d) => d.amountCents), 1);
  return (
    <div className="flex items-end gap-1 h-48 px-2">
      {data.map((d) => (
        <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
          <div className="text-[10px] text-muted-foreground">
            ${(d.amountCents / 100).toFixed(0)}
          </div>
          <div
            className={`w-full rounded-t min-h-[4px] transition-colors ${
              d.forecast
                ? "bg-primary/30 border border-dashed border-primary/50"
                : "bg-primary/70 hover:bg-primary"
            }`}
            style={{ height: `${(d.amountCents / max) * 130}px` }}
          />
          <div className="text-[9px] text-muted-foreground truncate w-8 text-center">
            {d.month.slice(5)}
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({
  data,
  colors,
}: {
  data: { label: string; value: number }[];
  colors: string[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0)
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No data
      </div>
    );

  let cumulative = 0;
  const segments = data.map((d, i) => {
    const pct = d.value / total;
    const startAngle = cumulative * 360;
    const endAngle = (cumulative + pct) * 360;
    cumulative += pct;
    const r = 40;
    const cx = 60;
    const cy = 60;
    const start = {
      x: cx + r * Math.cos(((startAngle - 90) * Math.PI) / 180),
      y: cy + r * Math.sin(((startAngle - 90) * Math.PI) / 180),
    };
    const end = {
      x: cx + r * Math.cos(((endAngle - 90) * Math.PI) / 180),
      y: cy + r * Math.sin(((endAngle - 90) * Math.PI) / 180),
    };
    const large = pct > 0.5 ? 1 : 0;
    return {
      d: `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`,
      color: colors[i % colors.length],
      label: d.label,
      value: d.value,
      pct: Math.round(pct * 100),
    };
  });

  return (
    <div className="flex items-center gap-4">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        aria-label="Donut chart"
        role="img"
      >
        {segments.map((s) => (
          <path key={s.label} d={s.d} fill={s.color} opacity={0.8} />
        ))}
        <circle cx="60" cy="60" r="22" fill="var(--card)" />
        <text
          x="60"
          y="63"
          textAnchor="middle"
          fontSize="10"
          fill="var(--muted-foreground)"
        >
          {total}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: s.color }}
            />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-medium text-foreground">{s.value}</span>
            <span className="text-muted-foreground">({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  if (data.length === 0)
    return (
      <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
        No data
      </div>
    );
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-2">
      {data.map((d, i) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-24 truncate flex-shrink-0">
            {d.label}
          </span>
          <div className="flex-1 bg-muted/30 rounded-full h-5 relative overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: CHART_COLORS[i % CHART_COLORS.length],
                opacity: 0.8,
              }}
            />
          </div>
          <span className="text-xs text-foreground font-medium w-14 text-right flex-shrink-0">
            {d.value >= 100
              ? `$${(d.value / 100).toFixed(0)}`
              : String(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function IntelligenceDashboard() {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();

  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [works, setWorks] = useState<CreativeWork[]>([]);
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([]);
  const [statements, setStatements] = useState<DistributionStatement[]>([]);
  const [territories, setTerritories] = useState<TerritoryRecord[]>([]);
  const [openDisputes, setOpenDisputes] = useState(0);
  // Per-org revenue for cross-org comparison
  const [orgRevenue, setOrgRevenue] = useState<
    { org: Organization; totalCents: number }[]
  >([]);

  const loadAll = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [allOrgs, allDisputes] = await Promise.all([
        (actor as any).listOrganizations() as Promise<Organization[]>,
        (actor as any).listAllDisputes().catch(() => [] as unknown[]),
      ]);
      setOrgs(allOrgs);
      const disputeArr = allDisputes as { status: Record<string, unknown> }[];
      setOpenDisputes(
        disputeArr.filter((d) => {
          const st = Object.keys(d.status)[0];
          return st === "open" || st === "pending" || st === "inReview";
        }).length,
      );

      // Aggregate across all orgs
      const allWorks: CreativeWork[] = [];
      const allLicenses: LicenseRecord[] = [];
      const allRevSources: RevenueSource[] = [];
      const allStatements: DistributionStatement[] = [];
      const allTerritories: TerritoryRecord[] = [];
      const allPayouts: PayoutRecord[] = [];

      await Promise.all(
        allOrgs.map(async (org) => {
          const [wrks, lics, revs, stmts, terrs] = await Promise.all([
            (actor as any).listWorksByOrg(org.id).catch(() => []) as Promise<
              CreativeWork[]
            >,
            (actor as any).listLicensesByOrg(org.id).catch(() => []) as Promise<
              LicenseRecord[]
            >,
            (actor as any)
              .listRevenueSourcesByOrg(org.id)
              .catch(() => []) as Promise<RevenueSource[]>,
            (actor as any)
              .listStatementsByOrg(org.id)
              .catch(() => []) as Promise<DistributionStatement[]>,
            (actor as any).listTerritoriesByOrg
              ? ((actor as any)
                  .listTerritoriesByOrg(org.id)
                  .catch(() => []) as Promise<TerritoryRecord[]>)
              : Promise.resolve([]),
          ]);
          allWorks.push(...wrks);
          allLicenses.push(...lics);
          allRevSources.push(...revs);
          allStatements.push(...stmts);
          allTerritories.push(...terrs);

          // Fetch payouts for statements
          for (const stmt of stmts) {
            const ps: PayoutRecord[] = await (actor as any)
              .listPayoutsByStatement(stmt.id)
              .catch(() => []);
            allPayouts.push(...ps);
          }
        }),
      );

      // If no territories from listTerritoriesByOrg, try per-work
      if (allTerritories.length === 0 && allWorks.length > 0) {
        await Promise.all(
          allWorks.slice(0, 20).map(async (w) => {
            const ts: TerritoryRecord[] = await (actor as any)
              .getTerritoriesByWork(w.id)
              .catch(() => []);
            allTerritories.push(...ts);
          }),
        );
      }

      // Deduplicate
      const uniqueWorks = Array.from(
        new Map(allWorks.map((w) => [w.id, w])).values(),
      );
      const uniqueLicenses = Array.from(
        new Map(allLicenses.map((l) => [l.id, l])).values(),
      );
      const uniqueRevSources = Array.from(
        new Map(allRevSources.map((r) => [r.id, r])).values(),
      );
      const uniqueStatements = Array.from(
        new Map(allStatements.map((s) => [s.id, s])).values(),
      );
      const uniqueTerritories = Array.from(
        new Map(allTerritories.map((t) => [t.id, t])).values(),
      );
      const uniquePayouts = Array.from(
        new Map(allPayouts.map((p) => [p.id, p])).values(),
      );

      setWorks(uniqueWorks);
      setLicenses(uniqueLicenses);
      setRevenueSources(uniqueRevSources);
      setStatements(uniqueStatements);
      setTerritories(uniqueTerritories);
      setPayouts(uniquePayouts);

      // Cross-org revenue
      const orgRevData = await Promise.all(
        allOrgs.map(async (org) => {
          const revs: RevenueSource[] = await (actor as any)
            .listRevenueSourcesByOrg(org.id)
            .catch(() => []);
          const total = revs.reduce((s, r) => s + Number(r.amountCents), 0);
          return { org, totalCents: total };
        }),
      );
      setOrgRevenue(orgRevData);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor && !isFetching) loadAll();
  }, [actor, isFetching, loadAll]);

  // ── Derived analytics ──────────────────────────────────────────────────

  const totalPayoutsCents = payouts.reduce(
    (s, p) => s + Number(p.amountCents),
    0,
  );
  const activeLicenses = licenses.filter(
    (l) => Object.keys(l.status)[0] === "active",
  ).length;

  // Revenue by month (last 12)
  const revenueByMonth = (() => {
    const map: Record<string, number> = {};
    for (const r of revenueSources) {
      const d = new Date(r.periodStart);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] ?? 0) + Number(r.amountCents);
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, amountCents]) => ({ month, amountCents, forecast: false }));
  })();

  const forecastData = linearForecast(revenueByMonth, 3);
  const chartData = [...revenueByMonth, ...forecastData];

  // Top-earning works (by revenue source amountCents attributed to workId via statements)
  const topEarningWorks = (() => {
    const revenueByWork: Record<string, number> = {};
    for (const stmt of statements) {
      const revForWork = revenueSources
        .filter((r) => r.orgId === stmt.orgId)
        .reduce((s, r) => s + Number(r.amountCents), 0);
      // Distribute evenly among works in same org as approximation
      const orgWorks = works.filter((w) => w.orgId === stmt.orgId);
      if (orgWorks.length > 0) {
        const perWork = revForWork / orgWorks.length;
        for (const w of orgWorks) {
          revenueByWork[w.id] = (revenueByWork[w.id] ?? 0) + perWork;
        }
      }
    }
    // If no statements, use revenue sources directly by org
    if (Object.keys(revenueByWork).length === 0) {
      for (const r of revenueSources) {
        const orgWorks = works.filter((w) => w.orgId === r.orgId);
        if (orgWorks.length > 0) {
          const perWork = Number(r.amountCents) / orgWorks.length;
          for (const w of orgWorks) {
            revenueByWork[w.id] = (revenueByWork[w.id] ?? 0) + perWork;
          }
        }
      }
    }
    return works
      .map((w) => ({
        work: w,
        org: orgs.find((o) => o.id === w.orgId),
        totalCents: revenueByWork[w.id] ?? 0,
      }))
      .sort((a, b) => b.totalCents - a.totalCents)
      .slice(0, 10);
  })();

  // License type breakdown
  const licensesByType = (() => {
    const map: Record<string, number> = {};
    for (const l of licenses) {
      const key = Object.keys(l.licenseType)[0] ?? "unknown";
      map[key] = (map[key] ?? 0) + 1;
    }
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  })();

  // Territory coverage
  const territoryData = (() => {
    const map: Record<string, number> = {};
    for (const t of territories) {
      const key = Object.keys(t.territoryCode)[0] ?? "unknown";
      map[key] = (map[key] ?? 0) + 1;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([label, value]) => ({ label, value }));
  })();

  const multiOrg =
    orgRevenue.filter((o) => o.totalCents > 0).length >= 2 || orgs.length >= 2;
  const crossOrgData = orgRevenue
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, 6)
    .map((o) => ({ label: o.org.name, value: o.totalCents }));

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-8 max-w-6xl" data-ocid="intelligence.page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-display text-foreground">
            {t("intelligenceDashboard")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("revenueForecast")} · {t("topEarningWorks")} ·{" "}
            {t("crossOrgComparison")}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6" data-ocid="intelligence.loading_state">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl bg-muted" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* A. KPI Summary Row */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            data-ocid="intelligence.kpi.section"
          >
            <Card
              className="bg-card border-border"
              data-ocid="intelligence.kpi.works.card"
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("totalWorks")}
                    </p>
                    <p className="text-2xl font-bold font-display text-foreground mt-1">
                      {works.length}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-card border-border"
              data-ocid="intelligence.kpi.licenses.card"
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("active")}
                    </p>
                    <p className="text-2xl font-bold font-display text-foreground mt-1">
                      {activeLicenses}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("licenseType")}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-card border-border"
              data-ocid="intelligence.kpi.disputes.card"
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Open Disputes
                    </p>
                    <p className="text-2xl font-bold font-display text-foreground mt-1">
                      {openDisputes}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-card border-border"
              data-ocid="intelligence.kpi.payouts.card"
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("totalRevenue")}
                    </p>
                    <p className="text-2xl font-bold font-display text-foreground mt-1">
                      $
                      {(totalPayoutsCents / 100).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* B. Revenue Trend + Forecast */}
          <Card
            className="bg-card border-border"
            data-ocid="intelligence.forecast.card"
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {t("revenueForecast")}
              </CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-primary/70 inline-block" />
                  Actual
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-primary/30 border border-dashed border-primary/50 inline-block" />
                  {t("forecast")}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                  No revenue data yet
                </div>
              ) : (
                <ForecastBarChart data={chartData} />
              )}
            </CardContent>
          </Card>

          {/* C & D — Top Works + License Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* C. Top-Earning Works */}
            <Card
              className="bg-card border-border"
              data-ocid="intelligence.top_works.card"
            >
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  {t("topEarningWorks")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topEarningWorks.length === 0 ? (
                  <div
                    className="flex items-center justify-center h-32 text-muted-foreground text-sm"
                    data-ocid="intelligence.top_works.empty_state"
                  >
                    <AlertCircle className="w-4 h-4 mr-2 opacity-50" />
                    No works registered
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {topEarningWorks.map((item, idx) => (
                      <div
                        key={item.work.id}
                        data-ocid={`intelligence.top_works.item.${idx + 1}`}
                        className={`flex items-center gap-3 px-2 py-1.5 rounded-lg ${
                          idx === 0
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        <span
                          className={`text-xs font-bold w-5 text-center ${
                            idx === 0 ? "text-primary" : "text-muted-foreground"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {item.work.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {item.org?.name ?? "—"}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-foreground flex-shrink-0">
                          ${(item.totalCents / 100).toFixed(0)}
                        </span>
                        {idx === 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-primary/30 text-primary px-1 py-0"
                          >
                            #1
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* D. Royalty Breakdown by License Type */}
            <Card
              className="bg-card border-border"
              data-ocid="intelligence.license_breakdown.card"
            >
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  {t("royaltyByLicenseType")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {licensesByType.length === 0 ? (
                  <div
                    className="flex items-center justify-center h-32 text-muted-foreground text-sm"
                    data-ocid="intelligence.license_breakdown.empty_state"
                  >
                    <AlertCircle className="w-4 h-4 mr-2 opacity-50" />
                    No licenses yet
                  </div>
                ) : (
                  <DonutChart data={licensesByType} colors={CHART_COLORS} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* E. Revenue by Territory */}
          <Card
            className="bg-card border-border"
            data-ocid="intelligence.territory.card"
          >
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                {t("revenueByTerritory")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {territoryData.length === 0 ? (
                <div
                  className="flex items-center justify-center h-24 text-muted-foreground text-sm"
                  data-ocid="intelligence.territory.empty_state"
                >
                  <AlertCircle className="w-4 h-4 mr-2 opacity-50" />
                  No territory data
                </div>
              ) : (
                <HorizontalBarChart data={territoryData} />
              )}
            </CardContent>
          </Card>

          {/* F. Cross-Org Revenue Comparison (only if 2+ orgs) */}
          {multiOrg && (
            <Card
              className="bg-card border-border"
              data-ocid="intelligence.cross_org.card"
            >
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  {t("crossOrgComparison")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {crossOrgData.every((d) => d.value === 0) ? (
                  <div
                    className="flex items-center justify-center h-24 text-muted-foreground text-sm"
                    data-ocid="intelligence.cross_org.empty_state"
                  >
                    <AlertCircle className="w-4 h-4 mr-2 opacity-50" />
                    No cross-org revenue data
                  </div>
                ) : (
                  <HorizontalBarChart data={crossOrgData} />
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
