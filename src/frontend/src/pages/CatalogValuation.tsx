import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
type CVType = any;
type ValuationConfig = any;
import { useActor } from "../hooks/useActor";
import { useOrganizations } from "../hooks/useQueries";
import { useTranslation } from "../i18n";

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString();
}

function fmtMoney(cents: bigint): string {
  return `$${(Number(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CatalogValuation() {
  const { t } = useTranslation();
  const { actor } = useActor();
  const qc = useQueryClient();
  const { data: orgs } = useOrganizations();

  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);
  const [showMultiplierDialog, setShowMultiplierDialog] = useState(false);
  const [snapshotNotes, setSnapshotNotes] = useState("");
  const [newMultiplierBps, setNewMultiplierBps] = useState("");

  const { data: config, isLoading: configLoading } = useQuery<ValuationConfig>({
    queryKey: ["valuation-config"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return (actor as any).getValuationConfig();
    },
    enabled: !!actor,
  });

  const { data: history, isLoading: historyLoading } = useQuery<CVType[]>({
    queryKey: ["valuation-history", selectedOrgId],
    queryFn: async () => {
      if (!actor) return [];
      if (selectedOrgId)
        return (actor as any).getValuationHistory(selectedOrgId);
      return (actor as any).listAllValuations();
    },
    enabled: !!actor,
  });

  const { data: latest } = useQuery<CVType | null>({
    queryKey: ["valuation-latest", selectedOrgId],
    queryFn: async () => {
      if (!actor || !selectedOrgId) return null;
      return (actor as any).getLatestValuation(selectedOrgId);
    },
    enabled: !!actor && !!selectedOrgId,
  });

  const snapshotMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const today = new Date().toISOString().split("T")[0];
      return (actor as any).createValuationSnapshot(
        selectedOrgId,
        today,
        snapshotNotes,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["valuation-history"] });
      qc.invalidateQueries({ queryKey: ["valuation-latest"] });
      setShowSnapshotDialog(false);
      setSnapshotNotes("");
    },
  });

  const proposeMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return (actor as any).proposeMultiplierChange(
        BigInt(Math.round(Number(newMultiplierBps) * 100)),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["valuation-config"] });
      setShowMultiplierDialog(false);
      setNewMultiplierBps("");
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return (actor as any).approveMultiplierChange();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["valuation-config"] }),
  });

  const chartData = [...(history ?? [])]
    .sort((a, b) => Number(a.createdAt) - Number(b.createdAt))
    .slice(-12)
    .map((v) => ({
      date: formatDate(v.createdAt),
      value: Number(v.estimatedValueCents) / 100,
    }));

  const currentMultiplier = config
    ? (Number(config.multiplierBps) / 100).toFixed(2)
    : "—";
  const pendingMultiplier = config?.pendingMultiplierBps
    ? (Number(config.pendingMultiplierBps) / 100).toFixed(2)
    : null;

  return (
    <div className="p-6 space-y-6 max-w-6xl" data-ocid="valuation.page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {t("catalogValuation")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("catalogValuationDesc")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            data-ocid="valuation.snapshot.primary_button"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!selectedOrgId}
            onClick={() => setShowSnapshotDialog(true)}
          >
            {t("createSnapshot")}
          </Button>
        </div>
      </div>

      {/* Org selector */}
      <div className="w-64">
        <Label className="text-muted-foreground text-xs mb-1 block">
          {t("organization")}
        </Label>
        <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
          <SelectTrigger
            className="bg-input border-border"
            data-ocid="valuation.org.select"
          >
            <SelectValue placeholder={t("selectOrg")} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {orgs?.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            key: "estimatedValue",
            value: latest ? fmtMoney(latest.estimatedValueCents) : "—",
          },
          {
            key: "totalWorks",
            value: latest ? Number(latest.totalWorks) : "—",
          },
          {
            key: "activeLicenses",
            value: latest ? Number(latest.activeLicenses) : "—",
          },
          {
            key: "totalDistributed",
            value: latest ? fmtMoney(latest.totalDistributedCents) : "—",
          },
        ].map(({ key, value }, i) => (
          <Card
            key={key}
            className="bg-card border-border"
            data-ocid={`valuation.stat.item.${i + 1}`}
          >
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {t(key)}
              </p>
              <p className="text-2xl font-display font-bold text-primary mt-1">
                {String(value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Multiplier config */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="font-display text-base">
            {t("multiplierConfig")}
          </CardTitle>
          {!pendingMultiplier ? (
            <Button
              size="sm"
              variant="outline"
              data-ocid="valuation.propose_multiplier.button"
              onClick={() => setShowMultiplierDialog(true)}
            >
              {t("proposeMultiplier")}
            </Button>
          ) : (
            <Button
              size="sm"
              data-ocid="valuation.approve_multiplier.button"
              className="bg-primary text-primary-foreground"
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
            >
              {approveMutation.isPending && (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              )}
              {t("approveMultiplier")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {configLoading ? (
            <div
              className="flex items-center gap-2"
              data-ocid="valuation.config.loading_state"
            >
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("multiplier")}
                </p>
                <p className="text-3xl font-display font-bold text-primary">
                  {currentMultiplier}×
                </p>
              </div>
              {pendingMultiplier && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2">
                  <p className="text-xs text-yellow-400">
                    {t("pendingMultiplier")}
                  </p>
                  <p className="text-xl font-display font-bold text-yellow-300">
                    {pendingMultiplier}×
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trend chart */}
      {chartData.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              {t("valuationTrend")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                  formatter={(v: number) => [
                    `$${v.toFixed(2)}`,
                    t("estimatedValue"),
                  ]}
                />
                <Bar
                  dataKey="value"
                  fill="var(--primary)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Valuation history table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            {t("valuationHistory")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {historyLoading ? (
            <div
              className="flex items-center justify-center py-12"
              data-ocid="valuation.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">
                    {t("created")}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t("snapshotWorks")}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t("activeLicenses")}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t("snapshotDistributed")}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t("multiplier")}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t("estimatedValue")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!history?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                      data-ocid="valuation.empty_state"
                    >
                      {t("noValuations")}
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((v, i) => (
                    <TableRow
                      key={v.id}
                      className="border-border hover:bg-muted/30"
                      data-ocid={`valuation.item.${i + 1}`}
                    >
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(v.createdAt)}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {Number(v.totalWorks)}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {Number(v.activeLicenses)}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {fmtMoney(v.totalDistributedCents)}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {(Number(v.multiplierBps) / 100).toFixed(2)}×
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        {fmtMoney(v.estimatedValueCents)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Snapshot Dialog */}
      <Dialog open={showSnapshotDialog} onOpenChange={setShowSnapshotDialog}>
        <DialogContent
          className="bg-card border-border"
          data-ocid="valuation.snapshot.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              {t("createSnapshot")}
            </DialogTitle>
          </DialogHeader>
          <div>
            <Label className="text-muted-foreground">{t("notes")}</Label>
            <Input
              className="bg-input border-border mt-1"
              data-ocid="valuation.snapshot_notes.input"
              value={snapshotNotes}
              onChange={(e) => setSnapshotNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="valuation.snapshot_cancel.button"
              onClick={() => setShowSnapshotDialog(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              data-ocid="valuation.snapshot_confirm.button"
              className="bg-primary text-primary-foreground"
              disabled={snapshotMutation.isPending}
              onClick={() => snapshotMutation.mutate()}
            >
              {snapshotMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("createSnapshot")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Propose Multiplier Dialog */}
      <Dialog
        open={showMultiplierDialog}
        onOpenChange={setShowMultiplierDialog}
      >
        <DialogContent
          className="bg-card border-border"
          data-ocid="valuation.multiplier.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              {t("proposeMultiplier")}
            </DialogTitle>
          </DialogHeader>
          <div>
            <Label className="text-muted-foreground">
              {t("newMultiplier")}
            </Label>
            <Input
              type="number"
              step="0.01"
              className="bg-input border-border mt-1"
              data-ocid="valuation.multiplier.input"
              placeholder="3.00"
              value={newMultiplierBps}
              onChange={(e) => setNewMultiplierBps(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("multiplierHint")}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="valuation.multiplier_cancel.button"
              onClick={() => setShowMultiplierDialog(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              data-ocid="valuation.multiplier_confirm.button"
              className="bg-primary text-primary-foreground"
              disabled={!newMultiplierBps || proposeMutation.isPending}
              onClick={() => proposeMutation.mutate()}
            >
              {proposeMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("proposeMultiplier")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
