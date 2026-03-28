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
import { Loader2, Plus, Shield } from "lucide-react";
import { useState } from "react";
import type { DisputeCategory, DisputeStatus } from "../backend.d";

type Dispute = any;
import { useActor } from "../hooks/useActor";
import { useOrganizations } from "../hooks/useQueries";
import { useTranslation } from "../i18n";

function categoryLabel(cat: DisputeCategory): string {
  if ("royalty" in cat) return "Royalty";
  if ("split" in cat) return "Split";
  if ("license" in cat) return "License";
  if ("financing" in cat) return "Financing";
  return "Other";
}

function statusLabel(s: DisputeStatus): string {
  if ("filed" in s) return "Filed";
  if ("inReview" in s) return "In Review";
  if ("awaitingResponse" in s) return "Awaiting Response";
  if ("resolved" in s) return "Resolved";
  if ("rejected" in s) return "Rejected";
  if ("closed" in s) return "Closed";
  return "Unknown";
}

function statusColor(s: DisputeStatus): string {
  if ("filed" in s) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if ("inReview" in s)
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  if ("awaitingResponse" in s)
    return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if ("resolved" in s)
    return "bg-green-500/20 text-green-400 border-green-500/30";
  if ("rejected" in s) return "bg-red-500/20 text-red-400 border-red-500/30";
  if ("closed" in s) return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  return "";
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString();
}

export function DisputeCenter() {
  const { t } = useTranslation();
  const { actor } = useActor();
  const qc = useQueryClient();
  const { data: orgs } = useOrganizations();

  const { data: disputes, isLoading } = useQuery<Dispute[]>({
    queryKey: ["disputes"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getDisputes();
    },
    enabled: !!actor,
  });

  const [showFileDialog, setShowFileDialog] = useState(false);
  const [fileForm, setFileForm] = useState({
    orgId: "",
    category: "royalty" as string,
    subject: "",
    description: "",
    targetEntityType: "",
    targetEntityId: "",
  });

  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [adminAction, setAdminAction] = useState<
    "" | "assign" | "status" | "propose" | "resolve" | "close"
  >("");
  const [actionInput, setActionInput] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [actionStatus, setActionStatus] = useState("inReview");

  const fileMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const categoryMap: Record<string, DisputeCategory> = {
        royalty: { royalty: null },
        split: { split: null },
        license: { license: null },
        financing: { financing: null },
        other: { other: null },
      };
      return (actor as any).fileDispute(
        fileForm.orgId,
        categoryMap[fileForm.category],
        fileForm.subject,
        fileForm.description,
        fileForm.targetEntityType,
        fileForm.targetEntityId,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disputes"] });
      setShowFileDialog(false);
      setFileForm({
        orgId: "",
        category: "royalty",
        subject: "",
        description: "",
        targetEntityType: "",
        targetEntityId: "",
      });
    },
  });

  const actionMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !selectedDispute) throw new Error("No actor");
      const statusMap: Record<string, DisputeStatus> = {
        filed: { filed: null },
        inReview: { inReview: null },
        awaitingResponse: { awaitingResponse: null },
        resolved: { resolved: null },
        rejected: { rejected: null },
        closed: { closed: null },
      };
      if (adminAction === "assign")
        return (actor as any).assignDispute(selectedDispute.id, actionInput);
      if (adminAction === "status")
        return (actor as any).updateDisputeStatus(
          selectedDispute.id,
          statusMap[actionStatus],
          actionNotes,
        );
      if (adminAction === "propose")
        return (actor as any).proposeDisputeResolution(
          selectedDispute.id,
          actionInput,
        );
      if (adminAction === "resolve")
        return (actor as any).resolveDispute(selectedDispute.id, actionInput);
      if (adminAction === "close")
        return (actor as any).closeDispute(selectedDispute.id, actionNotes);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disputes"] });
      setSelectedDispute(null);
      setAdminAction("");
      setActionInput("");
      setActionNotes("");
    },
  });

  const DisputeTable = ({ items }: { items: Dispute[] }) => (
    <Table>
      <TableHeader>
        <TableRow className="border-border">
          <TableHead className="text-muted-foreground">
            {t("disputeSubject")}
          </TableHead>
          <TableHead className="text-muted-foreground">
            {t("disputeCategory")}
          </TableHead>
          <TableHead className="text-muted-foreground">
            {t("disputeStatus")}
          </TableHead>
          <TableHead className="text-muted-foreground">
            {t("created")}
          </TableHead>
          <TableHead className="text-muted-foreground">
            {t("organization")}
          </TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="text-center text-muted-foreground py-8"
              data-ocid="dispute.empty_state"
            >
              {t("noDisputes")}
            </TableCell>
          </TableRow>
        ) : (
          items.map((d, i) => (
            <TableRow
              key={d.id}
              className="border-border hover:bg-muted/30 cursor-pointer"
              data-ocid={`dispute.item.${i + 1}`}
            >
              <TableCell className="font-medium text-foreground">
                {d.subject}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {categoryLabel(d.category)}
                </Badge>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(d.status)}`}
                >
                  {statusLabel(d.status)}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(d.createdAt)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {d.orgId}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  data-ocid={`dispute.edit_button.${i + 1}`}
                  onClick={() => {
                    setSelectedDispute(d);
                    setAdminAction("");
                  }}
                >
                  {t("view")}
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl" data-ocid="dispute.page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {t("disputeCenter")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("disputeCenterDesc")}
            </p>
          </div>
        </div>
        <Button
          data-ocid="dispute.open_modal_button"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setShowFileDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("fileDispute")}
        </Button>
      </div>

      <Tabs defaultValue="mine">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="mine" data-ocid="dispute.my.tab">
            {t("myDisputes")}
          </TabsTrigger>
          <TabsTrigger value="all" data-ocid="dispute.all.tab">
            {t("allDisputes")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {isLoading ? (
                <div
                  className="flex items-center justify-center py-12"
                  data-ocid="dispute.loading_state"
                >
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <DisputeTable items={disputes?.slice(0, 10) ?? []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <DisputeTable items={disputes ?? []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* File Dispute Dialog */}
      <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
        <DialogContent
          className="bg-card border-border max-w-lg"
          data-ocid="dispute.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              {t("fileDispute")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">
                {t("organization")}
              </Label>
              <Select
                value={fileForm.orgId}
                onValueChange={(v) => setFileForm((p) => ({ ...p, orgId: v }))}
              >
                <SelectTrigger
                  className="bg-input border-border"
                  data-ocid="dispute.select"
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
                {t("disputeCategory")}
              </Label>
              <Select
                value={fileForm.category}
                onValueChange={(v) =>
                  setFileForm((p) => ({ ...p, category: v }))
                }
              >
                <SelectTrigger
                  className="bg-input border-border"
                  data-ocid="dispute.category.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {["royalty", "split", "license", "financing", "other"].map(
                    (c) => (
                      <SelectItem key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground">
                {t("disputeSubject")}
              </Label>
              <Input
                className="bg-input border-border"
                data-ocid="dispute.subject.input"
                value={fileForm.subject}
                onChange={(e) =>
                  setFileForm((p) => ({ ...p, subject: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-muted-foreground">
                {t("disputeDescription")}
              </Label>
              <Textarea
                className="bg-input border-border"
                data-ocid="dispute.description.textarea"
                rows={3}
                value={fileForm.description}
                onChange={(e) =>
                  setFileForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground">
                  {t("targetEntityType")}
                </Label>
                <Input
                  className="bg-input border-border"
                  data-ocid="dispute.entity_type.input"
                  value={fileForm.targetEntityType}
                  onChange={(e) =>
                    setFileForm((p) => ({
                      ...p,
                      targetEntityType: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label className="text-muted-foreground">
                  {t("targetEntityId")}
                </Label>
                <Input
                  className="bg-input border-border"
                  data-ocid="dispute.entity_id.input"
                  value={fileForm.targetEntityId}
                  onChange={(e) =>
                    setFileForm((p) => ({
                      ...p,
                      targetEntityId: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="dispute.cancel_button"
              onClick={() => setShowFileDialog(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              data-ocid="dispute.submit_button"
              className="bg-primary text-primary-foreground"
              disabled={
                !fileForm.orgId || !fileForm.subject || fileMutation.isPending
              }
              onClick={() => fileMutation.mutate()}
            >
              {fileMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("fileDispute")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Detail Panel */}
      {selectedDispute && (
        <Dialog
          open={!!selectedDispute}
          onOpenChange={() => setSelectedDispute(null)}
        >
          <DialogContent
            className="bg-card border-border max-w-lg"
            data-ocid="dispute.detail.dialog"
          >
            <DialogHeader>
              <DialogTitle className="font-display text-foreground">
                {selectedDispute.subject}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <Badge variant="outline">
                  {categoryLabel(selectedDispute.category)}
                </Badge>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(selectedDispute.status)}`}
                >
                  {statusLabel(selectedDispute.status)}
                </span>
              </div>
              <p className="text-muted-foreground">
                {selectedDispute.description}
              </p>
              {selectedDispute.resolution && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("proposeResolution")}
                  </p>
                  <p className="text-foreground text-sm">
                    {selectedDispute.resolution}
                  </p>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  {t("adminActions")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    data-ocid="dispute.assign.button"
                    onClick={() => setAdminAction("assign")}
                  >
                    {t("assignDispute")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    data-ocid="dispute.status.button"
                    onClick={() => setAdminAction("status")}
                  >
                    {t("updateStatus")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    data-ocid="dispute.propose.button"
                    onClick={() => setAdminAction("propose")}
                  >
                    {t("proposeResolution")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    data-ocid="dispute.resolve.button"
                    onClick={() => setAdminAction("resolve")}
                  >
                    {t("resolveDispute")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    data-ocid="dispute.close.button"
                    onClick={() => setAdminAction("close")}
                  >
                    {t("closeDispute")}
                  </Button>
                </div>

                {adminAction === "assign" && (
                  <Input
                    className="bg-input border-border"
                    data-ocid="dispute.admin_id.input"
                    placeholder="Admin Principal ID"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                  />
                )}
                {adminAction === "status" && (
                  <div className="space-y-2">
                    <Select
                      value={actionStatus}
                      onValueChange={setActionStatus}
                    >
                      <SelectTrigger
                        className="bg-input border-border"
                        data-ocid="dispute.new_status.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {[
                          "filed",
                          "inReview",
                          "awaitingResponse",
                          "resolved",
                          "rejected",
                          "closed",
                        ].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      className="bg-input border-border"
                      data-ocid="dispute.notes.textarea"
                      placeholder={t("adminNotes")}
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
                {(adminAction === "propose" || adminAction === "resolve") && (
                  <Textarea
                    className="bg-input border-border"
                    data-ocid="dispute.resolution.textarea"
                    placeholder={t("resolutionText")}
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    rows={2}
                  />
                )}
                {adminAction === "close" && (
                  <Textarea
                    className="bg-input border-border"
                    data-ocid="dispute.close_notes.textarea"
                    placeholder={t("adminNotes")}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={2}
                  />
                )}

                {adminAction && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      data-ocid="dispute.action_cancel.button"
                      onClick={() => setAdminAction("")}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      size="sm"
                      data-ocid="dispute.action_confirm.button"
                      className="bg-primary text-primary-foreground"
                      disabled={actionMutation.isPending}
                      onClick={() => actionMutation.mutate()}
                    >
                      {actionMutation.isPending && (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      )}
                      {t("confirm")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
