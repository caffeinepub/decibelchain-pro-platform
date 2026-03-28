import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActor } from "@/hooks/useActor";
import { useTranslation } from "@/i18n";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Key,
  Loader2,
  Lock,
  Plus,
  ShieldOff,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type ApiKeyStatus = { active: null } | { revoked: null };

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  keyHash: string;
  scopes: string[];
  status: ApiKeyStatus;
  createdAt: bigint;
  expiresAt: bigint;
  lastUsedAt: bigint;
  createdById: string;
  revokedById: string;
};

type ApiKeyRevokeProposal = {
  id: string;
  keyId: string;
  keyName: string;
  reason: string;
  proposerId: string;
  proposedAt: bigint;
};

const SCOPES = [
  "read:works",
  "write:works",
  "read:royalties",
  "write:royalties",
  "read:licenses",
  "read:reports",
  "admin:all",
];

function formatBigIntDate(ts: bigint): string {
  if (ts === 0n) return "Never";
  return new Date(Number(ts / 1_000_000n)).toLocaleString();
}

function truncatePrincipal(p: string): string {
  if (p.length <= 16) return p;
  return `${p.slice(0, 8)}…${p.slice(-6)}`;
}

export function ApiKeyManager() {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [callerPrincipal, setCallerPrincipal] = useState("");

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [proposals, setProposals] = useState<ApiKeyRevokeProposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate dialog
  const [genOpen, setGenOpen] = useState(false);
  const [genName, setGenName] = useState("");
  const [genScopes, setGenScopes] = useState<string[]>([]);
  const [genExpiry, setGenExpiry] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newKeyDialogOpen, setNewKeyDialogOpen] = useState(false);
  const newKeyRef = useRef<HTMLInputElement>(null);

  // Revoke proposal dialog
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeTargetKey, setRevokeTargetKey] = useState<ApiKey | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [isProposing, setIsProposing] = useState(false);

  // Confirm revoke dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] =
    useState<ApiKeyRevokeProposal | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadData = useCallback(async () => {
    if (!actor) return;
    setIsLoading(true);
    try {
      const [keysResult, proposalsResult] = await Promise.all([
        (actor as any).listApiKeys(),
        (actor as any).listRevokeProposals(),
      ]);
      setKeys(keysResult);
      setProposals(proposalsResult);
    } catch (_e) {
      toast.error("Failed to load API keys");
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
        // Try to get principal from identity — fall back to empty
        if (profile?.[0]?.principalId) {
          setCallerPrincipal(profile[0].principalId);
        }
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

  async function handleGenerate() {
    if (!actor || !genName.trim()) return;
    setIsGenerating(true);
    try {
      const result = await (actor as any).generateApiKey(
        genName.trim(),
        genScopes,
        BigInt(genExpiry),
      );
      toast.success("API key generated");
      setNewKeyValue(result.key);
      setNewKeyDialogOpen(true);
      setGenOpen(false);
      setGenName("");
      setGenScopes([]);
      setGenExpiry(0);
      await loadData();
    } catch (_e) {
      toast.error("Failed to generate API key");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleProposeRevoke() {
    if (!actor || !revokeTargetKey || !revokeReason.trim()) return;
    setIsProposing(true);
    try {
      const result = await (actor as any).proposeRevokeApiKey(
        revokeTargetKey.id,
        revokeReason.trim(),
      );
      if ("ok" in result) {
        toast.success("Revoke proposal submitted");
        setRevokeOpen(false);
        setRevokeTargetKey(null);
        setRevokeReason("");
        await loadData();
      } else {
        toast.error(result.err);
      }
    } catch {
      toast.error("Failed to propose revoke");
    } finally {
      setIsProposing(false);
    }
  }

  async function handleConfirmRevoke() {
    if (!actor || !confirmTarget) return;
    setIsConfirming(true);
    try {
      const result = await (actor as any).confirmRevokeApiKey(confirmTarget.id);
      if ("ok" in result) {
        toast.success("API key revoked");
        setConfirmOpen(false);
        setConfirmTarget(null);
        await loadData();
      } else {
        toast.error((result as any).err);
      }
    } catch {
      toast.error("Failed to confirm revoke");
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleCancelProposal(proposal: ApiKeyRevokeProposal) {
    if (!actor) return;
    setIsCancelling(true);
    try {
      const result = await (actor as any).cancelRevokeProposal(proposal.id);
      if ("ok" in result) {
        toast.success("Proposal cancelled");
        await loadData();
      } else {
        toast.error((result as any).err);
      }
    } catch {
      toast.error("Failed to cancel proposal");
    } finally {
      setIsCancelling(false);
    }
  }

  function copyKey() {
    if (newKeyRef.current) {
      newKeyRef.current.select();
      navigator.clipboard.writeText(newKeyValue);
      toast.success("Key copied to clipboard");
    }
  }

  if (isCheckingAdmin) {
    return (
      <div
        className="flex items-center justify-center h-64"
        data-ocid="api_key_manager.loading_state"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 gap-4"
        data-ocid="api_key_manager.error_state"
      >
        <Lock className="h-16 w-16 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">
          {t("adminOnly" as any) ?? "Admin access required"}
        </p>
      </div>
    );
  }

  const activeKeys = keys.filter((k) => "active" in k.status);
  const _revokedKeys = keys.filter((k) => "revoked" in k.status);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t("apiKeyManager" as any)}
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage API access keys and revocation proposals
              </p>
            </div>
          </div>
          <Button
            onClick={() => setGenOpen(true)}
            className="gap-2"
            data-ocid="api_key_manager.open_modal_button"
          >
            <Plus className="h-4 w-4" />
            {t("generateKey" as any)}
          </Button>
        </div>

        <Tabs defaultValue="keys">
          <TabsList className="mb-4">
            <TabsTrigger value="keys" data-ocid="api_key_manager.tab">
              {t("apiKeyManager" as any)}
              {activeKeys.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeKeys.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="proposals" data-ocid="api_key_manager.tab">
              {t("revokeProposals" as any)}
              {proposals.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {proposals.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="keys">
            {isLoading ? (
              <div
                className="flex items-center justify-center h-32"
                data-ocid="api_key_manager.loading_state"
              >
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : keys.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center h-40 gap-2"
                data-ocid="api_key_manager.empty_state"
              >
                <Key className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No API keys yet. Generate one to get started.
                </p>
              </div>
            ) : (
              <div
                className="rounded-lg border border-border overflow-hidden"
                data-ocid="api_key_manager.table"
              >
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Name</TableHead>
                      <TableHead>Prefix</TableHead>
                      <TableHead>Scopes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((key, i) => (
                      <TableRow
                        key={key.id}
                        data-ocid={`api_key_manager.item.${i + 1}`}
                      >
                        <TableCell className="font-medium">
                          {key.name}
                        </TableCell>
                        <TableCell>
                          <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-primary">
                            {key.prefix}…
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {key.scopes.map((s) => (
                              <Badge
                                key={s}
                                variant="outline"
                                className="text-xs"
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {"active" in key.status ? (
                            <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" /> Revoked
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatBigIntDate(key.createdAt)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {key.expiresAt === 0n
                            ? "Never"
                            : formatBigIntDate(key.expiresAt)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {key.lastUsedAt === 0n
                            ? "Never"
                            : formatBigIntDate(key.lastUsedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {"active" in key.status && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive/40 hover:bg-destructive/10 gap-1"
                              onClick={() => {
                                setRevokeTargetKey(key);
                                setRevokeOpen(true);
                              }}
                              data-ocid={`api_key_manager.delete_button.${i + 1}`}
                            >
                              <ShieldOff className="h-3 w-3" />
                              {t("proposeRevoke" as any)}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Revoke Proposals Tab */}
          <TabsContent value="proposals">
            {isLoading ? (
              <div
                className="flex items-center justify-center h-32"
                data-ocid="api_key_manager.loading_state"
              >
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : proposals.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center h-40 gap-2"
                data-ocid="api_key_manager.empty_state"
              >
                <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No pending revoke proposals.
                </p>
              </div>
            ) : (
              <div
                className="rounded-lg border border-border overflow-hidden"
                data-ocid="api_key_manager.table"
              >
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Key Name</TableHead>
                      <TableHead>Proposer</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Proposed At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposals.map((p, i) => {
                      const isSelf =
                        p.proposerId === callerPrincipal &&
                        callerPrincipal !== "";
                      return (
                        <TableRow
                          key={p.id}
                          data-ocid={`api_key_manager.row.${i + 1}`}
                        >
                          <TableCell className="font-medium">
                            {p.keyName}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {truncatePrincipal(p.proposerId)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm">
                            {p.reason}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatBigIntDate(p.proposedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      disabled={isSelf}
                                      onClick={() => {
                                        setConfirmTarget(p);
                                        setConfirmOpen(true);
                                      }}
                                      data-ocid={`api_key_manager.confirm_button.${i + 1}`}
                                    >
                                      {t("confirmRevoke" as any)}
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {isSelf && (
                                  <TooltipContent>
                                    <p>
                                      {t("selfApprovalBlocked" as any) ??
                                        "Self-approval not allowed"}
                                    </p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                              {isSelf && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isCancelling}
                                  onClick={() => handleCancelProposal(p)}
                                  data-ocid={`api_key_manager.cancel_button.${i + 1}`}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Generate Key Dialog */}
        <Dialog open={genOpen} onOpenChange={setGenOpen}>
          <DialogContent
            className="max-w-lg"
            data-ocid="api_key_manager.dialog"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                {t("generateKey" as any)}
              </DialogTitle>
              <DialogDescription>
                Generate a new API key. The raw key will only be shown once.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="key-name">
                  Key Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="key-name"
                  placeholder="e.g. CI Pipeline, Partner Integration"
                  value={genName}
                  onChange={(e) => setGenName(e.target.value)}
                  data-ocid="api_key_manager.input"
                />
              </div>
              <div className="space-y-2">
                <Label>Scopes</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SCOPES.map((scope) => (
                    <div key={scope} className="flex items-center gap-2">
                      <Checkbox
                        id={`scope-${scope}`}
                        checked={genScopes.includes(scope)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setGenScopes((prev) => [...prev, scope]);
                          } else {
                            setGenScopes((prev) =>
                              prev.filter((s) => s !== scope),
                            );
                          }
                        }}
                        data-ocid="api_key_manager.checkbox"
                      />
                      <label
                        htmlFor={`scope-${scope}`}
                        className="text-sm font-mono cursor-pointer"
                      >
                        {scope}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="key-expiry">
                  Expiry (days, 0 = never expires)
                </Label>
                <Input
                  id="key-expiry"
                  type="number"
                  min={0}
                  value={genExpiry}
                  onChange={(e) => setGenExpiry(Number(e.target.value))}
                  data-ocid="api_key_manager.input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setGenOpen(false)}
                data-ocid="api_key_manager.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !genName.trim()}
                data-ocid="api_key_manager.submit_button"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {t("generateKey" as any)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Key Display Dialog */}
        <Dialog open={newKeyDialogOpen} onOpenChange={setNewKeyDialogOpen}>
          <DialogContent
            className="max-w-lg"
            data-ocid="api_key_manager.dialog"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                Copy Your New API Key
              </DialogTitle>
            </DialogHeader>
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-300">
                This key will only be shown once. Copy it now — you cannot
                retrieve it later.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Input
                ref={newKeyRef}
                value={newKeyValue}
                readOnly
                className="font-mono text-sm select-all"
                onClick={() => newKeyRef.current?.select()}
                data-ocid="api_key_manager.input"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyKey}
                data-ocid="api_key_manager.secondary_button"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setNewKeyDialogOpen(false)}
                data-ocid="api_key_manager.close_button"
              >
                I've copied my key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Propose Revoke Dialog */}
        <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
          <DialogContent data-ocid="api_key_manager.dialog">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <ShieldOff className="h-5 w-5" />
                {t("proposeRevoke" as any)}: {revokeTargetKey?.name}
              </DialogTitle>
              <DialogDescription>
                Submit a revocation proposal. A second admin must confirm before
                the key is revoked.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="revoke-reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="revoke-reason"
                placeholder="Why is this key being revoked?"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={3}
                data-ocid="api_key_manager.textarea"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRevokeOpen(false);
                  setRevokeReason("");
                }}
                data-ocid="api_key_manager.cancel_button"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleProposeRevoke}
                disabled={isProposing || !revokeReason.trim()}
                data-ocid="api_key_manager.delete_button"
              >
                {isProposing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {t("proposeRevoke" as any)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Revoke Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent data-ocid="api_key_manager.dialog">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                {t("confirmRevoke" as any)}
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently revoke the key{" "}
                <strong>{confirmTarget?.keyName}</strong>? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            {confirmTarget && (
              <div className="rounded-md border border-border bg-muted/20 p-3 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Key:</span>{" "}
                  {confirmTarget.keyName}
                </p>
                <p>
                  <span className="text-muted-foreground">Reason:</span>{" "}
                  {confirmTarget.reason}
                </p>
                <p>
                  <span className="text-muted-foreground">Proposed by:</span>{" "}
                  {truncatePrincipal(confirmTarget.proposerId)}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                data-ocid="api_key_manager.cancel_button"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmRevoke}
                disabled={isConfirming}
                data-ocid="api_key_manager.confirm_button"
              >
                {isConfirming ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {t("confirmRevoke" as any)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
