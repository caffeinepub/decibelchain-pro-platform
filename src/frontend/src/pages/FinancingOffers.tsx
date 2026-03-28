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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  SlidersHorizontal,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useAllWorks, useOrganizations } from "../hooks/useQueries";
import { useTranslation } from "../i18n";

// ── Local types (variant-object style matching ICP Candid) ────────────────
type DealStructure =
  | { standard: null }
  | { newWaysNow: null }
  | { cooperative: null };
type OfferStatus =
  | { draft: null }
  | { open: null }
  | { funded: null }
  | { closed: null };
type CommitmentStatus =
  | { pending: null }
  | { confirmed: null }
  | { cancelled: null }
  | { refunded: null };
type FinancingAdjStatus =
  | { pending: null }
  | { approved: null }
  | { rejected: null };
type FinancingAdjEntityType = { financingOffer: null } | { commitment: null };
type FinancingAdjFieldName =
  | { offerPercentBps: null }
  | { targetAmountCents: null }
  | { revenueShareBps: null }
  | { commitmentAmountCents: null };

interface FinancingOffer {
  id: string;
  workId: string;
  orgId: string;
  title: string;
  description: string;
  offerPercentBps: bigint;
  targetAmountCents: bigint;
  currency: string;
  deadline: string;
  minCommitmentCents: bigint;
  maxCommitmentCents: bigint;
  revenueShareBps: bigint;
  dealStructure: DealStructure;
  status: OfferStatus;
  createdBy: string;
  createdAt: bigint;
  updatedAt: bigint;
}

interface InvestorCommitment {
  id: string;
  offerId: string;
  investorId: string;
  commitmentAmountCents: bigint;
  currency: string;
  status: CommitmentStatus;
  notes: string;
  confirmedAt: bigint;
  createdAt: bigint;
}

interface FinancingAdjustment {
  id: string;
  entityType: FinancingAdjEntityType;
  entityId: string;
  fieldName: FinancingAdjFieldName;
  oldValue: bigint;
  proposedValue: bigint;
  reason: string;
  requestedBy: string;
  requestedAt: bigint;
  status: FinancingAdjStatus;
  reviewedBy: string;
  reviewedAt: bigint;
  reviewNotes: string;
}

interface FinancingStats {
  totalOffersCount: bigint;
  openOffersCount: bigint;
  totalTargetAmountCents: bigint;
  totalCommittedAmountCents: bigint;
  fundedOffersCount: bigint;
}

// ── Helpers ──────────────────────────────────────────────────────────────
function getDealStructureLabel(ds: DealStructure): string {
  if ("standard" in ds) return "standard";
  if ("newWaysNow" in ds) return "newWaysNow";
  if ("cooperative" in ds) return "cooperative";
  return "unknown";
}

function getOfferStatusLabel(s: OfferStatus): string {
  if ("draft" in s) return "draft";
  if ("open" in s) return "open";
  if ("funded" in s) return "funded";
  if ("closed" in s) return "closed";
  return "unknown";
}

function getCommitmentStatusLabel(s: CommitmentStatus): string {
  if ("pending" in s) return "pending";
  if ("confirmed" in s) return "confirmed";
  if ("cancelled" in s) return "cancelled";
  if ("refunded" in s) return "refunded";
  return "unknown";
}

function getAdjStatusLabel(s: FinancingAdjStatus): string {
  if ("pending" in s) return "pending";
  if ("approved" in s) return "approved";
  if ("rejected" in s) return "rejected";
  return "unknown";
}

function getAdjFieldLabel(f: FinancingAdjFieldName): string {
  if ("offerPercentBps" in f) return "offerPercentBps";
  if ("targetAmountCents" in f) return "targetAmountCents";
  if ("revenueShareBps" in f) return "revenueShareBps";
  if ("commitmentAmountCents" in f) return "commitmentAmountCents";
  return "unknown";
}

function formatAdjValue(f: FinancingAdjFieldName, v: bigint): string {
  if ("offerPercentBps" in f || "revenueShareBps" in f)
    return `${(Number(v) / 100).toFixed(2)}%`;
  return `$${(Number(v) / 100).toFixed(2)}`;
}

function bpsToPercent(bps: bigint): string {
  return `${(Number(bps) / 100).toFixed(2)}%`;
}

function centsToUsd(cents: bigint): string {
  return `$${(Number(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dealStructureToVariant(s: string): DealStructure {
  if (s === "newWaysNow") return { newWaysNow: null };
  if (s === "cooperative") return { cooperative: null };
  return { standard: null };
}

function offerStatusToVariant(s: string): OfferStatus {
  if (s === "open") return { open: null };
  if (s === "funded") return { funded: null };
  if (s === "closed") return { closed: null };
  return { draft: null };
}

// ── Badge components ──────────────────────────────────────────────────────
function DealBadge({ deal }: { deal: DealStructure }) {
  const label = getDealStructureLabel(deal);
  const cls: Record<string, string> = {
    standard: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    newWaysNow: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    cooperative: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  const display: Record<string, string> = {
    standard: "Standard",
    newWaysNow: "NewWaysNow™",
    cooperative: "Cooperative",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls[label] ?? cls.standard}`}
    >
      {display[label] ?? label}
    </span>
  );
}

function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const label = getOfferStatusLabel(status);
  const cls: Record<string, string> = {
    draft: "bg-muted/40 text-muted-foreground border-border",
    open: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    funded: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    closed: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls[label] ?? cls.draft}`}
    >
      {label}
    </span>
  );
}

function CommitmentBadge({ status }: { status: CommitmentStatus }) {
  const label = getCommitmentStatusLabel(status);
  const cls: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    cancelled: "bg-destructive/15 text-destructive border-destructive/30",
    refunded: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls[label] ?? cls.pending}`}
    >
      {label}
    </span>
  );
}

function AdjStatusBadge({ status }: { status: FinancingAdjStatus }) {
  const label = getAdjStatusLabel(status);
  const cls: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    rejected: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls[label] ?? cls.pending}`}
    >
      {label}
    </span>
  );
}

// ── Create Offer Dialog ───────────────────────────────────────────────────
function CreateOfferDialog({
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
    title: "",
    description: "",
    workId: "",
    dealStructure: "standard",
    offerPercent: "",
    targetAmountDollars: "",
    currency: "USD",
    revenueSharePercent: "",
    deadline: "",
    minCommitmentDollars: "",
    maxCommitmentDollars: "",
  });

  async function handleSubmit() {
    if (!actor || !form.title || !form.workId || !form.deadline) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      await (actor as any).createFinancingOffer(
        form.workId,
        orgId,
        form.title,
        form.description,
        BigInt(Math.round(Number.parseFloat(form.offerPercent || "0") * 100)),
        BigInt(
          Math.round(Number.parseFloat(form.targetAmountDollars || "0") * 100),
        ),
        form.currency || "USD",
        form.deadline,
        BigInt(
          Math.round(Number.parseFloat(form.minCommitmentDollars || "0") * 100),
        ),
        BigInt(
          Math.round(Number.parseFloat(form.maxCommitmentDollars || "0") * 100),
        ),
        BigInt(
          Math.round(Number.parseFloat(form.revenueSharePercent || "0") * 100),
        ),
        dealStructureToVariant(form.dealStructure),
      );
      toast.success("Financing offer created");
      setOpen(false);
      setForm({
        title: "",
        description: "",
        workId: "",
        dealStructure: "standard",
        offerPercent: "",
        targetAmountDollars: "",
        currency: "USD",
        revenueSharePercent: "",
        deadline: "",
        minCommitmentDollars: "",
        maxCommitmentDollars: "",
      });
      onCreated();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create offer");
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
        data-ocid="financing.open_modal_button"
      >
        <Plus className="w-4 h-4" />
        {t("createFinancingOffer")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="financing.dialog"
        >
          <DialogHeader>
            <DialogTitle>{t("createFinancingOffer")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("workTitle")} *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Offer title"
                data-ocid="financing.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("description")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={2}
                data-ocid="financing.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("selectWork")} *</Label>
              <Select
                value={form.workId}
                onValueChange={(v) => setForm((p) => ({ ...p, workId: v }))}
              >
                <SelectTrigger data-ocid="financing.select">
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
              <Label>{t("dealStructure")} *</Label>
              <Select
                value={form.dealStructure}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, dealStructure: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">{t("standard")}</SelectItem>
                  <SelectItem value="newWaysNow">{t("newWaysNow")}</SelectItem>
                  <SelectItem value="cooperative">
                    {t("cooperative")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("offerPercent")} (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.offerPercent}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, offerPercent: e.target.value }))
                  }
                  placeholder="10.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("revenueShare")} (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.revenueSharePercent}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      revenueSharePercent: e.target.value,
                    }))
                  }
                  placeholder="5.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("targetAmount")} ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.targetAmountDollars}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      targetAmountDollars: e.target.value,
                    }))
                  }
                  placeholder="50000.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("currency")}</Label>
                <Input
                  value={form.currency}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, currency: e.target.value }))
                  }
                  placeholder="USD"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("minCommitment")} ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.minCommitmentDollars}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      minCommitmentDollars: e.target.value,
                    }))
                  }
                  placeholder="500.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("maxCommitment")} ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.maxCommitmentDollars}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      maxCommitmentDollars: e.target.value,
                    }))
                  }
                  placeholder="10000.00"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("deadline")} *</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm((p) => ({ ...p, deadline: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="financing.cancel_button"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              data-ocid="financing.submit_button"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Propose Adjustment Dialog ─────────────────────────────────────────────
function ProposeAdjustmentDialog({
  offer,
  onProposed,
}: {
  offer: FinancingOffer;
  onProposed: () => void;
}) {
  const { t } = useTranslation();
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldName, setFieldName] = useState("offerPercentBps");
  const [proposedValue, setProposedValue] = useState("");
  const [reason, setReason] = useState("");

  function getCurrentValue(): bigint {
    if (fieldName === "offerPercentBps") return offer.offerPercentBps;
    if (fieldName === "targetAmountCents") return offer.targetAmountCents;
    if (fieldName === "revenueShareBps") return offer.revenueShareBps;
    return 0n;
  }

  function getFieldVariant(): FinancingAdjFieldName {
    if (fieldName === "targetAmountCents") return { targetAmountCents: null };
    if (fieldName === "revenueShareBps") return { revenueShareBps: null };
    return { offerPercentBps: null };
  }

  function getProposedBigInt(): bigint {
    const v = Number.parseFloat(proposedValue || "0");
    if (fieldName === "targetAmountCents") return BigInt(Math.round(v * 100)); // dollars to cents
    return BigInt(Math.round(v * 100)); // percent to bps
  }

  async function handleSubmit() {
    if (!actor || !proposedValue || !reason) {
      toast.error("Please fill all fields");
      return;
    }
    setSaving(true);
    try {
      await (actor as any).proposeFinancingAdjustment(
        { financingOffer: null } as FinancingAdjEntityType,
        offer.id,
        getFieldVariant(),
        getCurrentValue(),
        getProposedBigInt(),
        reason,
      );
      toast.success("Adjustment proposed");
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
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1 text-xs"
        data-ocid="financing.open_modal_button"
      >
        <SlidersHorizontal className="w-3 h-3" />
        {t("proposeAdjustment")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-ocid="financing.dialog">
          <DialogHeader>
            <DialogTitle>
              {t("proposeAdjustment")} — {offer.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("fieldName")}</Label>
              <Select value={fieldName} onValueChange={setFieldName}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offerPercentBps">Offer % (bps)</SelectItem>
                  <SelectItem value="targetAmountCents">
                    Target Amount ($)
                  </SelectItem>
                  <SelectItem value="revenueShareBps">
                    Revenue Share % (bps)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-md bg-muted/30 text-sm">
              <span className="text-muted-foreground">{t("oldValue")}: </span>
              <span className="font-mono font-medium">
                {fieldName === "targetAmountCents"
                  ? centsToUsd(getCurrentValue())
                  : bpsToPercent(getCurrentValue())}
              </span>
            </div>
            <div className="space-y-1.5">
              <Label>
                {t("proposedValue")}{" "}
                {fieldName === "targetAmountCents" ? "($)" : "(%)"}
              </Label>
              <Input
                type="number"
                step="0.01"
                value={proposedValue}
                onChange={(e) => setProposedValue(e.target.value)}
                placeholder="New value"
                data-ocid="financing.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("reason")} *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Reason for adjustment..."
                data-ocid="financing.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="financing.cancel_button"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              data-ocid="financing.submit_button"
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

// ── Status Change Confirmation Dialog ─────────────────────────────────────
function ChangeStatusDialog({
  offer,
  onChanged,
}: {
  offer: FinancingOffer;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState("open");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  async function handleConfirm() {
    if (!actor) return;
    setSaving(true);
    try {
      await (actor as any).updateFinancingOfferStatus(
        offer.id,
        offerStatusToVariant(newStatus),
        notes,
      );
      toast.success("Offer status updated");
      setOpen(false);
      setConfirmed(false);
      setNotes("");
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs gap-1"
        data-ocid="financing.edit_button"
      >
        {t("status")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setConfirmed(false);
        }}
      >
        <DialogContent data-ocid="financing.dialog">
          <DialogHeader>
            <DialogTitle>
              {confirmed ? t("confirmAction") : t("status")} — {offer.title}
            </DialogTitle>
          </DialogHeader>
          {!confirmed ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>{t("status")}</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger data-ocid="financing.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t("draft")}</SelectItem>
                    <SelectItem value="open">{t("open")}</SelectItem>
                    <SelectItem value="funded">{t("funded")}</SelectItem>
                    <SelectItem value="closed">{t("closed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("notes")}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  data-ocid="financing.textarea"
                />
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <p className="text-sm">
                  {t("thisActionCannotBeUndone")} Change status to{" "}
                  <strong>{newStatus}</strong>?
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => (confirmed ? setConfirmed(false) : setOpen(false))}
              data-ocid="financing.cancel_button"
            >
              {confirmed ? t("back") : t("cancel")}
            </Button>
            <Button
              onClick={() => (confirmed ? handleConfirm() : setConfirmed(true))}
              disabled={saving}
              data-ocid="financing.confirm_button"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {confirmed ? t("confirmAction") : (t("next") ?? "Next")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Commitments Expandable Panel ──────────────────────────────────────────
function CommitmentsPanel({
  offer,
  isAdmin,
  onUpdated,
}: {
  offer: FinancingOffer;
  isAdmin: boolean;
  onUpdated: () => void;
}) {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();
  const [expanded, setExpanded] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmStatus, setConfirmStatus] = useState("");
  const [confirmNotes, setConfirmNotes] = useState("");

  const { data: commitments = [], refetch } = useQuery<InvestorCommitment[]>({
    queryKey: ["commitments", offer.id],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listCommitmentsByOffer(offer.id);
    },
    enabled: !!actor && !isFetching && expanded,
  });

  async function handleUpdateStatus() {
    if (!actor || !confirmId) return;
    setUpdatingId(confirmId);
    try {
      const statusVariant: CommitmentStatus =
        confirmStatus === "confirmed"
          ? { confirmed: null }
          : confirmStatus === "cancelled"
            ? { cancelled: null }
            : confirmStatus === "refunded"
              ? { refunded: null }
              : { pending: null };
      await (actor as any).updateCommitmentStatus(
        confirmId,
        statusVariant,
        confirmNotes,
      );
      toast.success("Commitment status updated");
      setConfirmId(null);
      setConfirmNotes("");
      refetch();
      onUpdated();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update commitment");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        data-ocid="financing.toggle"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        {t("commitToOffer")}
      </button>
      {expanded && (
        <div className="mt-2 pl-4 space-y-2">
          {commitments.length === 0 ? (
            <p
              className="text-xs text-muted-foreground"
              data-ocid="financing.empty_state"
            >
              No commitments yet
            </p>
          ) : (
            commitments.map((c, idx) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-border/30"
                data-ocid={`financing.item.${idx + 1}`}
              >
                <div className="text-xs space-y-0.5">
                  <p className="font-mono">{c.investorId.slice(0, 16)}…</p>
                  <p>{centsToUsd(c.commitmentAmountCents)}</p>
                  <CommitmentBadge status={c.status} />
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    {confirmId === c.id ? (
                      <div className="flex gap-1 items-center">
                        <Input
                          className="h-6 text-xs w-24"
                          placeholder="Notes"
                          value={confirmNotes}
                          onChange={(e) => setConfirmNotes(e.target.value)}
                        />
                        <Button
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={handleUpdateStatus}
                          disabled={!!updatingId}
                          data-ocid="financing.confirm_button"
                        >
                          {updatingId === c.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs px-2"
                          onClick={() => setConfirmId(null)}
                          data-ocid="financing.cancel_button"
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() => {
                            setConfirmId(c.id);
                            setConfirmStatus("confirmed");
                          }}
                          data-ocid="financing.edit_button"
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs px-2 text-destructive"
                          onClick={() => {
                            setConfirmId(c.id);
                            setConfirmStatus("cancelled");
                          }}
                          data-ocid="financing.delete_button"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Adjustments Tab ───────────────────────────────────────────────────────
function AdjustmentsTab() {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject">(
    "approve",
  );
  const [processing, setProcessing] = useState(false);

  const { data: pending = [], isLoading: loadingPending } = useQuery<
    FinancingAdjustment[]
  >({
    queryKey: ["financingAdjustments", "pending"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listPendingFinancingAdjustments();
    },
    enabled: !!actor && !isFetching,
  });

  async function handleAction() {
    if (!actor || !confirmingId) return;
    setProcessing(true);
    try {
      const notes = reviewNotes[confirmingId] ?? "";
      if (confirmAction === "approve") {
        await (actor as any).approveFinancingAdjustment(confirmingId, notes);
        toast.success("Adjustment approved");
      } else {
        await (actor as any).rejectFinancingAdjustment(confirmingId, notes);
        toast.success("Adjustment rejected");
      }
      setConfirmingId(null);
      qc.invalidateQueries({ queryKey: ["financingAdjustments"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    } finally {
      setProcessing(false);
    }
  }

  const pendingList = pending.filter((a) => "pending" in a.status);
  const historyList = pending.filter((a) => !("pending" in a.status));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            {t("pendingAdjustments")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPending ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : pendingList.length === 0 ? (
            <p
              className="text-sm text-muted-foreground"
              data-ocid="financing.empty_state"
            >
              {t("noAdjustments")}
            </p>
          ) : (
            <div className="space-y-3">
              {pendingList.map((adj, idx) => (
                <div
                  key={adj.id}
                  className="p-4 rounded-lg border border-border/50 bg-card/50 space-y-3"
                  data-ocid={`financing.item.${idx + 1}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary">
                          {getAdjFieldLabel(adj.fieldName)}
                        </span>
                        <AdjStatusBadge status={adj.status} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("oldValue")}:{" "}
                        <span className="font-mono">
                          {formatAdjValue(adj.fieldName, adj.oldValue)}
                        </span>{" "}
                        → {t("proposedValue")}:{" "}
                        <span className="font-mono text-primary">
                          {formatAdjValue(adj.fieldName, adj.proposedValue)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("reason")}: {adj.reason}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("requestedBy")}: {adj.requestedBy.slice(0, 16)}…
                      </p>
                    </div>
                  </div>
                  {confirmingId === adj.id ? (
                    <div className="space-y-2">
                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs">
                        <AlertTriangle className="inline w-3 h-3 mr-1 text-amber-400" />
                        {t("thisActionCannotBeUndone")}{" "}
                        {confirmAction === "approve"
                          ? t("approveAdjustment")
                          : t("rejectAdjustment")}
                        ?
                      </div>
                      <Textarea
                        placeholder={t("reviewNotes")}
                        rows={2}
                        value={reviewNotes[adj.id] ?? ""}
                        onChange={(e) =>
                          setReviewNotes((p) => ({
                            ...p,
                            [adj.id]: e.target.value,
                          }))
                        }
                        data-ocid="financing.textarea"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleAction}
                          disabled={processing}
                          className="gap-1"
                          data-ocid="financing.confirm_button"
                        >
                          {processing && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                          {confirmAction === "approve"
                            ? t("approveAdjustment")
                            : t("rejectAdjustment")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmingId(null)}
                          data-ocid="financing.cancel_button"
                        >
                          {t("cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          setConfirmingId(adj.id);
                          setConfirmAction("approve");
                        }}
                        data-ocid="financing.primary_button"
                      >
                        <CheckCircle className="w-3 h-3" />
                        {t("approveAdjustment")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive"
                        onClick={() => {
                          setConfirmingId(adj.id);
                          setConfirmAction("reject");
                        }}
                        data-ocid="financing.secondary_button"
                      >
                        <XCircle className="w-3 h-3" />
                        {t("rejectAdjustment")}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {historyList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("adjustmentHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {historyList.map((adj, idx) => (
                <div
                  key={adj.id}
                  className="flex flex-wrap items-center justify-between p-3 rounded-md bg-muted/20 border border-border/30 gap-2"
                  data-ocid={`financing.row.${idx + 1}`}
                >
                  <div className="text-xs space-y-0.5">
                    <span className="font-medium">
                      {getAdjFieldLabel(adj.fieldName)}
                    </span>
                    <p className="text-muted-foreground">
                      {formatAdjValue(adj.fieldName, adj.oldValue)} →{" "}
                      {formatAdjValue(adj.fieldName, adj.proposedValue)}
                    </p>
                  </div>
                  <AdjStatusBadge status={adj.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export function FinancingOffers() {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();
  const { data: orgs = [] } = useOrganizations();
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (actor && !isFetching) {
      (actor as any)
        .isCallerAdmin()
        .then(setIsAdmin)
        .catch(() => {});
    }
  }, [actor, isFetching]);

  const orgId = selectedOrgId || orgs[0]?.id || "";

  const { data: stats, isLoading: loadingStats } = useQuery<FinancingStats>({
    queryKey: ["financingStats", orgId],
    queryFn: async () => {
      if (!actor || !orgId) return null;
      return (actor as any).getFinancingStats(orgId);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });

  const {
    data: offers = [],
    isLoading: loadingOffers,
    refetch: refetchOffers,
  } = useQuery<FinancingOffer[]>({
    queryKey: ["financingOffers", orgId],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      return (actor as any).listFinancingOffersByOrg(orgId);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });

  function refetchAll() {
    refetchOffers();
    qc.invalidateQueries({ queryKey: ["financingStats", orgId] });
  }

  const statsCards = [
    {
      label: t("totalOffers") ?? "Total Offers",
      value: stats ? Number(stats.totalOffersCount).toString() : "—",
      icon: TrendingUp,
    },
    {
      label: t("openOffers") ?? "Open Offers",
      value: stats ? Number(stats.openOffersCount).toString() : "—",
      icon: TrendingUp,
    },
    {
      label: t("totalTarget") ?? "Total Target",
      value: stats ? centsToUsd(stats.totalTargetAmountCents) : "—",
      icon: TrendingUp,
    },
    {
      label: t("totalCommitted") ?? "Total Committed",
      value: stats ? centsToUsd(stats.totalCommittedAmountCents) : "—",
      icon: TrendingUp,
    },
    {
      label: t("fundedOffers") ?? "Funded Offers",
      value: stats ? Number(stats.fundedOffersCount).toString() : "—",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">
            {t("financingOffers")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            FinFracFran™ Cooperative Financing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={orgId} onValueChange={setSelectedOrgId}>
            <SelectTrigger className="w-48" data-ocid="financing.select">
              <SelectValue placeholder={t("selectOrg")} />
            </SelectTrigger>
            <SelectContent>
              {orgs.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && orgId && (
            <CreateOfferDialog orgId={orgId} onCreated={refetchAll} />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statsCards.map((card) => (
          <Card key={card.label} className="bg-card/50">
            <CardContent className="p-4">
              {loadingStats ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-1">
                    {card.label}
                  </p>
                  <p className="text-xl font-bold text-primary">{card.value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="offers">
        <TabsList data-ocid="financing.tab">
          <TabsTrigger value="offers">{t("offersTab") ?? "Offers"}</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="adjustments">{t("adjustmentsTab")}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="offers" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loadingOffers ? (
                <div className="p-6 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : offers.length === 0 ? (
                <div
                  className="p-12 text-center text-muted-foreground"
                  data-ocid="financing.empty_state"
                >
                  <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>{t("noOffers") ?? "No financing offers yet"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("name")}</TableHead>
                        <TableHead>{t("dealStructure")}</TableHead>
                        <TableHead>{t("offerPercent")}</TableHead>
                        <TableHead>{t("targetAmount")}</TableHead>
                        <TableHead>{t("revenueShare")}</TableHead>
                        <TableHead>{t("status")}</TableHead>
                        <TableHead>{t("deadline")}</TableHead>
                        <TableHead>{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offers.map((offer, idx) => (
                        <TableRow
                          key={offer.id}
                          data-ocid={`financing.item.${idx + 1}`}
                        >
                          <TableCell className="font-medium">
                            {offer.title}
                          </TableCell>
                          <TableCell>
                            <DealBadge deal={offer.dealStructure} />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {bpsToPercent(offer.offerPercentBps)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {centsToUsd(offer.targetAmountCents)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {bpsToPercent(offer.revenueShareBps)}
                          </TableCell>
                          <TableCell>
                            <OfferStatusBadge status={offer.status} />
                          </TableCell>
                          <TableCell className="text-xs">
                            {offer.deadline}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <CommitmentsPanel
                                offer={offer}
                                isAdmin={isAdmin}
                                onUpdated={refetchAll}
                              />
                              {isAdmin && (
                                <>
                                  <ChangeStatusDialog
                                    offer={offer}
                                    onChanged={refetchAll}
                                  />
                                  <ProposeAdjustmentDialog
                                    offer={offer}
                                    onProposed={() =>
                                      qc.invalidateQueries({
                                        queryKey: ["financingAdjustments"],
                                      })
                                    }
                                  />
                                </>
                              )}
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
        </TabsContent>

        {isAdmin && (
          <TabsContent value="adjustments" className="mt-4">
            <AdjustmentsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
