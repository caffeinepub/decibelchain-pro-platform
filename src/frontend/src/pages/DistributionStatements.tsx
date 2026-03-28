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
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import {
  useOrganizations,
  usePayoutsByStatement,
  useStatementsByOrg,
} from "../hooks/useQueries";
import { useTranslation } from "../i18n";

function formatCents(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

type StatementStatus = "draft" | "finalized" | "paid";
type PayoutStatus = "pending" | "processing" | "completed" | "failed";

function statusBadge(status: StatementStatus, t: (k: string) => string) {
  const variants: Record<StatementStatus, string> = {
    draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    finalized: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    paid: "bg-green-500/10 text-green-400 border-green-500/30",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${variants[status]}`}
    >
      {t(status)}
    </span>
  );
}

function payoutStatusBadge(status: PayoutStatus, t: (k: string) => string) {
  const variants: Record<PayoutStatus, string> = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    processing: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    completed: "bg-green-500/10 text-green-400 border-green-500/30",
    failed: "bg-red-500/10 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${variants[status]}`}
    >
      {t(status)}
    </span>
  );
}

interface StatementRowProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  statement: any;
  index: number;
}

function StatementDetail({ statement }: { statement: any }) {
  const { t } = useTranslation();
  const { actor } = useActor();
  const qc = useQueryClient();
  const [finalizing, setFinalizing] = useState(false);
  const statementStatus = Object.keys(statement.status)[0] as StatementStatus;
  const { data: payouts, isLoading: payoutsLoading } = usePayoutsByStatement(
    statementStatus === "finalized" || statementStatus === "paid"
      ? statement.id
      : null,
  );

  const [payoutUpdates, setPayoutUpdates] = useState<
    Record<string, { status: PayoutStatus; notes: string }>
  >({});
  const [saving, setSaving] = useState<string | null>(null);

  async function handleFinalize() {
    if (!actor) return;
    setFinalizing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).finalizeStatement(statement.id);
      qc.invalidateQueries({ queryKey: ["statements"] });
      toast.success("Statement finalized");
    } catch {
      toast.error("Failed to finalize");
    } finally {
      setFinalizing(false);
    }
  }

  async function handleSavePayout(payoutId: string) {
    if (!actor) return;
    const update = payoutUpdates[payoutId];
    if (!update) return;
    setSaving(payoutId);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).updatePayoutStatus(
        payoutId,
        { [update.status]: null },
        update.notes,
      );
      qc.invalidateQueries({ queryKey: ["payouts", statement.id] });
      toast.success("Payout updated");
    } catch {
      toast.error("Failed to update payout");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mt-4 space-y-4 border-t border-border/50 pt-4">
      {/* Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">{t("currency")}</p>
          <p className="font-medium">{statement.currency}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-medium text-primary">
            {formatCents(statement.totalAmountCents)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("periodStart")}</p>
          <p className="font-medium">{statement.periodStart}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("periodEnd")}</p>
          <p className="font-medium">{statement.periodEnd}</p>
        </div>
      </div>

      {/* Line items */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">
          {t("lineItems")}
        </h4>
        {statement.lineItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">No line items</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Holder ID</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statement.lineItems.map((li: any) => (
                <TableRow key={String(li.holderId)}>
                  <TableCell className="font-mono text-xs">
                    {String(li.holderId).slice(0, 12)}…
                  </TableCell>
                  <TableCell>{String(li.percentage)}%</TableCell>
                  <TableCell>{formatCents(li.amountCents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Finalize button */}
      {statementStatus === "draft" && (
        <Button
          data-ocid="statements.finalize.primary_button"
          size="sm"
          onClick={handleFinalize}
          disabled={finalizing}
          className="gap-2"
        >
          {finalizing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {t("finalizeStatement")}
        </Button>
      )}

      {/* Payouts */}
      {(statementStatus === "finalized" || statementStatus === "paid") && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            {t("payouts")}
          </h4>
          {payoutsLoading ? (
            <div data-ocid="statements.payouts.loading_state">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full bg-muted mb-2" />
              ))}
            </div>
          ) : !payouts?.length ? (
            <p
              className="text-xs text-muted-foreground"
              data-ocid="statements.payouts.empty_state"
            >
              {t("payouts")} — none yet
            </p>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout: any, pi: number) => {
                const currentStatus = Object.keys(
                  payout.status,
                )[0] as PayoutStatus;
                const update = payoutUpdates[payout.id] ?? {
                  status: currentStatus,
                  notes: payout.notes ?? "",
                };
                return (
                  <div
                    key={payout.id}
                    data-ocid={`statements.payout.item.${pi + 1}`}
                    className="flex flex-wrap items-center gap-3 p-3 rounded-md border border-border/50 bg-muted/20"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono truncate">
                        {String(payout.holderId).slice(0, 16)}…
                      </p>
                      <p className="text-sm font-medium text-primary">
                        {formatCents(payout.amountCents)}
                      </p>
                    </div>
                    {payoutStatusBadge(currentStatus, t)}
                    <Select
                      value={update.status}
                      onValueChange={(v) =>
                        setPayoutUpdates((prev) => ({
                          ...prev,
                          [payout.id]: { ...update, status: v as PayoutStatus },
                        }))
                      }
                    >
                      <SelectTrigger
                        data-ocid={`statements.payout.select.${pi + 1}`}
                        className="w-32 h-8 text-xs"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          [
                            "pending",
                            "processing",
                            "completed",
                            "failed",
                          ] as PayoutStatus[]
                        ).map((s) => (
                          <SelectItem key={s} value={s}>
                            {t(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      className="h-8 min-h-0 text-xs w-36 resize-none py-1.5"
                      placeholder="Notes..."
                      value={update.notes}
                      onChange={(e) =>
                        setPayoutUpdates((prev) => ({
                          ...prev,
                          [payout.id]: { ...update, notes: e.target.value },
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      data-ocid={`statements.payout.save_button.${pi + 1}`}
                      onClick={() => handleSavePayout(payout.id)}
                      disabled={saving === payout.id}
                      className="h-8 text-xs"
                    >
                      {saving === payout.id && (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      )}
                      {t("save")}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatementRow({ statement, index }: StatementRowProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const status = Object.keys(statement.status)[0] as StatementStatus;

  return (
    <>
      <TableRow
        data-ocid={`statements.item.${index}`}
        className="cursor-pointer hover:bg-muted/20"
        onClick={() => setExpanded((v) => !v)}
      >
        <TableCell className="font-mono text-xs">
          {statement.id.slice(0, 8)}…
        </TableCell>
        <TableCell className="font-mono text-xs">
          {statement.workId.slice(0, 8)}…
        </TableCell>
        <TableCell className="text-xs">
          {statement.periodStart} – {statement.periodEnd}
        </TableCell>
        <TableCell className="font-medium text-primary">
          {formatCents(statement.totalAmountCents)}
        </TableCell>
        <TableCell>{statement.currency}</TableCell>
        <TableCell>{statusBadge(status, t)}</TableCell>
        <TableCell>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/10 p-4">
            <StatementDetail statement={statement} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function DistributionStatements() {
  const { t } = useTranslation();
  const { actor } = useActor();
  const qc = useQueryClient();
  const { data: orgs, isLoading: orgsLoading } = useOrganizations();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [workId, setWorkId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [currency, setCurrency] = useState("USD");

  const { data: statements, isLoading: statementsLoading } =
    useStatementsByOrg(selectedOrgId);

  async function handleCreate() {
    if (!actor || !selectedOrgId || !workId || !periodStart || !periodEnd)
      return;
    setSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).createDistributionStatement(
        selectedOrgId,
        workId,
        periodStart,
        periodEnd,
        currency,
      );
      qc.invalidateQueries({ queryKey: ["statements", selectedOrgId] });
      toast.success("Statement created");
      setDialogOpen(false);
      setWorkId("");
      setPeriodStart("");
      setPeriodEnd("");
      setCurrency("USD");
    } catch {
      toast.error("Failed to create statement");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl" data-ocid="statements.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            {t("distributionStatements")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">{t("royalties")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="statements.create.open_modal_button"
              disabled={!selectedOrgId}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {t("createStatement")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-md"
            data-ocid="statements.create.dialog"
          >
            <DialogHeader>
              <DialogTitle className="font-display">
                {t("createStatement")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Work ID</Label>
                <Input
                  data-ocid="statements.work_id.input"
                  value={workId}
                  onChange={(e) => setWorkId(e.target.value)}
                  placeholder="work-id..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("periodStart")}</Label>
                  <Input
                    data-ocid="statements.period_start.input"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("periodEnd")}</Label>
                  <Input
                    data-ocid="statements.period_end.input"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("currency")}</Label>
                <Input
                  data-ocid="statements.currency.input"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="USD"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                data-ocid="statements.create.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                data-ocid="statements.create.submit_button"
                onClick={handleCreate}
                disabled={submitting || !workId || !periodStart || !periodEnd}
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
            <SelectTrigger data-ocid="statements.org.select" className="w-64">
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
            data-ocid="statements.empty_state"
          >
            <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t("selectOrgFirst")}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              {t("distributionStatements")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statementsLoading ? (
              <div className="space-y-2" data-ocid="statements.loading_state">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full bg-muted" />
                ))}
              </div>
            ) : !statements?.length ? (
              <p
                className="text-sm text-muted-foreground py-6 text-center"
                data-ocid="statements.list.empty_state"
              >
                {t("noStatements")}
              </p>
            ) : (
              <Table data-ocid="statements.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Work ID</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>{t("currency")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statements.map((stmt: any, i: number) => (
                    <StatementRow
                      key={stmt.id}
                      statement={stmt}
                      index={i + 1}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
