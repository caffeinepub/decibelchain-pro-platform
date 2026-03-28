import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart2,
  BookOpen,
  Briefcase,
  Download,
  FileSpreadsheet,
  FileText,
  Lock,
  Shield,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type {
  AuditEntry,
  CreativeWork,
  DistributionStatement,
  FinancingOffer,
  InvestorCommitment,
  LicenseRecord,
  Organization,
  OwnershipSplit,
  PayoutRecord,
  Performance,
  RevenueSource,
  TerritoryRecord,
} from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useTranslation } from "../i18n";

function exportCsv(filename: string, rows: string[][], headers: string[]) {
  const content = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function RevenueBarChart({
  data,
}: {
  data: { month: string; amountCents: number }[];
}) {
  if (data.length === 0)
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        No data
      </div>
    );
  const max = Math.max(...data.map((d) => d.amountCents), 1);
  return (
    <div className="flex items-end gap-2 h-40 px-2">
      {data.map((d) => (
        <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
          <div className="text-xs text-muted-foreground">
            ${(d.amountCents / 100).toFixed(0)}
          </div>
          <div
            className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors min-h-[4px]"
            style={{ height: `${(d.amountCents / max) * 110}px` }}
          />
          <div className="text-[10px] text-muted-foreground rotate-45 origin-top-left w-8 truncate">
            {d.month}
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

const CHART_COLORS = [
  "oklch(0.72 0.18 50)",
  "oklch(0.6 0.15 220)",
  "oklch(0.65 0.16 150)",
  "oklch(0.7 0.14 300)",
  "oklch(0.68 0.13 30)",
  "oklch(0.62 0.17 180)",
];

export function Reports() {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([]);
  const [works, setWorks] = useState<CreativeWork[]>([]);
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);

  // Bulk export loading states
  const [exportingStatements, setExportingStatements] = useState(false);
  const [exportingAudit, setExportingAudit] = useState(false);
  const [exportingPortfolio, setExportingPortfolio] = useState(false);
  const [exportingRights, setExportingRights] = useState(false);
  const [selectedRightsWork, setSelectedRightsWork] = useState("");

  useEffect(() => {
    if (actor && !isFetching) {
      (actor as any)
        .listOrganizations()
        .then((list: Organization[]) => {
          setOrgs(list);
          if (list.length > 0) setSelectedOrg(list[0].id);
        })
        .catch(() => {});
      (actor as any)
        .isCallerAdmin()
        .then((v: boolean) => setIsAdmin(v))
        .catch(() => {});
    }
  }, [actor, isFetching]);

  const loadData = useCallback(async () => {
    if (!actor || !selectedOrg) return;
    setLoading(true);
    try {
      const [rev, wrks, lics, stmts] = await Promise.all([
        (actor as any).listRevenueSourcesByOrg(selectedOrg),
        (actor as any).listWorksByOrg(selectedOrg),
        (actor as any).listLicensesByOrg(selectedOrg),
        (actor as any).listStatementsByOrg(selectedOrg),
      ]);
      setRevenueSources(rev);
      setWorks(wrks);
      if (!selectedRightsWork && wrks.length > 0)
        setSelectedRightsWork(wrks[0].id);
      setLicenses(lics);
      const allPayouts: PayoutRecord[] = [];
      for (const stmt of stmts as DistributionStatement[]) {
        const p = await (actor as any).listPayoutsByStatement(stmt.id);
        allPayouts.push(...p);
      }
      setPayouts(allPayouts);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [actor, selectedOrg, selectedRightsWork]);

  useEffect(() => {
    if (selectedOrg) loadData();
  }, [selectedOrg, loadData]);

  // Revenue by month
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
      .map(([month, amountCents]) => ({ month, amountCents }));
  })();

  const worksByType = (() => {
    const map: Record<string, number> = {};
    for (const w of works) {
      const key = Object.keys(w.workType)[0] ?? "unknown";
      map[key] = (map[key] ?? 0) + 1;
    }
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  })();

  const licensesByType = (() => {
    const map: Record<string, number> = {};
    for (const l of licenses) {
      const key = Object.keys(l.licenseType)[0] ?? "unknown";
      map[key] = (map[key] ?? 0) + 1;
    }
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  })();

  const payoutByStatus = (() => {
    const map: Record<string, number> = {};
    for (const p of payouts) {
      const key = Object.keys(p.status)[0] ?? "unknown";
      map[key] = (map[key] ?? 0) + 1;
    }
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  })();

  const handleExportRevenue = () => {
    exportCsv(
      "revenue-sources.csv",
      revenueSources.map((r) => [
        r.id,
        r.description,
        String(Number(r.amountCents) / 100),
        new Date(r.periodStart).toISOString(),
      ]),
      ["ID", "Source Name", "Amount (USD)", "Period Start"],
    );
  };

  const handleExportWorks = () => {
    exportCsv(
      "works.csv",
      works.map((w) => [
        w.id,
        w.title,
        Object.keys(w.workType)[0] ?? "",
        w.isrc,
        w.iswc,
        w.genre,
        w.releaseDate,
      ]),
      ["ID", "Title", "Type", "ISRC", "ISWC", "Genre", "Release Date"],
    );
  };

  const handleExportLicenses = () => {
    exportCsv(
      "licenses.csv",
      licenses.map((l) => [
        l.id,
        Object.keys(l.licenseType)[0] ?? "",
        Object.keys(l.status)[0] ?? "",
        l.licenseeId,
        String(Number(l.feeCents) / 100),
      ]),
      ["ID", "Type", "Status", "Licensee", "Fee (USD)"],
    );
  };

  const handleExportPayouts = () => {
    exportCsv(
      "payouts.csv",
      payouts.map((p) => [
        p.id,
        p.holderId,
        String(Number(p.amountCents) / 100),
        Object.keys(p.status)[0] ?? "",
      ]),
      ["ID", "Holder", "Amount (USD)", "Status"],
    );
  };

  // Bulk export handlers
  const handleBulkExportStatements = async () => {
    if (!actor || !selectedOrg) return;
    setExportingStatements(true);
    try {
      const stmts: DistributionStatement[] = await (
        actor as any
      ).listStatementsByOrg(selectedOrg);
      const rows: string[][] = [];
      for (const stmt of stmts) {
        const ps: PayoutRecord[] = await (actor as any).listPayoutsByStatement(
          stmt.id,
        );
        if (ps.length === 0) {
          rows.push([
            stmt.id,
            stmt.orgId,
            stmt.workId,
            stmt.periodStart,
            stmt.periodEnd,
            stmt.currency,
            Object.keys(stmt.status)[0] ?? "",
            "",
            "",
            "",
            "",
          ]);
        } else {
          for (const p of ps) {
            rows.push([
              stmt.id,
              stmt.orgId,
              stmt.workId,
              stmt.periodStart,
              stmt.periodEnd,
              stmt.currency,
              Object.keys(stmt.status)[0] ?? "",
              p.id,
              p.holderId,
              String(Number(p.amountCents) / 100),
              Object.keys(p.status)[0] ?? "",
            ]);
          }
        }
      }
      exportCsv(`royalty-statements-${selectedOrg}.csv`, rows, [
        "Statement ID",
        "Org ID",
        "Work ID",
        "Period Start",
        "Period End",
        "Currency",
        "Statement Status",
        "Payout ID",
        "Holder ID",
        "Payout Amount (USD)",
        "Payout Status",
      ]);
    } catch {
      /* ignore */
    } finally {
      setExportingStatements(false);
    }
  };

  const handleBulkExportAudit = async () => {
    if (!actor) return;
    setExportingAudit(true);
    try {
      const entries: AuditEntry[] = await (actor as any).getAuditLog(
        BigInt(0),
        BigInt(10000),
      );
      exportCsv(
        "audit-trail.csv",
        entries.map((e) => [
          String(e.id),
          new Date(Number(e.timestamp) / 1_000_000).toISOString(),
          e.actorId,
          e.entityType,
          e.entityId,
          e.action,
          e.details,
        ]),
        [
          "ID",
          "Timestamp",
          "Actor",
          "Entity Type",
          "Entity ID",
          "Action",
          "Details",
        ],
      );
    } catch {
      /* ignore */
    } finally {
      setExportingAudit(false);
    }
  };

  const handleBulkExportPortfolio = async () => {
    if (!actor || !selectedOrg) return;
    setExportingPortfolio(true);
    try {
      const offers: FinancingOffer[] = await (
        actor as any
      ).listFinancingOffersByOrg(selectedOrg);
      const rows: string[][] = [];
      for (const offer of offers) {
        const commitments: InvestorCommitment[] = await (
          actor as any
        ).listCommitmentsByOffer(offer.id);
        if (commitments.length === 0) {
          rows.push([
            offer.id,
            offer.title,
            offer.workId,
            Object.keys(offer.status)[0] ?? "",
            String(Number(offer.targetAmountCents) / 100),
            offer.currency,
            offer.deadline,
            String(Number(offer.revenueShareBps) / 100),
            "",
            "",
            "",
            "",
          ]);
        } else {
          for (const c of commitments) {
            rows.push([
              offer.id,
              offer.title,
              offer.workId,
              Object.keys(offer.status)[0] ?? "",
              String(Number(offer.targetAmountCents) / 100),
              offer.currency,
              offer.deadline,
              String(Number(offer.revenueShareBps) / 100),
              c.id,
              c.investorId,
              String(Number(c.commitmentAmountCents) / 100),
              Object.keys(c.status)[0] ?? "",
            ]);
          }
        }
      }
      exportCsv(`portfolio-summary-${selectedOrg}.csv`, rows, [
        "Offer ID",
        "Offer Title",
        "Work ID",
        "Offer Status",
        "Target Amount (USD)",
        "Currency",
        "Deadline",
        "Revenue Share %",
        "Commitment ID",
        "Investor ID",
        "Commitment Amount (USD)",
        "Commitment Status",
      ]);
    } catch {
      /* ignore */
    } finally {
      setExportingPortfolio(false);
    }
  };

  const handleBulkExportRights = async () => {
    if (!actor || !selectedRightsWork) return;
    setExportingRights(true);
    try {
      const [splits, territories, lics, revSrcs, perfs] = await Promise.all([
        (actor as any).getSplitsByWork(selectedRightsWork) as Promise<
          OwnershipSplit[]
        >,
        (actor as any).getTerritoriesByWork(selectedRightsWork) as Promise<
          TerritoryRecord[]
        >,
        (actor as any).listLicensesByWork(selectedRightsWork) as Promise<
          LicenseRecord[]
        >,
        (actor as any).listRevenueSourcesByWork(selectedRightsWork) as Promise<
          RevenueSource[]
        >,
        (actor as any).listAllPerformances() as Promise<Performance[]>,
      ]);
      const workPerfs = (perfs as Performance[]).filter((p) =>
        p.setlist.some(
          (s: { workId: string }) => s.workId === selectedRightsWork,
        ),
      );

      const work = works.find((w) => w.id === selectedRightsWork);
      const rows: string[][] = [];

      // Section: splits
      for (const s of splits as OwnershipSplit[]) {
        rows.push([
          "split",
          `${s.workId}-${s.holderId}`,
          s.holderId,
          s.role,
          `${String(Number(s.percentage) / 100)}%`,
          "",
          "",
          "",
          "",
          "",
        ]);
      }
      // Section: territories
      for (const t of territories as TerritoryRecord[]) {
        rows.push([
          "territory",
          t.id,
          Object.keys(t.territoryCode)[0] ?? "",
          t.subPublisherId,
          t.notes,
          "",
          "",
          "",
          "",
          "",
        ]);
      }
      // Section: licenses
      for (const l of lics as LicenseRecord[]) {
        rows.push([
          "license",
          l.id,
          Object.keys(l.licenseType)[0] ?? "",
          Object.keys(l.status)[0] ?? "",
          l.licenseeId,
          String(Number(l.feeCents) / 100),
          l.territory,
          l.termStart,
          l.termEnd,
          "",
        ]);
      }
      // Section: revenue sources
      for (const r of revSrcs as RevenueSource[]) {
        rows.push([
          "revenue",
          r.id,
          Object.keys(r.sourceType)[0] ?? "",
          String(Number(r.amountCents) / 100),
          r.currency,
          r.periodStart,
          r.periodEnd,
          r.description,
          "",
          "",
        ]);
      }
      // Section: performances
      for (const p of workPerfs) {
        rows.push([
          "performance",
          p.id,
          p.venueName,
          p.venueCity,
          p.venueCountry,
          p.performanceDate,
          Object.keys(p.performanceType)[0] ?? "",
          p.verified ? "verified" : "unverified",
          "",
          "",
        ]);
      }

      const workTitle = work?.title ?? selectedRightsWork;
      exportCsv(
        `rights-report-${workTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.csv`,
        rows,
        [
          "Record Type",
          "ID",
          "Field1",
          "Field2",
          "Field3",
          "Field4",
          "Field5",
          "Field6",
          "Field7",
          "Field8",
        ],
      );
    } catch {
      /* ignore */
    } finally {
      setExportingRights(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl" data-ocid="reports.page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-foreground">
              {t("reportsAnalytics")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("reportsAnalytics")}
            </p>
          </div>
        </div>
        {orgs.length > 0 && (
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger
              data-ocid="reports.org.select"
              className="w-52 bg-input border-border"
            >
              <SelectValue placeholder={t("selectOrg")} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {orgs.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          data-ocid="reports.loading_state"
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Revenue by Month */}
          <Card
            className="bg-card border-border"
            data-ocid="reports.revenue.card"
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {t("revenueByMonth")}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-border/40">
                  {revenueSources.length} sources
                </Badge>
                <Button
                  data-ocid="reports.revenue.export.button"
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs gap-1"
                  onClick={handleExportRevenue}
                >
                  <Download className="w-3 h-3" />
                  {t("exportCsv")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <RevenueBarChart data={revenueByMonth} />
            </CardContent>
          </Card>

          {/* Works by Type */}
          <Card
            className="bg-card border-border"
            data-ocid="reports.works.card"
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                {t("worksByType")}
              </CardTitle>
              <Button
                data-ocid="reports.works.export.button"
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs gap-1"
                onClick={handleExportWorks}
              >
                <Download className="w-3 h-3" />
                {t("exportCsv")}
              </Button>
            </CardHeader>
            <CardContent>
              <DonutChart data={worksByType} colors={CHART_COLORS} />
            </CardContent>
          </Card>

          {/* Licenses by Type */}
          <Card
            className="bg-card border-border"
            data-ocid="reports.licenses.card"
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                {t("licensesByType")}
              </CardTitle>
              <Button
                data-ocid="reports.licenses.export.button"
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs gap-1"
                onClick={handleExportLicenses}
              >
                <Download className="w-3 h-3" />
                {t("exportCsv")}
              </Button>
            </CardHeader>
            <CardContent>
              <DonutChart
                data={licensesByType}
                colors={CHART_COLORS.slice(2)}
              />
            </CardContent>
          </Card>

          {/* Payout Status */}
          <Card
            className="bg-card border-border"
            data-ocid="reports.payouts.card"
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {t("payoutStatus")}
              </CardTitle>
              <Button
                data-ocid="reports.payouts.export.button"
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs gap-1"
                onClick={handleExportPayouts}
              >
                <Download className="w-3 h-3" />
                {t("exportCsv")}
              </Button>
            </CardHeader>
            <CardContent>
              <DonutChart
                data={payoutByStatus}
                colors={CHART_COLORS.slice(1)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Data Exports Section */}
      <div className="space-y-4" data-ocid="reports.bulk_exports.section">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display text-foreground">
              {t("bulkExports")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("adminOnlyExports")}
            </p>
          </div>
        </div>

        {!isAdmin ? (
          <Alert
            className="border-border/40 bg-muted/30"
            data-ocid="reports.bulk_exports.locked"
          >
            <Lock className="h-4 w-4" />
            <AlertDescription className="text-sm text-muted-foreground">
              {t("exportAdminLocked")}
            </AlertDescription>
          </Alert>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            data-ocid="reports.bulk_exports.grid"
          >
            {/* Royalty Statements */}
            <Card
              className="bg-card border-border"
              data-ocid="reports.bulk_exports.statements.card"
            >
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  {t("exportRoyaltyStatements")}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t("exportRoyaltyStatementsDesc")}
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  data-ocid="reports.bulk_exports.statements.button"
                  size="sm"
                  variant="outline"
                  className="gap-2 border-primary/30 hover:bg-primary/10"
                  disabled={exportingStatements || !selectedOrg}
                  onClick={handleBulkExportStatements}
                >
                  <Download className="w-4 h-4" />
                  {exportingStatements ? t("exportingData") : t("exportCsv")}
                </Button>
              </CardContent>
            </Card>

            {/* Audit Trail */}
            <Card
              className="bg-card border-border"
              data-ocid="reports.bulk_exports.audit.card"
            >
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  {t("exportAuditTrail")}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t("exportAuditTrailDesc")}
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  data-ocid="reports.bulk_exports.audit.button"
                  size="sm"
                  variant="outline"
                  className="gap-2 border-primary/30 hover:bg-primary/10"
                  disabled={exportingAudit}
                  onClick={handleBulkExportAudit}
                >
                  <Download className="w-4 h-4" />
                  {exportingAudit ? t("exportingData") : t("exportCsv")}
                </Button>
              </CardContent>
            </Card>

            {/* Investment Portfolio Summary */}
            <Card
              className="bg-card border-border"
              data-ocid="reports.bulk_exports.portfolio.card"
            >
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  {t("exportPortfolioSummary")}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t("exportPortfolioSummaryDesc")}
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  data-ocid="reports.bulk_exports.portfolio.button"
                  size="sm"
                  variant="outline"
                  className="gap-2 border-primary/30 hover:bg-primary/10"
                  disabled={exportingPortfolio || !selectedOrg}
                  onClick={handleBulkExportPortfolio}
                >
                  <Download className="w-4 h-4" />
                  {exportingPortfolio ? t("exportingData") : t("exportCsv")}
                </Button>
              </CardContent>
            </Card>

            {/* Consolidated Rights Report */}
            <Card
              className="bg-card border-border"
              data-ocid="reports.bulk_exports.rights.card"
            >
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  {t("exportRightsReport")}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t("exportRightsReportDesc")}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {works.length > 0 && (
                  <Select
                    value={selectedRightsWork}
                    onValueChange={setSelectedRightsWork}
                  >
                    <SelectTrigger
                      data-ocid="reports.bulk_exports.rights.select"
                      className="w-full bg-input border-border text-xs h-8"
                    >
                      <SelectValue
                        placeholder={t("selectWorkForRightsReport")}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {works.map((w) => (
                        <SelectItem key={w.id} value={w.id} className="text-xs">
                          {w.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  data-ocid="reports.bulk_exports.rights.button"
                  size="sm"
                  variant="outline"
                  className="gap-2 border-primary/30 hover:bg-primary/10"
                  disabled={exportingRights || !selectedRightsWork}
                  onClick={handleBulkExportRights}
                >
                  <Download className="w-4 h-4" />
                  {exportingRights ? t("exportingData") : t("exportCsv")}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
