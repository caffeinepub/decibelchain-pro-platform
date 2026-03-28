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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { TerritoryCode } from "../backend.d";

type TerritoryRecord = any;
import { useActor } from "../hooks/useActor";
import { useAllWorks, useOrganizations } from "../hooks/useQueries";
import { useTranslation } from "../i18n";

const TERRITORY_CODES = [
  "world",
  "northAmerica",
  "europe",
  "latinAmerica",
  "asiaPacific",
  "africa",
  "middleEast",
  "oceania",
  "custom",
];

function tcLabel(tc: TerritoryCode): string {
  if ("world" in tc) return "World";
  if ("northAmerica" in tc) return "North America";
  if ("europe" in tc) return "Europe";
  if ("latinAmerica" in tc) return "Latin America";
  if ("asiaPacific" in tc) return "Asia Pacific";
  if ("africa" in tc) return "Africa";
  if ("middleEast" in tc) return "Middle East";
  if ("oceania" in tc) return "Oceania";
  if ("custom" in tc) return `Custom: ${tc.custom}`;
  return "Unknown";
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString();
}

export function TerritoryManager() {
  const { t } = useTranslation();
  const { actor } = useActor();
  const qc = useQueryClient();
  const { data: orgs } = useOrganizations();
  const { data: works } = useAllWorks();

  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedWorkId, setSelectedWorkId] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    territoryCode: "world",
    customCode: "",
    subPublisherId: "",
    notes: "",
  });

  const filteredWorks =
    works?.filter((w) => !selectedOrgId || w.orgId === selectedOrgId) ?? [];

  const { data: territories, isLoading } = useQuery<TerritoryRecord[]>({
    queryKey: ["territories", selectedWorkId, selectedOrgId],
    queryFn: async () => {
      if (!actor) return [];
      if (selectedWorkId)
        return (actor as any).getTerritoriesByWork(selectedWorkId);
      if (selectedOrgId)
        return (actor as any).getTerritoriesByOrg(selectedOrgId);
      return (actor as any).listAllTerritories();
    },
    enabled: !!actor,
  });

  const { data: allTerritories } = useQuery<TerritoryRecord[]>({
    queryKey: ["territories", "all"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listAllTerritories();
    },
    enabled: !!actor,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const tc: TerritoryCode =
        form.territoryCode === "custom"
          ? { custom: form.customCode }
          : ({ [form.territoryCode]: null } as any);
      return (actor as any).registerTerritory(
        selectedWorkId,
        selectedOrgId,
        tc,
        form.subPublisherId,
        form.notes,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["territories"] });
      setShowDialog(false);
      setForm({
        territoryCode: "world",
        customCode: "",
        subPublisherId: "",
        notes: "",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).removeTerritory(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["territories"] }),
  });

  const TerritoryTable = ({ items }: { items: TerritoryRecord[] }) => (
    <Table>
      <TableHeader>
        <TableRow className="border-border">
          <TableHead className="text-muted-foreground">
            {t("territoryCode")}
          </TableHead>
          <TableHead className="text-muted-foreground">
            {t("subPublisher")}
          </TableHead>
          <TableHead className="text-muted-foreground">
            {t("registeredBy")}
          </TableHead>
          <TableHead className="text-muted-foreground">
            {t("created")}
          </TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center text-muted-foreground py-8"
              data-ocid="territory.empty_state"
            >
              {t("noTerritories")}
            </TableCell>
          </TableRow>
        ) : (
          items.map((tr, i) => (
            <TableRow
              key={tr.id}
              className="border-border hover:bg-muted/30"
              data-ocid={`territory.item.${i + 1}`}
            >
              <TableCell>
                <Badge
                  variant="outline"
                  className="text-primary border-primary/30"
                >
                  {tcLabel(tr.territoryCode)}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {tr.subPublisherId || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm truncate max-w-[120px]">
                {tr.registeredBy}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(tr.createdAt)}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  data-ocid={`territory.delete_button.${i + 1}`}
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeMutation.mutate(tr.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl" data-ocid="territory.page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {t("territoryManager")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("territoryManagerDesc")}
            </p>
          </div>
        </div>
        <Button
          data-ocid="territory.open_modal_button"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={!selectedWorkId}
          onClick={() => setShowDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("registerTerritory")}
        </Button>
      </div>

      {/* Selectors */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-muted-foreground text-xs mb-1 block">
                {t("organization")}
              </Label>
              <Select
                value={selectedOrgId}
                onValueChange={(v) => {
                  setSelectedOrgId(v);
                  setSelectedWorkId("");
                }}
              >
                <SelectTrigger
                  className="bg-input border-border"
                  data-ocid="territory.org.select"
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
            <div className="flex-1 min-w-[200px]">
              <Label className="text-muted-foreground text-xs mb-1 block">
                {t("selectWork")}
              </Label>
              <Select value={selectedWorkId} onValueChange={setSelectedWorkId}>
                <SelectTrigger
                  className="bg-input border-border"
                  data-ocid="territory.work.select"
                >
                  <SelectValue placeholder={t("selectWork")} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {filteredWorks.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="filtered">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="filtered" data-ocid="territory.work.tab">
            {t("workTerritories")}
          </TabsTrigger>
          <TabsTrigger value="all" data-ocid="territory.all.tab">
            {t("allTerritories")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="filtered" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {isLoading ? (
                <div
                  className="flex items-center justify-center py-12"
                  data-ocid="territory.loading_state"
                >
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <TerritoryTable items={territories ?? []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <TerritoryTable items={allTerritories ?? []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-card border-border"
          data-ocid="territory.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              {t("registerTerritory")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">
                {t("territoryCode")}
              </Label>
              <Select
                value={form.territoryCode}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, territoryCode: v }))
                }
              >
                <SelectTrigger
                  className="bg-input border-border"
                  data-ocid="territory.code.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {TERRITORY_CODES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.territoryCode === "custom" && (
              <div>
                <Label className="text-muted-foreground">
                  {t("customCode")}
                </Label>
                <Input
                  className="bg-input border-border"
                  data-ocid="territory.custom_code.input"
                  value={form.customCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, customCode: e.target.value }))
                  }
                />
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">
                {t("subPublisher")}
              </Label>
              <Input
                className="bg-input border-border"
                data-ocid="territory.sub_publisher.input"
                value={form.subPublisherId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, subPublisherId: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-muted-foreground">{t("notes")}</Label>
              <Textarea
                className="bg-input border-border"
                data-ocid="territory.notes.textarea"
                rows={2}
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="territory.cancel_button"
              onClick={() => setShowDialog(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              data-ocid="territory.submit_button"
              className="bg-primary text-primary-foreground"
              disabled={registerMutation.isPending}
              onClick={() => registerMutation.mutate()}
            >
              {registerMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("register")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
