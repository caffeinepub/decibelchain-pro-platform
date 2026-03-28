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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  Printer,
  ScrollText,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Contract, ContractParty, ContractTemplate } from "../backend.d";
import { ContractStatus, ContractType } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useOrganizations } from "../hooks/useQueries";
import { useTranslation } from "../i18n";

// ─── helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: ContractStatus) {
  const map: Record<ContractStatus, { label: string; cls: string }> = {
    [ContractStatus.draft]: {
      label: "Draft",
      cls: "bg-muted text-muted-foreground",
    },
    [ContractStatus.pendingApproval]: {
      label: "Pending Approval",
      cls: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40",
    },
    [ContractStatus.approved]: {
      label: "Approved",
      cls: "bg-blue-500/20 text-blue-400 border border-blue-500/40",
    },
    [ContractStatus.executed]: {
      label: "Executed",
      cls: "bg-green-500/20 text-green-400 border border-green-500/40",
    },
    [ContractStatus.voided]: {
      label: "Voided",
      cls: "bg-destructive/20 text-destructive border border-destructive/40",
    },
  };
  const s = map[status] ?? { label: status, cls: "bg-muted" };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

function fmtDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString();
}

function printContract(contract: Contract) {
  const statusLabel =
    contract.status === ContractStatus.executed
      ? "EXECUTED"
      : contract.status === ContractStatus.voided
        ? "VOIDED"
        : "DRAFT";
  const watermarkColor =
    contract.status === ContractStatus.executed
      ? "#22c55e"
      : contract.status === ContractStatus.voided
        ? "#ef4444"
        : "#94a3b8";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${contract.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DM Sans', sans-serif; color: #1e293b; background: #fff; padding: 60px; position: relative; }
    .watermark {
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 100px; font-weight: 900; color: ${watermarkColor};
      opacity: 0.06; pointer-events: none; z-index: 0;
      font-family: 'Playfair Display', serif; white-space: nowrap;
    }
    .content { position: relative; z-index: 1; max-width: 800px; margin: 0 auto; }
    .letterhead { text-align: center; border-bottom: 3px solid #c4a44a; padding-bottom: 24px; margin-bottom: 32px; }
    .logo-name { font-family: 'Playfair Display', serif; font-size: 32px; color: #0f172a; letter-spacing: 2px; }
    .logo-sub { font-size: 12px; color: #94a3b8; letter-spacing: 4px; text-transform: uppercase; margin-top: 4px; }
    h1 { font-family: 'Playfair Display', serif; font-size: 24px; margin-bottom: 8px; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 32px; }
    .meta span { margin-right: 16px; }
    h2 { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 12px; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; font-size: 12px; color: #64748b; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
    td { padding: 10px 12px; border: 1px solid #e2e8f0; font-size: 13px; }
    .terms { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; font-size: 13px; line-height: 1.7; white-space: pre-wrap; margin-bottom: 32px; }
    .signatures { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 32px; margin-top: 32px; }
    .sig-block { border-top: 2px solid #0f172a; padding-top: 8px; }
    .sig-name { font-weight: 600; font-size: 13px; }
    .sig-role { font-size: 11px; color: #64748b; margin-top: 2px; }
    .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    @media print { .watermark { position: fixed; } }
  </style>
</head>
<body>
  <div class="watermark">${statusLabel}</div>
  <div class="content">
    <div class="letterhead">
      <div class="logo-name">DecibelChain</div>
      <div class="logo-sub">Performing Rights Organization · Decentralized</div>
    </div>
    <h1>${contract.title}</h1>
    <div class="meta">
      <span><strong>Type:</strong> ${contract.contractType}</span>
      <span><strong>Status:</strong> ${statusLabel}</span>
      <span><strong>Org ID:</strong> ${contract.orgId}</span>
    </div>
    <h2>Parties</h2>
    <table>
      <thead><tr><th>Name</th><th>Role</th><th>Principal ID</th></tr></thead>
      <tbody>
        ${contract.parties.map((p) => `<tr><td>${p.name}</td><td>${p.role}</td><td style="font-size:11px;font-family:monospace">${p.principalId}</td></tr>`).join("")}
      </tbody>
    </table>
    <h2>Terms</h2>
    <div class="terms">${contract.terms || "No terms specified."}</div>
    <h2>Signatures</h2>
    <div class="signatures">
      ${contract.parties.map((p) => `<div class="sig-block"><div class="sig-name">${p.name}</div><div class="sig-role">${p.role}</div><div style="height:40px"></div></div>`).join("")}
    </div>
    <div class="footer">
      Created: ${fmtDate(contract.createdAt)} &nbsp;·&nbsp; Last Updated: ${fmtDate(contract.updatedAt)}<br/>
      Generated by DecibelChain PRO Platform
    </div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ─── ConfirmDialog ─────────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  loading,
  danger,
}: {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md" data-ocid="contract.dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            data-ocid="contract.cancel_button"
          >
            Cancel
          </Button>
          <Button
            variant={danger ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
            data-ocid="contract.confirm_button"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── NewTemplateDialog ─────────────────────────────────────────────────────────

function NewTemplateDialog({ onCreated }: { onCreated: () => void }) {
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contractType, setContractType] = useState<ContractType>(
    ContractType.license,
  );
  const [bodyTemplate, setBodyTemplate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!actor || !name.trim()) return;
    setSaving(true);
    try {
      await (actor as any).createContractTemplate(
        name.trim(),
        contractType,
        bodyTemplate,
      );
      toast.success("Template created");
      setOpen(false);
      setName("");
      setBodyTemplate("");
      onCreated();
    } catch {
      toast.error("Failed to create template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        data-ocid="contract.template.open_modal_button"
      >
        <Plus className="w-4 h-4 mr-1" /> New Template
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-xl"
          data-ocid="contract.template.dialog"
        >
          <DialogHeader>
            <DialogTitle>New Contract Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Template Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Sync License"
                data-ocid="contract.template.input"
              />
            </div>
            <div className="space-y-1">
              <Label>Contract Type</Label>
              <Select
                value={contractType}
                onValueChange={(v) => setContractType(v as ContractType)}
              >
                <SelectTrigger data-ocid="contract.template.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ContractType.license}>License</SelectItem>
                  <SelectItem value={ContractType.financing}>
                    Financing
                  </SelectItem>
                  <SelectItem value={ContractType.custom}>Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Template Body</Label>
              <Textarea
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                rows={8}
                placeholder={
                  "Use placeholders like {{partyA}}, {{workTitle}}, {{terms}}, {{date}}.\n\nExample:\nThis agreement is entered into between {{partyA}} and {{partyB}} for the work titled {{workTitle}}."
                }
                className="font-mono text-xs"
                data-ocid="contract.template.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="contract.template.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !name.trim()}
              data-ocid="contract.template.submit_button"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── TemplatesTab ──────────────────────────────────────────────────────────────

function TemplatesTab({ isAdmin }: { isAdmin: boolean }) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useQuery<ContractTemplate[]>({
    queryKey: ["contractTemplates"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listContractTemplates();
    },
    enabled: !!actor && !isFetching,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {templates.length} template{templates.length !== 1 ? "s" : ""}
        </p>
        {isAdmin && (
          <NewTemplateDialog
            onCreated={() =>
              qc.invalidateQueries({ queryKey: ["contractTemplates"] })
            }
          />
        )}
      </div>

      {isLoading ? (
        <div
          className="flex items-center justify-center py-12"
          data-ocid="contract.templates.loading_state"
        >
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="contract.templates.empty_state"
        >
          <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No templates yet.</p>
          {isAdmin && (
            <p className="text-xs mt-1">Create a template to get started.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table
            className="w-full text-sm"
            data-ocid="contract.templates.table"
          >
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Type
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Created
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl, i) => (
                <>
                  <tr
                    key={tpl.id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    data-ocid={`contract.templates.row.${i + 1}`}
                  >
                    <td className="px-4 py-3 font-medium">{tpl.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">
                        {tpl.contractType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {fmtDate(tpl.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpanded(expanded === tpl.id ? null : tpl.id)
                        }
                        data-ocid={`contract.templates.toggle.${i + 1}`}
                      >
                        {expanded === tpl.id ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                  {expanded === tpl.id && (
                    <tr
                      key={`${tpl.id}-body`}
                      className="bg-muted/10 border-b border-border/50"
                    >
                      <td colSpan={4} className="px-6 py-4">
                        <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">
                          Template Body
                        </p>
                        <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-mono bg-muted/30 rounded p-3">
                          {tpl.bodyTemplate || "(empty)"}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── NewContractDialog ──────────────────────────────────────────────────────────

function NewContractDialog({
  orgId,
  onCreated,
}: {
  orgId: string;
  onCreated: () => void;
}) {
  const { actor, isFetching } = useActor();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ContractTemplate | null>(null);
  const [title, setTitle] = useState("");
  const [contractType, setContractType] = useState<ContractType>(
    ContractType.license,
  );
  const [workId, setWorkId] = useState("");
  const [licenseId, setLicenseId] = useState("");
  const [financingOfferId, setFinancingOfferId] = useState("");
  const [terms, setTerms] = useState("");
  const [parties, setParties] = useState<
    Array<ContractParty & { _uid: number }>
  >([{ name: "", role: "", principalId: "", _uid: 0 }]);
  const [saving, setSaving] = useState(false);

  const { data: templates = [] } = useQuery<ContractTemplate[]>({
    queryKey: ["contractTemplates"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listContractTemplates();
    },
    enabled: !!actor && !isFetching && open,
  });

  function resetForm() {
    setStep(1);
    setSelectedTemplate(null);
    setTitle("");
    setContractType(ContractType.license);
    setWorkId("");
    setLicenseId("");
    setFinancingOfferId("");
    setTerms("");
    setParties([{ name: "", role: "", principalId: "", _uid: 0 }]);
  }

  function handleSelectTemplate(tpl: ContractTemplate) {
    setSelectedTemplate(tpl);
    setContractType(tpl.contractType as ContractType);
    setTerms(tpl.bodyTemplate);
    setStep(2);
  }

  function addParty() {
    setParties((p) => [
      ...p,
      { name: "", role: "", principalId: "", _uid: Date.now() },
    ]);
  }

  function removeParty(i: number) {
    setParties((p) => p.filter((_, idx) => idx !== i));
  }

  function updateParty(i: number, field: keyof ContractParty, val: string) {
    setParties((p) =>
      p.map((party, idx) => (idx === i ? { ...party, [field]: val } : party)),
    );
  }

  async function handleSubmit() {
    if (!actor || !title.trim()) return;
    setSaving(true);
    try {
      await (actor as any).createContract(
        orgId,
        contractType,
        selectedTemplate?.id ?? "",
        title.trim(),
        parties.filter((p) => p.name.trim()),
        workId.trim(),
        licenseId.trim(),
        financingOfferId.trim(),
        terms,
      );
      toast.success("Contract created");
      setOpen(false);
      resetForm();
      onCreated();
    } catch {
      toast.error("Failed to create contract");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => {
          setOpen(true);
          resetForm();
        }}
        data-ocid="contract.new.open_modal_button"
      >
        <Plus className="w-4 h-4 mr-1" /> New Contract
      </Button>
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="contract.new.dialog"
        >
          <DialogHeader>
            <DialogTitle>New Contract — Step {step} of 3</DialogTitle>
          </DialogHeader>

          {/* Step 1: Select template */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Select a template to pre-fill the contract terms, or skip to
                enter terms manually.
              </p>
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No templates available.
                </p>
              ) : (
                <div className="space-y-2">
                  {templates.map((tpl) => (
                    <button
                      type="button"
                      key={tpl.id}
                      className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                      onClick={() => handleSelectTemplate(tpl)}
                    >
                      <p className="font-medium text-sm">{tpl.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {tpl.contractType}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setStep(2);
                  }}
                >
                  Skip — Enter Manually
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 2: Fill details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Contract Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sync License — Midnight Echo"
                  data-ocid="contract.title.input"
                />
              </div>
              <div className="space-y-1">
                <Label>Contract Type</Label>
                <Select
                  value={contractType}
                  onValueChange={(v) => setContractType(v as ContractType)}
                >
                  <SelectTrigger data-ocid="contract.type.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ContractType.license}>
                      License
                    </SelectItem>
                    <SelectItem value={ContractType.financing}>
                      Financing
                    </SelectItem>
                    <SelectItem value={ContractType.custom}>Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Work ID (optional)</Label>
                  <Input
                    value={workId}
                    onChange={(e) => setWorkId(e.target.value)}
                    placeholder="work-id"
                    data-ocid="contract.workid.input"
                  />
                </div>
                <div className="space-y-1">
                  <Label>License ID (optional)</Label>
                  <Input
                    value={licenseId}
                    onChange={(e) => setLicenseId(e.target.value)}
                    placeholder="license-id"
                    data-ocid="contract.licenseid.input"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Financing ID (optional)</Label>
                  <Input
                    value={financingOfferId}
                    onChange={(e) => setFinancingOfferId(e.target.value)}
                    placeholder="offer-id"
                    data-ocid="contract.financingid.input"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Terms</Label>
                <Textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={7}
                  className="font-mono text-xs"
                  placeholder="Enter the full contract terms here..."
                  data-ocid="contract.terms.textarea"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!title.trim()}>
                  Next: Add Parties
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 3: Parties */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Contract Parties</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addParty}
                  data-ocid="contract.party.button"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Party
                </Button>
              </div>
              {parties.map((party, i) => (
                <div
                  key={party._uid}
                  className="grid grid-cols-3 gap-2 p-3 rounded-lg border border-border/50"
                  data-ocid={`contract.party.item.${i + 1}`}
                >
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input
                      value={party.name}
                      onChange={(e) => updateParty(i, "name", e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Role</Label>
                    <Input
                      value={party.role}
                      onChange={(e) => updateParty(i, "role", e.target.value)}
                      placeholder="e.g. Licensor"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Principal ID</Label>
                    <div className="flex gap-1">
                      <Input
                        value={party.principalId}
                        onChange={(e) =>
                          updateParty(i, "principalId", e.target.value)
                        }
                        placeholder="principal-id"
                        className="text-xs"
                      />
                      {parties.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => removeParty(i)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving || !title.trim()}
                  data-ocid="contract.new.submit_button"
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Contract
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── ContractRow ────────────────────────────────────────────────────────────────

function ContractRow({
  contract,
  index,
  isAdmin,
  currentPrincipal,
  onRefresh,
}: {
  contract: Contract;
  index: number;
  isAdmin: boolean;
  currentPrincipal: string;
  onRefresh: () => void;
}) {
  const { actor } = useActor();
  const [expanded, setExpanded] = useState(false);
  const [confirm, setConfirm] = useState<null | "propose" | "approve" | "void">(
    null,
  );
  const [editOpen, setEditOpen] = useState(false);
  const [editTerms, setEditTerms] = useState(contract.terms);

  const selfApprovalBlocked =
    confirm === "approve" && contract.proposedBy === currentPrincipal;

  const actionMutation = useMutation({
    mutationFn: async (action: "propose" | "approve" | "void") => {
      if (!actor) throw new Error("No actor");
      if (action === "propose")
        return (actor as any).proposeContractExecution(contract.id);
      if (action === "approve")
        return (actor as any).approveContractExecution(contract.id);
      return (actor as any).voidContract(contract.id);
    },
    onSuccess: () => {
      toast.success(
        confirm === "propose"
          ? "Execution proposed"
          : confirm === "approve"
            ? "Contract executed"
            : "Contract voided",
      );
      setConfirm(null);
      onRefresh();
    },
    onError: () => {
      toast.error("Action failed");
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return (actor as any).updateContractTerms(contract.id, editTerms);
    },
    onSuccess: () => {
      toast.success("Terms updated");
      setEditOpen(false);
      onRefresh();
    },
    onError: () => {
      toast.error("Failed to update terms");
    },
  });

  return (
    <>
      <tr
        className="border-b border-border/50 hover:bg-muted/10 transition-colors"
        data-ocid={`contract.item.${index}`}
      >
        <td className="px-4 py-3">
          <button
            type="button"
            className="flex items-center gap-2 text-left"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className="font-medium text-sm">{contract.title}</span>
          </button>
        </td>
        <td className="px-4 py-3">
          <Badge variant="outline" className="capitalize text-xs">
            {contract.contractType}
          </Badge>
        </td>
        <td className="px-4 py-3">{statusBadge(contract.status)}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {contract.parties.length}
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {fmtDate(contract.createdAt)}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => printContract(contract)}
              data-ocid={`contract.print.button.${index}`}
              title="Print / Export PDF"
            >
              <Printer className="w-3.5 h-3.5" />
            </Button>
            {contract.status === ContractStatus.draft && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditTerms(contract.terms);
                    setEditOpen(true);
                  }}
                  data-ocid={`contract.edit_button.${index}`}
                >
                  Edit
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary"
                    onClick={() => setConfirm("propose")}
                    data-ocid={`contract.propose.button.${index}`}
                  >
                    Propose
                  </Button>
                )}
              </>
            )}
            {contract.status === ContractStatus.pendingApproval && isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300"
                onClick={() => setConfirm("approve")}
                data-ocid={`contract.approve.button.${index}`}
              >
                Approve
              </Button>
            )}
            {contract.status !== ContractStatus.voided && isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirm("void")}
                data-ocid={`contract.delete_button.${index}`}
              >
                Void
              </Button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded details */}
      {expanded && (
        <tr className="bg-muted/5 border-b border-border/50">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Parties
                </p>
                {contract.parties.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No parties
                  </p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="text-left pb-1">Name</th>
                        <th className="text-left pb-1">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contract.parties.map((p, pi) => (
                        <tr key={`${p.principalId}-${pi}`}>
                          <td className="py-0.5 pr-4">{p.name}</td>
                          <td className="py-0.5">{p.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {(contract.workId ||
                  contract.licenseId ||
                  contract.financingOfferId) && (
                  <div className="mt-3 space-y-1">
                    {contract.workId && (
                      <p className="text-xs text-muted-foreground">
                        Work:{" "}
                        <code className="text-foreground/70">
                          {contract.workId}
                        </code>
                      </p>
                    )}
                    {contract.licenseId && (
                      <p className="text-xs text-muted-foreground">
                        License:{" "}
                        <code className="text-foreground/70">
                          {contract.licenseId}
                        </code>
                      </p>
                    )}
                    {contract.financingOfferId && (
                      <p className="text-xs text-muted-foreground">
                        Financing:{" "}
                        <code className="text-foreground/70">
                          {contract.financingOfferId}
                        </code>
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Terms
                </p>
                <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-mono bg-muted/30 rounded p-3 max-h-40 overflow-y-auto">
                  {contract.terms || "(no terms)"}
                </pre>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Edit terms dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl" data-ocid="contract.edit.dialog">
          <DialogHeader>
            <DialogTitle>Edit Terms — {contract.title}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editTerms}
            onChange={(e) => setEditTerms(e.target.value)}
            rows={10}
            className="font-mono text-xs"
            data-ocid="contract.edit.textarea"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              data-ocid="contract.edit.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => editMutation.mutate()}
              disabled={editMutation.isPending}
              data-ocid="contract.edit.save_button"
            >
              {editMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save Terms
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm === "propose"
            ? "Propose Execution"
            : confirm === "approve"
              ? "Approve & Execute Contract"
              : "Void Contract"
        }
        description={
          selfApprovalBlocked
            ? "⚠️ Self-approval is blocked. You cannot approve a contract you proposed."
            : confirm === "propose"
              ? `Propose "${contract.title}" for execution? A second admin must approve before it is executed.`
              : confirm === "approve"
                ? `Mark "${contract.title}" as executed? This action cannot be undone.`
                : `Void "${contract.title}"? This action cannot be undone.`
        }
        loading={actionMutation.isPending}
        danger={confirm === "void"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (selfApprovalBlocked) {
            toast.error("Self-approval is blocked.");
            setConfirm(null);
            return;
          }
          if (confirm) actionMutation.mutate(confirm);
        }}
      />
    </>
  );
}

// ─── ContractsTab ──────────────────────────────────────────────────────────────

function ContractsTab({
  isAdmin,
  currentPrincipal,
}: {
  isAdmin: boolean;
  currentPrincipal: string;
}) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const { data: orgs = [] } = useOrganizations();
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const orgId = selectedOrgId || orgs[0]?.id || "";

  const {
    data: contracts = [],
    isLoading,
    refetch,
  } = useQuery<Contract[]>({
    queryKey: ["contracts", orgId],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      return (actor as any).getContractsByOrg(orgId);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });

  function refresh() {
    refetch();
    qc.invalidateQueries({ queryKey: ["contracts", orgId] });
  }

  const total = contracts.length;
  const pending = contracts.filter(
    (c) => c.status === ContractStatus.pendingApproval,
  ).length;
  const executed = contracts.filter(
    (c) => c.status === ContractStatus.executed,
  ).length;

  return (
    <div className="space-y-4">
      {/* Org selector + new */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={orgId} onValueChange={setSelectedOrgId}>
          <SelectTrigger className="w-52" data-ocid="contract.org.select">
            <SelectValue placeholder="Select Organization" />
          </SelectTrigger>
          <SelectContent>
            {orgs.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {orgId && <NewContractDialog orgId={orgId} onCreated={refresh} />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-muted/20 border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">{total}</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-yellow-400">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-400">{pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-green-400">Executed</p>
            <p className="text-2xl font-bold text-green-400">{executed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Contracts table */}
      {isLoading ? (
        <div
          className="flex items-center justify-center py-12"
          data-ocid="contract.list.loading_state"
        >
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : contracts.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="contract.list.empty_state"
        >
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {orgId
              ? "No contracts for this organization."
              : "Select an organization."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm" data-ocid="contract.list.table">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Title
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Type
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Parties
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Created
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {contracts.map((c, i) => (
                <ContractRow
                  key={c.id}
                  contract={c}
                  index={i + 1}
                  isAdmin={isAdmin}
                  currentPrincipal={currentPrincipal}
                  onRefresh={refresh}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── ContractGenerator (main export) ──────────────────────────────────────────

export function ContractGenerator() {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const currentPrincipal = identity?.getPrincipal().toString() ?? "";

  useEffect(() => {
    if (!isFetching && actor) {
      (actor as any)
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
          <ScrollText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">
            {t("contractGenerator")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("contractGeneratorDesc")}
          </p>
        </div>
        {checkingAdmin && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />
        )}
        {isAdmin && !checkingAdmin && (
          <Badge
            variant="outline"
            className="ml-auto border-primary/40 text-primary"
          >
            Admin
          </Badge>
        )}
      </div>

      <Tabs defaultValue="contracts">
        <TabsList className="bg-muted/40">
          <TabsTrigger value="contracts" data-ocid="contract.contracts.tab">
            {t("contracts")}
          </TabsTrigger>
          <TabsTrigger value="templates" data-ocid="contract.templates.tab">
            {t("contractTemplates")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="mt-4">
          <ContractsTab isAdmin={isAdmin} currentPrincipal={currentPrincipal} />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TemplatesTab isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
