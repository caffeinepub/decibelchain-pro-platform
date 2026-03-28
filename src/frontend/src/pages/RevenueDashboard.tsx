import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  DollarSign,
  Loader2,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import {
  useOrganizations,
  useRevenueSourcesByOrg,
  useRevenueStats,
} from "../hooks/useQueries";
import { useTranslation } from "../i18n";

const SOURCE_TYPES = [
  "streaming",
  "performance",
  "sync",
  "mechanical",
  "digital",
  "other",
] as const;
type SourceType = (typeof SOURCE_TYPES)[number];

function formatCents(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

export function RevenueDashboard() {
  const { t } = useTranslation();
  const { actor } = useActor();
  const qc = useQueryClient();
  const { data: orgs, isLoading: orgsLoading } = useOrganizations();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [workId, setWorkId] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("streaming");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [description, setDescription] = useState("");

  const { data: stats, isLoading: statsLoading } =
    useRevenueStats(selectedOrgId);
  const { data: sources, isLoading: sourcesLoading } =
    useRevenueSourcesByOrg(selectedOrgId);

  const statCards = [
    {
      key: "totalRevenue",
      value: stats ? formatCents(stats.totalRevenueCents) : "$0.00",
      icon: DollarSign,
    },
    {
      key: "totalDistributed",
      value: stats ? formatCents(stats.totalDistributedCents) : "$0.00",
      icon: TrendingUp,
    },
    {
      key: "pendingPayouts",
      value: stats ? formatCents(stats.pendingPayoutsCents) : "$0.00",
      icon: Wallet,
    },
    {
      key: "statementCount",
      value: stats ? String(stats.statementCount) : "0",
      icon: BarChart3,
    },
  ];

  async function handleSubmit() {
    if (
      !actor ||
      !selectedOrgId ||
      !workId ||
      !amount ||
      !periodStart ||
      !periodEnd
    )
      return;
    setSubmitting(true);
    try {
      const amountCents = BigInt(Math.round(Number.parseFloat(amount) * 100));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).createRevenueSource(
        selectedOrgId,
        workId,
        { [sourceType]: null },
        amountCents,
        currency,
        periodStart,
        periodEnd,
        description,
      );
      qc.invalidateQueries({ queryKey: ["revenueSources", selectedOrgId] });
      qc.invalidateQueries({ queryKey: ["revenueStats", selectedOrgId] });
      toast.success("Revenue source added");
      setDialogOpen(false);
      setWorkId("");
      setAmount("");
      setCurrency("USD");
      setPeriodStart("");
      setPeriodEnd("");
      setDescription("");
    } catch {
      toast.error("Failed to add revenue source");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl" data-ocid="revenue_dashboard.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            {t("revenueDashboard")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">{t("royalties")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="revenue_dashboard.add_revenue.open_modal_button"
              disabled={!selectedOrgId}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {t("addRevenueSource")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-md"
            data-ocid="revenue_dashboard.add_revenue.dialog"
          >
            <DialogHeader>
              <DialogTitle className="font-display">
                {t("addRevenueSource")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Work ID</Label>
                <Input
                  data-ocid="revenue_dashboard.work_id.input"
                  value={workId}
                  onChange={(e) => setWorkId(e.target.value)}
                  placeholder="work-id..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("sourceType")}</Label>
                <Select
                  value={sourceType}
                  onValueChange={(v) => setSourceType(v as SourceType)}
                >
                  <SelectTrigger data-ocid="revenue_dashboard.source_type.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {t(st)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("amountUsd")}</Label>
                  <Input
                    data-ocid="revenue_dashboard.amount.input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("currency")}</Label>
                  <Input
                    data-ocid="revenue_dashboard.currency.input"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="USD"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("periodStart")}</Label>
                  <Input
                    data-ocid="revenue_dashboard.period_start.input"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("periodEnd")}</Label>
                  <Input
                    data-ocid="revenue_dashboard.period_end.input"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("description")}</Label>
                <Input
                  data-ocid="revenue_dashboard.description.input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                data-ocid="revenue_dashboard.add_revenue.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                data-ocid="revenue_dashboard.add_revenue.submit_button"
                onClick={handleSubmit}
                disabled={
                  submitting || !workId || !amount || !periodStart || !periodEnd
                }
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("submit")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Org selector */}
      <div className="flex items-center gap-3">
        <Label className="text-sm whitespace-nowrap">{t("organization")}</Label>
        {orgsLoading ? (
          <Skeleton className="h-9 w-48 bg-muted" />
        ) : (
          <Select
            value={selectedOrgId ?? ""}
            onValueChange={(v) => setSelectedOrgId(v || null)}
          >
            <SelectTrigger
              data-ocid="revenue_dashboard.org.select"
              className="w-64"
            >
              <SelectValue placeholder={t("selectOrg")} />
            </SelectTrigger>
            <SelectContent>
              {(orgs ?? []).map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!selectedOrgId ? (
        <Card className="bg-card border-border">
          <CardContent
            className="py-16 text-center"
            data-ocid="revenue_dashboard.empty_state"
          >
            <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t("selectOrgFirst")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(({ key, value, icon: Icon }) => (
              <Card key={key} className="bg-card border-border">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {t(key)}
                      </p>
                      {statsLoading ? (
                        <Skeleton className="h-7 w-20 mt-1 bg-muted" />
                      ) : (
                        <p className="text-2xl font-display font-bold text-foreground mt-1">
                          {value}
                        </p>
                      )}
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue Sources Table */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">
                {t("addRevenueSource")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sourcesLoading ? (
                <div
                  className="space-y-2"
                  data-ocid="revenue_dashboard.sources.loading_state"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full bg-muted" />
                  ))}
                </div>
              ) : !sources?.length ? (
                <p
                  className="text-sm text-muted-foreground py-6 text-center"
                  data-ocid="revenue_dashboard.sources.empty_state"
                >
                  {t("noRevenueSources")}
                </p>
              ) : (
                <Table data-ocid="revenue_dashboard.sources.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work ID</TableHead>
                      <TableHead>{t("sourceType")}</TableHead>
                      <TableHead>{t("amountUsd")}</TableHead>
                      <TableHead>{t("currency")}</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>{t("description")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sources.map((src, i) => (
                      <TableRow
                        key={src.id}
                        data-ocid={`revenue_dashboard.sources.item.${i + 1}`}
                      >
                        <TableCell className="font-mono text-xs">
                          {src.workId.slice(0, 8)}…
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {Object.keys(src.sourceType)[0]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCents(src.amountCents)}
                        </TableCell>
                        <TableCell>{src.currency}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {src.periodStart} – {src.periodEnd}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground text-xs">
                          {src.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
