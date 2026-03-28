import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Globe,
  Key,
  Music,
  Rocket,
  ShoppingBag,
  Users,
  Webhook,
} from "lucide-react";
import { useState } from "react";

type OrgType =
  | "Label"
  | "Publisher"
  | "PRO"
  | "Independent"
  | "Distributor"
  | "";
type Role = "Admin" | "User" | "Guest";
type Genre =
  | "Pop"
  | "Rock"
  | "Jazz"
  | "Electronic"
  | "Classical"
  | "R&B"
  | "Hip-Hop"
  | "Other"
  | "";
type Language = "English" | "Español" | "Français" | "Português" | "日本語";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface Work {
  id: string;
  title: string;
  isrc: string;
  genre: Genre;
}

interface FormData {
  orgName: string;
  orgType: OrgType;
  country: string;
  website: string;
  description: string;
  teamMembers: TeamMember[];
  works: Work[];
  integrations: {
    marketplace: boolean;
    apiAccess: boolean;
    webhooks: boolean;
    multiLanguage: boolean;
  };
  language: Language;
}

const STEPS = [
  { label: "Organization", num: 1 },
  { label: "Team", num: 2 },
  { label: "Works", num: 3 },
  { label: "Settings", num: 4 },
  { label: "Review", num: 5 },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.num} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                currentStep === step.num
                  ? "bg-primary border-primary text-primary-foreground"
                  : currentStep > step.num
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-sidebar-accent border-border text-muted-foreground"
              }`}
            >
              {currentStep > step.num ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                step.num
              )}
            </div>
            <span
              className={`text-[10px] font-medium hidden sm:block ${
                currentStep === step.num
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`w-12 sm:w-16 h-0.5 mb-4 mx-1 ${
                currentStep > step.num ? "bg-primary/60" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Step1({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="orgName">
          Organization Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="orgName"
          data-ocid="onboarding.orgName.input"
          placeholder="e.g. Sundown Records"
          value={data.orgName}
          onChange={(e) => onChange({ orgName: e.target.value })}
          className="bg-sidebar-accent border-border"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="orgType">
          Organization Type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.orgType}
          onValueChange={(v) => onChange({ orgType: v as OrgType })}
        >
          <SelectTrigger
            data-ocid="onboarding.orgType.select"
            className="bg-sidebar-accent border-border"
          >
            <SelectValue placeholder="Select type…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Label">Label</SelectItem>
            <SelectItem value="Publisher">Publisher</SelectItem>
            <SelectItem value="PRO">PRO</SelectItem>
            <SelectItem value="Independent">Independent</SelectItem>
            <SelectItem value="Distributor">Distributor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            data-ocid="onboarding.country.input"
            placeholder="e.g. United States"
            value={data.country}
            onChange={(e) => onChange({ country: e.target.value })}
            className="bg-sidebar-accent border-border"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website">Website (optional)</Label>
          <Input
            id="website"
            data-ocid="onboarding.website.input"
            placeholder="https://"
            value={data.website}
            onChange={(e) => onChange({ website: e.target.value })}
            className="bg-sidebar-accent border-border"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          data-ocid="onboarding.description.textarea"
          placeholder="Tell us about your organization…"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="bg-sidebar-accent border-border resize-none"
          rows={3}
        />
      </div>
    </div>
  );
}

function Step2({
  data,
  onChange,
  onSkip,
}: {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onSkip: () => void;
}) {
  const addMember = () => {
    if (data.teamMembers.length >= 5) return;
    onChange({
      teamMembers: [
        ...data.teamMembers,
        { id: crypto.randomUUID(), name: "", email: "", role: "User" },
      ],
    });
  };

  const updateMember = (id: string, field: keyof TeamMember, value: string) => {
    onChange({
      teamMembers: data.teamMembers.map((m) =>
        m.id === id ? { ...m, [field]: value } : m,
      ),
    });
  };

  const removeMember = (id: string) => {
    onChange({ teamMembers: data.teamMembers.filter((m) => m.id !== id) });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Invite up to 5 team members to your organization. You can always add
        more later.
      </p>

      {data.teamMembers.length === 0 && (
        <div className="text-center py-8 rounded-lg border border-dashed border-border">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No team members added yet.
          </p>
        </div>
      )}

      {data.teamMembers.map((member, i) => (
        <div
          key={member.id}
          data-ocid={`onboarding.team_member.item.${i + 1}`}
          className="p-4 rounded-lg border border-border bg-sidebar-accent/40 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Member {i + 1}
            </span>
            <button
              type="button"
              data-ocid={`onboarding.team_member.delete_button.${i + 1}`}
              onClick={() => removeMember(member.id)}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Full name"
              value={member.name}
              onChange={(e) => updateMember(member.id, "name", e.target.value)}
              className="bg-sidebar border-border"
            />
            <Input
              placeholder="Email address"
              type="email"
              value={member.email}
              onChange={(e) => updateMember(member.id, "email", e.target.value)}
              className="bg-sidebar border-border"
            />
            <Select
              value={member.role}
              onValueChange={(v) => updateMember(member.id, "role", v)}
            >
              <SelectTrigger className="bg-sidebar border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Guest">Guest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        {data.teamMembers.length < 5 && (
          <Button
            type="button"
            data-ocid="onboarding.add_member.button"
            variant="outline"
            size="sm"
            onClick={addMember}
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            <Users className="w-4 h-4 mr-1" />
            Add Member
          </Button>
        )}
        <Button
          type="button"
          data-ocid="onboarding.skip_team.button"
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="text-muted-foreground"
        >
          Skip for now →
        </Button>
      </div>
    </div>
  );
}

function Step3({
  data,
  onChange,
  onSkip,
}: {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onSkip: () => void;
}) {
  const addWork = () => {
    if (data.works.length >= 3) return;
    onChange({
      works: [
        ...data.works,
        { id: crypto.randomUUID(), title: "", isrc: "", genre: "" },
      ],
    });
  };

  const updateWork = (id: string, field: keyof Work, value: string) => {
    onChange({
      works: data.works.map((w) =>
        w.id === id ? { ...w, [field]: value } : w,
      ),
    });
  };

  const removeWork = (id: string) => {
    onChange({ works: data.works.filter((w) => w.id !== id) });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Register up to 3 initial works to seed your catalog. You can register
        more any time from Works Registry.
      </p>

      {data.works.length === 0 && (
        <div className="text-center py-8 rounded-lg border border-dashed border-border">
          <Music className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No works added yet.</p>
        </div>
      )}

      {data.works.map((work, i) => (
        <div
          key={work.id}
          data-ocid={`onboarding.work.item.${i + 1}`}
          className="p-4 rounded-lg border border-border bg-sidebar-accent/40 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Work {i + 1}
            </span>
            <button
              type="button"
              data-ocid={`onboarding.work.delete_button.${i + 1}`}
              onClick={() => removeWork(work.id)}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Work title *"
              value={work.title}
              onChange={(e) => updateWork(work.id, "title", e.target.value)}
              className="bg-sidebar border-border"
            />
            <Input
              placeholder="ISRC (optional)"
              value={work.isrc}
              onChange={(e) => updateWork(work.id, "isrc", e.target.value)}
              className="bg-sidebar border-border"
            />
            <Select
              value={work.genre}
              onValueChange={(v) => updateWork(work.id, "genre", v)}
            >
              <SelectTrigger className="bg-sidebar border-border">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Pop",
                  "Rock",
                  "Jazz",
                  "Electronic",
                  "Classical",
                  "R&B",
                  "Hip-Hop",
                  "Other",
                ].map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        {data.works.length < 3 && (
          <Button
            type="button"
            data-ocid="onboarding.add_work.button"
            variant="outline"
            size="sm"
            onClick={addWork}
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            <Music className="w-4 h-4 mr-1" />
            Add Work
          </Button>
        )}
        <Button
          type="button"
          data-ocid="onboarding.skip_works.button"
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="text-muted-foreground"
        >
          Skip for now →
        </Button>
      </div>
    </div>
  );
}

function Step4({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
}) {
  const toggleIntegration = (key: keyof typeof data.integrations) => {
    onChange({
      integrations: { ...data.integrations, [key]: !data.integrations[key] },
    });
  };

  const integrationOptions: {
    key: keyof typeof data.integrations;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: "marketplace",
      label: "Licensing Marketplace",
      description:
        "List works and accept license requests from buyers worldwide.",
      icon: <ShoppingBag className="w-5 h-5 text-primary" />,
    },
    {
      key: "apiAccess",
      label: "API Access",
      description: "Connect external systems using API keys and HTTP outcalls.",
      icon: <Key className="w-5 h-5 text-primary" />,
    },
    {
      key: "webhooks",
      label: "Webhook Notifications",
      description: "Push platform events to your own endpoints in real-time.",
      icon: <Webhook className="w-5 h-5 text-primary" />,
    },
    {
      key: "multiLanguage",
      label: "Multi-language Support",
      description: "Display the platform in your preferred language.",
      icon: <Globe className="w-5 h-5 text-primary" />,
    },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Choose which features to enable for your organization. You can change
        these at any time.
      </p>

      <div className="space-y-3">
        {integrationOptions.map(({ key, label, description, icon }) => (
          <button
            type="button"
            key={key}
            data-ocid={`onboarding.integration_${key}.toggle`}
            onClick={() => toggleIntegration(key)}
            className={`w-full flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all text-left ${
              data.integrations[key]
                ? "border-primary/50 bg-primary/5"
                : "border-border bg-sidebar-accent/30 hover:border-border/80"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {description}
              </p>
            </div>
            <Checkbox
              checked={data.integrations[key]}
              onCheckedChange={() => toggleIntegration(key)}
              className="mt-0.5"
            />
          </button>
        ))}
      </div>

      {data.integrations.multiLanguage && (
        <div className="space-y-1.5">
          <Label>Preferred Language</Label>
          <Select
            value={data.language}
            onValueChange={(v) => onChange({ language: v as Language })}
          >
            <SelectTrigger
              data-ocid="onboarding.language.select"
              className="bg-sidebar-accent border-border"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">🇺🇸 English</SelectItem>
              <SelectItem value="Español">🇪🇸 Español</SelectItem>
              <SelectItem value="Français">🇫🇷 Français</SelectItem>
              <SelectItem value="Português">🇧🇷 Português</SelectItem>
              <SelectItem value="日本語">🇯🇵 日本語</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function Step5({ data }: { data: FormData }) {
  const enabledIntegrations = Object.entries(data.integrations)
    .filter(([, v]) => v)
    .map(
      ([k]) =>
        ({
          marketplace: "Licensing Marketplace",
          apiAccess: "API Access",
          webhooks: "Webhooks",
          multiLanguage: "Multi-language",
        })[k],
    )
    .filter(Boolean);

  const summaryItems = [
    { label: "Organization Name", value: data.orgName || "—" },
    { label: "Type", value: data.orgType || "—" },
    { label: "Country", value: data.country || "—" },
    { label: "Website", value: data.website || "—" },
    {
      label: "Team Members",
      value:
        data.teamMembers.length > 0
          ? `${data.teamMembers.length} member(s)`
          : "None added",
    },
    {
      label: "Works",
      value:
        data.works.length > 0 ? `${data.works.length} work(s)` : "None added",
    },
    {
      label: "Integrations",
      value:
        enabledIntegrations.length > 0
          ? enabledIntegrations.join(", ")
          : "None selected",
    },
    {
      label: "Language",
      value: data.integrations.multiLanguage ? data.language : "English",
    },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Review your organization setup before launching. Everything looks good?
        Let's go!
      </p>
      <div className="rounded-lg border border-border overflow-hidden">
        {summaryItems.map(({ label, value }, i) => (
          <div
            key={label}
            className={`flex items-center gap-3 px-4 py-3 ${
              i % 2 === 0 ? "bg-sidebar-accent/30" : "bg-sidebar-accent/10"
            }`}
          >
            <span className="text-xs text-muted-foreground w-36 flex-shrink-0">
              {label}
            </span>
            <span className="text-sm font-medium text-foreground">{value}</span>
          </div>
        ))}
      </div>
      {data.orgName && data.orgType && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/10 border border-primary/30">
          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-sm text-primary font-medium">
            Ready to launch <strong>{data.orgName}</strong>!
          </p>
        </div>
      )}
    </div>
  );
}

function SuccessChecklist({
  data,
  onReturnToDashboard,
}: {
  data: FormData;
  onReturnToDashboard: () => void;
}) {
  const hasWorks = data.works.length > 0;
  const hasMembers = data.teamMembers.length > 0;

  const tasks = [
    {
      id: "create_org",
      label: "Create your organization",
      done: true,
      icon: "🏢",
    },
    {
      id: "register_work",
      label: "Register your first work",
      done: hasWorks,
      icon: "🎵",
    },
    {
      id: "invite_member",
      label: "Invite a team member",
      done: hasMembers,
      icon: "👥",
    },
    {
      id: "setup_listing",
      label: "Set up a licensing listing",
      done: false,
      icon: "🛍️",
    },
    {
      id: "configure_territory",
      label: "Configure territory rights",
      done: false,
      icon: "🌍",
    },
    {
      id: "explore_marketplace",
      label: "Explore the marketplace",
      done: false,
      icon: "🔍",
    },
  ];

  const completedCount = tasks.filter((t) => t.done).length;
  const progressPct = (completedCount / tasks.length) * 100;

  return (
    <div className="max-w-xl mx-auto">
      {/* Success banner */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto mb-4">
          <Rocket className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">
          {data.orgName} is live!
        </h2>
        <p className="text-muted-foreground text-sm">
          Your organization is set up and ready. Complete the checklist below to
          get the most out of DecibelChain.
        </p>
      </div>

      {/* Progress */}
      <Card className="bg-sidebar-accent/30 border-border mb-6">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">
              Onboarding Progress
            </span>
            <Badge variant="outline" className="text-primary border-primary/40">
              {completedCount}/{tasks.length} completed
            </Badge>
          </div>
          <Progress value={progressPct} className="h-2" />
        </CardContent>
      </Card>

      {/* Task list */}
      <div className="space-y-2 mb-8">
        {tasks.map((task, i) => (
          <div
            key={task.id}
            data-ocid={`onboarding.checklist.item.${i + 1}`}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
              task.done
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-sidebar-accent/20"
            }`}
          >
            <span className="text-lg">{task.icon}</span>
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  task.done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {task.label}
              </p>
            </div>
            {task.done ? (
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            ) : (
              <>
                <Circle className="w-5 h-5 text-muted-foreground/30 flex-shrink-0" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  data-ocid={`onboarding.checklist_go.button.${i + 1}`}
                  className="text-xs text-primary hover:bg-primary/10 px-2 py-1 h-auto"
                >
                  Go →
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button
          type="button"
          data-ocid="onboarding.return_dashboard.button"
          onClick={onReturnToDashboard}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}

const defaultForm: FormData = {
  orgName: "",
  orgType: "",
  country: "",
  website: "",
  description: "",
  teamMembers: [],
  works: [],
  integrations: {
    marketplace: true,
    apiAccess: false,
    webhooks: false,
    multiLanguage: false,
  },
  language: "English",
};

export function TenantOnboarding({
  onNavigate,
}: { onNavigate?: (page: string) => void }) {
  const [step, setStep] = useState(1);
  const [launched, setLaunched] = useState(false);
  const [form, setForm] = useState<FormData>(defaultForm);

  const updateForm = (updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const step1Valid = form.orgName.trim() !== "" && form.orgType !== "";
  const canGoNext = step !== 1 || step1Valid;

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const stepTitles: Record<number, string> = {
    1: "Tell us about your organization",
    2: "Set up your team",
    3: "Register initial works",
    4: "Integrations & settings",
    5: "Review & launch",
  };

  const stepSubtitles: Record<number, string> = {
    1: "Give your organization a name and a few details so other members can find and recognize you.",
    2: "Add team members who will collaborate with you. Each member can be assigned a role.",
    3: "Seed your works catalog with your most important tracks or compositions.",
    4: "Choose the platform capabilities you'd like to activate for your organization.",
    5: "Everything looks right? Hit Launch to create your organization.",
  };

  if (launched) {
    return (
      <div className="p-6">
        <SuccessChecklist
          data={form}
          onReturnToDashboard={() => onNavigate?.("dashboard")}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Tenant Onboarding
          </span>
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {stepTitles[step]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {stepSubtitles[step]}
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={step} />

      {/* Card */}
      <Card className="bg-card border-border shadow-lg">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground">
              Step {step} of {STEPS.length}
            </CardTitle>
            <Badge
              variant="outline"
              className="text-xs border-primary/30 text-primary"
            >
              {STEPS[step - 1].label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {step === 1 && <Step1 data={form} onChange={updateForm} />}
          {step === 2 && (
            <Step2 data={form} onChange={updateForm} onSkip={next} />
          )}
          {step === 3 && (
            <Step3 data={form} onChange={updateForm} onSkip={next} />
          )}
          {step === 4 && <Step4 data={form} onChange={updateForm} />}
          {step === 5 && <Step5 data={form} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5">
        <Button
          type="button"
          data-ocid="onboarding.back.button"
          variant="outline"
          onClick={back}
          disabled={step === 1}
          className="border-border text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        {step < 5 ? (
          <Button
            type="button"
            data-ocid="onboarding.next.button"
            onClick={next}
            disabled={!canGoNext}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            data-ocid="onboarding.launch.button"
            onClick={() => setLaunched(true)}
            disabled={!step1Valid}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Rocket className="w-4 h-4" /> Launch Organization
          </Button>
        )}
      </div>
    </div>
  );
}
