import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { useTranslation } from "@/i18n";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Layers,
  Loader2,
  Pause,
  Play,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SAMPLE_WORKS = [
  { id: "w1", title: "Midnight Reverie" },
  { id: "w2", title: "Cascading Frequencies" },
  { id: "w3", title: "Neon Serenade" },
  { id: "w4", title: "Hollow Echoes" },
  { id: "w5", title: "Solar Drift" },
];

const TERRITORIES = [
  "North America",
  "Europe",
  "Latin America",
  "Asia Pacific",
  "Africa",
  "Middle East",
];

const CURRENT_ADMIN = "admin1";

type CsvRow = {
  title: string;
  iswc: string;
  genre: string;
  type: string;
  organization: string;
  valid: boolean;
  errors: string[];
  status?: "pending" | "success" | "error";
};

type SplitRow = { id: string; principal: string; percentage: string };

type RoyaltyRule = {
  id: string;
  work: string;
  org: string;
  territory: string;
  threshold: string;
  action: string;
  status: "active" | "paused";
  pendingDeletion?: boolean;
  deletionProposedBy?: string;
};

const SAMPLE_CSV = `Title,ISWC,Genre,Type,Organization
Midnight Sonata,T-123456789-0,Classical,Original,Harmony Rights
Blue Horizon,T-987654321-0,Jazz,Cover,Blue Note Publishing
Urban Pulse,INVALID-ISWC,Hip-Hop,Original,Metro Music Group
Silent Storm,,Electronic,Remix,Storm Records`;

function parseCsv(raw: string): CsvRow[] {
  const lines = raw.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const rows = lines.slice(1);
  return rows.map((line) => {
    const [title, iswc, genre, type, organization] = line
      .split(",")
      .map((s) => s.trim());
    const errors: string[] = [];
    if (!title) errors.push("Title required");
    if (!iswc) errors.push("ISWC required");
    else if (!/^T-\d{9}-\d$/.test(iswc)) errors.push("Invalid ISWC format");
    if (!genre) errors.push("Genre required");
    if (!organization) errors.push("Organization required");
    return {
      title: title ?? "",
      iswc: iswc ?? "",
      genre: genre ?? "",
      type: type ?? "",
      organization: organization ?? "",
      valid: errors.length === 0,
      errors,
    };
  });
}

export default function BatchOperations() {
  const { t } = useTranslation();

  // Tab 1 state
  const [csvText, setCsvText] = useState("");
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [parsed, setParsed] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerProgress, setRegisterProgress] = useState(0);
  const [registerDone, setRegisterDone] = useState(false);

  // Tab 2 state — splits
  const [selectedWork, setSelectedWork] = useState("");
  const [splitRows, setSplitRows] = useState<SplitRow[]>([
    { id: "s1", principal: "", percentage: "" },
  ]);
  // Tab 2 state — territories
  const [selectedTerritoryWorks, setSelectedTerritoryWorks] = useState<
    string[]
  >([]);
  const [selectedTerritories, setSelectedTerritories] = useState<string[]>([]);

  // Tab 3 state
  const [ruleWork, setRuleWork] = useState("all");
  const [ruleOrg, setRuleOrg] = useState("all");
  const [ruleTerritory, setRuleTerritory] = useState("all");
  const [ruleThreshold, setRuleThreshold] = useState("");
  const [ruleAction, setRuleAction] = useState("generateStatement");
  const [rules, setRules] = useState<RoyaltyRule[]>([
    {
      id: "r1",
      work: "All Works",
      org: "All Orgs",
      territory: "Europe",
      threshold: "5000",
      action: "Generate Statement",
      status: "active",
    },
    {
      id: "r2",
      work: "Midnight Reverie",
      org: "All Orgs",
      territory: "All",
      threshold: "1000",
      action: "Generate Statement",
      status: "paused",
    },
  ]);

  const splitTotal = splitRows.reduce(
    (sum, r) => sum + (Number.parseFloat(r.percentage) || 0),
    0,
  );

  function handleParse() {
    const rows = parseCsv(csvText);
    setCsvRows(rows);
    setParsed(true);
    setRegisterDone(false);
    setRegisterProgress(0);
  }

  function handleRegisterAll() {
    const valid = csvRows.filter((r) => r.valid);
    if (!valid.length) return;
    setRegistering(true);
    setRegisterProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setRegistering(false);
        setRegisterDone(true);
        setCsvRows((prev) =>
          prev.map((r) => ({ ...r, status: r.valid ? "success" : "error" })),
        );
        toast.success(`${valid.length} work(s) registered successfully`);
      }
      setRegisterProgress(Math.min(progress, 100));
    }, 350);
  }

  function addSplitRow() {
    setSplitRows((prev) => [
      ...prev,
      { id: `s${Date.now()}`, principal: "", percentage: "" },
    ]);
  }

  function updateSplitRow(
    id: string,
    field: "principal" | "percentage",
    value: string,
  ) {
    setSplitRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  }

  function removeSplitRow(id: string) {
    setSplitRows((prev) => prev.filter((r) => r.id !== id));
  }

  function handleSubmitSplits() {
    if (!selectedWork) {
      toast.error("Select a work first");
      return;
    }
    if (Math.abs(splitTotal - 100) > 0.01) {
      toast.error("Total must equal 100%");
      return;
    }
    toast.success("Split assignments submitted");
  }

  function toggleTerritoryWork(id: string) {
    setSelectedTerritoryWorks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleTerritory(ter: string) {
    setSelectedTerritories((prev) =>
      prev.includes(ter) ? prev.filter((x) => x !== ter) : [...prev, ter],
    );
  }

  function handleApplyCoverage() {
    if (!selectedTerritoryWorks.length) {
      toast.error("Select at least one work");
      return;
    }
    if (!selectedTerritories.length) {
      toast.error("Select at least one territory");
      return;
    }
    toast.success(
      `Coverage applied to ${selectedTerritoryWorks.length} work(s) across ${selectedTerritories.length} territory(ies)`,
    );
  }

  function handleAddRule() {
    if (!ruleThreshold) {
      toast.error("Enter a revenue threshold");
      return;
    }
    const newRule: RoyaltyRule = {
      id: `r${Date.now()}`,
      work:
        ruleWork === "all"
          ? "All Works"
          : (SAMPLE_WORKS.find((w) => w.id === ruleWork)?.title ?? ruleWork),
      org: ruleOrg === "all" ? "All Orgs" : ruleOrg,
      territory: ruleTerritory === "all" ? "All" : ruleTerritory,
      threshold: ruleThreshold,
      action: "Generate Statement",
      status: "active",
    };
    setRules((prev) => [...prev, newRule]);
    setRuleThreshold("");
    toast.success("Royalty rule created");
  }

  function toggleRuleStatus(id: string) {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "active" ? "paused" : "active" }
          : r,
      ),
    );
  }

  function proposeDeleteRule(id: string) {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, pendingDeletion: true, deletionProposedBy: CURRENT_ADMIN }
          : r,
      ),
    );
    toast.success("Deletion proposed — awaiting second admin approval");
  }

  function confirmDeleteRule(id: string) {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    if (rule.deletionProposedBy === CURRENT_ADMIN) {
      toast.error("Self-approval blocked — a different admin must confirm");
      return;
    }
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast.success("Rule deleted");
  }

  const validCount = csvRows.filter((r) => r.valid).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
          <Layers className="h-6 w-6" />
          {t("batchOperations")}
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Bulk registration, split/territory assignment, and automated royalty
          rules
        </p>
      </div>

      <Tabs defaultValue="bulkRegister" data-ocid="batch.tab">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger
            value="bulkRegister"
            className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900"
            data-ocid="batch.bulk_register.tab"
          >
            <FileText className="h-4 w-4 mr-2" />
            Bulk Work Registration
          </TabsTrigger>
          <TabsTrigger
            value="splitTerritory"
            className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900"
            data-ocid="batch.split_territory.tab"
          >
            <Layers className="h-4 w-4 mr-2" />
            Split & Territory
          </TabsTrigger>
          <TabsTrigger
            value="royaltyRules"
            className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900"
            data-ocid="batch.royalty_rules.tab"
          >
            <Play className="h-4 w-4 mr-2" />
            Royalty Rules
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Bulk Work Registration */}
        <TabsContent value="bulkRegister" className="space-y-4 mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-amber-400 text-lg">
                Bulk Work Registration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Paste CSV data below to register multiple works at once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-900 rounded p-3 text-xs font-mono text-slate-400 border border-slate-700">
                <p className="text-amber-400 font-semibold mb-1">
                  Expected CSV format:
                </p>
                <p>Title,ISWC,Genre,Type,Organization</p>
                <p>My Song,T-123456789-0,Pop,Original,My Publishing Co</p>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">CSV Data</Label>
                <Textarea
                  data-ocid="batch.bulk_register.textarea"
                  value={csvText}
                  onChange={(e) => {
                    setCsvText(e.target.value);
                    setParsed(false);
                    setRegisterDone(false);
                  }}
                  placeholder={SAMPLE_CSV}
                  className="bg-slate-900 border-slate-700 text-slate-200 font-mono text-xs h-40"
                />
              </div>
              <Button
                data-ocid="batch.bulk_register.parse_button"
                onClick={handleParse}
                disabled={!csvText.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold"
              >
                Parse &amp; Preview
              </Button>

              {parsed && csvRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-300 text-sm">
                      {csvRows.length} row(s) parsed —
                    </span>
                    <Badge className="bg-emerald-900 text-emerald-300">
                      {validCount} valid
                    </Badge>
                    <Badge className="bg-red-900 text-red-300">
                      {csvRows.length - validCount} invalid
                    </Badge>
                  </div>
                  <div className="rounded border border-slate-700 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-900 border-slate-700">
                          <TableHead className="text-amber-400">
                            Status
                          </TableHead>
                          <TableHead className="text-amber-400">
                            Title
                          </TableHead>
                          <TableHead className="text-amber-400">ISWC</TableHead>
                          <TableHead className="text-amber-400">
                            Genre
                          </TableHead>
                          <TableHead className="text-amber-400">Type</TableHead>
                          <TableHead className="text-amber-400">
                            Organization
                          </TableHead>
                          <TableHead className="text-amber-400">
                            Issues
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvRows.map((row, i) => (
                          <TableRow
                            key={`${row.title}-${row.iswc}`}
                            className="border-slate-700 hover:bg-slate-750"
                            data-ocid={`batch.bulk_register.item.${i + 1}`}
                          >
                            <TableCell>
                              {row.status === "success" ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              ) : row.status === "error" ? (
                                <XCircle className="h-4 w-4 text-red-400" />
                              ) : row.valid ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-400" />
                              )}
                            </TableCell>
                            <TableCell className="text-slate-200">
                              {row.title || "—"}
                            </TableCell>
                            <TableCell className="text-slate-300 font-mono text-xs">
                              {row.iswc || "—"}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {row.genre || "—"}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {row.type || "—"}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {row.organization || "—"}
                            </TableCell>
                            <TableCell className="text-red-400 text-xs">
                              {row.errors.join("; ") || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {registering && (
                    <div
                      className="space-y-2"
                      data-ocid="batch.bulk_register.loading_state"
                    >
                      <p className="text-slate-400 text-sm">
                        Registering works…
                      </p>
                      <Progress
                        value={registerProgress}
                        className="h-2 bg-slate-700"
                      />
                    </div>
                  )}

                  {!registerDone && !registering && validCount > 0 && (
                    <Button
                      data-ocid="batch.bulk_register.submit_button"
                      onClick={handleRegisterAll}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                    >
                      Register {validCount} Valid Work(s)
                    </Button>
                  )}

                  {registerDone && (
                    <div
                      className="flex items-center gap-2 text-emerald-400"
                      data-ocid="batch.bulk_register.success_state"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">
                        Registration complete — {validCount} works added to
                        registry.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {parsed && csvRows.length === 0 && (
                <div
                  className="flex items-center gap-2 text-red-400"
                  data-ocid="batch.bulk_register.error_state"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    No rows found. Ensure the CSV includes a header row and at
                    least one data row.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Split & Territory */}
        <TabsContent value="splitTerritory" className="space-y-4 mt-4">
          {/* Bulk Splits */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-amber-400 text-lg">
                A — Bulk Split Assignment
              </CardTitle>
              <CardDescription className="text-slate-400">
                Select a work and define ownership split percentages. Total must
                equal 100%.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Work</Label>
                <Select value={selectedWork} onValueChange={setSelectedWork}>
                  <SelectTrigger
                    className="bg-slate-900 border-slate-700 text-slate-200"
                    data-ocid="batch.split.select"
                  >
                    <SelectValue placeholder="Select a work…" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {SAMPLE_WORKS.map((w) => (
                      <SelectItem
                        key={w.id}
                        value={w.id}
                        className="text-slate-200"
                      >
                        {w.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded border border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-900 border-slate-700">
                      <TableHead className="text-amber-400">
                        Principal / Payee Name
                      </TableHead>
                      <TableHead className="text-amber-400">
                        Percentage (%)
                      </TableHead>
                      <TableHead className="text-amber-400 w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {splitRows.map((row, i) => (
                      <TableRow
                        key={row.id}
                        className="border-slate-700"
                        data-ocid={`batch.split.item.${i + 1}`}
                      >
                        <TableCell>
                          <Input
                            value={row.principal}
                            onChange={(e) =>
                              updateSplitRow(
                                row.id,
                                "principal",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. Jane Doe"
                            className="bg-slate-900 border-slate-700 text-slate-200 h-8"
                            data-ocid={`batch.split.input.${i + 1}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.percentage}
                            onChange={(e) =>
                              updateSplitRow(
                                row.id,
                                "percentage",
                                e.target.value,
                              )
                            }
                            placeholder="0"
                            type="number"
                            min="0"
                            max="100"
                            className="bg-slate-900 border-slate-700 text-slate-200 h-8 w-24"
                            data-ocid={`batch.split.percentage_input.${i + 1}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeSplitRow(row.id)}
                            className="text-red-400 hover:text-red-300 h-8 w-8"
                            data-ocid={`batch.split.delete_button.${i + 1}`}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSplitRow}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  data-ocid="batch.split.secondary_button"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Row
                </Button>
                <span
                  className={`text-sm font-mono ${Math.abs(splitTotal - 100) < 0.01 ? "text-emerald-400" : splitTotal > 100 ? "text-red-400" : "text-amber-400"}`}
                >
                  Total: {splitTotal.toFixed(2)}%
                  {Math.abs(splitTotal - 100) < 0.01 && " ✓"}
                  {splitTotal > 100 && " (exceeds 100%)"}
                </span>
              </div>

              <Button
                onClick={handleSubmitSplits}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold"
                data-ocid="batch.split.submit_button"
              >
                Submit Split Assignments
              </Button>
            </CardContent>
          </Card>

          {/* Bulk Territory Coverage */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-amber-400 text-lg">
                B — Bulk Territory Coverage
              </CardTitle>
              <CardDescription className="text-slate-400">
                Select works and apply territory coverage in bulk.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-slate-300 mb-3 block">Works</Label>
                  <div className="space-y-2">
                    {SAMPLE_WORKS.map((w, i) => (
                      <div
                        key={w.id}
                        className="flex items-center gap-2"
                        data-ocid={`batch.territory.works.item.${i + 1}`}
                      >
                        <Checkbox
                          id={`tw-${w.id}`}
                          checked={selectedTerritoryWorks.includes(w.id)}
                          onCheckedChange={() => toggleTerritoryWork(w.id)}
                          className="border-slate-600 data-[state=checked]:bg-amber-500"
                          data-ocid={`batch.territory.works.checkbox.${i + 1}`}
                        />
                        <label
                          htmlFor={`tw-${w.id}`}
                          className="text-slate-200 text-sm cursor-pointer"
                        >
                          {w.title}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300 mb-3 block">
                    Territories
                  </Label>
                  <div className="space-y-2">
                    {TERRITORIES.map((ter, i) => (
                      <div
                        key={ter}
                        className="flex items-center gap-2"
                        data-ocid={`batch.territory.regions.item.${i + 1}`}
                      >
                        <Checkbox
                          id={`ter-${ter}`}
                          checked={selectedTerritories.includes(ter)}
                          onCheckedChange={() => toggleTerritory(ter)}
                          className="border-slate-600 data-[state=checked]:bg-amber-500"
                          data-ocid={`batch.territory.regions.checkbox.${i + 1}`}
                        />
                        <label
                          htmlFor={`ter-${ter}`}
                          className="text-slate-200 text-sm cursor-pointer"
                        >
                          {ter}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                onClick={handleApplyCoverage}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold"
                data-ocid="batch.territory.submit_button"
              >
                Apply Coverage
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Automated Royalty Rules */}
        <TabsContent value="royaltyRules" className="space-y-4 mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-amber-400 text-lg">
                Create Royalty Rule
              </CardTitle>
              <CardDescription className="text-slate-400">
                Automatically trigger actions when revenue thresholds are met.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-slate-300">Work</Label>
                  <Select value={ruleWork} onValueChange={setRuleWork}>
                    <SelectTrigger
                      className="bg-slate-900 border-slate-700 text-slate-200"
                      data-ocid="batch.rule.work_select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="all" className="text-slate-200">
                        All Works
                      </SelectItem>
                      {SAMPLE_WORKS.map((w) => (
                        <SelectItem
                          key={w.id}
                          value={w.id}
                          className="text-slate-200"
                        >
                          {w.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Organization</Label>
                  <Select value={ruleOrg} onValueChange={setRuleOrg}>
                    <SelectTrigger
                      className="bg-slate-900 border-slate-700 text-slate-200"
                      data-ocid="batch.rule.org_select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="all" className="text-slate-200">
                        All Orgs
                      </SelectItem>
                      <SelectItem
                        value="Harmony Rights"
                        className="text-slate-200"
                      >
                        Harmony Rights
                      </SelectItem>
                      <SelectItem
                        value="Blue Note Publishing"
                        className="text-slate-200"
                      >
                        Blue Note Publishing
                      </SelectItem>
                      <SelectItem
                        value="Metro Music Group"
                        className="text-slate-200"
                      >
                        Metro Music Group
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Territory</Label>
                  <Select
                    value={ruleTerritory}
                    onValueChange={setRuleTerritory}
                  >
                    <SelectTrigger
                      className="bg-slate-900 border-slate-700 text-slate-200"
                      data-ocid="batch.rule.territory_select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="all" className="text-slate-200">
                        All Territories
                      </SelectItem>
                      {TERRITORIES.map((ter) => (
                        <SelectItem
                          key={ter}
                          value={ter}
                          className="text-slate-200"
                        >
                          {ter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Revenue Threshold (USD)
                  </Label>
                  <Input
                    value={ruleThreshold}
                    onChange={(e) => setRuleThreshold(e.target.value)}
                    placeholder="e.g. 5000"
                    type="number"
                    min="0"
                    className="bg-slate-900 border-slate-700 text-slate-200"
                    data-ocid="batch.rule.threshold_input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Action</Label>
                  <Select value={ruleAction} onValueChange={setRuleAction}>
                    <SelectTrigger
                      className="bg-slate-900 border-slate-700 text-slate-200"
                      data-ocid="batch.rule.action_select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem
                        value="generateStatement"
                        className="text-slate-200"
                      >
                        Generate Statement
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleAddRule}
                className="mt-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold"
                data-ocid="batch.rule.submit_button"
              >
                <Plus className="h-4 w-4 mr-2" /> Create Rule
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-amber-400 text-lg">
                Active Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div
                  className="text-slate-500 text-center py-8"
                  data-ocid="batch.rule.empty_state"
                >
                  No royalty rules configured.
                </div>
              ) : (
                <div className="rounded border border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-900 border-slate-700">
                        <TableHead className="text-amber-400">Work</TableHead>
                        <TableHead className="text-amber-400">Org</TableHead>
                        <TableHead className="text-amber-400">
                          Territory
                        </TableHead>
                        <TableHead className="text-amber-400">
                          Threshold
                        </TableHead>
                        <TableHead className="text-amber-400">Action</TableHead>
                        <TableHead className="text-amber-400">Status</TableHead>
                        <TableHead className="text-amber-400">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.map((rule, i) => (
                        <TableRow
                          key={rule.id}
                          className="border-slate-700 hover:bg-slate-750"
                          data-ocid={`batch.rule.item.${i + 1}`}
                        >
                          <TableCell className="text-slate-200">
                            {rule.work}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {rule.org}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {rule.territory}
                          </TableCell>
                          <TableCell className="text-slate-300 font-mono">
                            ${Number(rule.threshold).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {rule.action}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={
                                  rule.status === "active"
                                    ? "bg-emerald-900 text-emerald-300"
                                    : "bg-slate-700 text-slate-400"
                                }
                              >
                                {rule.status === "active" ? "Active" : "Paused"}
                              </Badge>
                              {rule.pendingDeletion && (
                                <Badge className="bg-red-900 text-red-300">
                                  Pending Deletion
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => toggleRuleStatus(rule.id)}
                                className="h-7 w-7 text-slate-400 hover:text-amber-400"
                                title={
                                  rule.status === "active" ? "Pause" : "Resume"
                                }
                                data-ocid={`batch.rule.toggle.${i + 1}`}
                              >
                                {rule.status === "active" ? (
                                  <Pause className="h-3.5 w-3.5" />
                                ) : (
                                  <Play className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              {!rule.pendingDeletion ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => proposeDeleteRule(rule.id)}
                                  className="h-7 w-7 text-red-400 hover:text-red-300"
                                  title="Propose deletion"
                                  data-ocid={`batch.rule.delete_button.${i + 1}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => confirmDeleteRule(rule.id)}
                                  className="h-7 text-xs bg-red-700 hover:bg-red-600 text-white"
                                  data-ocid={`batch.rule.confirm_button.${i + 1}`}
                                >
                                  Confirm Delete
                                </Button>
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
      </Tabs>
    </div>
  );
}
