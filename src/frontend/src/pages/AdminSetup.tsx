import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  ClipboardCopy,
  LogIn,
  MinusCircle,
  PlusCircle,
  Settings,
  Shield,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthContext } from "../contexts/AuthContext";
import { useActor } from "../hooks/useActor";

export function AdminSetup() {
  const { actor, isFetching } = useActor();
  const { login, isLoggingIn, isLoggedIn, identity } = useAuthContext();

  const [hasSeeded, setHasSeeded] = useState<boolean | null>(null);
  const [admins, setAdmins] = useState<string[]>([]);
  const [isCallerAdmin, setIsCallerAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [principalInput, setPrincipalInput] = useState("");
  const [seedInput, setSeedInput] = useState("");
  const [working, setWorking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentPrincipal = identity?.getPrincipal().toString();

  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey is a manual trigger
  useEffect(() => {
    if (!actor || isFetching) return;
    let cancelled = false;
    setLoading(true);
    const run = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a = actor as any;
        const [seeded, adminList] = await Promise.all([
          a.hasAdminBeenSeeded() as Promise<boolean>,
          a.listAdmins() as Promise<string[]>,
        ]);
        if (cancelled) return;
        setHasSeeded(seeded);
        setAdmins(adminList);
        if (isLoggedIn) {
          const callerIsAdmin = (await a.isCallerAdmin()) as boolean;
          if (!cancelled) setIsCallerAdmin(callerIsAdmin);
        }
      } catch {
        if (!cancelled) toast.error("Failed to load admin data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, isLoggedIn, refreshKey]);

  const handleSeed = async () => {
    if (!seedInput.trim()) {
      toast.error("Please enter a principal ID");
      return;
    }
    setWorking(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).seedAdminPrincipal(seedInput.trim());
      if (result.__kind__ === "ok") {
        toast.success("Admin access granted successfully!");
        setSeedInput("");
        refresh();
      } else {
        toast.error(result.err || "Failed to grant admin access");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  const handlePromote = async () => {
    if (!principalInput.trim()) {
      toast.error("Please enter a principal ID");
      return;
    }
    setWorking(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).promoteToAdmin(principalInput.trim());
      if (result.__kind__ === "ok") {
        toast.success("Principal promoted to admin!");
        setPrincipalInput("");
        refresh();
      } else {
        toast.error(result.err || "Failed to promote principal");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  const handleDemote = async (principal: string) => {
    if (principal === currentPrincipal) {
      toast.error("You cannot demote yourself.");
      return;
    }
    setWorking(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).demoteAdmin(principal);
      if (result.__kind__ === "ok") {
        toast.success("Admin role removed.");
        refresh();
      } else {
        toast.error(result.err || "Failed to demote admin");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const truncatePrincipal = (p: string) =>
    p.length > 20 ? `${p.slice(0, 10)}…${p.slice(-8)}` : p;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Platform Admin Setup
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure principal IDs with administrator access
          </p>
        </div>
      </div>

      {/* How to find your principal ID */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                How to find your Principal ID
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your principal ID looks like:{" "}
                <code className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                  xxxxx-xxxxx-xxxxx-xxxxx-xxx
                </code>
                . Sign in to the platform, then go to your{" "}
                <strong>Profile</strong> page to find it. The principal ID is
                the unique identifier associated with your Internet Identity.
              </p>
              {isLoggedIn && currentPrincipal && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Your current principal:
                  </span>
                  <code className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {truncatePrincipal(currentPrincipal)}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentPrincipal)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Copy your principal ID"
                    data-ocid="adminsetup.copy_button"
                  >
                    {copiedId === currentPrincipal ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <ClipboardCopy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      )}

      {!loading && (
        <>
          {/* Bootstrap mode — no admin exists yet */}
          {!hasSeeded && (
            <Card className="border-amber-500/30" data-ocid="adminsetup.card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldOff className="w-5 h-5 text-amber-500" />
                  <CardTitle className="text-base">Bootstrap Setup</CardTitle>
                </div>
                <CardDescription>
                  No platform admin has been configured yet. Paste a principal
                  ID below to grant the first admin access.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-xs text-amber-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    This action bootstraps the very first administrator. Choose
                    carefully — this cannot be undone without another admin.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seed-principal" className="text-sm">
                    Principal ID
                  </Label>
                  <Input
                    id="seed-principal"
                    placeholder="e.g. rdmx6-jaaaa-aaaaa-aaadq-cai"
                    value={seedInput}
                    onChange={(e) => setSeedInput(e.target.value)}
                    className="font-mono text-sm"
                    data-ocid="adminsetup.input"
                  />
                </div>
                <Button
                  onClick={handleSeed}
                  disabled={working || !seedInput.trim()}
                  className="gap-2"
                  data-ocid="adminsetup.submit_button"
                >
                  {working ? (
                    <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  Grant Admin Access
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Admin management mode — admin already exists */}
          {hasSeeded && (
            <>
              {/* Current admins list */}
              <Card data-ocid="adminsetup.card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      <CardTitle className="text-base">
                        Platform Administrators
                      </CardTitle>
                    </div>
                    <Badge variant="secondary">
                      {admins.length} admin{admins.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <CardDescription>
                    These principal IDs have full administrator access to the
                    platform.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {admins.length === 0 ? (
                    <p
                      className="text-sm text-muted-foreground text-center py-4"
                      data-ocid="adminsetup.empty_state"
                    >
                      No admins configured yet.
                    </p>
                  ) : (
                    <div className="space-y-2" data-ocid="adminsetup.list">
                      {admins.map((principal, idx) => (
                        <div
                          key={principal}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                          data-ocid={`adminsetup.item.${idx + 1}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <code
                                className="font-mono text-xs text-foreground block truncate"
                                title={principal}
                              >
                                {truncatePrincipal(principal)}
                              </code>
                              {principal === currentPrincipal && (
                                <span className="text-[10px] text-primary/70">
                                  (you)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(principal)}
                              className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded"
                              aria-label="Copy principal ID"
                              title="Copy principal ID"
                              data-ocid="adminsetup.copy_button"
                            >
                              {copiedId === principal ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <ClipboardCopy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {isCallerAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDemote(principal)}
                                disabled={
                                  working || principal === currentPrincipal
                                }
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                                data-ocid={`adminsetup.delete_button.${idx + 1}`}
                              >
                                <MinusCircle className="w-3.5 h-3.5" />
                                Demote
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add admin — only for logged-in admins */}
              {isLoggedIn && isCallerAdmin ? (
                <Card data-ocid="adminsetup.card">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <PlusCircle className="w-5 h-5 text-primary" />
                      <CardTitle className="text-base">
                        Add Administrator
                      </CardTitle>
                    </div>
                    <CardDescription>
                      Promote another Internet Identity principal to platform
                      admin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="promote-principal" className="text-sm">
                        Principal ID
                      </Label>
                      <Input
                        id="promote-principal"
                        placeholder="e.g. rdmx6-jaaaa-aaaaa-aaadq-cai"
                        value={principalInput}
                        onChange={(e) => setPrincipalInput(e.target.value)}
                        className="font-mono text-sm"
                        data-ocid="adminsetup.input"
                      />
                    </div>
                    <Button
                      onClick={handlePromote}
                      disabled={working || !principalInput.trim()}
                      className="gap-2"
                      data-ocid="adminsetup.submit_button"
                    >
                      {working ? (
                        <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <PlusCircle className="w-4 h-4" />
                      )}
                      Promote to Admin
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                !isLoggedIn && (
                  <Card className="border-muted/50">
                    <CardContent className="pt-5 pb-5">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <Shield className="w-8 h-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          Log in as an admin to manage roles and promote new
                          administrators.
                        </p>
                        <Button
                          variant="outline"
                          className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
                          onClick={login}
                          disabled={isLoggingIn}
                          data-ocid="adminsetup.primary_button"
                        >
                          <LogIn className="w-4 h-4" />
                          Sign In with Internet Identity
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
