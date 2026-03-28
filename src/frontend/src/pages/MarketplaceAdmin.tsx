import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { useActor } from "@/hooks/useActor";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  ShieldCheck,
  Store,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type LicenseRequest = {
  id: string;
  listingId: string;
  listingTitle: string;
  requestorPrincipal: { toString(): string };
  requestorName: string;
  intendedUse: string;
  territory: string;
  duration: string;
  offeredTerms: string;
  contactInfo: string;
  status: string;
  counterOffer: string;
  createdAt: bigint;
  updatedAt: bigint;
};

type MarketplaceApprovalProposal = {
  id: string;
  requestId: string;
  requestTitle: string;
  listingId: string;
  proposedBy: string;
  proposedAt: bigint;
  reason: string;
  status: string;
  confirmedBy: string;
  confirmedAt: bigint;
};

function formatBigIntDate(ts: bigint): string {
  if (!ts || ts === 0n) return "—";
  return new Date(Number(ts / 1_000_000n)).toLocaleString();
}

function truncatePrincipal(p: string): string {
  if (!p || p.length <= 16) return p || "—";
  return `${p.slice(0, 8)}…${p.slice(-6)}`;
}

export function MarketplaceAdmin() {
  const { actor, isFetching } = useActor();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [callerPrincipal, setCallerPrincipal] = useState("");

  const [allRequests, setAllRequests] = useState<LicenseRequest[]>([]);
  const [proposals, setProposals] = useState<MarketplaceApprovalProposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Propose approval dialog
  const [proposeOpen, setProposeOpen] = useState(false);
  const [proposeTarget, setProposeTarget] = useState<LicenseRequest | null>(
    null,
  );
  const [proposeReason, setProposeReason] = useState("");
  const [isProposing, setIsProposing] = useState(false);

  // Reject dialog
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<LicenseRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Confirm approval dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] =
    useState<MarketplaceApprovalProposal | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const loadData = useCallback(async () => {
    if (!actor) return;
    setIsLoading(true);
    try {
      const [requestsResult, proposalsResult] = await Promise.all([
        (actor as any).listAllLicenseRequests(),
        (actor as any).listApprovalProposals(),
      ]);
      setAllRequests(requestsResult || []);
      setProposals(proposalsResult || []);
    } catch {
      toast.error("Failed to load marketplace admin data");
    } finally {
      setIsLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (!actor || isFetching) return;
    (async () => {
      try {
        const [adminCheck, profile] = await Promise.all([
          (actor as any).isCallerAdmin(),
          (actor as any).getMyProfile
            ? (actor as any).getMyProfile()
            : Promise.resolve(null),
        ]);
        setIsAdmin(Boolean(adminCheck));
        if (profile?.[0]?.principalId)
          setCallerPrincipal(profile[0].principalId);
      } catch {
        /* ignore */
      } finally {
        setIsCheckingAdmin(false);
      }
    })();
  }, [actor, isFetching]);

  useEffect(() => {
    if (isAdmin && actor) loadData();
  }, [isAdmin, actor, loadData]);

  async function handleProposeApproval() {
    if (!actor || !proposeTarget || !proposeReason.trim()) return;
    setIsProposing(true);
    try {
      const result = await (actor as any).proposeApprovalForRequest(
        proposeTarget.id,
        proposeReason.trim(),
      );
      if (result.__kind__ === "ok") {
        toast.success(
          "Approval proposal submitted — awaiting second admin confirmation.",
        );
        setProposeOpen(false);
        setProposeTarget(null);
        setProposeReason("");
        await loadData();
      } else {
        toast.error(result.err || "Failed to propose approval");
      }
    } catch {
      toast.error("Failed to propose approval");
    } finally {
      setIsProposing(false);
    }
  }

  async function handleReject() {
    if (!actor || !rejectTarget || !rejectReason.trim()) return;
    setIsRejecting(true);
    try {
      const result = await (actor as any).adminRejectMarketplaceRequest(
        rejectTarget.id,
        rejectReason.trim(),
      );
      if (result.__kind__ === "ok") {
        toast.success("Request rejected.");
        setRejectOpen(false);
        setRejectTarget(null);
        setRejectReason("");
        await loadData();
      } else {
        toast.error(result.err || "Failed to reject request");
      }
    } catch {
      toast.error("Failed to reject request");
    } finally {
      setIsRejecting(false);
    }
  }

  async function handleConfirmApproval() {
    if (!actor || !confirmTarget) return;
    setIsConfirming(true);
    try {
      const result = await (actor as any).confirmApprovalForRequest(
        confirmTarget.id,
      );
      if (result.__kind__ === "ok") {
        toast.success("License created in Registry and listing closed.");
        setConfirmOpen(false);
        setConfirmTarget(null);
        await loadData();
      } else {
        toast.error(result.err || "Failed to confirm approval");
      }
    } catch {
      toast.error("Failed to confirm approval");
    } finally {
      setIsConfirming(false);
    }
  }

  if (isCheckingAdmin) {
    return (
      <div
        className="flex items-center justify-center h-64"
        data-ocid="marketplace_admin.loading_state"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 gap-4"
        data-ocid="marketplace_admin.error_state"
      >
        <Lock className="h-16 w-16 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Admin access required</p>
      </div>
    );
  }

  const pendingProposals = proposals.filter((p) => p.status === "pending");
  const pendingRequestIds = new Set(pendingProposals.map((p) => p.requestId));
  // Requests with status "accepted" that don't yet have a pending proposal
  const awaitingApproval = allRequests.filter(
    (r) => r.status === "accepted" && !pendingRequestIds.has(r.id),
  );
  const confirmedProposals = proposals.filter((p) => p.status === "confirmed");
  const rejectedRequests = allRequests.filter(
    (r) => r.status === "admin_rejected",
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Store className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Marketplace Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Review license requests, approve two-admin workflow, and manage
            License Registry conversions
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              Awaiting Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {awaitingApproval.length + pendingProposals.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              Converted to Licenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {confirmedProposals.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {rejectedRequests.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending" data-ocid="marketplace_admin.tab">
            Pending Approvals
            {awaitingApproval.length + pendingProposals.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {awaitingApproval.length + pendingProposals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" data-ocid="marketplace_admin.tab">
            Conversion History
          </TabsTrigger>
          <TabsTrigger value="rejections" data-ocid="marketplace_admin.tab">
            Rejection Log
          </TabsTrigger>
        </TabsList>

        {/* Pending Approvals Tab */}
        <TabsContent value="pending">
          {isLoading ? (
            <div
              className="flex items-center justify-center h-32"
              data-ocid="marketplace_admin.loading_state"
            >
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : awaitingApproval.length === 0 && pendingProposals.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-40 gap-2"
              data-ocid="marketplace_admin.empty_state"
            >
              <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                No requests pending approval.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Awaiting first admin action */}
              {awaitingApproval.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    Ready for Approval Proposal
                  </h3>
                  <div
                    className="rounded-lg border border-border overflow-hidden"
                    data-ocid="marketplace_admin.table"
                  >
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Listing Title</TableHead>
                          <TableHead>Requestor</TableHead>
                          <TableHead>Intended Use</TableHead>
                          <TableHead>Territory</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Offered Terms</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {awaitingApproval.map((req, i) => (
                          <TableRow
                            key={req.id}
                            data-ocid={`marketplace_admin.item.${i + 1}`}
                          >
                            <TableCell className="font-medium">
                              {req.listingTitle}
                            </TableCell>
                            <TableCell className="text-sm">
                              {req.requestorName}
                            </TableCell>
                            <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                              {req.intendedUse}
                            </TableCell>
                            <TableCell className="text-sm">
                              {req.territory}
                            </TableCell>
                            <TableCell className="text-sm">
                              {req.duration}
                            </TableCell>
                            <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                              {req.offeredTerms}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatBigIntDate(req.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => {
                                    setProposeTarget(req);
                                    setProposeOpen(true);
                                  }}
                                  data-ocid={`marketplace_admin.primary_button.${i + 1}`}
                                >
                                  <ShieldCheck className="h-3 w-3" />
                                  Propose Approval
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive border-destructive/40 hover:bg-destructive/10 gap-1"
                                  onClick={() => {
                                    setRejectTarget(req);
                                    setRejectOpen(true);
                                  }}
                                  data-ocid={`marketplace_admin.delete_button.${i + 1}`}
                                >
                                  <XCircle className="h-3 w-3" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Pending proposals — awaiting second admin */}
              {pendingProposals.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-amber-400/80 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Awaiting Second Admin Confirmation
                  </h3>
                  <div
                    className="rounded-lg border border-amber-500/30 overflow-hidden"
                    data-ocid="marketplace_admin.table"
                  >
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-amber-500/5">
                          <TableHead>Request Title</TableHead>
                          <TableHead>Proposed By</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Proposed At</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingProposals.map((proposal, i) => {
                          const isSelf =
                            callerPrincipal !== "" &&
                            proposal.proposedBy === callerPrincipal;
                          return (
                            <TableRow
                              key={proposal.id}
                              data-ocid={`marketplace_admin.row.${i + 1}`}
                            >
                              <TableCell className="font-medium">
                                {proposal.requestTitle}
                                <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                                  Awaiting Second Admin
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {truncatePrincipal(proposal.proposedBy)}
                              </TableCell>
                              <TableCell className="max-w-xs truncate text-sm">
                                {proposal.reason}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {formatBigIntDate(proposal.proposedAt)}
                              </TableCell>
                              <TableCell className="text-right">
                                {isSelf ? (
                                  <span className="text-xs text-muted-foreground italic">
                                    You proposed this — another admin must
                                    confirm
                                  </span>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => {
                                      setConfirmTarget(proposal);
                                      setConfirmOpen(true);
                                    }}
                                    data-ocid={`marketplace_admin.confirm_button.${i + 1}`}
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Confirm &amp; Convert to License
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Conversion History Tab */}
        <TabsContent value="history">
          {isLoading ? (
            <div
              className="flex items-center justify-center h-32"
              data-ocid="marketplace_admin.loading_state"
            >
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : confirmedProposals.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-40 gap-2"
              data-ocid="marketplace_admin.empty_state"
            >
              <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No conversions yet.</p>
            </div>
          ) : (
            <div
              className="rounded-lg border border-border overflow-hidden"
              data-ocid="marketplace_admin.table"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Request Title</TableHead>
                    <TableHead>Proposed By</TableHead>
                    <TableHead>Confirmed By</TableHead>
                    <TableHead>Confirmed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmedProposals.map((p, i) => (
                    <TableRow
                      key={p.id}
                      data-ocid={`marketplace_admin.item.${i + 1}`}
                    >
                      <TableCell className="font-medium">
                        {p.requestTitle}
                        <Badge className="ml-2 bg-green-600/20 text-green-400 border-green-600/30 text-[10px]">
                          Converted
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {truncatePrincipal(p.proposedBy)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {truncatePrincipal(p.confirmedBy)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatBigIntDate(p.confirmedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Rejection Log Tab */}
        <TabsContent value="rejections">
          {isLoading ? (
            <div
              className="flex items-center justify-center h-32"
              data-ocid="marketplace_admin.loading_state"
            >
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : rejectedRequests.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-40 gap-2"
              data-ocid="marketplace_admin.empty_state"
            >
              <XCircle className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No rejections yet.</p>
            </div>
          ) : (
            <div
              className="rounded-lg border border-border overflow-hidden"
              data-ocid="marketplace_admin.table"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Listing Title</TableHead>
                    <TableHead>Requestor</TableHead>
                    <TableHead>Territory</TableHead>
                    <TableHead>Rejected At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedRequests.map((req, i) => (
                    <TableRow
                      key={req.id}
                      data-ocid={`marketplace_admin.item.${i + 1}`}
                    >
                      <TableCell className="font-medium">
                        {req.listingTitle}
                      </TableCell>
                      <TableCell className="text-sm">
                        {req.requestorName}
                      </TableCell>
                      <TableCell className="text-sm">{req.territory}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatBigIntDate(req.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Propose Approval Dialog */}
      <Dialog open={proposeOpen} onOpenChange={setProposeOpen}>
        <DialogContent
          className="max-w-lg"
          data-ocid="marketplace_admin.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Propose License Approval
            </DialogTitle>
            <DialogDescription>
              Submitting a proposal for{" "}
              <strong>{proposeTarget?.listingTitle}</strong>. A second admin
              must confirm before the license is created.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {proposeTarget && (
              <div className="rounded-md border border-border bg-muted/20 p-3 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Requestor:</span>{" "}
                  {proposeTarget.requestorName}
                </p>
                <p>
                  <span className="text-muted-foreground">Intended Use:</span>{" "}
                  {proposeTarget.intendedUse}
                </p>
                <p>
                  <span className="text-muted-foreground">Territory:</span>{" "}
                  {proposeTarget.territory}
                </p>
                <p>
                  <span className="text-muted-foreground">Duration:</span>{" "}
                  {proposeTarget.duration}
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="propose-reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="propose-reason"
                placeholder="Why should this request be approved?"
                value={proposeReason}
                onChange={(e) => setProposeReason(e.target.value)}
                rows={3}
                data-ocid="marketplace_admin.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setProposeOpen(false);
                setProposeReason("");
              }}
              data-ocid="marketplace_admin.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProposeApproval}
              disabled={isProposing || !proposeReason.trim()}
              data-ocid="marketplace_admin.submit_button"
            >
              {isProposing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Propose Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent
          className="max-w-lg"
          data-ocid="marketplace_admin.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Reject License Request
            </DialogTitle>
            <DialogDescription>
              Rejecting request for{" "}
              <strong>{rejectTarget?.listingTitle}</strong>. This action will
              notify the requestor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reject-reason"
              placeholder="Why is this request being rejected?"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              data-ocid="marketplace_admin.textarea"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectOpen(false);
                setRejectReason("");
              }}
              data-ocid="marketplace_admin.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectReason.trim()}
              data-ocid="marketplace_admin.delete_button"
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Approval Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent data-ocid="marketplace_admin.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              Confirm &amp; Convert to License
            </DialogTitle>
            <DialogDescription>
              Confirming this proposal will create an official license in the
              License Registry and close the marketplace listing.
            </DialogDescription>
          </DialogHeader>
          {confirmTarget && (
            <div className="rounded-md border border-border bg-muted/20 p-3 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Request:</span>{" "}
                {confirmTarget.requestTitle}
              </p>
              <p>
                <span className="text-muted-foreground">Proposed by:</span>{" "}
                {truncatePrincipal(confirmTarget.proposedBy)}
              </p>
              <p>
                <span className="text-muted-foreground">Reason:</span>{" "}
                {confirmTarget.reason}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              data-ocid="marketplace_admin.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApproval}
              disabled={isConfirming}
              data-ocid="marketplace_admin.confirm_button"
            >
              {isConfirming ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Confirm &amp; Convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
