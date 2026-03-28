import { Badge } from "@/components/ui/badge";
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
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Loader2,
  Mic2,
  Music2,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { PerformanceType, SetlistEntry } from "../backend.d";

type Performance = any;
import { useActor } from "../hooks/useActor";
import { useAllWorks, useOrganizations } from "../hooks/useQueries";
import { useTranslation } from "../i18n";

const PERF_TYPES = [
  "concert",
  "festival",
  "broadcast",
  "streamingLive",
  "privateEvent",
  "other",
];

function ptLabel(pt: PerformanceType): string {
  if ("concert" in pt) return "Concert";
  if ("festival" in pt) return "Festival";
  if ("broadcast" in pt) return "Broadcast";
  if ("streamingLive" in pt) return "Live Stream";
  if ("privateEvent" in pt) return "Private Event";
  return "Other";
}

function ptColor(pt: PerformanceType): string {
  if ("concert" in pt) return "bg-primary/20 text-primary border-primary/30";
  if ("festival" in pt)
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  if ("broadcast" in pt)
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if ("streamingLive" in pt)
    return "bg-purple-500/20 text-purple-400 border-purple-500/30";
  return "bg-muted/50 text-muted-foreground border-border";
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString();
}

type SetlistItem = { workId: string; title: string; durationSeconds: string };

export function PerformanceTracker() {
  const { t } = useTranslation();
  const { actor } = useActor();
  const qc = useQueryClient();
  const { data: orgs } = useOrganizations();
  const { data: works } = useAllWorks();

  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPerf, setSelectedPerf] = useState<Performance | null>(null);
  const [form, setForm] = useState({
    orgId: "",
    venueName: "",
    venueCity: "",
    venueCountry: "",
    performanceDate: "",
    performanceType: "concert",
    promoter: "",
  });
  const [setlist, setSetlist] = useState<SetlistItem[]>([]);
  const [workSearch, setWorkSearch] = useState("");

  const { data: performances, isLoading } = useQuery<Performance[]>({
    queryKey: ["performances", selectedOrgId],
    queryFn: async () => {
      if (!actor) return [];
      if (selectedOrgId)
        return (actor as any).getPerformancesByOrg(selectedOrgId);
      return (actor as any).listAllPerformances();
    },
    enabled: !!actor,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const ptMap: Record<string, PerformanceType> = {
        concert: { concert: null },
        festival: { festival: null },
        broadcast: { broadcast: null },
        streamingLive: { streamingLive: null },
        privateEvent: { privateEvent: null },
        other: { other: null },
      };
      const setlistPayload: SetlistEntry[] = setlist.map((s, i) => ({
        workId: s.workId,
        position: BigInt(i + 1),
        durationSeconds: BigInt(Number(s.durationSeconds) || 0),
      }));
      return (actor as any).registerPerformance(
        form.orgId,
        form.venueName,
        form.venueCity,
        form.venueCountry,
        form.performanceDate,
        ptMap[form.performanceType],
        form.promoter,
        setlistPayload,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["performances"] });
      setShowDialog(false);
      setForm({
        orgId: "",
        venueName: "",
        venueCity: "",
        venueCountry: "",
        performanceDate: "",
        performanceType: "concert",
        promoter: "",
      });
      setSetlist([]);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).verifyPerformance(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["performances"] }),
  });

  const addToSetlist = (workId: string, title: string) => {
    if (setlist.find((s) => s.workId === workId)) return;
    setSetlist((p) => [...p, { workId, title, durationSeconds: "" }]);
  };

  const moveSetlist = (i: number, dir: -1 | 1) => {
    const next = [...setlist];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setSetlist(next);
  };

  const filteredSearchWorks =
    works?.filter((w) =>
      w.title.toLowerCase().includes(workSearch.toLowerCase()),
    ) ?? [];

  return (
    <div className="p-6 space-y-6 max-w-6xl" data-ocid="performance.page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mic2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {t("performanceTracker")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("performanceTrackerDesc")}
            </p>
          </div>
        </div>
        <Button
          data-ocid="performance.open_modal_button"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setShowDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("registerPerformance")}
        </Button>
      </div>

      {/* Org filter */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-4 items-end">
            <div className="w-64">
              <Label className="text-muted-foreground text-xs mb-1 block">
                {t("filterByOrg")}
              </Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger
                  className="bg-input border-border"
                  data-ocid="performance.org.select"
                >
                  <SelectValue placeholder={t("allOrganizations")} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="">{t("allOrganizations")}</SelectItem>
                  {orgs?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performances Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            {t("performances")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="flex items-center justify-center py-12"
              data-ocid="performance.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">
                    {t("venue")}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t("venueCity")}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t("created")}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t("performanceType")}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t("setlist")}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t("verified")}
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!performances?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                      data-ocid="performance.empty_state"
                    >
                      {t("noPerformances")}
                    </TableCell>
                  </TableRow>
                ) : (
                  performances.map((p, i) => (
                    <TableRow
                      key={p.id}
                      className="border-border hover:bg-muted/30 cursor-pointer"
                      data-ocid={`performance.item.${i + 1}`}
                    >
                      <TableCell className="font-medium text-foreground">
                        {p.venueName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.venueCity}, {p.venueCountry}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(p.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ptColor(p.performanceType)}`}
                        >
                          {ptLabel(p.performanceType)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {p.setlist.length} {t("tracks")}
                      </TableCell>
                      <TableCell>
                        {p.verified ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {t("unverified")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedPerf(p)}
                          >
                            {t("view")}
                          </Button>
                          {!p.verified && (
                            <Button
                              size="sm"
                              variant="ghost"
                              data-ocid={`performance.verify.button.${i + 1}`}
                              className="text-green-400 hover:text-green-300"
                              onClick={() => verifyMutation.mutate(p.id)}
                            >
                              {t("verifyPerformance")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Register Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-card border-border max-w-2xl"
          data-ocid="performance.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              {t("registerPerformance")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground">
                  {t("organization")}
                </Label>
                <Select
                  value={form.orgId}
                  onValueChange={(v) => setForm((p) => ({ ...p, orgId: v }))}
                >
                  <SelectTrigger
                    className="bg-input border-border"
                    data-ocid="performance.org_select.select"
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
              <div>
                <Label className="text-muted-foreground">
                  {t("performanceType")}
                </Label>
                <Select
                  value={form.performanceType}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, performanceType: v }))
                  }
                >
                  <SelectTrigger
                    className="bg-input border-border"
                    data-ocid="performance.type.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {PERF_TYPES.map((pt) => (
                      <SelectItem key={pt} value={pt}>
                        {pt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("venue")}</Label>
              <Input
                className="bg-input border-border"
                data-ocid="performance.venue.input"
                value={form.venueName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, venueName: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground">
                  {t("venueCity")}
                </Label>
                <Input
                  className="bg-input border-border"
                  data-ocid="performance.city.input"
                  value={form.venueCity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, venueCity: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-muted-foreground">{t("country")}</Label>
                <Input
                  className="bg-input border-border"
                  data-ocid="performance.country.input"
                  value={form.venueCountry}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, venueCountry: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground">
                  {t("performanceDate")}
                </Label>
                <Input
                  type="date"
                  className="bg-input border-border"
                  data-ocid="performance.date.input"
                  value={form.performanceDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, performanceDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-muted-foreground">{t("promoter")}</Label>
                <Input
                  className="bg-input border-border"
                  data-ocid="performance.promoter.input"
                  value={form.promoter}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, promoter: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Setlist Builder */}
            <div>
              <Label className="text-muted-foreground font-semibold">
                {t("setlist")} ({t("optional")})
              </Label>
              <div className="mt-2 border border-border rounded-lg p-3 space-y-2">
                <Input
                  className="bg-input border-border"
                  data-ocid="performance.setlist_search.search_input"
                  placeholder={t("searchWorks")}
                  value={workSearch}
                  onChange={(e) => setWorkSearch(e.target.value)}
                />
                {workSearch && (
                  <div className="bg-muted/30 rounded border border-border max-h-32 overflow-y-auto">
                    {filteredSearchWorks.slice(0, 8).map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-primary/10 text-foreground"
                        onClick={() => {
                          addToSetlist(w.id, w.title);
                          setWorkSearch("");
                        }}
                      >
                        {w.title}
                      </button>
                    ))}
                  </div>
                )}
                <div className="space-y-1">
                  {setlist.map((s, i) => (
                    <div
                      key={s.workId}
                      className="flex items-center gap-2 bg-muted/20 rounded px-2 py-1"
                      data-ocid={`performance.setlist.item.${i + 1}`}
                    >
                      <span className="text-xs text-muted-foreground w-5">
                        {i + 1}.
                      </span>
                      <span className="flex-1 text-sm text-foreground truncate">
                        {s.title}
                      </span>
                      <Input
                        className="bg-input border-border h-6 w-20 text-xs"
                        placeholder="secs"
                        value={s.durationSeconds}
                        onChange={(e) => {
                          const next = [...setlist];
                          next[i].durationSeconds = e.target.value;
                          setSetlist(next);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => moveSetlist(i, -1)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSetlist(i, 1)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSetlist((p) => p.filter((_, j) => j !== i))
                        }
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="performance.cancel_button"
              onClick={() => setShowDialog(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              data-ocid="performance.submit_button"
              className="bg-primary text-primary-foreground"
              disabled={
                !form.orgId || !form.venueName || registerMutation.isPending
              }
              onClick={() => registerMutation.mutate()}
            >
              {registerMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("registerPerformance")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      {selectedPerf && (
        <Dialog
          open={!!selectedPerf}
          onOpenChange={() => setSelectedPerf(null)}
        >
          <DialogContent
            className="bg-card border-border"
            data-ocid="performance.detail.dialog"
          >
            <DialogHeader>
              <DialogTitle className="font-display text-foreground">
                {selectedPerf.venueName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ptColor(selectedPerf.performanceType)}`}
                >
                  {ptLabel(selectedPerf.performanceType)}
                </span>
                {selectedPerf.verified && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    {t("verified")}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {selectedPerf.venueCity}, {selectedPerf.venueCountry}
              </p>
              {selectedPerf.promoter && (
                <p className="text-muted-foreground">
                  {t("promoter")}: {selectedPerf.promoter}
                </p>
              )}
              {selectedPerf.setlist.length > 0 && (
                <div>
                  <p className="font-semibold text-muted-foreground mb-2">
                    {t("setlist")}
                  </p>
                  <div className="space-y-1">
                    {selectedPerf.setlist.map((s, _i) => (
                      <div key={s.workId} className="flex gap-2 text-sm">
                        <span className="text-muted-foreground w-5">
                          {Number(s.position)}.
                        </span>
                        <span className="text-foreground">{s.workId}</span>
                        {Number(s.durationSeconds) > 0 && (
                          <span className="text-muted-foreground ml-auto">
                            {Number(s.durationSeconds)}s
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                data-ocid="performance.detail_close.button"
                onClick={() => setSelectedPerf(null)}
              >
                {t("close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
