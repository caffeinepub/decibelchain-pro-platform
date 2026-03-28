import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, PieChart, Plus } from "lucide-react";
import { useState } from "react";
import {
  formatTimestamp,
  useAllWorks,
  useSetSplit,
  useSplitsByWork,
} from "../hooks/useQueries";
import { useTranslation } from "../i18n";

export function OwnershipSplits() {
  const { t } = useTranslation();
  const { data: works } = useAllWorks();
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const { data: splits, isLoading: splitsLoading } =
    useSplitsByWork(selectedWorkId);
  const setSplit = useSetSplit();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ holderId: "", percentage: "", role: "" });

  const selectedWork = works?.find((w) => w.id === selectedWorkId);
  const totalPct =
    splits?.reduce((sum, s) => sum + Number(s.percentage), 0) ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkId || !form.holderId || !form.percentage) return;
    await setSplit.mutateAsync({
      workId: selectedWorkId,
      holderId: form.holderId,
      percentage: Number(form.percentage),
      role: form.role,
    });
    setForm({ holderId: "", percentage: "", role: "" });
    setShowForm(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl" data-ocid="ownership_splits.page">
      <div>
        <h2 className="font-display text-2xl font-bold">
          {t("ownershipSplits")}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">{t("selectWork")}</p>
      </div>

      {/* Work selector */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4">
          <Label className="mb-2 block">{t("creativeWorks")}</Label>
          <Select
            value={selectedWorkId ?? ""}
            onValueChange={(v) => {
              setSelectedWorkId(v);
              setShowForm(false);
            }}
          >
            <SelectTrigger
              data-ocid="ownership_splits.work.select"
              className="bg-input border-border"
            >
              <SelectValue placeholder={t("selectWork")} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {works?.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedWorkId && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold">
                {t("splitsFor")}: {selectedWork?.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={
                    totalPct === 100
                      ? "border-green-500/40 text-green-400"
                      : "border-yellow-500/40 text-yellow-400"
                  }
                >
                  {t("totalPercentage")}: {totalPct}%
                </Badge>
              </div>
            </div>
            <Button
              data-ocid="ownership_splits.add.primary_button"
              className="bg-primary text-primary-foreground"
              onClick={() => setShowForm((v) => !v)}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("addSplit")}
            </Button>
          </div>

          {showForm && (
            <Card
              className="bg-card border-primary/30"
              data-ocid="ownership_splits.form.card"
            >
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm">
                  {t("addSplit")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>{t("holderId")} *</Label>
                    <Input
                      data-ocid="ownership_splits.holder_id.input"
                      value={form.holderId}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, holderId: e.target.value }))
                      }
                      className="bg-input border-border font-mono text-sm"
                      placeholder="Principal ID"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>{t("percentage")} *</Label>
                      <Input
                        type="number"
                        data-ocid="ownership_splits.percentage.input"
                        value={form.percentage}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, percentage: e.target.value }))
                        }
                        className="bg-input border-border"
                        min="1"
                        max="100"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("role")}</Label>
                      <Input
                        data-ocid="ownership_splits.role.input"
                        value={form.role}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, role: e.target.value }))
                        }
                        className="bg-input border-border"
                        placeholder="e.g. Songwriter"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      data-ocid="ownership_splits.add.submit_button"
                      disabled={
                        setSplit.isPending || !form.holderId || !form.percentage
                      }
                      className="bg-primary text-primary-foreground"
                    >
                      {setSplit.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {t("addSplit")}
                    </Button>
                    <Button
                      type="button"
                      data-ocid="ownership_splits.add.cancel_button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="border-border"
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {splitsLoading ? (
            <Skeleton
              className="h-32 w-full bg-muted"
              data-ocid="ownership_splits.loading_state"
            />
          ) : !splits?.length ? (
            <div
              className="text-center py-10 text-muted-foreground"
              data-ocid="ownership_splits.empty_state"
            >
              <PieChart className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t("noSplits")}</p>
            </div>
          ) : (
            <Card className="bg-card border-border overflow-hidden">
              <Table data-ocid="ownership_splits.table">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">
                      {t("holderId")}
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      {t("percentage")}
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      {t("role")}
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      {t("timestamp")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {splits.map((split, i) => (
                    <TableRow
                      key={`${split.workId}-${split.holderId}`}
                      data-ocid={`ownership_splits.row.${i + 1}`}
                      className="border-border"
                    >
                      <TableCell className="font-mono text-xs">
                        {split.holderId}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary/20 text-primary border-0">
                          {Number(split.percentage)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{split.role || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatTimestamp(split.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
