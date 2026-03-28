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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, GitMerge, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useActor } from "../hooks/useActor";
import { useTranslation } from "../i18n";

// ── CSV export helper (same as Reports.tsx) ──────────────────────────────────
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

// ── Chart colors (OKLCH, same as IntelligenceDashboard) ───────────────────────
const CHART_COLORS = [
  "oklch(0.72 0.18 50)",
  "oklch(0.6 0.15 220)",
  "oklch(0.65 0.16 150)",
  "oklch(0.7 0.14 300)",
  "oklch(0.68 0.13 30)",
];

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ORGS = [
  {
    id: "org-1",
    name: "Stellar Sounds Publishing",
    totalRevenue: 184200,
    works: 42,
    statements: 18,
  },
  {
    id: "org-2",
    name: "Midnight Riff Collective",
    totalRevenue: 97500,
    works: 27,
    statements: 11,
  },
  {
    id: "org-3",
    name: "Neon Harmony Group",
    totalRevenue: 253800,
    works: 61,
    statements: 24,
  },
  {
    id: "org-4",
    name: "Deep Current Records",
    totalRevenue: 61400,
    works: 15,
    statements: 7,
  },
  {
    id: "org-5",
    name: "Pacific Groove Alliance",
    totalRevenue: 118900,
    works: 33,
    statements: 14,
  },
];

const MOCK_SPLITS = [
  {
    workId: "WK-0041",
    title: "Echoes of Tomorrow",
    orgs: ["Stellar Sounds Publishing", "Neon Harmony Group"],
    splits: [55, 45],
    balanced: true,
  },
  {
    workId: "WK-0073",
    title: "Broken Signal",
    orgs: ["Midnight Riff Collective", "Deep Current Records"],
    splits: [60, 35],
    balanced: false,
  },
  {
    workId: "WK-0112",
    title: "Blue Meridian",
    orgs: ["Stellar Sounds Publishing", "Pacific Groove Alliance"],
    splits: [50, 50],
    balanced: true,
  },
  {
    workId: "WK-0089",
    title: "Neon Rain Reprise",
    orgs: ["Neon Harmony Group", "Pacific Groove Alliance"],
    splits: [40, 55],
    balanced: false,
  },
  {
    workId: "WK-0158",
    title: "Phantom Frequencies",
    orgs: [
      "Stellar Sounds Publishing",
      "Midnight Riff Collective",
      "Neon Harmony Group",
    ],
    splits: [33, 33, 34],
    balanced: true,
  },
  {
    workId: "WK-0203",
    title: "Tidal Shift",
    orgs: ["Deep Current Records", "Pacific Groove Alliance"],
    splits: [48, 48],
    balanced: false,
  },
  {
    workId: "WK-0017",
    title: "Gold Rush Anthem",
    orgs: ["Stellar Sounds Publishing", "Deep Current Records"],
    splits: [70, 30],
    balanced: true,
  },
  {
    workId: "WK-0265",
    title: "Static Horizon",
    orgs: ["Midnight Riff Collective", "Neon Harmony Group"],
    splits: [45, 55],
    balanced: true,
  },
];

type PayoutStatus = "Finalized" | "Pending";

interface MockPayout {
  id: string;
  date: string;
  payee: string;
  org: string;
  work: string;
  amountCents: number;
  status: PayoutStatus;
}

const MOCK_PAYOUTS: MockPayout[] = [
  {
    id: "p1",
    date: "2025-03-12",
    payee: "Jamie Holloway",
    org: "Stellar Sounds Publishing",
    work: "Echoes of Tomorrow",
    amountCents: 184000,
    status: "Finalized",
  },
  {
    id: "p2",
    date: "2025-03-10",
    payee: "Maya Chen",
    org: "Neon Harmony Group",
    work: "Neon Rain Reprise",
    amountCents: 97500,
    status: "Finalized",
  },
  {
    id: "p3",
    date: "2025-03-08",
    payee: "Carlos Reyes",
    org: "Midnight Riff Collective",
    work: "Broken Signal",
    amountCents: 62000,
    status: "Pending",
  },
  {
    id: "p4",
    date: "2025-03-05",
    payee: "Priya Nair",
    org: "Pacific Groove Alliance",
    work: "Tidal Shift",
    amountCents: 45300,
    status: "Finalized",
  },
  {
    id: "p5",
    date: "2025-02-28",
    payee: "Sam Oduya",
    org: "Deep Current Records",
    work: "Gold Rush Anthem",
    amountCents: 118900,
    status: "Finalized",
  },
  {
    id: "p6",
    date: "2025-02-25",
    payee: "Jamie Holloway",
    org: "Stellar Sounds Publishing",
    work: "Blue Meridian",
    amountCents: 77200,
    status: "Pending",
  },
  {
    id: "p7",
    date: "2025-02-22",
    payee: "Aisha Moreau",
    org: "Neon Harmony Group",
    work: "Phantom Frequencies",
    amountCents: 53400,
    status: "Finalized",
  },
  {
    id: "p8",
    date: "2025-02-18",
    payee: "Diego Fuentes",
    org: "Pacific Groove Alliance",
    work: "Static Horizon",
    amountCents: 88600,
    status: "Finalized",
  },
  {
    id: "p9",
    date: "2025-02-14",
    payee: "Carlos Reyes",
    org: "Midnight Riff Collective",
    work: "Echoes of Tomorrow",
    amountCents: 31700,
    status: "Pending",
  },
  {
    id: "p10",
    date: "2025-02-10",
    payee: "Priya Nair",
    org: "Pacific Groove Alliance",
    work: "Blue Meridian",
    amountCents: 54100,
    status: "Finalized",
  },
  {
    id: "p11",
    date: "2025-02-07",
    payee: "Sam Oduya",
    org: "Deep Current Records",
    work: "Tidal Shift",
    amountCents: 29800,
    status: "Finalized",
  },
  {
    id: "p12",
    date: "2025-01-31",
    payee: "Maya Chen",
    org: "Neon Harmony Group",
    work: "Broken Signal",
    amountCents: 143000,
    status: "Finalized",
  },
  {
    id: "p13",
    date: "2025-01-28",
    payee: "Jamie Holloway",
    org: "Stellar Sounds Publishing",
    work: "Gold Rush Anthem",
    amountCents: 66500,
    status: "Pending",
  },
  {
    id: "p14",
    date: "2025-01-22",
    payee: "Aisha Moreau",
    org: "Neon Harmony Group",
    work: "Neon Rain Reprise",
    amountCents: 91200,
    status: "Finalized",
  },
  {
    id: "p15",
    date: "2025-01-18",
    payee: "Diego Fuentes",
    org: "Pacific Groove Alliance",
    work: "Static Horizon",
    amountCents: 37400,
    status: "Finalized",
  },
  {
    id: "p16",
    date: "2025-01-15",
    payee: "Carlos Reyes",
    org: "Midnight Riff Collective",
    work: "Phantom Frequencies",
    amountCents: 47900,
    status: "Finalized",
  },
  {
    id: "p17",
    date: "2025-01-10",
    payee: "Priya Nair",
    org: "Pacific Groove Alliance",
    work: "Gold Rush Anthem",
    amountCents: 82300,
    status: "Pending",
  },
  {
    id: "p18",
    date: "2025-01-05",
    payee: "Sam Oduya",
    org: "Deep Current Records",
    work: "Echoes of Tomorrow",
    amountCents: 24600,
    status: "Finalized",
  },
];

// ── Revenue Summary Tab ───────────────────────────────────────────────────────
function RevenueSummaryTab() {
  const totalRevenue = MOCK_ORGS.reduce((s, o) => s + o.totalRevenue, 0);
  const maxRevenue = Math.max(...MOCK_ORGS.map((o) => o.totalRevenue));

  return (
    <div className="space-y-6">
      {/* Horizontal bar chart */}
      <Card className="bg-card/60 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Revenue by Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {MOCK_ORGS.map((org, i) => {
            const pct = (org.totalRevenue / maxRevenue) * 100;
            return (
              <div key={org.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/80 truncate max-w-[60%]">
                    {org.name}
                  </span>
                  <span className="text-primary font-mono font-semibold">
                    ${(org.totalRevenue / 100).toLocaleString()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Summary table */}
      <Card className="bg-card/60 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Organization Revenue Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Organization</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">Works</TableHead>
                <TableHead className="text-right">Statements</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_ORGS.map((org) => (
                <TableRow
                  key={org.id}
                  className="border-border/30 hover:bg-muted/20"
                >
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell className="text-right font-mono text-primary">
                    ${(org.totalRevenue / 100).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{org.works}</TableCell>
                  <TableCell className="text-right">{org.statements}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {((org.totalRevenue / totalRevenue) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
              {/* Total row */}
              <TableRow className="border-t-2 border-primary/30 bg-primary/5 font-bold">
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="text-right font-mono text-primary font-bold">
                  ${(totalRevenue / 100).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {MOCK_ORGS.reduce((s, o) => s + o.works, 0)}
                </TableCell>
                <TableCell className="text-right">
                  {MOCK_ORGS.reduce((s, o) => s + o.statements, 0)}
                </TableCell>
                <TableCell className="text-right">100.0%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Split Reconciliation Tab ──────────────────────────────────────────────────
type SplitFilter = "all" | "balanced" | "discrepancy";

function SplitReconciliationTab() {
  const [filter, setFilter] = useState<SplitFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "balanced") return MOCK_SPLITS.filter((s) => s.balanced);
    if (filter === "discrepancy") return MOCK_SPLITS.filter((s) => !s.balanced);
    return MOCK_SPLITS;
  }, [filter]);

  return (
    <div className="space-y-4">
      {/* Filter toggle */}
      <div className="flex gap-2" data-ocid="splits.tab">
        {(["all", "balanced", "discrepancy"] as SplitFilter[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "bg-primary text-primary-foreground"
                : "border-border/50 text-muted-foreground"
            }
            data-ocid={`splits.${f}.toggle`}
          >
            {f === "all"
              ? "All"
              : f === "balanced"
                ? "Balanced"
                : "Discrepancies Only"}
          </Button>
        ))}
      </div>

      <Card className="bg-card/60 border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Work Title</TableHead>
                <TableHead>Work ID</TableHead>
                <TableHead>Orgs Involved</TableHead>
                <TableHead>Split % per Org</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="splits.empty_state"
                  >
                    No works match this filter.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((work, idx) => (
                <TableRow
                  key={work.workId}
                  className="border-border/30 hover:bg-muted/20"
                  data-ocid={`splits.item.${idx + 1}`}
                >
                  <TableCell className="font-medium">{work.title}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {work.workId}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {work.orgs.map((org) => (
                        <Badge
                          key={org}
                          variant="outline"
                          className="text-xs border-border/50"
                        >
                          {org}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {work.splits.join(" / ")}%
                    <span className="text-xs text-muted-foreground ml-1">
                      (Σ={work.splits.reduce((a, b) => a + b, 0)}%)
                    </span>
                  </TableCell>
                  <TableCell>
                    {work.balanced ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">
                        Balanced
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 border">
                        Discrepancy
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Unified Payout History Tab ────────────────────────────────────────────────
type SortField = "date" | "amount";
type SortDir = "asc" | "desc";

function UnifiedPayoutHistoryTab({ isAdmin }: { isAdmin: boolean }) {
  const [orgFilter, setOrgFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const orgNames = useMemo(
    () => ["all", ...Array.from(new Set(MOCK_PAYOUTS.map((p) => p.org)))],
    [],
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let rows = MOCK_PAYOUTS;
    if (orgFilter !== "all") rows = rows.filter((p) => p.org === orgFilter);
    if (statusFilter !== "all")
      rows = rows.filter((p) => p.status === statusFilter);
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = a.date.localeCompare(b.date);
      else cmp = a.amountCents - b.amountCents;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [orgFilter, statusFilter, sortField, sortDir]);

  const handleExport = () => {
    exportCsv(
      "unified-payout-history.csv",
      filtered.map((p) => [
        p.date,
        p.payee,
        p.org,
        p.work,
        `$${(p.amountCents / 100).toFixed(2)}`,
        p.status,
      ]),
      ["Date", "Payee", "Organization", "Work", "Amount", "Status"],
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 text-xs">
      {sortField === field ? (sortDir === "asc" ? "↑" : "↓") : "⇅"}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Filters + export */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger
            className="w-52 border-border/50"
            data-ocid="payouts.select"
          >
            <SelectValue placeholder="Filter by org" />
          </SelectTrigger>
          <SelectContent>
            {orgNames.map((org) => (
              <SelectItem key={org} value={org}>
                {org === "all" ? "All Organizations" : org}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            className="w-40 border-border/50"
            data-ocid="payouts.status.select"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Finalized">Finalized</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto">
          {isAdmin ? (
            <Button
              size="sm"
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10 gap-2"
              onClick={handleExport}
              data-ocid="payouts.upload_button"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          ) : (
            <div
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
              data-ocid="payouts.error_state"
            >
              <Lock className="h-3.5 w-3.5" />
              Admin-only export
            </div>
          )}
        </div>
      </div>

      <Card className="bg-card/60 border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead
                  className="cursor-pointer select-none hover:text-primary transition-colors"
                  onClick={() => handleSort("date")}
                  data-ocid="payouts.table"
                >
                  Date <SortIcon field="date" />
                </TableHead>
                <TableHead>Payee</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Work</TableHead>
                <TableHead
                  className="text-right cursor-pointer select-none hover:text-primary transition-colors"
                  onClick={() => handleSort("amount")}
                >
                  Amount <SortIcon field="amount" />
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="payouts.empty_state"
                  >
                    No payout records match this filter.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p, idx) => (
                <TableRow
                  key={p.id}
                  className="border-border/30 hover:bg-muted/20"
                  data-ocid={`payouts.item.${idx + 1}`}
                >
                  <TableCell className="font-mono text-sm">{p.date}</TableCell>
                  <TableCell>{p.payee}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.org}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.work}
                  </TableCell>
                  <TableCell className="text-right font-mono text-primary font-semibold">
                    ${(p.amountCents / 100).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        p.status === "Finalized"
                          ? "bg-green-500/20 text-green-400 border-green-500/30 border"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30 border"
                      }
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function CrossOrgRoyalties() {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (actor && !isFetching) {
      (actor as any)
        .isCallerAdmin()
        .then((v: boolean) => setIsAdmin(v))
        .catch(() => {});
    }
  }, [actor, isFetching]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" data-ocid="crossorg.page">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <GitMerge className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t("crossOrgRoyalties")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Consolidated royalty views across all your organizations
          </p>
        </div>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Organizations", value: MOCK_ORGS.length.toString() },
          {
            label: "Total Revenue",
            value: `$${(MOCK_ORGS.reduce((s, o) => s + o.totalRevenue, 0) / 100).toLocaleString()}`,
          },
          { label: "Cross-Org Works", value: MOCK_SPLITS.length.toString() },
          {
            label: "Discrepancies",
            value: MOCK_SPLITS.filter((s) => !s.balanced).length.toString(),
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="bg-card/60 border-border/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {kpi.label}
              </p>
              <p className="text-2xl font-bold text-primary">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="revenue"
        className="space-y-4"
        data-ocid="crossorg.tab"
      >
        <TabsList className="bg-muted/30 border border-border/40">
          <TabsTrigger value="revenue" data-ocid="crossorg.revenue.tab">
            Revenue Summary
          </TabsTrigger>
          <TabsTrigger value="splits" data-ocid="crossorg.splits.tab">
            Split Reconciliation
          </TabsTrigger>
          <TabsTrigger value="payouts" data-ocid="crossorg.payouts.tab">
            Unified Payout History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <RevenueSummaryTab />
        </TabsContent>
        <TabsContent value="splits">
          <SplitReconciliationTab />
        </TabsContent>
        <TabsContent value="payouts">
          <UnifiedPayoutHistoryTab isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
