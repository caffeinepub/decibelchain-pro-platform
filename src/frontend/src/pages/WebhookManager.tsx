import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useActor } from "@/hooks/useActor";
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Plus,
  Radio,
  RefreshCw,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type WebhookEndpoint = {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: bigint;
  createdById: string;
};

type WebhookDeliveryLog = {
  id: string;
  webhookId: string;
  event: string;
  statusCode: bigint;
  success: boolean;
  responsePreview: string;
  timestamp: bigint;
};

const ALL_EVENTS = [
  { key: "work.registered", label: "Work Registered" },
  { key: "payout.finalized", label: "Payout Finalized" },
  { key: "contract.executed", label: "Contract Executed" },
  { key: "license.created", label: "License Created" },
  { key: "dispute.filed", label: "Dispute Filed" },
];

export function WebhookManager() {
  const { actor, isFetching } = useActor();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [logs, setLogs] = useState<WebhookDeliveryLog[]>([]);
  const [loading, setLoading] = useState(false);

  // New webhook form
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  // Pinging state
  const [pinging, setPinging] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [hooks, deliveryLogs] = await Promise.all([
        (actor as any).listWebhooks(),
        (actor as any).listWebhookLogs(),
      ]);
      setWebhooks(hooks);
      setLogs(deliveryLogs);
    } catch {
      toast.error("Failed to load webhook data");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (!actor || isFetching) return;
    (actor as any)
      .isCallerAdmin()
      .then((result: boolean) => {
        setIsAdmin(Boolean(result));
        setAdminChecked(true);
      })
      .catch(() => setAdminChecked(true));
  }, [actor, isFetching]);

  useEffect(() => {
    if (isAdmin && actor) loadData();
  }, [isAdmin, actor, loadData]);

  const handleCreate = async () => {
    if (
      !actor ||
      !newName.trim() ||
      !newUrl.trim() ||
      selectedEvents.length === 0
    ) {
      toast.error("Please fill all fields and select at least one event");
      return;
    }
    setCreating(true);
    try {
      const result = await (actor as any).registerWebhook(
        newName.trim(),
        newUrl.trim(),
        selectedEvents,
      );
      if ("ok" in result) {
        toast.success("Webhook registered");
        setNewSecret(result.ok.secret);
        setNewName("");
        setNewUrl("");
        setSelectedEvents([]);
        await loadData();
      } else {
        toast.error(result.err);
      }
    } catch {
      toast.error("Failed to register webhook");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    if (!actor) return;
    setToggling(id);
    try {
      const result = await (actor as any).updateWebhookStatus(id, !active);
      if ("ok" in result) {
        toast.success(`Webhook ${!active ? "activated" : "deactivated"}`);
        await loadData();
      } else {
        toast.error(result.err);
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!actor) return;
    setDeleting(id);
    try {
      const result = await (actor as any).deleteWebhook(id);
      if ("ok" in result) {
        toast.success("Webhook deleted");
        await loadData();
      } else {
        toast.error(result.err);
      }
    } catch {
      toast.error("Failed to delete webhook");
    } finally {
      setDeleting(null);
    }
  };

  const handlePing = async (id: string) => {
    if (!actor) return;
    setPinging(id);
    try {
      const result = await (actor as any).pingWebhook(id);
      if ("ok" in result) {
        const log = result.ok as WebhookDeliveryLog;
        if (log.success) {
          toast.success(`Ping succeeded — ${log.statusCode}`);
        } else {
          toast.error(`Ping failed — ${log.statusCode}`);
        }
        await loadData();
      } else {
        toast.error(result.err);
      }
    } catch {
      toast.error("Failed to ping webhook");
    } finally {
      setPinging(null);
    }
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copied to clipboard");
  };

  const getWebhookName = (id: string) =>
    webhooks.find((w) => w.id === id)?.name ?? `${id.slice(0, 8)}...`;

  if (!adminChecked) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 gap-4"
        data-ocid="webhook_manager.error_state"
      >
        <Lock className="h-16 w-16 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Radio className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Webhook Engine</h1>
          <p className="text-sm text-muted-foreground">
            Register endpoints and monitor delivery logs
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto gap-2"
          onClick={loadData}
          disabled={loading}
          data-ocid="webhook_manager.secondary_button"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="webhooks">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="webhooks" data-ocid="webhook_manager.tab">
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="logs" data-ocid="webhook_manager.tab">
            Delivery Logs
          </TabsTrigger>
        </TabsList>

        {/* WEBHOOKS TAB */}
        <TabsContent value="webhooks" className="space-y-6 mt-6">
          {/* New webhook secret banner */}
          {newSecret && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-primary">
                  <Zap className="h-4 w-4" />
                  Webhook Created — Save Your Secret
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  This secret will only be shown once. Copy it now.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-background rounded-md text-xs font-mono border border-border">
                    {showSecret ? newSecret : "•".repeat(newSecret.length)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSecret((v) => !v)}
                  >
                    {showSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copySecret(newSecret)}
                    data-ocid="webhook_manager.secondary_button"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setNewSecret(null)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Register form */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Register Webhook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="wh-name">Name</Label>
                  <Input
                    id="wh-name"
                    placeholder="Production DSP Listener"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    data-ocid="webhook_manager.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wh-url">Endpoint URL</Label>
                  <Input
                    id="wh-url"
                    placeholder="https://example.com/webhooks"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    data-ocid="webhook_manager.input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Events</Label>
                <div className="flex flex-wrap gap-4">
                  {ALL_EVENTS.map((ev) => (
                    <div key={ev.key} className="flex items-center gap-2">
                      <Checkbox
                        id={`ev-${ev.key}`}
                        checked={selectedEvents.includes(ev.key)}
                        onCheckedChange={(checked) => {
                          setSelectedEvents((prev) =>
                            checked
                              ? [...prev, ev.key]
                              : prev.filter((e) => e !== ev.key),
                          );
                        }}
                        data-ocid="webhook_manager.checkbox"
                      />
                      <Label
                        htmlFor={`ev-${ev.key}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {ev.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="gap-2"
                data-ocid="webhook_manager.primary_button"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Register Webhook
              </Button>
            </CardContent>
          </Card>

          {/* Webhooks list */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Registered Webhooks</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div
                  className="flex justify-center py-8"
                  data-ocid="webhook_manager.loading_state"
                >
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : webhooks.length === 0 ? (
                <div
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="webhook_manager.empty_state"
                >
                  No webhooks registered yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((wh, i) => (
                      <TableRow
                        key={wh.id}
                        data-ocid={`webhook_manager.item.${i + 1}`}
                      >
                        <TableCell className="font-medium">{wh.name}</TableCell>
                        <TableCell className="max-w-[180px] truncate text-muted-foreground text-xs">
                          {wh.url}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {wh.events.map((ev) => (
                              <Badge
                                key={ev}
                                variant="outline"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {ev}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={wh.active ? "default" : "secondary"}
                            className={
                              wh.active
                                ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/30"
                                : ""
                            }
                          >
                            {wh.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggle(wh.id, wh.active)}
                              disabled={toggling === wh.id}
                              className="text-xs"
                              data-ocid={`webhook_manager.toggle.${i + 1}`}
                            >
                              {toggling === wh.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : wh.active ? (
                                "Deactivate"
                              ) : (
                                "Activate"
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePing(wh.id)}
                              disabled={pinging === wh.id}
                              title="Test ping"
                              data-ocid={`webhook_manager.secondary_button.${i + 1}`}
                            >
                              {pinging === wh.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Zap className="h-4 w-4 text-primary" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(wh.id)}
                              disabled={deleting === wh.id}
                              className="text-destructive hover:text-destructive"
                              data-ocid={`webhook_manager.delete_button.${i + 1}`}
                            >
                              {deleting === wh.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DELIVERY LOGS TAB */}
        <TabsContent value="logs" className="mt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Delivery History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div
                  className="flex justify-center py-8"
                  data-ocid="webhook_manager.loading_state"
                >
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="webhook_manager.empty_state"
                >
                  No delivery logs yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Webhook</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Response Preview</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log, i) => (
                      <TableRow
                        key={log.id}
                        data-ocid={`webhook_manager.row.${i + 1}`}
                      >
                        <TableCell className="font-medium text-sm">
                          {getWebhookName(log.webhookId)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {log.event}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.success ? (
                            <div className="flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs">Success</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-destructive">
                              <XCircle className="h-4 w-4" />
                              <span className="text-xs">Failed</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm font-mono font-semibold ${
                              log.success
                                ? "text-emerald-400"
                                : "text-destructive"
                            }`}
                          >
                            {Number(log.statusCode)}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground font-mono">
                          {log.responsePreview || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(
                            Number(log.timestamp) / 1_000_000,
                          ).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
