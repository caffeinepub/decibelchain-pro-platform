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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  CircleDot,
  Clock,
  DollarSign,
  FileText,
  Globe,
  Link2,
  Package,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

type ServiceType =
  | "distribution"
  | "publishing"
  | "licensing"
  | "sync"
  | "marketing"
  | "legal";

type AppStatus = "submitted" | "review" | "approved" | "active";
type RequestStatus = "pending" | "under_review" | "approved" | "rejected";
type RequestType =
  | "api_access"
  | "data_feed"
  | "reporting"
  | "payment_integration";
type Priority = "standard" | "high" | "urgent";

interface IntegrationRequest {
  id: string;
  type: RequestType;
  description: string;
  priority: Priority;
  status: RequestStatus;
  submitted: string;
  proposedBy?: string;
}

interface VendorApplication {
  id: string;
  company: string;
  serviceType: ServiceType;
  email: string;
  country: string;
  submitted: string;
  status: AppStatus;
}

const MOCK_REQUESTS: IntegrationRequest[] = [
  {
    id: "req-001",
    type: "api_access",
    description: "Full API access for royalty data synchronization",
    priority: "high",
    status: "approved",
    submitted: "2026-03-10",
  },
  {
    id: "req-002",
    type: "data_feed",
    description: "Daily streaming data feed for analytics pipeline",
    priority: "standard",
    status: "under_review",
    submitted: "2026-03-18",
  },
  {
    id: "req-003",
    type: "reporting",
    description: "Monthly automated royalty report delivery",
    priority: "standard",
    status: "pending",
    submitted: "2026-03-25",
  },
  {
    id: "req-004",
    type: "payment_integration",
    description: "Direct ACH payout integration for artist disbursements",
    priority: "urgent",
    status: "rejected",
    submitted: "2026-03-05",
  },
];

const MOCK_APPLICATIONS: VendorApplication[] = [
  {
    id: "app-001",
    company: "SoundSync Distribution",
    serviceType: "distribution",
    email: "ops@soundsync.io",
    country: "United States",
    submitted: "2026-03-22",
    status: "submitted",
  },
  {
    id: "app-002",
    company: "Harmonia Publishing Ltd",
    serviceType: "publishing",
    email: "admin@harmonia.co.uk",
    country: "United Kingdom",
    submitted: "2026-03-20",
    status: "review",
  },
  {
    id: "app-003",
    company: "Syncfire Agency",
    serviceType: "sync",
    email: "info@syncfire.com",
    country: "Canada",
    submitted: "2026-03-15",
    status: "review",
  },
  {
    id: "app-004",
    company: "LegalBeat LLP",
    serviceType: "legal",
    email: "partners@legalbeat.com",
    country: "Germany",
    submitted: "2026-03-12",
    status: "submitted",
  },
];

const MOCK_ADMIN_REQUESTS: IntegrationRequest[] = [
  {
    id: "req-admin-001",
    type: "api_access",
    description: "Read-only API access for catalog metadata sync",
    priority: "standard",
    status: "pending",
    submitted: "2026-03-26",
  },
  {
    id: "req-admin-002",
    type: "payment_integration",
    description: "SEPA payment rail integration for EU disbursements",
    priority: "urgent",
    status: "pending",
    submitted: "2026-03-24",
    proposedBy: "admin@decibelchain.io",
  },
  {
    id: "req-admin-003",
    type: "data_feed",
    description: "Real-time SoundScan data ingestion feed",
    priority: "high",
    status: "under_review",
    submitted: "2026-03-20",
  },
];

const RECENT_ACTIVITY = [
  {
    id: 1,
    text: "Integration request #req-001 approved",
    time: "2 hours ago",
    icon: CheckCircle2,
    color: "text-green-400",
  },
  {
    id: 2,
    text: "New work linked: 'Midnight Frequencies'",
    time: "Yesterday",
    icon: Link2,
    color: "text-primary",
  },
  {
    id: 3,
    text: "Monthly royalty report generated",
    time: "3 days ago",
    icon: FileText,
    color: "text-blue-400",
  },
  {
    id: 4,
    text: "Profile details updated",
    time: "5 days ago",
    icon: RefreshCw,
    color: "text-muted-foreground",
  },
  {
    id: 5,
    text: "API key rotated successfully",
    time: "1 week ago",
    icon: ShieldCheck,
    color: "text-amber-400",
  },
];

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  distribution: "Distribution",
  publishing: "Publishing",
  licensing: "Licensing",
  sync: "Sync / Placement",
  marketing: "Marketing",
  legal: "Legal",
};

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  api_access: "API Access",
  data_feed: "Data Feed",
  reporting: "Reporting",
  payment_integration: "Payment Integration",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  standard: "Standard",
  high: "High",
  urgent: "Urgent",
};

function StatusBadge({ status }: { status: RequestStatus }) {
  const map: Record<RequestStatus, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
    under_review: {
      label: "Under Review",
      className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    approved: {
      label: "Approved",
      className: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  };
  const { label, className } = map[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${className}`}
    >
      {label}
    </span>
  );
}

function AppStatusBadge({ status }: { status: AppStatus }) {
  const map: Record<AppStatus, { label: string; className: string }> = {
    submitted: {
      label: "Submitted",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
    review: {
      label: "Under Review",
      className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    approved: {
      label: "Approved",
      className: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    active: {
      label: "Active",
      className: "bg-primary/20 text-primary border-primary/30",
    },
  };
  const { label, className } = map[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${className}`}
    >
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, string> = {
    standard: "text-muted-foreground",
    high: "text-amber-400",
    urgent: "text-red-400",
  };
  return (
    <span className={`text-xs font-medium ${map[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

// ---------- Tab 1: Self-Onboarding ----------
function OnboardingTab() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    company: "",
    serviceType: "" as ServiceType | "",
    email: "",
    website: "",
    country: "",
    description: "",
  });
  const [interests, setInterests] = useState<Record<string, boolean>>({
    api_access: false,
    data_feed: false,
    reporting: false,
    payment_integration: false,
  });
  const [lookupName, setLookupName] = useState("");
  const [lookupResult, setLookupResult] = useState<null | string>(null);

  const onboarding_steps = [
    { label: "Submitted", done: true },
    { label: "Under Review", done: false },
    { label: "Admin Approved", done: false },
    { label: "Active", done: false },
  ];

  return (
    <div className="space-y-6">
      {!submitted ? (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Package className="w-5 h-5 text-primary" />
              Vendor Self-Registration
            </CardTitle>
            <CardDescription>
              Register your company as a DecibelChain vendor partner.
              Applications are reviewed within 2 business days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="vp-company">Company Name *</Label>
                <Input
                  id="vp-company"
                  data-ocid="vendor.company.input"
                  placeholder="e.g. Harmonia Publishing"
                  value={form.company}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, company: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vp-service">Service Type *</Label>
                <Select
                  value={form.serviceType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, serviceType: v as ServiceType }))
                  }
                >
                  <SelectTrigger
                    id="vp-service"
                    data-ocid="vendor.service_type.select"
                  >
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map(
                      (k) => (
                        <SelectItem key={k} value={k}>
                          {SERVICE_TYPE_LABELS[k]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vp-email">Contact Email *</Label>
                <Input
                  id="vp-email"
                  data-ocid="vendor.email.input"
                  type="email"
                  placeholder="contact@yourcompany.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vp-website">Website</Label>
                <Input
                  id="vp-website"
                  data-ocid="vendor.website.input"
                  placeholder="https://yourcompany.com"
                  value={form.website}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, website: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vp-country">Country *</Label>
                <Input
                  id="vp-country"
                  data-ocid="vendor.country.input"
                  placeholder="e.g. United States"
                  value={form.country}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, country: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="vp-desc">Description</Label>
                <Textarea
                  id="vp-desc"
                  data-ocid="vendor.description.textarea"
                  placeholder="Briefly describe your services and how you plan to integrate with DecibelChain…"
                  className="resize-none"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Integration Interests</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(
                    [
                      ["api_access", "API Access"],
                      ["data_feed", "Data Feed"],
                      ["reporting", "Reporting"],
                      ["payment_integration", "Payment Integration"],
                    ] as [string, string][]
                  ).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={`int-${key}`}
                        data-ocid={`vendor.interest_${key}.checkbox`}
                        checked={interests[key]}
                        onCheckedChange={(v) =>
                          setInterests((i) => ({ ...i, [key]: Boolean(v) }))
                        }
                      />
                      <Label
                        htmlFor={`int-${key}`}
                        className="cursor-pointer text-sm"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Button
                data-ocid="vendor.submit.button"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  if (
                    form.company &&
                    form.serviceType &&
                    form.email &&
                    form.country
                  ) {
                    setSubmitted(true);
                  }
                }}
              >
                <Package className="w-4 h-4 mr-2" />
                Submit Application
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className="bg-card border-border"
          data-ocid="vendor.onboarding.success_state"
        >
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Application Submitted!
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Thank you for registering{" "}
              <span className="text-primary font-medium">{form.company}</span>.
              Our team will review your application and respond within 2
              business days.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSubmitted(false);
                setForm({
                  company: "",
                  serviceType: "",
                  email: "",
                  website: "",
                  country: "",
                  description: "",
                });
              }}
            >
              Submit Another Application
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status Lookup */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <CircleDot className="w-4 h-4 text-primary" />
            Application Status Lookup
          </CardTitle>
          <CardDescription>
            Enter your company name to check the status of your application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              data-ocid="vendor.status_lookup.input"
              placeholder="Company name…"
              value={lookupName}
              onChange={(e) => setLookupName(e.target.value)}
              className="max-w-sm"
            />
            <Button
              data-ocid="vendor.status_lookup.button"
              variant="outline"
              onClick={() =>
                setLookupResult(lookupName.trim() ? "pending" : null)
              }
            >
              Check Status
            </Button>
          </div>
          {lookupResult && (
            <div className="mt-5" data-ocid="vendor.status_result.panel">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-foreground">
                  Status:{" "}
                </span>
                <span className="text-sm text-yellow-400 font-semibold">
                  Pending Review
                </span>
              </div>
              <div className="flex items-start gap-0">
                {onboarding_steps.map((step, i) => (
                  <div
                    key={step.label}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div className="flex items-center w-full">
                      {i > 0 && (
                        <div
                          className={`flex-1 h-0.5 ${i <= 1 ? "bg-primary/40" : "bg-border"}`}
                        />
                      )}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                          i === 0
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-muted border-border text-muted-foreground"
                        }`}
                      >
                        {i === 0 ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <span className="text-xs">{i + 1}</span>
                        )}
                      </div>
                      {i < onboarding_steps.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 ${i < 1 ? "bg-primary/40" : "bg-border"}`}
                        />
                      )}
                    </div>
                    <p
                      className={`text-xs mt-1.5 text-center ${
                        i === 0
                          ? "text-primary font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Tab 2: My Dashboard ----------
function DashboardTab({
  onSwitchToRequests,
}: { onSwitchToRequests: () => void }) {
  const [updateOpen, setUpdateOpen] = useState(false);

  const kpis = [
    {
      label: "Active Integrations",
      value: "3",
      icon: Zap,
      color: "text-primary",
    },
    {
      label: "Pending Requests",
      value: "1",
      icon: Clock,
      color: "text-yellow-400",
    },
    {
      label: "Works Linked",
      value: "127",
      icon: FileText,
      color: "text-blue-400",
    },
    {
      label: "Revenue Tracked",
      value: "$42,830",
      icon: DollarSign,
      color: "text-green-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Vendor profile card */}
      <Card className="bg-card border-border">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-foreground">
                  SoundSync Distribution
                </h3>
                <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
                  Distribution
                </Badge>
                <Badge className="bg-primary/20 text-primary border border-primary/30 text-xs">
                  Active
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Joined March 2026 · United States
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                A leading independent music distribution platform connecting
                artists directly to DSPs worldwide.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-card border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {RECENT_ACTIVITY.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3"
                  data-ocid={`vendor.activity.item.${item.id}`}
                >
                  <item.icon
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.color}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.text}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              data-ocid="vendor.submit_integration_request.button"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onSwitchToRequests}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Submit Integration Request
            </Button>
            <Button
              data-ocid="vendor.update_profile.button"
              variant="outline"
              className="w-full"
              onClick={() => setUpdateOpen(true)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Profile
            </Button>
            <Button variant="outline" className="w-full">
              <FileText className="w-4 h-4 mr-2" />
              Download Integration Guide
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent data-ocid="vendor.update_profile.dialog">
          <DialogHeader>
            <DialogTitle>Update Vendor Profile</DialogTitle>
            <DialogDescription>
              Edit your company information and contact details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Company Name</Label>
              <Input
                defaultValue="SoundSync Distribution"
                data-ocid="vendor.profile_company.input"
              />
            </div>
            <div className="space-y-1">
              <Label>Contact Email</Label>
              <Input
                defaultValue="ops@soundsync.io"
                data-ocid="vendor.profile_email.input"
              />
            </div>
            <div className="space-y-1">
              <Label>Website</Label>
              <Input
                defaultValue="https://soundsync.io"
                data-ocid="vendor.profile_website.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateOpen(false)}
              data-ocid="vendor.profile_update.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground"
              onClick={() => setUpdateOpen(false)}
              data-ocid="vendor.profile_update.save_button"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- Tab 3: Integration Requests ----------
function IntegrationRequestsTab({ isAdmin }: { isAdmin: boolean }) {
  const [requests, setRequests] = useState<IntegrationRequest[]>(MOCK_REQUESTS);
  const [newOpen, setNewOpen] = useState(false);
  const [selfApproveNotice, setSelfApproveNotice] = useState<string | null>(
    null,
  );
  const [newForm, setNewForm] = useState({
    type: "" as RequestType | "",
    description: "",
    priority: "standard" as Priority,
    volume: "",
  });

  const handleProposeApproval = (id: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "under_review" as RequestStatus,
              proposedBy: "admin@decibelchain.io",
            }
          : r,
      ),
    );
  };

  const handleConfirmApproval = (id: string, isSelf: boolean) => {
    if (isSelf) {
      setSelfApproveNotice(id);
      return;
    }
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "approved" as RequestStatus } : r,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Integration Requests
        </h3>
        <Button
          size="sm"
          data-ocid="vendor.new_request.open_modal_button"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setNewOpen(true)}
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          New Request
        </Button>
      </div>

      {selfApproveNotice && (
        <div
          className="flex items-center gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20"
          data-ocid="vendor.self_approve.error_state"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">
            Self-approval is not permitted. A different admin must confirm this
            proposal.
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setSelfApproveNotice(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                  Type
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                  Description
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                  Priority
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                  Date
                </th>
                {isAdmin && (
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                    Admin Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {requests.map((req, idx) => (
                <tr
                  key={req.id}
                  data-ocid={`vendor.request.item.${idx + 1}`}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <td className="py-2.5 px-4">
                    <span className="font-medium text-foreground">
                      {REQUEST_TYPE_LABELS[req.type]}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 max-w-xs">
                    <p className="text-muted-foreground truncate">
                      {req.description}
                    </p>
                  </td>
                  <td className="py-2.5 px-4">
                    <PriorityBadge priority={req.priority} />
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground text-xs">
                    {req.submitted}
                  </td>
                  {isAdmin && (
                    <td className="py-2.5 px-4">
                      {req.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          data-ocid={`vendor.propose_approval.button.${idx + 1}`}
                          onClick={() => handleProposeApproval(req.id)}
                        >
                          Propose Approval
                        </Button>
                      )}
                      {req.status === "under_review" && req.proposedBy && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 border-green-500/30 text-green-400 hover:bg-green-500/10"
                          data-ocid={`vendor.confirm_approval.button.${idx + 1}`}
                          onClick={() =>
                            handleConfirmApproval(
                              req.id,
                              req.proposedBy === "admin@decibelchain.io",
                            )
                          }
                        >
                          Confirm Approval
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Request Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent data-ocid="vendor.new_request.dialog">
          <DialogHeader>
            <DialogTitle>New Integration Request</DialogTitle>
            <DialogDescription>
              Submit a new integration request for review by the DecibelChain
              admin team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Request Type</Label>
              <Select
                value={newForm.type}
                onValueChange={(v) =>
                  setNewForm((f) => ({ ...f, type: v as RequestType }))
                }
              >
                <SelectTrigger data-ocid="vendor.request_type.select">
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(REQUEST_TYPE_LABELS) as RequestType[]).map(
                    (k) => (
                      <SelectItem key={k} value={k}>
                        {REQUEST_TYPE_LABELS[k]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                data-ocid="vendor.request_description.textarea"
                placeholder="Describe the integration need…"
                className="resize-none"
                rows={3}
                value={newForm.description}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={newForm.priority}
                  onValueChange={(v) =>
                    setNewForm((f) => ({ ...f, priority: v as Priority }))
                  }
                >
                  <SelectTrigger data-ocid="vendor.request_priority.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Expected Volume</Label>
                <Input
                  data-ocid="vendor.request_volume.input"
                  placeholder="e.g. 10k calls/day"
                  value={newForm.volume}
                  onChange={(e) =>
                    setNewForm((f) => ({ ...f, volume: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="vendor.new_request.cancel_button"
              onClick={() => setNewOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground"
              data-ocid="vendor.new_request.submit_button"
              onClick={() => {
                if (newForm.type && newForm.description) {
                  setRequests((prev) => [
                    ...prev,
                    {
                      id: `req-${Date.now()}`,
                      type: newForm.type as RequestType,
                      description: newForm.description,
                      priority: newForm.priority,
                      status: "pending",
                      submitted: new Date().toISOString().slice(0, 10),
                    },
                  ]);
                  setNewOpen(false);
                  setNewForm({
                    type: "",
                    description: "",
                    priority: "standard",
                    volume: "",
                  });
                }
              }}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- Tab 4: Admin Queue ----------
function AdminQueueTab({ isAdmin }: { isAdmin: boolean }) {
  const [applications, setApplications] =
    useState<VendorApplication[]>(MOCK_APPLICATIONS);
  const [adminRequests, setAdminRequests] =
    useState<IntegrationRequest[]>(MOCK_ADMIN_REQUESTS);
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveOpen, setApproveOpen] = useState<string | null>(null);
  const [selfApproveNotice, setSelfApproveNotice] = useState<string | null>(
    null,
  );

  if (!isAdmin) {
    return (
      <Card
        className="bg-card border-border"
        data-ocid="vendor.admin_queue.error_state"
      >
        <CardContent className="pt-12 pb-12 text-center">
          <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Admin access required to view the Vendor Queue.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleApproveApp = (id: string) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "approved" as AppStatus } : a,
      ),
    );
    setApproveOpen(null);
  };

  const handleRejectApp = (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    setRejectOpen(null);
    setRejectReason("");
  };

  const handleProposeReq = (id: string) => {
    setAdminRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "under_review" as RequestStatus,
              proposedBy: "admin@decibelchain.io",
            }
          : r,
      ),
    );
  };

  const handleConfirmReq = (id: string) => {
    const req = adminRequests.find((r) => r.id === id);
    if (req?.proposedBy === "admin@decibelchain.io") {
      setSelfApproveNotice(id);
      return;
    }
    setAdminRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "approved" as RequestStatus } : r,
      ),
    );
  };

  return (
    <div className="space-y-6">
      {selfApproveNotice && (
        <div
          className="flex items-center gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20"
          data-ocid="vendor.admin_self_approve.error_state"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">
            Self-approval blocked. A second admin must confirm this proposal.
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setSelfApproveNotice(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Vendor Applications */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Vendor Applications
        </h3>
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                    Company
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                    Country
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                    Submitted
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app, idx) => (
                  <tr
                    key={app.id}
                    data-ocid={`vendor.application.item.${idx + 1}`}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-2.5 px-4">
                      <p className="font-medium text-foreground">
                        {app.company}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {app.email}
                      </p>
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground">
                      {SERVICE_TYPE_LABELS[app.serviceType]}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {app.country}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <AppStatusBadge status={app.status} />
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground text-xs">
                      {app.submitted}
                    </td>
                    <td className="py-2.5 px-4">
                      {app.status !== "approved" && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
                            data-ocid={`vendor.approve_app.button.${idx + 1}`}
                            onClick={() => setApproveOpen(app.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                            data-ocid={`vendor.reject_app.button.${idx + 1}`}
                            onClick={() => setRejectOpen(app.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Integration Request Queue */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          Integration Request Queue
        </h3>
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                    Description
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                    Priority
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {adminRequests.map((req, idx) => (
                  <tr
                    key={req.id}
                    data-ocid={`vendor.admin_request.item.${idx + 1}`}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-medium text-foreground">
                      {REQUEST_TYPE_LABELS[req.type]}
                    </td>
                    <td className="py-2.5 px-4 max-w-xs">
                      <p className="text-muted-foreground truncate">
                        {req.description}
                      </p>
                    </td>
                    <td className="py-2.5 px-4">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        {req.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            data-ocid={`vendor.admin_propose.button.${idx + 1}`}
                            onClick={() => handleProposeReq(req.id)}
                          >
                            Propose
                          </Button>
                        )}
                        {req.status === "under_review" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-green-500/30 text-green-400 hover:bg-green-500/10"
                            data-ocid={`vendor.admin_confirm.button.${idx + 1}`}
                            onClick={() => handleConfirmReq(req.id)}
                          >
                            Confirm
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Approve Dialog */}
      <Dialog
        open={!!approveOpen}
        onOpenChange={(o) => !o && setApproveOpen(null)}
      >
        <DialogContent data-ocid="vendor.approve_app.dialog">
          <DialogHeader>
            <DialogTitle>Approve Vendor Application</DialogTitle>
            <DialogDescription>
              Approving this application will grant the vendor Active status and
              allow integration setup.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="vendor.approve_app.cancel_button"
              onClick={() => setApproveOpen(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground"
              data-ocid="vendor.approve_app.confirm_button"
              onClick={() => approveOpen && handleApproveApp(approveOpen)}
            >
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={!!rejectOpen}
        onOpenChange={(o) => !o && setRejectOpen(null)}
      >
        <DialogContent data-ocid="vendor.reject_app.dialog">
          <DialogHeader>
            <DialogTitle>Reject Vendor Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. The applicant will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              data-ocid="vendor.reject_reason.textarea"
              placeholder="Rejection reason…"
              className="resize-none"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="vendor.reject_app.cancel_button"
              onClick={() => setRejectOpen(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              data-ocid="vendor.reject_app.confirm_button"
              onClick={() => rejectOpen && handleRejectApp(rejectOpen)}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- Main Page ----------
export function VendorPortal() {
  const [activeTab, setActiveTab] = useState("onboarding");
  // Simulate admin; in production this would come from the actor/auth context
  const isAdmin = true;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Vendor Portal</h1>
          <p className="text-sm text-muted-foreground">
            Self-onboarding, dashboard, and integration management for vendor
            partners
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/30 border border-border">
          <TabsTrigger value="onboarding" data-ocid="vendor.onboarding.tab">
            Self-Onboarding
          </TabsTrigger>
          <TabsTrigger value="dashboard" data-ocid="vendor.dashboard.tab">
            My Dashboard
          </TabsTrigger>
          <TabsTrigger value="requests" data-ocid="vendor.requests.tab">
            Integration Requests
          </TabsTrigger>
          <TabsTrigger value="admin" data-ocid="vendor.admin.tab">
            Admin Queue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding" className="mt-4">
          <OnboardingTab />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardTab onSwitchToRequests={() => setActiveTab("requests")} />
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <IntegrationRequestsTab isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="admin" className="mt-4">
          <AdminQueueTab isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
