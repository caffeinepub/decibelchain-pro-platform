import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Activity,
  AlertTriangle,
  Building2,
  DollarSign,
  FileText,
  Loader2,
  Lock,
  Music,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  MemberProfile,
  PlatformFeeConfig,
  PlatformHealthMetrics,
} from "../backend.d";
import { UserRole } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useTranslation } from "../i18n";

function bpsToPercent(bps: bigint): string {
  return `${(Number(bps) / 100).toFixed(2)}%`;
}

function truncatePrincipal(id: string): string {
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}...${id.slice(-6)}`;
}

function formatCurrency(cents: bigint): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(cents) / 100);
}

function formatTimestamp(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleString();
}

// ─── Health Tab ───────────────────────────────────────────────────────────────
function HealthTab({ metrics }: { metrics: PlatformHealthMetrics }) {
  const cards = [
    {
      label: "Total Organizations",
      value: Number(metrics.totalOrgs).toLocaleString(),
      icon: Building2,
      color: "text-primary",
    },
    {
      label: "Total Members",
      value: Number(metrics.totalMembers).toLocaleString(),
      icon: Users,
      color: "text-blue-400",
    },
    {
      label: "Total Works",
      value: Number(metrics.totalWorks).toLocaleString(),
      icon: Music,
      color: "text-purple-400",
    },
    {
      label: "Active Licenses",
      value: Number(metrics.activeLicenses).toLocaleString(),
      icon: FileText,
      color: "text-green-400",
    },
    {
      label: "Open Disputes",
      value: Number(metrics.openDisputes).toLocaleString(),
      icon: AlertTriangle,
      color: "text-yellow-400",
    },
    {
      label: "Payouts Processed",
      value: Number(metrics.totalPayoutsProcessed).toLocaleString(),
      icon: TrendingUp,
      color: "text-emerald-400",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(metrics.totalRevenueSourcesCents),
      icon: DollarSign,
      color: "text-amber-400",
    },
    {
      label: "Contracts Executed",
      value: Number(metrics.totalContractsExecuted).toLocaleString(),
      icon: ShieldCheck,
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="bg-card/60 border-border/50"
          data-ocid="admin.health.card"
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <CardDescription className="text-xs">
                {card.label}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-display text-foreground">
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── User Management Tab ──────────────────────────────────────────────────────
function UsersTab({
  profiles,
  callerPrincipal,
}: { profiles: MemberProfile[]; callerPrincipal: string }) {
  const { actor } = useActor();
  const [search, setSearch] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<{
    profile: MemberProfile;
    role: UserRole;
  } | null>(null);
  const [assigning, setAssigning] = useState(false);

  const filtered = profiles.filter(
    (p) =>
      p.displayName.toLowerCase().includes(search.toLowerCase()) ||
      p.principalId.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAssign = async () => {
    if (!confirmTarget || !actor) return;
    setAssigning(true);
    try {
      await (actor as any).assignCallerUserRole(
        confirmTarget.profile.principalId as any,
        confirmTarget.role,
      );
      toast.success(`Role updated for ${confirmTarget.profile.displayName}`);
      setConfirmTarget(null);
    } catch {
      toast.error("Failed to assign role");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        data-ocid="admin.users.search_input"
        placeholder="Search by name or principal..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm bg-background/50"
      />
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table data-ocid="admin.users.table">
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">
                Display Name
              </TableHead>
              <TableHead className="text-muted-foreground">
                Principal ID
              </TableHead>
              <TableHead className="text-muted-foreground">Orgs</TableHead>
              <TableHead className="text-muted-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p, i) => (
              <TableRow
                key={p.principalId}
                className="border-border/30"
                data-ocid={`admin.users.row.${i + 1}`}
              >
                <TableCell className="font-medium">
                  {p.displayName || "—"}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {truncatePrincipal(p.principalId)}
                </TableCell>
                <TableCell>{p.orgIds.length}</TableCell>
                <TableCell>
                  {p.principalId === callerPrincipal ? (
                    <Badge
                      variant="outline"
                      className="text-muted-foreground text-xs"
                    >
                      Self
                    </Badge>
                  ) : (
                    <Select
                      onValueChange={(role) =>
                        setConfirmTarget({ profile: p, role: role as UserRole })
                      }
                    >
                      <SelectTrigger
                        data-ocid={`admin.users.select.${i + 1}`}
                        className="w-32 h-7 text-xs bg-background/50"
                      >
                        <SelectValue placeholder="Assign role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.admin}>Admin</SelectItem>
                        <SelectItem value={UserRole.user}>User</SelectItem>
                        <SelectItem value={UserRole.guest}>Guest</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                  data-ocid="admin.users.empty_state"
                >
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!confirmTarget}
        onOpenChange={() => setConfirmTarget(null)}
      >
        <DialogContent
          data-ocid="admin.users.dialog"
          className="border-border/50"
        >
          <DialogHeader>
            <DialogTitle>Confirm Role Change</DialogTitle>
            <DialogDescription>
              Assign role <strong>{confirmTarget?.role}</strong> to{" "}
              <strong>{confirmTarget?.profile.displayName}</strong>? This action
              will take effect immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="admin.users.cancel_button"
              onClick={() => setConfirmTarget(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin.users.confirm_button"
              onClick={handleAssign}
              disabled={assigning}
            >
              {assigning && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Fee Configuration Tab ────────────────────────────────────────────────────
function FeesTab({
  config,
  callerPrincipal,
}: { config: PlatformFeeConfig; callerPrincipal: string }) {
  const { actor } = useActor();
  const [royaltyBps, setRoyaltyBps] = useState("");
  const [licenseBps, setLicenseBps] = useState("");
  const [financingBps, setFinancingBps] = useState("");
  const [proposing, setProposing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(config);

  const hasPending = currentConfig.proposedBy !== "";
  const selfIsProposer =
    hasPending && currentConfig.proposedBy === callerPrincipal;

  const handlePropose = async () => {
    if (!actor) return;
    const r = Number.parseInt(royaltyBps);
    const l = Number.parseInt(licenseBps);
    const f = Number.parseInt(financingBps);
    if (
      Number.isNaN(r) ||
      Number.isNaN(l) ||
      Number.isNaN(f) ||
      r < 0 ||
      l < 0 ||
      f < 0 ||
      r > 1000 ||
      l > 1000 ||
      f > 1000
    ) {
      toast.error("Enter valid basis points (0–1000) for all fields");
      return;
    }
    setProposing(true);
    try {
      const updated = await (actor as any).proposeFeeChange(
        BigInt(r),
        BigInt(l),
        BigInt(f),
      );
      setCurrentConfig(updated);
      toast.success("Fee change proposed. A second admin must confirm.");
      setRoyaltyBps("");
      setLicenseBps("");
      setFinancingBps("");
    } catch {
      toast.error("Failed to propose fee change");
    } finally {
      setProposing(false);
    }
  };

  const handleConfirm = async () => {
    if (!actor) return;
    if (selfIsProposer) {
      toast.error("Self-approval is blocked");
      return;
    }
    setConfirming(true);
    try {
      const updated = await (actor as any).confirmFeeChange();
      setCurrentConfig(updated);
      toast.success("Fee change confirmed and applied.");
    } catch {
      toast.error("Failed to confirm fee change");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Current fees */}
      <Card className="bg-card/60 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Current Active Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Royalty Processing",
                bps: currentConfig.royaltyProcessingFeeBps,
              },
              { label: "License Fee", bps: currentConfig.licenseFeeBps },
              {
                label: "Financing Platform",
                bps: currentConfig.financingPlatformFeeBps,
              },
            ].map((f) => (
              <div
                key={f.label}
                className="text-center p-3 rounded-lg bg-background/40 border border-border/30"
              >
                <p className="text-xs text-muted-foreground mb-1">{f.label}</p>
                <p className="text-xl font-bold text-primary font-display">
                  {bpsToPercent(f.bps)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Number(f.bps)} bps
                </p>
              </div>
            ))}
          </div>
          {currentConfig.lastUpdatedBy && (
            <p className="text-xs text-muted-foreground mt-3">
              Last updated by {truncatePrincipal(currentConfig.lastUpdatedBy)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pending proposal */}
      {hasPending && (
        <Card
          className="bg-yellow-500/10 border-yellow-500/30"
          data-ocid="admin.fees.pending_fee_change"
        >
          <CardHeader>
            <CardTitle className="text-base text-yellow-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Pending Fee Change
            </CardTitle>
            <CardDescription>
              Proposed by {truncatePrincipal(currentConfig.proposedBy)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Royalty Processing",
                  bps: currentConfig.pendingRoyaltyProcessingFeeBps,
                },
                {
                  label: "License Fee",
                  bps: currentConfig.pendingLicenseFeeBps,
                },
                {
                  label: "Financing Platform",
                  bps: currentConfig.pendingFinancingPlatformFeeBps,
                },
              ].map((f) => (
                <div
                  key={f.label}
                  className="text-center p-2 rounded bg-background/40"
                >
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className="font-bold text-yellow-300">
                    {bpsToPercent(f.bps)}
                  </p>
                </div>
              ))}
            </div>
            {selfIsProposer ? (
              <Badge
                variant="outline"
                className="text-yellow-400 border-yellow-500/30"
              >
                You proposed this — another admin must confirm
              </Badge>
            ) : (
              <Button
                data-ocid="admin.fees.confirm_fee_change_button"
                onClick={handleConfirm}
                disabled={confirming}
                className="bg-yellow-500 hover:bg-yellow-400 text-black"
              >
                {confirming && (
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                )}
                Confirm Fee Change
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Propose new fees */}
      <Card className="bg-card/60 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Propose New Fees</CardTitle>
          <CardDescription>
            Enter basis points (100 bps = 1%). Range: 0–1000.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Royalty Processing (bps)</Label>
              <Input
                data-ocid="admin.fees.royalty_input"
                type="number"
                min={0}
                max={1000}
                value={royaltyBps}
                onChange={(e) => setRoyaltyBps(e.target.value)}
                placeholder={String(
                  Number(currentConfig.royaltyProcessingFeeBps),
                )}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">License Fee (bps)</Label>
              <Input
                data-ocid="admin.fees.license_input"
                type="number"
                min={0}
                max={1000}
                value={licenseBps}
                onChange={(e) => setLicenseBps(e.target.value)}
                placeholder={String(Number(currentConfig.licenseFeeBps))}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Financing Platform (bps)</Label>
              <Input
                data-ocid="admin.fees.financing_input"
                type="number"
                min={0}
                max={1000}
                value={financingBps}
                onChange={(e) => setFinancingBps(e.target.value)}
                placeholder={String(
                  Number(currentConfig.financingPlatformFeeBps),
                )}
                className="bg-background/50"
              />
            </div>
          </div>
          <Button
            data-ocid="admin.fees.propose_submit_button"
            onClick={handlePropose}
            disabled={proposing || hasPending}
          >
            {proposing && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
            {hasPending ? "Resolve Pending Change First" : "Propose Fee Change"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Audit Log Tab ────────────────────────────────────────────────────────────
interface AuditEntryRaw {
  timestamp: bigint;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}

function AuditTab() {
  const { actor, isFetching } = useActor();
  const [entries, setEntries] = useState<AuditEntryRaw[]>([]);
  const [loading, setLoading] = useState(false);
  const [actorFilter, setActorFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const loadEntries = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const raw = await (actor as any).getAuditLog(BigInt(0), BigInt(10000));
      setEntries(raw as AuditEntryRaw[]);
    } catch {
      toast.error("Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor && !isFetching) loadEntries();
  }, [actor, isFetching, loadEntries]);

  const filtered = entries.filter((e) => {
    if (
      actorFilter &&
      !e.actor.toLowerCase().includes(actorFilter.toLowerCase())
    )
      return false;
    if (
      entityTypeFilter !== "all" &&
      e.entityType.toLowerCase() !== entityTypeFilter.toLowerCase()
    )
      return false;
    if (
      actionFilter &&
      !e.action.toLowerCase().includes(actionFilter.toLowerCase())
    )
      return false;
    if (dateFrom) {
      const fromMs = new Date(dateFrom).getTime();
      if (Number(e.timestamp / BigInt(1_000_000)) < fromMs) return false;
    }
    if (dateTo) {
      const toMs = new Date(dateTo).getTime() + 86400000;
      if (Number(e.timestamp / BigInt(1_000_000)) > toMs) return false;
    }
    return true;
  });

  const sortedDesc = [...filtered].sort((a, b) =>
    a.timestamp < b.timestamp ? 1 : -1,
  );
  const paginated = sortedDesc.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sortedDesc.length / PAGE_SIZE);

  const entityTypes = [
    "all",
    ...Array.from(new Set(entries.map((e) => e.entityType).filter(Boolean))),
  ];

  return (
    <div className="space-y-4" data-ocid="admin.audit.panel">
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Input
          data-ocid="admin.audit.actor_input"
          placeholder="Actor principal..."
          value={actorFilter}
          onChange={(e) => {
            setActorFilter(e.target.value);
            setPage(0);
          }}
          className="bg-background/50 text-xs"
        />
        <Select
          value={entityTypeFilter}
          onValueChange={(v) => {
            setEntityTypeFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger
            data-ocid="admin.audit.entity_type_select"
            className="bg-background/50 text-xs"
          >
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            {entityTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "all" ? "All Types" : t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          data-ocid="admin.audit.action_input"
          placeholder="Action keyword..."
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(0);
          }}
          className="bg-background/50 text-xs"
        />
        <Input
          data-ocid="admin.audit.date_from_input"
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(0);
          }}
          className="bg-background/50 text-xs"
        />
        <Input
          data-ocid="admin.audit.date_to_input"
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(0);
          }}
          className="bg-background/50 text-xs"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {sortedDesc.length} entries
          {filtered.length !== entries.length ? " (filtered)" : ""}
        </span>
        {loading && (
          <span className="flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading...
          </span>
        )}
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table data-ocid="admin.audit.table">
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs">
                Timestamp
              </TableHead>
              <TableHead className="text-muted-foreground text-xs">
                Actor
              </TableHead>
              <TableHead className="text-muted-foreground text-xs">
                Action
              </TableHead>
              <TableHead className="text-muted-foreground text-xs">
                Entity Type
              </TableHead>
              <TableHead className="text-muted-foreground text-xs">
                Entity ID
              </TableHead>
              <TableHead className="text-muted-foreground text-xs">
                Details
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((e, i) => (
              <TableRow
                key={`${String(e.timestamp)}-${i}`}
                className="border-border/30"
                data-ocid={`admin.audit.row.${i + 1}`}
              >
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(e.timestamp)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {truncatePrincipal(e.actor)}
                </TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline" className="text-xs font-mono">
                    {e.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {e.entityType}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {truncatePrincipal(e.entityId)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                  {e.details}
                </TableCell>
              </TableRow>
            ))}
            {paginated.length === 0 && !loading && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                  data-ocid="admin.audit.empty_state"
                >
                  No audit entries match the current filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            data-ocid="admin.audit.pagination_prev"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            data-ocid="admin.audit.pagination_next"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function PlatformAdmin() {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [metrics, setMetrics] = useState<PlatformHealthMetrics | null>(null);
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [feeConfig, setFeeConfig] = useState<PlatformFeeConfig | null>(null);
  const [callerPrincipal, setCallerPrincipal] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor || isFetching) return;
    const init = async () => {
      setLoading(true);
      try {
        const adminCheck = await (actor as any).isCallerAdmin();
        setIsAdmin(adminCheck);
        if (adminCheck) {
          const [m, p, f] = await Promise.all([
            (actor as any).getPlatformHealthMetrics(),
            (actor as any).listAllProfiles(),
            (actor as any).getPlatformFeeConfig(),
          ]);
          setMetrics(m);
          setProfiles(p);
          setFeeConfig(f);
          // Try to get caller's principal via profile
          try {
            const myProfile = await (actor as any).getMyProfile();
            if (myProfile) setCallerPrincipal(myProfile.principalId ?? "");
          } catch {
            /* ignore */
          }
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [actor, isFetching]);

  if (loading || isAdmin === null) {
    return (
      <div
        className="flex items-center justify-center h-64"
        data-ocid="admin.loading_state"
      >
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 gap-4"
        data-ocid="admin.access_denied.panel"
      >
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-destructive" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Admin Access Required
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            This section is restricted to platform administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-ocid="admin.page">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-primary" />
            {t("platformAdmin")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Platform-wide administration and configuration
          </p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30">
          Admin
        </Badge>
      </div>

      <Tabs defaultValue="health" data-ocid="admin.tabs">
        <TabsList className="bg-card/60 border border-border/50">
          <TabsTrigger
            data-ocid="admin.health.tab"
            value="health"
            className="flex items-center gap-2"
          >
            <Activity className="w-3.5 h-3.5" />
            {t("platformHealth")}
          </TabsTrigger>
          <TabsTrigger
            data-ocid="admin.users.tab"
            value="users"
            className="flex items-center gap-2"
          >
            <Users className="w-3.5 h-3.5" />
            {t("userManagement")}
          </TabsTrigger>
          <TabsTrigger
            data-ocid="admin.fees.tab"
            value="fees"
            className="flex items-center gap-2"
          >
            <DollarSign className="w-3.5 h-3.5" />
            {t("feeConfiguration")}
          </TabsTrigger>
          <TabsTrigger
            data-ocid="admin.audit.tab"
            value="audit"
            className="flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5" />
            {t("advancedAuditLog")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-6">
          {metrics ? (
            <HealthTab metrics={metrics} />
          ) : (
            <p className="text-muted-foreground">Loading metrics...</p>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UsersTab profiles={profiles} callerPrincipal={callerPrincipal} />
        </TabsContent>

        <TabsContent value="fees" className="mt-6">
          {feeConfig ? (
            <FeesTab config={feeConfig} callerPrincipal={callerPrincipal} />
          ) : (
            <p className="text-muted-foreground">Loading fee config...</p>
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
