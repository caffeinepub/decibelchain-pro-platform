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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Briefcase, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useTranslation } from "../i18n";

// ── Local types ───────────────────────────────────────────────────────────
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

interface FinancingOffer {
  id: string;
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

function getDealStructureLabel(ds: DealStructure): string {
  if ("standard" in ds) return "standard";
  if ("newWaysNow" in ds) return "newWaysNow";
  if ("cooperative" in ds) return "cooperative";
  return "unknown";
}

function getCommitmentStatusLabel(s: CommitmentStatus): string {
  if ("pending" in s) return "pending";
  if ("confirmed" in s) return "confirmed";
  if ("cancelled" in s) return "cancelled";
  if ("refunded" in s) return "refunded";
  return "unknown";
}

function bpsToPercent(bps: bigint): string {
  return `${(Number(bps) / 100).toFixed(2)}%`;
}

function centsToUsd(cents: bigint): string {
  return `$${(Number(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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

// ── Commit to Offer Dialog ────────────────────────────────────────────────
function CommitDialog({
  offer,
  onCommitted,
}: {
  offer: FinancingOffer;
  onCommitted: () => void;
}) {
  const { t } = useTranslation();
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amountDollars, setAmountDollars] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const minDollars = Number(offer.minCommitmentCents) / 100;
  const maxDollars = Number(offer.maxCommitmentCents) / 100;
  const enteredAmount = Number.parseFloat(amountDollars || "0");
  const validAmount =
    enteredAmount >= minDollars &&
    (maxDollars === 0 || enteredAmount <= maxDollars);

  async function handleCommit() {
    if (!actor) return;
    setSaving(true);
    try {
      await (actor as any).commitToOffer(
        offer.id,
        BigInt(Math.round(enteredAmount * 100)),
        offer.currency || "USD",
        notes,
      );
      toast.success("Commitment submitted!");
      setOpen(false);
      setConfirmed(false);
      setAmountDollars("");
      setNotes("");
      onCommitted();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to commit");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-1 text-xs"
        data-ocid="portfolio.open_modal_button"
      >
        <Briefcase className="w-3 h-3" />
        {t("commitToOffer")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setConfirmed(false);
        }}
      >
        <DialogContent data-ocid="portfolio.dialog">
          <DialogHeader>
            <DialogTitle>
              {confirmed ? t("confirmAction") : t("commitToOffer")} —{" "}
              {offer.title}
            </DialogTitle>
          </DialogHeader>
          {!confirmed ? (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-md bg-muted/30 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">
                    {t("dealStructure")}:{" "}
                  </span>
                  <DealBadge deal={offer.dealStructure} />
                </p>
                <p>
                  <span className="text-muted-foreground">
                    {t("offerPercent")}:{" "}
                  </span>
                  <span className="font-mono">
                    {bpsToPercent(offer.offerPercentBps)}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">
                    {t("revenueShare")}:{" "}
                  </span>
                  <span className="font-mono">
                    {bpsToPercent(offer.revenueShareBps)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Range: {centsToUsd(offer.minCommitmentCents)} –{" "}
                  {maxDollars > 0
                    ? centsToUsd(offer.maxCommitmentCents)
                    : "no max"}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>{t("totalCommitted")} ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={minDollars}
                  max={maxDollars > 0 ? maxDollars : undefined}
                  value={amountDollars}
                  onChange={(e) => setAmountDollars(e.target.value)}
                  placeholder={`Min: $${minDollars}`}
                  data-ocid="portfolio.input"
                />
                {amountDollars && !validAmount && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="portfolio.error_state"
                  >
                    Amount must be between{" "}
                    {centsToUsd(offer.minCommitmentCents)}{" "}
                    {maxDollars > 0
                      ? `and ${centsToUsd(offer.maxCommitmentCents)}`
                      : "minimum"}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>{t("notes")}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  data-ocid="portfolio.textarea"
                />
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p>{t("thisActionCannotBeUndone")}</p>
                  <p>
                    Commit{" "}
                    <strong className="text-primary">
                      ${enteredAmount.toFixed(2)}
                    </strong>{" "}
                    to <strong>{offer.title}</strong>?
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => (confirmed ? setConfirmed(false) : setOpen(false))}
              data-ocid="portfolio.cancel_button"
            >
              {confirmed ? t("back") : t("cancel")}
            </Button>
            <Button
              onClick={() =>
                confirmed ? handleCommit() : validAmount && setConfirmed(true)
              }
              disabled={saving || (!confirmed && !validAmount)}
              data-ocid="portfolio.confirm_button"
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

// ── Main Component ────────────────────────────────────────────────────────
export function InvestmentPortfolio() {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();

  const { data: myCommitments = [], isLoading: loadingCommitments } = useQuery<
    InvestorCommitment[]
  >({
    queryKey: ["myCommitments"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listMyCommitments();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: openOffers = [], isLoading: loadingOffers } = useQuery<
    FinancingOffer[]
  >({
    queryKey: ["openFinancingOffers"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listOpenFinancingOffers();
    },
    enabled: !!actor && !isFetching,
  });

  function refetchAll() {
    qc.invalidateQueries({ queryKey: ["myCommitments"] });
    qc.invalidateQueries({ queryKey: ["openFinancingOffers"] });
  }

  const totalCommitted = myCommitments.reduce(
    (sum, c) => sum + Number(c.commitmentAmountCents),
    0,
  );
  const activeCount = myCommitments.filter(
    (c) => "confirmed" in c.status,
  ).length;
  const confirmedCount = myCommitments.filter(
    (c) => "confirmed" in c.status,
  ).length;
  const pendingCount = myCommitments.filter(
    (c) => "pending" in c.status,
  ).length;

  const statsCards = [
    {
      label: t("totalCommitted") ?? "Total Committed",
      value: `$${(totalCommitted / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    },
    {
      label: t("activeCommitments") ?? "Active Commitments",
      value: activeCount.toString(),
    },
    {
      label: t("confirmed") ?? "Confirmed",
      value: confirmedCount.toString(),
    },
    {
      label: t("pending") ?? "Pending",
      value: pendingCount.toString(),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">
          {t("investmentPortfolio")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your FinFracFran™ investment commitments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <Card key={card.label} className="bg-card/50">
            <CardContent className="p-4">
              {loadingCommitments ? (
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

      {/* My Commitments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("activeCommitments") ?? "My Commitments"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingCommitments ? (
            <div className="p-6 space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : myCommitments.length === 0 ? (
            <div
              className="p-12 text-center text-muted-foreground"
              data-ocid="portfolio.empty_state"
            >
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No commitments yet. Browse open offers below.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("dealStructure")}</TableHead>
                    <TableHead>{t("totalCommitted")}</TableHead>
                    <TableHead>{t("currency")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("notes")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myCommitments.map((c, idx) => (
                    <TableRow
                      key={c.id}
                      data-ocid={`portfolio.item.${idx + 1}`}
                    >
                      <TableCell className="font-mono text-xs">
                        {c.offerId.slice(0, 12)}…
                      </TableCell>
                      <TableCell>—</TableCell>
                      <TableCell className="font-mono text-xs">
                        {centsToUsd(c.commitmentAmountCents)}
                      </TableCell>
                      <TableCell className="text-xs">{c.currency}</TableCell>
                      <TableCell>
                        <CommitmentBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Offers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("openOffers") ?? "Open Financing Offers"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingOffers ? (
            <div className="p-6 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : openOffers.length === 0 ? (
            <div
              className="p-12 text-center text-muted-foreground"
              data-ocid="portfolio.empty_state"
            >
              <p>No open offers available at this time.</p>
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
                    <TableHead>{t("deadline")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openOffers.map((offer, idx) => (
                    <TableRow
                      key={offer.id}
                      data-ocid={`portfolio.item.${idx + 1}`}
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
                      <TableCell className="text-xs">
                        {offer.deadline}
                      </TableCell>
                      <TableCell>
                        <CommitDialog offer={offer} onCommitted={refetchAll} />
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
