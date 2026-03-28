import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
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
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  FileX,
  Loader2,
  Plus,
  Scale,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  AdjustmentEntityType,
  AdjustmentFieldName,
  AdjustmentRequest,
  LicenseRecord,
  LicenseType,
} from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useAllWorks, useOrganizations } from "../hooks/useQueries";
import { useTranslation } from "../i18n";

type Actor = {
  listLicensesByOrg: (orgId: string) => Promise<LicenseRecord[]>;
  createLicense: (
    workId: string,
    orgId: string,
    licenseType: LicenseType,
    territory: string,
    termStart: string,
    termEnd: string,
    exclusivity: boolean,
    feeCents: bigint,
    currency: string,
    licenseeId: string,
    notes: string,
  ) => Promise<LicenseRecord>;
  approveLicense: (id: string) => Promise<[] | [LicenseRecord]>;
  rejectLicense: (id: string, reason: string) => Promise<[] | [LicenseRecord]>;
  revokeLicense: (id: string, reason: string) => Promise<[] | [LicenseRecord]>;
  expireLicense: (id: string) => Promise<[] | [LicenseRecord]>;
  proposeAdjustment: (
    entityType: AdjustmentEntityType,
    entityId: string,
    fieldName: AdjustmentFieldName,
    oldValue: bigint,
    proposedValue: bigint,
    reason: string,
  ) => Promise<AdjustmentRequest>;
  approveAdjustment: (
    id: string,
    reviewNotes: string,
  ) => Promise<[] | [AdjustmentRequest]>;
  rejectAdjustment: (
    id: string,
    reviewNotes: string,
  ) => Promise<[] | [AdjustmentRequest]>;
  listPendingAdjustments: () => Promise<AdjustmentRequest[]>;
  listAdjustmentsByEntity: (
    entityType: AdjustmentEntityType,
    entityId: string,
  ) => Promise<AdjustmentRequest[]>;
  isCallerAdmin: () => Promise<boolean>;
};

function getStatusLabel(status: LicenseRecord["status"]): string {
  if ("active" in status) return "active";
  if ("revoked" in status) return "revoked";
  if ("expired" in status) return "expired";
  if ("pendingApproval" in status) return "pendingApproval";
  if ("rejected" in status) return "rejected";
  return "unknown";
}

function getLicenseTypeLabel(lt: LicenseType): string {
  if ("sync" in lt) return "sync";
  if ("mechanical" in lt) return "mechanical";
  if ("performance" in lt) return "performance";
  if ("master" in lt) return "master";
  if ("blanket" in lt) return "blanket";
  return "unknown";
}

function getAdjStatusLabel(status: AdjustmentRequest["status"]): string {
  if ("pending" in status) return "pending";
  if ("approved" in status) return "approved";
  if ("rejected" in status) return "rejected";
  return "unknown";
}

function getFieldLabel(fn: AdjustmentFieldName): string {
  if ("feeCents" in fn) return "feeCents";
  if ("amountCents" in fn) return "amountCents";
  if ("percentage" in fn) return "percentage";
  return "unknown";
}

function formatAdjValue(fn: AdjustmentFieldName, value: bigint): string {
  if ("percentage" in fn) return `${Number(value) / 100}%`;
  return `$${(Number(value) / 100).toFixed(2)}`;
}

function StatusBadge({ status }: { status: LicenseRecord["status"] }) {
  const label = getStatusLabel(status);
  const variants: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    pendingApproval: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    expired: "bg-muted/30 text-muted-foreground border-border",
    revoked: "bg-destructive/15 text-destructive border-destructive/30",
    rejected: "bg-destructive/10 text-destructive/70 border-destructive/20",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        variants[label] ?? variants.expired
      }`}
    >
      {label}
    </span>
  );
}

function AdjStatusBadge({ status }: { status: AdjustmentRequest["status"] }) {
  const label = getAdjStatusLabel(status);
  const variants: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    rejected: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        variants[label] ?? variants.pending
      }`}
    >
      {label}
    </span>
  );
}

// ── Create License Dialog ──────────────────────────────────────────────────
function CreateLicenseDialog({
  orgId,
  onCreated,
}: {
  orgId: string;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const { actor } = useActor();
  const { data: allWorks = [] } = useAllWorks();
  const orgWorks = allWorks.filter((w) => w.orgId === orgId);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    workId: "",
    licenseType: "sync" as string,
    territory: "",
    termStart: "",
    termEnd: "",
    exclusivity: false,
    feeDollars: "",
    currency: "USD",
    licenseeId: "",
    notes: "",
  });

  const licenseTypeToVariant = (t: string): LicenseType => {
    const map: Record<string, LicenseType> = {
      sync: { sync: null },
      mechanical: { mechanical: null },
      performance: { performance: null },
      master: { master: null },
      blanket: { blanket: null },
    };
    return map[t] ?? { sync: null };
  };

  async function handleSubmit() {
    if (
      !actor ||
      !form.workId ||
      !form.territory ||
      !form.termStart ||
      !form.termEnd ||
      !form.licenseeId
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      await (actor as unknown as Actor).createLicense(
        form.workId,
        orgId,
        licenseTypeToVariant(form.licenseType),
        form.territory,
        form.termStart,
        form.termEnd,
        form.exclusivity,
        BigInt(Math.round(Number.parseFloat(form.feeDollars || "0") * 100)),
        form.currency || "USD",
        form.licenseeId,
        form.notes,
      );
      toast.success("License created");
      setOpen(false);
      setForm({
        workId: "",
        licenseType: "sync",
        territory: "",
        termStart: "",
        termEnd: "",
        exclusivity: false,
        feeDollars: "",
        currency: "USD",
        licenseeId: "",
        notes: "",
      });
      onCreated();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create license");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="gap-2"
        data-ocid="license.open_modal_button"
      >
        <Plus className="w-4 h-4" />
        {t("createLicense")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="license.dialog"
        >
          <DialogHeader>
            <DialogTitle>{t("createLicense")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("selectWork")} *</Label>
              <Select
                value={form.workId}
                onValueChange={(v) => setForm((p) => ({ ...p, workId: v }))}
              >
                <SelectTrigger data-ocid="license.select">
                  <SelectValue placeholder={t("selectWork")} />
                </SelectTrigger>
                <SelectContent>
                  {orgWorks.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("licenseType")} *</Label>
              <Select
                value={form.licenseType}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, licenseType: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "sync",
                    "mechanical",
                    "performance",
                    "master",
                    "blanket",
                  ].map((lt) => (
                    <SelectItem key={lt} value={lt}>
                      {lt.charAt(0).toUpperCase() + lt.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("territory")} *</Label>
                <Input
                  value={form.territory}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, territory: e.target.value }))
                  }
                  placeholder="Worldwide"
                  data-ocid="license.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("licenseeId")} *</Label>
                <Input
                  value={form.licenseeId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, licenseeId: e.target.value }))
                  }
                  placeholder="Principal or name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("termStart")} *</Label>
                <Input
                  type="date"
                  value={form.termStart}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, termStart: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("termEnd")} *</Label>
                <Input
                  type="date"
                  value={form.termEnd}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, termEnd: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("feeCents")} ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.feeDollars}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, feeDollars: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Input
                  value={form.currency}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, currency: e.target.value }))
                  }
                  placeholder="USD"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="excl"
                checked={form.exclusivity}
                onCheckedChange={(v) =>
                  setForm((p) => ({ ...p, exclusivity: !!v }))
                }
                data-ocid="license.checkbox"
              />
              <Label htmlFor="excl">{t("exclusivity")}</Label>
            </div>

            <div className="space-y-1.5">
              <Label>{t("notes")}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                rows={2}
                data-ocid="license.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="license.cancel_button"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              data-ocid="license.submit_button"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("createLicense")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Propose Adjustment Dialog ──────────────────────────────────────────────
function ProposeAdjustmentDialog({
  license,
  onProposed,
}: {
  license: LicenseRecord;
  onProposed: () => void;
}) {
  const { t } = useTranslation();
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldName, setFieldName] = useState("feeCents");
  const [proposedValue, setProposedValue] = useState("");
  const [reason, setReason] = useState("");

  const fieldNameVariant = (fn: string): AdjustmentFieldName => {
    const map: Record<string, AdjustmentFieldName> = {
      feeCents: { feeCents: null },
      amountCents: { amountCents: null },
      percentage: { percentage: null },
    };
    return map[fn] ?? { feeCents: null };
  };

  const getCurrentValue = (): bigint => {
    if (fieldName === "feeCents") return license.feeCents;
    return BigInt(0);
  };

  const formatCurrentValue = (): string => {
    if (fieldName === "percentage")
      return `${Number(getCurrentValue()) / 100}%`;
    return `$${(Number(getCurrentValue()) / 100).toFixed(2)}`;
  };

  const parseProposedValue = (): bigint => {
    const n = Number.parseFloat(proposedValue || "0");
    if (fieldName === "percentage") return BigInt(Math.round(n * 100));
    return BigInt(Math.round(n * 100));
  };

  async function handleSubmit() {
    if (!actor || !reason.trim()) {
      toast.error("Reason is required");
      return;
    }
    setSaving(true);
    try {
      await (actor as unknown as Actor).proposeAdjustment(
        { license: null },
        license.id,
        fieldNameVariant(fieldName),
        getCurrentValue(),
        parseProposedValue(),
        reason,
      );
      toast.success("Adjustment proposed — awaiting peer approval");
      setOpen(false);
      setProposedValue("");
      setReason("");
      onProposed();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to propose adjustment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-7 px-2 text-xs gap-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
        data-ocid="license.open_modal_button"
      >
        <SlidersHorizontal className="w-3 h-3" />
        {t("proposeAdjustment")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-ocid="license.dialog">
          <DialogHeader>
            <DialogTitle>{t("proposeAdjustment")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Entity Type:</span>
                <span className="ml-2 font-medium">License</span>
              </div>
              <div>
                <span className="text-muted-foreground">Entity ID:</span>
                <span className="ml-2 font-mono text-xs">
                  {license.id.slice(0, 12)}…
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("fieldName")}</Label>
              <Select value={fieldName} onValueChange={setFieldName}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feeCents">{t("feeCents")}</SelectItem>
                  <SelectItem value="amountCents">Amount</SelectItem>
                  <SelectItem value="percentage">{t("percentage")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("oldValue")}</Label>
              <div className="px-3 py-2 rounded-md bg-muted/30 text-sm font-mono border border-border">
                {formatCurrentValue()}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("proposedValue")} *</Label>
              <Input
                type="number"
                min="0"
                step={fieldName === "percentage" ? "0.01" : "0.01"}
                value={proposedValue}
                onChange={(e) => setProposedValue(e.target.value)}
                placeholder={
                  fieldName === "percentage" ? "e.g. 15.5" : "e.g. 500.00"
                }
                data-ocid="license.input"
              />
              <p className="text-xs text-muted-foreground">
                {fieldName === "percentage"
                  ? "Enter percentage value (e.g. 15.5 for 15.5%)"
                  : "Enter dollar amount (e.g. 500.00)"}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>{t("reason")} *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the reason for this adjustment…"
                rows={3}
                data-ocid="license.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="license.cancel_button"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              data-ocid="license.submit_button"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("proposeAdjustment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── License Action Confirm Dialog ──────────────────────────────────────────
function LicenseActionDialog({
  title,
  description,
  requireReason,
  onConfirm,
  trigger,
  ocidPrefix,
}: {
  title: string;
  description: string;
  requireReason?: boolean;
  onConfirm: (reason: string) => Promise<void>;
  trigger: React.ReactNode;
  ocidPrefix: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    if (requireReason && !reason.trim()) {
      toast.error("Reason is required");
      return;
    }
    setSaving(true);
    try {
      await onConfirm(reason);
      setOpen(false);
      setReason("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <span
        onClick={() => setOpen(true)}
        onKeyDown={() => setOpen(true)}
        role="presentation"
      >
        {trigger}
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-ocid={`${ocidPrefix}.dialog`}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{description}</p>
          {requireReason && (
            <div className="space-y-1.5">
              <Label>{t("reason")} *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason…"
                rows={2}
                data-ocid={`${ocidPrefix}.textarea`}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid={`${ocidPrefix}.cancel_button`}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={saving}
              data-ocid={`${ocidPrefix}.confirm_button`}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Adjustment Review Dialog ───────────────────────────────────────────────
function AdjustmentReviewDialog({
  adj,
  action,
  onDone,
}: {
  adj: AdjustmentRequest;
  action: "approve" | "reject";
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    if (action === "reject" && !notes.trim()) {
      toast.error("Review notes are required for rejection");
      return;
    }
    setSaving(true);
    try {
      if (action === "approve") {
        const res = await (actor as unknown as Actor).approveAdjustment(
          adj.id,
          notes,
        );
        if (res.length === 0)
          throw new Error("Cannot approve your own request");
        toast.success("Adjustment approved");
      } else {
        const res = await (actor as unknown as Actor).rejectAdjustment(
          adj.id,
          notes,
        );
        if (res.length === 0) throw new Error("Cannot reject your own request");
        toast.success("Adjustment rejected");
      }
      setOpen(false);
      setNotes("");
      onDone();
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    } finally {
      setSaving(false);
    }
  }

  const isApprove = action === "approve";

  return (
    <>
      <Button
        size="sm"
        variant={isApprove ? "default" : "outline"}
        className={`h-7 px-2 text-xs ${
          isApprove
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "border-destructive/40 text-destructive hover:bg-destructive/10"
        }`}
        onClick={() => setOpen(true)}
        data-ocid={
          isApprove ? "adjustment.confirm_button" : "adjustment.delete_button"
        }
      >
        {isApprove ? (
          <CheckCircle className="w-3 h-3 mr-1" />
        ) : (
          <FileX className="w-3 h-3 mr-1" />
        )}
        {isApprove ? t("approveAdjustment") : t("rejectAdjustment")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-ocid="adjustment.dialog">
          <DialogHeader>
            <DialogTitle>
              {isApprove ? t("confirmApprove") : t("confirmReject")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-md bg-muted/20 border border-border p-3 space-y-1.5">
              <div>
                <span className="text-muted-foreground">Field: </span>
                <span className="font-medium">
                  {getFieldLabel(adj.fieldName)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("oldValue")}: </span>
                <span className="font-mono">
                  {formatAdjValue(adj.fieldName, adj.oldValue)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("proposedValue")}:{" "}
                </span>
                <span className="font-mono font-semibold text-amber-400">
                  {formatAdjValue(adj.fieldName, adj.proposedValue)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("reason")}: </span>
                <span>{adj.reason}</span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("requestedBy")}:{" "}
                </span>
                <span className="font-mono text-xs">
                  {adj.requestedBy.slice(0, 20)}…
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>
                {t("reviewNotes")}
                {isApprove ? " (optional)" : " *"}
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add review notes…"
                rows={2}
                data-ocid="adjustment.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="adjustment.cancel_button"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={saving}
              variant={isApprove ? "default" : "destructive"}
              data-ocid="adjustment.submit_button"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isApprove ? t("approveAdjustment") : t("rejectAdjustment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Adjustments Tab ────────────────────────────────────────────────────────
function AdjustmentsTab() {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<AdjustmentRequest[]>([]);
  const [history, setHistory] = useState<AdjustmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    if (!actor) return;
    setLoading(true);
    try {
      const all = await (actor as unknown as Actor).listPendingAdjustments();
      const pend = all.filter((a) => "pending" in a.status);
      const hist = all.filter((a) => !("pending" in a.status));
      setPending(pend);
      setHistory(hist);
    } catch {
      toast.error("Failed to load adjustments");
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchData is stable within component scope
  useEffect(() => {
    if (!isFetching && actor) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, isFetching]);

  function handleDone() {
    fetchData();
    queryClient.invalidateQueries({ queryKey: ["licenses"] });
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            {t("pendingAdjustments")}
            {pending.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-amber-500/15 text-amber-400 border-0 text-xs"
              >
                {pending.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p
              className="text-sm text-muted-foreground py-4 text-center"
              data-ocid="adjustment.empty_state"
            >
              {t("noAdjustments")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("fieldName")}</TableHead>
                    <TableHead>{t("oldValue")}</TableHead>
                    <TableHead>{t("proposedValue")}</TableHead>
                    <TableHead>{t("reason")}</TableHead>
                    <TableHead>{t("requestedBy")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((adj, idx) => (
                    <TableRow
                      key={adj.id}
                      data-ocid={`adjustment.row.item.${idx + 1}`}
                    >
                      <TableCell className="font-mono text-xs">
                        {getFieldLabel(adj.fieldName)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatAdjValue(adj.fieldName, adj.oldValue)}
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-amber-400">
                        {formatAdjValue(adj.fieldName, adj.proposedValue)}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm">
                        {adj.reason}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {adj.requestedBy.slice(0, 12)}…
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <AdjustmentReviewDialog
                            adj={adj}
                            action="approve"
                            onDone={handleDone}
                          />
                          <AdjustmentReviewDialog
                            adj={adj}
                            action="reject"
                            onDone={handleDone}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("adjustmentHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t("noAdjustments")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("fieldName")}</TableHead>
                    <TableHead>{t("oldValue")}</TableHead>
                    <TableHead>{t("proposedValue")}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>{t("reviewedBy")}</TableHead>
                    <TableHead>{t("reviewNotes")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((adj, idx) => (
                    <TableRow
                      key={adj.id}
                      data-ocid={`adjustment.history.item.${idx + 1}`}
                    >
                      <TableCell className="font-mono text-xs">
                        {getFieldLabel(adj.fieldName)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatAdjValue(adj.fieldName, adj.oldValue)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatAdjValue(adj.fieldName, adj.proposedValue)}
                      </TableCell>
                      <TableCell>
                        <AdjStatusBadge status={adj.status} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {adj.reviewedBy
                          ? `${adj.reviewedBy.slice(0, 12)}…`
                          : "-"}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm">
                        {adj.reviewNotes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Licenses Tab ───────────────────────────────────────────────────────────
function LicensesTab({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();
  const { data: orgs = [], isLoading: orgsLoading } = useOrganizations();
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [licLoading, setLicLoading] = useState(false);

  async function fetchLicenses(orgId: string) {
    if (!actor || !orgId) return;
    setLicLoading(true);
    try {
      const data = await (actor as unknown as Actor).listLicensesByOrg(orgId);
      setLicenses(data);
    } catch {
      toast.error("Failed to load licenses");
    } finally {
      setLicLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchLicenses is stable within component scope
  useEffect(() => {
    if (!isFetching && actor && selectedOrgId) fetchLicenses(selectedOrgId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, isFetching, selectedOrgId]);

  useEffect(() => {
    if (orgs.length > 0 && !selectedOrgId) setSelectedOrgId(orgs[0].id);
  }, [orgs, selectedOrgId]);

  async function handleApprove(id: string) {
    try {
      await (actor as unknown as Actor).approveLicense(id);
      toast.success("License approved");
      fetchLicenses(selectedOrgId);
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  async function handleReject(id: string, reason: string) {
    await (actor as unknown as Actor).rejectLicense(id, reason);
    toast.success("License rejected");
    fetchLicenses(selectedOrgId);
  }

  async function handleRevoke(id: string, reason: string) {
    await (actor as unknown as Actor).revokeLicense(id, reason);
    toast.success("License revoked");
    fetchLicenses(selectedOrgId);
  }

  async function handleExpire(id: string) {
    try {
      await (actor as unknown as Actor).expireLicense(id);
      toast.success("License marked expired");
      fetchLicenses(selectedOrgId);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  const isPending = (s: LicenseRecord["status"]) => "pendingApproval" in s;
  const isActive = (s: LicenseRecord["status"]) => "active" in s;

  return (
    <div className="space-y-4">
      {/* Org Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-64">
          {orgsLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger data-ocid="license.select">
                <SelectValue placeholder={t("selectOrg")} />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {selectedOrgId && (
          <CreateLicenseDialog
            orgId={selectedOrgId}
            onCreated={() => fetchLicenses(selectedOrgId)}
          />
        )}
      </div>

      {/* Table */}
      {licLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : licenses.length === 0 ? (
        <Card className="border-border/50">
          <CardContent
            className="flex flex-col items-center justify-center py-16 gap-3"
            data-ocid="license.empty_state"
          >
            <Scale className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-muted-foreground">{t("noLicenses")}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work ID</TableHead>
                    <TableHead>{t("licenseType")}</TableHead>
                    <TableHead>{t("territory")}</TableHead>
                    <TableHead>{t("termStart")}</TableHead>
                    <TableHead>{t("termEnd")}</TableHead>
                    <TableHead>{t("feeCents")}</TableHead>
                    <TableHead>{t("exclusivity")}</TableHead>
                    <TableHead>{t("licenseeId")}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((lic, idx) => (
                    <TableRow
                      key={lic.id}
                      data-ocid={`license.row.item.${idx + 1}`}
                    >
                      <TableCell className="font-mono text-xs max-w-[100px] truncate">
                        {lic.workId.slice(0, 10)}…
                      </TableCell>
                      <TableCell className="capitalize">
                        {getLicenseTypeLabel(lic.licenseType)}
                      </TableCell>
                      <TableCell>{lic.territory}</TableCell>
                      <TableCell>{lic.termStart}</TableCell>
                      <TableCell>{lic.termEnd}</TableCell>
                      <TableCell className="font-mono">
                        ${(Number(lic.feeCents) / 100).toFixed(2)}{" "}
                        {lic.currency}
                      </TableCell>
                      <TableCell>{lic.exclusivity ? "✓" : "–"}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[100px] truncate">
                        {lic.licenseeId}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={lic.status} />
                      </TableCell>
                      <TableCell>
                        {isAdmin && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {isPending(lic.status) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                  onClick={() => handleApprove(lic.id)}
                                  data-ocid={`license.confirm_button.${idx + 1}`}
                                >
                                  {t("approveLicense")}
                                </Button>
                                <LicenseActionDialog
                                  title={t("confirmReject")}
                                  description="This will reject the license. Please provide a reason."
                                  requireReason
                                  onConfirm={(r) => handleReject(lic.id, r)}
                                  trigger={
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                                    >
                                      {t("rejectLicense")}
                                    </Button>
                                  }
                                  ocidPrefix="license.reject"
                                />
                              </>
                            )}
                            {isActive(lic.status) && (
                              <>
                                <LicenseActionDialog
                                  title={t("confirmRevoke")}
                                  description="This will revoke the license permanently."
                                  requireReason
                                  onConfirm={(r) => handleRevoke(lic.id, r)}
                                  trigger={
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                                    >
                                      {t("revokeLicense")}
                                    </Button>
                                  }
                                  ocidPrefix="license.revoke"
                                />
                                <LicenseActionDialog
                                  title={t("confirmExpire")}
                                  description="This will mark the license as expired."
                                  onConfirm={() => handleExpire(lic.id)}
                                  trigger={
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    >
                                      {t("expireLicense")}
                                    </Button>
                                  }
                                  ocidPrefix="license.expire"
                                />
                              </>
                            )}
                            <ProposeAdjustmentDialog
                              license={lic}
                              onProposed={() => fetchLicenses(selectedOrgId)}
                            />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export function LicensingManager() {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    if (!isFetching && actor) {
      (actor as unknown as Actor)
        .isCallerAdmin()
        .then(setIsAdmin)
        .catch(() => setIsAdmin(false))
        .finally(() => setCheckingAdmin(false));
    }
  }, [actor, isFetching]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
          <Scale className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">
            {t("licensingManager")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage sync clearances, licensing agreements, and fee adjustments
          </p>
        </div>
        {isAdmin && (
          <Badge className="ml-auto bg-primary/15 text-primary border-primary/30 text-xs">
            Admin
          </Badge>
        )}
      </div>

      {checkingAdmin ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="licenses" className="space-y-4">
          <TabsList className="bg-muted/20 border border-border/50">
            <TabsTrigger value="licenses" data-ocid="licensing.tab">
              {t("licensesTab")}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="adjustments" data-ocid="licensing.tab">
                {t("adjustmentsTab")}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="licenses">
            <LicensesTab isAdmin={isAdmin} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="adjustments">
              <AdjustmentsTab />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
