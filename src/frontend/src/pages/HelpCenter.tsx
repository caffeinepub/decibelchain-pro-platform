import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Award,
  BarChart2,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Code2,
  Compass,
  DollarSign,
  FileMusic,
  FileText,
  GitMerge,
  Globe,
  HelpCircle,
  Key,
  Layers,
  LayoutDashboard,
  LineChart,
  Lock,
  Map as MapIcon,
  MessageCircle,
  Mic2,
  PieChart,
  Rss,
  Scale,
  ScrollText,
  Search,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  TrendingUp,
  User,
  Users,
  Webhook,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useActor } from "../hooks/useActor";

const gettingStartedSteps = [
  {
    num: 1,
    title: "Login with Internet Identity",
    icon: ShieldCheck,
    body: 'Click "Connect with Internet Identity" on the landing page. Your ICP anchor is your cryptographic identity — no username, password, or email required. If you do not have one yet, the Identity portal guides you through creating one in under two minutes.',
    tip: "Keep your Identity anchor recovery phrase in a safe place — it is the only way to recover access.",
  },
  {
    num: 2,
    title: "Set Up Your Profile",
    icon: User,
    body: "Navigate to Sidebar → Profile. Add your display name, bio, social links, and language preference. Your profile is your public-facing identity on the platform and appears on works you register, organizations you join, and contracts you sign.",
    tip: "Choose a display name recognizable to collaborators — it appears everywhere across the platform.",
  },
  {
    num: 3,
    title: "Create or Join an Organization",
    icon: Building2,
    body: "Go to Sidebar → Organizations. Organizations are your operating entity — PROs, publishers, labels, or collectives. Create one and invite members with appropriate roles (Admin / User / Guest), or ask an existing org admin to invite you via your principal ID.",
    tip: "You can belong to multiple organizations simultaneously, each with a different role.",
  },
  {
    num: 4,
    title: "Register Your Works",
    icon: FileMusic,
    body: "Go to Sidebar → Works Registry. Add musical works with ISWC/ISRC identifiers, genre, type (song / composition / sound recording), and territory info. Then assign ownership splits in the Splits Editor — percentages must total exactly 100%.",
    tip: "Even without ISWC/ISRC, works can be registered; add these codes later for DSP integration.",
  },
  {
    num: 5,
    title: "Start Earning",
    icon: DollarSign,
    body: "Once works are registered with splits, revenue flows through Royalties → Revenue. Submit for distribution via Statements. Explore Licensing to create sync and mechanical licenses, Financing for cooperative investment through FinFracFran™ or NewWaysNow, and Portfolio to track all your investment positions.",
    tip: "Use the Marketplace to list works for public licensing and receive inbound sync requests.",
  },
];

const modules = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    description:
      "Your daily starting point. Shows platform KPIs, recent activity, quick-action tiles for each major module, and any pending actions requiring your attention. The dashboard aggregates key metrics from across all modules into one at-a-glance view.",
    tips: [
      "Pending approvals and actions are surfaced here first — check it each session.",
      "KPI cards link directly to the relevant module for quick drill-down.",
    ],
  },
  {
    name: "Organizations",
    icon: Building2,
    description:
      "Create and manage your organization. Set name, type, country, and description. Invite members with Admin/User/Guest roles and view or remove members. Each org is fully isolated — members only see data belonging to their organization.",
    tips: [
      "Assign at least two Admin members so two-admin approval workflows can function.",
      "Org type affects how fees and territory rules apply.",
    ],
  },
  {
    name: "Works Registry",
    icon: FileMusic,
    description:
      "Register musical works — enter title, ISWC, ISRC, genre, work type (song/composition/sound recording), and associated organization. Works become the foundation for all downstream royalties, licenses, certificates, and analytics.",
    tips: [
      "ISWC and ISRC fields are optional but strongly recommended for DSP registry lookup.",
      "Use Batch Operations to upload dozens of works at once via CSV.",
    ],
  },
  {
    name: "Splits Editor",
    icon: PieChart,
    description:
      "Define ownership splits for any registered work. Assign percentage shares to org members or cross-org collaborators. All splits must total exactly 100%. Splits determine how royalties are distributed whenever revenue is attributed to a work.",
    tips: [
      "Cross-org splits are fully supported — add any platform member.",
      "Use Batch Operations for bulk split assignments across many works.",
    ],
  },
  {
    name: "Vendor Directory",
    icon: Store,
    description:
      "Browse and register external vendors — distributors, studios, publishers, sync agents, and legal firms. Vendors can be tiered (verified/unverified) and linked to licensing deals. Use this directory to track all external service relationships.",
    tips: [
      "Verified vendor badges help distinguish trusted partners from unvetted contacts.",
      "Link vendors to licenses for full deal provenance tracking.",
    ],
  },
  {
    name: "Audit Trail",
    icon: ClipboardList,
    description:
      "Immutable log of every platform action — who did what, when, and on which entity. Filterable by actor, entity type, action keyword, and date range. Admins can export up to 10,000 entries as CSV for compliance and forensic review.",
    tips: [
      "All sensitive actions (fee changes, key revocations, contract approvals) appear here with full actor attribution.",
      "Use date filters to scope export to a specific reporting period.",
    ],
  },
  {
    name: "Profile",
    icon: User,
    description:
      "Your personal platform profile. Manage display name, bio, social links, and language preference (EN/ES/FR/PT/JA). Your profile is public-facing and linked to your registered works, org memberships, and signed contracts.",
    tips: [
      "Language preference applies immediately across the entire UI.",
      "Your public profile URL is shareable for collaboration.",
    ],
  },
  {
    name: "Revenue Dashboard",
    icon: DollarSign,
    description:
      "Live view of all revenue streams flowing into your works. Visualized by source, territory, and time period. Filter by organization or date range to isolate specific revenue flows.",
    tips: [
      "Cross-reference with Intelligence → Analytics for forecasting.",
      "Revenue from licensing, performances, and direct entries all appear here.",
    ],
  },
  {
    name: "Distribution Statements",
    icon: BarChart3,
    description:
      "Generate and view royalty distribution statements. Each statement details which works earned, which members received what share, the exact amounts, and the payout timeline. Use statements for accounting and member communication.",
    tips: [
      "Statements are linked back to the splits active at time of distribution.",
      "Export statements as CSV from Platform → Reports.",
    ],
  },
  {
    name: "Licensing Manager",
    icon: Scale,
    description:
      "Create and manage licenses for works you control. Set sync, mechanical, performance, or master license terms including territory scope, duration, and fees. Licenses in the registry are linked to the Marketplace for inbound requests.",
    tips: [
      "Approved marketplace requests are automatically converted to license entries here.",
      "Link licenses to contracts via the Contract Generator for legally executable agreements.",
    ],
  },
  {
    name: "Financing Offers",
    icon: TrendingUp,
    description:
      "The FinFracFran™ and NewWaysNow cooperative financing models. Rights holders offer a fractional share of future royalties in exchange for upfront capital from investors. Configure offer terms, investment caps, and payout structures.",
    tips: [
      "FinFracFran™ — fractional royalty shares for upfront capital.",
      "NewWaysNow — community-backed, flexible investment terms with pooled royalty participation.",
    ],
  },
  {
    name: "Investment Portfolio",
    icon: Briefcase,
    description:
      "Track all financing positions — deals you have funded, expected return schedules, active terms, and actual payout performance. The portfolio view gives investors a single dashboard for all their DecibelChain-based investments.",
    tips: [
      "Performance metrics update as new revenue is attributed to backed works.",
      "Export the Portfolio Summary from Platform → Reports.",
    ],
  },
  {
    name: "Activity Feed",
    icon: Rss,
    description:
      "Social-style feed of platform events — new works registered, licenses executed, payouts finalized, new members joined. Follow organizations and members to personalize what appears in your feed.",
    tips: [
      "The feed is a quick way to stay current with collaborators activity.",
      "Important events are also surfaced in Notifications for direct alerts.",
    ],
  },
  {
    name: "Messages",
    icon: MessageCircle,
    description:
      "Direct messaging between platform members. Supports threaded conversations. Unread message count is shown as a badge in the sidebar. Use messages for deal discussions, collaboration requests, or support questions.",
    tips: [
      "Message principals by searching in Member Directory first.",
      "Unread count resets when you open the conversation.",
    ],
  },
  {
    name: "Member Directory",
    icon: Users,
    description:
      "Browse all platform members. View public profiles, org affiliations, registered works, and contact info. Admins can assign or change member roles directly from this directory.",
    tips: [
      "Search by name, org, or principal ID.",
      "Role changes take effect immediately and are logged in the Audit Trail.",
    ],
  },
  {
    name: "Notifications",
    icon: Bell,
    description:
      "Bell-icon alerts for all platform events affecting you — approvals needed, new messages, payout confirmations, disputes filed, and contract status updates. Unread count is shown as a badge in the sidebar and header.",
    tips: [
      "Click the bell in the header for a quick-view dropdown.",
      "Visit Notifications Center for a full chronological list with filters.",
    ],
  },
  {
    name: "Dispute Center",
    icon: Shield,
    description:
      "File and track royalty disputes. Describe the issue, reference the work or split in question, and attach evidence. The two-admin resolution workflow tracks status from Filed → Under Review → Resolved. All dispute activity is logged.",
    tips: [
      "Disputes freeze the affected split allocations pending resolution.",
      "Both parties can submit evidence documents before admin review.",
    ],
  },
  {
    name: "Territory Manager",
    icon: Globe,
    description:
      "Define which territories a work is registered in and which territories a license covers. Set territory-specific royalty rates. Supports ISO country codes and regional groupings (EU, LATAM, APAC).",
    tips: [
      "Territory coverage affects which DSPs and collecting societies can distribute your works.",
      "Use bulk territory assignment in Batch Operations for large catalogs.",
    ],
  },
  {
    name: "Performance Tracker",
    icon: Mic2,
    description:
      "Log live and broadcast performances for registered works. Each performance entry (venue, date, broadcast details) feeds into royalty calculations and distribution, ensuring accurate public performance revenue tracking.",
    tips: [
      "Logging performances manually ensures no performance royalties are missed.",
      "Future DSP outcall integrations will auto-populate streaming performance data.",
    ],
  },
  {
    name: "Catalog Valuation",
    icon: TrendingUp,
    description:
      "AI-assisted catalog valuation tool. Input works, revenue history, and territory data to generate a valuation estimate useful for financing, acquisition discussions, and investor reporting.",
    tips: [
      "Valuations are estimates — combine with your accountant analysis for formal use.",
      "Richer historical revenue data produces more accurate estimates.",
    ],
  },
  {
    name: "DSP Registry Lookup",
    icon: Search,
    description:
      "Look up work metadata from external DSPs via ISRC or ISWC using MusicBrainz integration. Useful for verifying that your works are correctly registered externally and enriching internal work records with additional metadata.",
    tips: [
      "Results include track, artist, label, and territory coverage from MusicBrainz.",
      "Use the raw JSON toggle to see the full API response for debugging.",
    ],
  },
  {
    name: "Batch Operations",
    icon: Layers,
    description:
      "Bulk work registration via CSV upload (with per-row validation preview), bulk split assignment, bulk territory coverage, and automated royalty rules with a two-admin delete workflow. The single most powerful tool for managing large catalogs efficiently.",
    tips: [
      "Download the CSV template before uploading to ensure correct column format.",
      "Per-row validation shows errors before any data is committed.",
    ],
  },
  {
    name: "Certificates",
    icon: Award,
    description:
      "Issue on-chain certificates of rights and provenance for any registered work. Each certificate includes a tamper-evident SHA-256 hash of the ownership snapshot, registration timestamp, territory scope, and a shareable public verification URL.",
    tips: [
      "Certificates are publicly verifiable without login via Discovery → Verify Certificate.",
      "Issue a new certificate after any significant ownership change to keep provenance current.",
    ],
  },
  {
    name: "Public Catalog",
    icon: Compass,
    description:
      "Publicly browsable catalog requiring no login. Search and filter works by genre, type, or organization. Drill into any work to see splits, territories, and performances. Browse org profiles and member affiliations.",
    tips: [
      "Share direct links to works and orgs for public-facing discovery.",
      "Guests can browse and share but cannot submit requests without logging in.",
    ],
  },
  {
    name: "Verify Certificate",
    icon: ShieldCheck,
    description:
      "Public certificate verification page requiring no login. Paste any certificate ID to see the full certificate document — work details, ownership snapshot, hash, territory scope, and a prominent VERIFIED badge.",
    tips: [
      "Certificates are tamper-evident: any change to the underlying work data will show as MISMATCH.",
      "The ?verify=<certId> URL parameter auto-loads a certificate — use it for shareable verification links.",
    ],
  },
  {
    name: "Marketplace",
    icon: ShoppingBag,
    description:
      "Public-facing licensing marketplace. Rights holders list works with license type, asking terms, territory scope, and price. Potential licensees submit sync/license requests. Rights holders can accept, reject, or counter-offer from their My Requests tab.",
    tips: [
      "Accepted requests enter the admin two-approval workflow before becoming formal licenses.",
      "Filter listings by genre, license type, territory, or price range.",
    ],
  },
  {
    name: "Contract Generator",
    icon: ScrollText,
    description:
      "Template-based contract generation. Create reusable contract templates with placeholders. Draft contracts linked to works, licenses, or financing deals. Two-admin propose/approve workflow before execution. Print-ready export with letterhead, watermark, parties table, and signature lines.",
    tips: [
      "Templates with {{PLACEHOLDER}} variables can be reused across multiple contracts.",
      "Executed contracts are logged in the Audit Trail with both approving admins recorded.",
    ],
  },
  {
    name: "Reports",
    icon: BarChart2,
    description:
      "Admin-only bulk data exports: Royalty Statements CSV, Audit Trail export (up to 10,000 rows), Investment Portfolio Summary, and Consolidated Rights Report combining splits, territories, licenses, revenue, and performances per work.",
    tips: [
      "The Consolidated Rights Report is the most comprehensive single export — one row per work with all related data.",
      "Non-admins see a lock notice; request your admin to export on your behalf.",
    ],
  },
  {
    name: "Analytics Dashboard",
    icon: LineChart,
    description:
      "KPI summary cards, 12-month revenue trend with 3-month forecast, top-earning works by period, license and territory breakdowns, and cross-org revenue comparison chart. Under Intelligence in the sidebar.",
    tips: [
      "The 3-month forecast uses trend extrapolation from the trailing 12 months.",
      "Filter by org to isolate one tenant performance.",
    ],
  },
  {
    name: "Cross-Org Royalties",
    icon: GitMerge,
    description:
      "Revenue Summary per organization (bar chart + aggregate table), Split Reconciliation for cross-org co-owned works with automatic discrepancy detection, and Unified Payout History — sortable, filterable, with admin CSV export.",
    tips: [
      "Discrepancy detection flags splits that do not sum to 100% or have conflicting org-level values.",
      "Unified Payout History is the single source of truth for all inter-org settlements.",
    ],
  },
  {
    name: "Platform Admin",
    icon: ShieldCheck,
    description:
      "Admin-only section. Platform Health KPIs (8 metrics), User Management with role assignment (self-modification blocked), Fee Configuration with two-admin proposal/approval workflow, and Advanced Audit Log with full-text filters and pagination.",
    tips: [
      "Fee changes require a second admin to approve — the proposing admin cannot self-approve.",
      "User Management role changes are logged and take effect immediately.",
    ],
  },
  {
    name: "API Keys",
    icon: Key,
    description:
      "Generate named API keys with configurable scopes (read, write, admin) and expiry dates. The key value is displayed only once — copy it immediately. Two-admin revoke workflow for active keys ensures no unauthorized deactivation.",
    tips: [
      "Store API keys in your secrets manager — they cannot be retrieved after initial generation.",
      "Narrow scopes reduce blast radius if a key is compromised.",
    ],
  },
  {
    name: "Webhook Engine",
    icon: Webhook,
    description:
      "Register outbound HTTP webhook endpoints with event subscriptions (work.registered, payout.finalized, contract.executed). Test-ping with live delivery log showing status codes and retry counts. Toggle endpoints active/inactive.",
    tips: [
      "Use test-ping to verify your endpoint is reachable before activating.",
      "Delivery log retains last 50 delivery attempts per endpoint.",
    ],
  },
  {
    name: "Marketplace Admin",
    icon: Store,
    description:
      "Admin review queue for license requests accepted by rights holders. Two-admin approval converts them into formal entries in the License Registry with automatic listing closure. Tabs: Pending Approvals, Conversion History, Rejection Log.",
    tips: [
      "Self-approval is blocked — the proposing admin and approving admin must be different people.",
      "Rejected requests are logged with timestamps and reasons for accountability.",
    ],
  },
];

type FaqItem = { q: string; a: string };
type FaqCategory = {
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  items: FaqItem[];
};

const faqCategories: FaqCategory[] = [
  {
    category: "Getting Started",
    icon: Zap,
    items: [
      {
        q: "Do I need a cryptocurrency wallet to use DecibelChain?",
        a: "No. Authentication uses Internet Identity, which is a secure digital identity built on the Internet Computer blockchain. No wallet, no crypto, and no browser extension is required for basic platform use.",
      },
      {
        q: "Is DecibelChain free to use?",
        a: "Platform access is free for all core features including works registration, splits, royalties, and community tools. Cooperative financing deals, licensing transactions, and certain API integrations may involve fees configured by platform administrators.",
      },
      {
        q: "What languages are supported?",
        a: "English, Spanish (Español), French (Français), Portuguese (Português), and Japanese (日本語). Use the language selector in the header to switch instantly — your preference is saved to your profile.",
      },
      {
        q: "Can I use DecibelChain on my phone?",
        a: "Yes. The platform is fully mobile-optimized with a fixed bottom navigation bar, swipe-right sidebar gesture, and responsive layouts for all screen sizes from 375px upward.",
      },
      {
        q: "How do I change my display name?",
        a: "Sidebar → Profile → edit your display name field → Save. Changes are reflected immediately across the platform including in works, contracts, and the member directory.",
      },
    ],
  },
  {
    category: "Organizations & Members",
    icon: Building2,
    items: [
      {
        q: "Can I belong to multiple organizations?",
        a: "Yes. You can be a member of multiple organizations simultaneously, each with a different role (Admin, User, or Guest). Switch context within the platform by selecting the relevant org from Works or Splits views.",
      },
      {
        q: "What is the difference between Admin, User, and Guest roles?",
        a: "Admin can manage the org, approve sensitive actions, and access all modules. User can register works, submit licensing requests, and manage their profile. Guest has read-only access to org data and cannot make changes.",
      },
      {
        q: "How do I invite someone to my organization?",
        a: "Sidebar → Organizations → your org → Invite Member. Share the invite link or add their platform principal ID directly. The invited member will receive a notification upon joining.",
      },
      {
        q: "Can two admins from different organizations approve the same action?",
        a: "Yes. For cross-org actions such as cross-org split changes, the two-admin requirement draws from the admins of the organization(s) controlling the affected resource. Both approvers must be verified admins of the relevant org.",
      },
      {
        q: "What happens if a member leaves the organization?",
        a: "Their existing splits remain on record for historical accuracy. You can reassign or retire their splits from the Splits Editor. Their membership is removed but their audit trail entries remain intact.",
      },
    ],
  },
  {
    category: "Works & Rights",
    icon: FileMusic,
    items: [
      {
        q: "What is an ISWC?",
        a: "International Standard Musical Work Code — a unique identifier for a musical composition (the underlying song/notes/lyrics). Format: T-XXXXXXXXX-X. Issued by CISAC. Required by most international collecting societies for registration.",
      },
      {
        q: "What is an ISRC?",
        a: "International Standard Recording Code — a unique identifier for a specific sound recording (a particular version/recording of a song). Format: CC-XXX-YY-NNNNN. Required by DSPs for streaming royalty attribution.",
      },
      {
        q: "Can a work have splits across different organizations?",
        a: "Yes. Cross-org splits are fully supported. The Intelligence → Cross-Org Royalties section automatically tracks and reconciles revenue flows across organizations for any co-owned work.",
      },
      {
        q: "Can I register a work without an ISWC or ISRC?",
        a: "Yes. These fields are optional but strongly recommended. Without them, DSP Registry Lookup and external cross-referencing will not be possible, but the work can still earn royalties within the platform.",
      },
      {
        q: "How does the Certificate of Rights work?",
        a: "Navigate to Platform → Certificates → Issue Certificate for any work. The system captures a SHA-256 hash of the current ownership snapshot, creation timestamp, and territory scope. The certificate is tamper-evident and publicly verifiable at Discovery → Verify Certificate without login.",
      },
    ],
  },
  {
    category: "Royalties & Financing",
    icon: DollarSign,
    items: [
      {
        q: "How are royalties calculated?",
        a: "Revenue is attributed to each work based on performance logs, territory-specific rates, and license income. Splits then distribute that revenue among rights holders proportionally according to their assigned percentage shares.",
      },
      {
        q: "What is FinFracFran™?",
        a: "A cooperative financing model where rights holders offer a fractional share of future royalties in exchange for upfront capital from investors. All offer terms, investment caps, and payout structures are fully configurable and managed through Royalties → Financing.",
      },
      {
        q: "What is NewWaysNow?",
        a: "A complementary cooperative financing model focused on community-backed, flexible investment terms with pooled royalty participation. Designed for collective funding scenarios where multiple investors share proportional returns from a work revenue.",
      },
      {
        q: "Can investors browse available financing offers?",
        a: "Yes. Royalties → Financing Offers shows all active offers to any authenticated user. Browse offers, review terms, and commit capital directly through the platform.",
      },
      {
        q: "How are payouts tracked?",
        a: "Distribution Statements capture each payout cycle — works, splits, amounts, and dates. All payouts also appear in Intelligence → Cross-Org Royalties → Unified Payout History for a global sorted view with admin CSV export.",
      },
    ],
  },
  {
    category: "Marketplace & Licensing",
    icon: ShoppingBag,
    items: [
      {
        q: "Who can list a work on the Marketplace?",
        a: "Any authenticated user who is a rights holder (has a split share) for the work. Create a listing from Marketplace → My Listings. Specify license type, asking terms, territory scope, and price.",
      },
      {
        q: "What license types are supported?",
        a: "Sync, mechanical, performance, and master recording licenses. License type determines which royalty streams are covered by the agreement and which collecting society rules apply.",
      },
      {
        q: "What happens after a license request is accepted?",
        a: "The rights holder accepts the request → an admin proposes it for approval → a second admin confirms (two-admin workflow, self-approval blocked) → the request is automatically converted into a formal license entry in the License Registry and the listing is marked closed.",
      },
      {
        q: "Can I negotiate terms in the marketplace?",
        a: "Yes. Rights holders can counter-offer with different terms — revised price, different territory scope, or adjusted duration — from their My Requests tab. The requester receives a notification and can accept or decline.",
      },
    ],
  },
  {
    category: "Admin & Security",
    icon: Lock,
    items: [
      {
        q: "Why do some actions require two admins to approve?",
        a: "DecibelChain uses a two-admin approval model for all sensitive operations — fee changes, API key revocation, dispute resolutions, contract execution, and marketplace approvals. This prevents unauthorized unilateral decisions and ensures accountability through the Audit Trail.",
      },
      {
        q: "Can an admin approve their own proposal?",
        a: "No. Self-approval is blocked at the contract level in the Motoko canister code. The proposing admin and the approving admin must always be two distinct identities. This is enforced cryptographically, not just at the UI level.",
      },
      {
        q: "How do I revoke an API key?",
        a: "Admin → API Keys → Revoke button next to the key. This initiates a two-admin proposal workflow. The key remains active until a second admin confirms the revocation. Both actions are logged in the Audit Trail.",
      },
      {
        q: "How do I register a webhook?",
        a: "Admin → Webhook Engine → Register Endpoint. Provide the target URL, select event subscriptions (work.registered, payout.finalized, contract.executed), and save. Use the Test Ping button to verify delivery before activating.",
      },
      {
        q: "Where can I export data for accounting purposes?",
        a: "Platform → Reports → Bulk Data Exports (admin-only). Available exports: Royalty Statements CSV, Audit Trail (up to 10,000 entries), Investment Portfolio Summary, and Consolidated Rights Report. Non-admins should request an export from their org admin.",
      },
    ],
  },
  {
    category: "Technical & API",
    icon: Code2,
    items: [
      {
        q: "Does DecibelChain have a public API?",
        a: "Yes. API keys with configurable scopes (read, write, admin) can be generated from Admin → API Keys. These allow external systems to query platform data, receive webhook events, and integrate with the rights registry programmatically.",
      },
      {
        q: "What is the Webhook Engine used for?",
        a: "Registering outbound HTTP endpoints that receive real-time event notifications when platform actions occur (new work registered, payout finalized, contract executed). Useful for integrating with external accounting systems, DSP pipelines, or custom reporting tools.",
      },
      {
        q: "What is the DSP Lookup tool?",
        a: "A registry lookup tool at Platform → DSP Lookup that queries MusicBrainz via HTTP outcall from the ICP canister to retrieve metadata for an ISRC or ISWC. Useful for verifying external registrations and cross-referencing with DSP databases.",
      },
      {
        q: "Is data stored on a blockchain?",
        a: "Yes. DecibelChain runs on the Internet Computer Protocol (ICP), a decentralized blockchain network. All data — works, splits, contracts, certificates, and audit logs — is stored in canisters (ICP smart contracts) with cryptographic integrity guarantees and no central server.",
      },
      {
        q: "What happens if the platform is unreachable?",
        a: "DecibelChain runs on ICP, which provides subnet-level fault tolerance and geographic redundancy. Individual node failures do not affect availability. All state is replicated across subnet nodes with cryptographic consensus.",
      },
    ],
  },
];

const architectureSections = [
  {
    icon: Building2,
    title: "Multi-Tenant Architecture",
    body: "Each Organization is a fully isolated tenant with its own members, works, revenue streams, splits, licenses, and fee structures. Tenant isolation is enforced at the data layer inside the Motoko canister: Org A private data is never accessible to Org B members, regardless of role. Admins within an org can only manage their own org resources.",
    highlights: [
      "Data isolation enforced at canister level, not just UI level",
      "Per-tenant fee structures and royalty rates",
      "Independent member directories per org",
    ],
  },
  {
    icon: GitMerge,
    title: "Multi-Organization Collaboration",
    body: "When explicitly authorized, organizations can collaborate across tenant boundaries: cross-org co-owned works with shared splits, joint marketplace listings, and cross-org royalty reporting. Intelligence → Cross-Org Royalties automatically reconciles all inter-org revenue flows and detects split discrepancies.",
    highlights: [
      "Cross-org splits with automatic reconciliation",
      "Shared marketplace listings across org boundaries",
      "Unified Payout History aggregates all inter-org settlements",
    ],
  },
  {
    icon: Store,
    title: "Multi-Vendor Integration",
    body: "The Vendor Directory catalogs external service providers — distributors, studios, DSPs, and legal firms. The API Keys + Webhook Engine layer allows any vendor to integrate programmatically with platform data. Vendors receive real-time event notifications and can query the rights registry via the public API surface.",
    highlights: [
      "Vendor tiers: verified vs. unverified partners",
      "API keys with scoped access for vendor integrations",
      "Webhook subscriptions for real-time event delivery",
    ],
  },
  {
    icon: Code2,
    title: "PaaS (Platform-as-a-Service) Layer",
    body: "API Keys, Webhook Engine, and HTTP Outcalls form the platform-as-a-service foundation. External operators can build custom products consuming DecibelChain rights data, receive real-time events via webhooks, and push data back via the write API. The platform is designed to be the authoritative rights data source for an entire ecosystem of connected products.",
    highlights: [
      "Public read API with configurable scope keys",
      "Outbound webhooks for real-time system integration",
      "HTTP Outcalls for fetching external DSP metadata",
      "Designed to be the backend for third-party royalty tools",
    ],
  },
  {
    icon: Lock,
    title: "Security Model",
    body: "Internet Identity provides cryptographic authentication with no passwords. Role-based access (Admin / User / Guest) controls every module. All sensitive actions require two distinct admins to propose and approve. Self-approval is blocked at the canister level. The immutable Audit Trail captures every action with actor principal, timestamp, and entity reference.",
    highlights: [
      "Internet Identity — cryptographic, passwordless auth",
      "Two-admin approval for all sensitive operations",
      "Self-approval blocked in Motoko canister code",
      "Immutable audit log with full actor attribution",
    ],
  },
  {
    icon: Globe,
    title: "Decentralization",
    body: "DecibelChain runs entirely on the Internet Computer Protocol (ICP). There is no central server, no cloud provider dependency, and no single point of failure. All application code and data live in on-chain canisters with cryptographic provenance. Updates to the canister require governance approval, making the platform verifiably tamper-resistant.",
    highlights: [
      "No central server — all on ICP canisters",
      "Subnet-level fault tolerance and geo-redundancy",
      "On-chain certificates with SHA-256 provenance hashes",
      "Canister upgrades require governance approval",
    ],
  },
];

const roadmap = [
  {
    part: "8-A",
    status: "live" as const,
    title: "Help Center & Documentation",
    desc: "This page — searchable in-app documentation, comprehensive FAQ, module guides for all user levels, architecture overview, and multi-tenancy explanation.",
  },
  {
    part: "8-B",
    status: "planned" as const,
    title: "Tenant Onboarding Console",
    desc: "Self-service organization registration wizard, interactive onboarding checklist with progress tracking, and a tenant health dashboard showing completion status for key setup steps.",
  },
  {
    part: "8-C",
    status: "planned" as const,
    title: "White-Label & Per-Org Branding",
    desc: "Logo upload, accent color customization, org-scoped homepage with custom welcome message, and branded certificate exports — enabling each tenant to present a custom-branded experience.",
  },
  {
    part: "8-D",
    status: "planned" as const,
    title: "Advanced Vendor Portal",
    desc: "Vendor self-onboarding flow, dedicated vendor dashboard for integration management, integration request workflow, and vendor-tier badge system for trust signaling.",
  },
  {
    part: "8-E",
    status: "planned" as const,
    title: "Global UI Polish & Accessibility",
    desc: "Typography refinement, motion choreography, WCAG 2.1 AA color contrast audit, full ARIA role coverage, keyboard navigation for all interactive surfaces, and screen-reader compatibility.",
  },
];

export function HelpCenter() {
  const { actor, isFetching } = useActor();
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const q = searchQuery.toLowerCase().trim();

  useEffect(() => {
    if (!actor || isFetching) return;
    (actor as any)
      .isCallerAdmin()
      .then((v: boolean) => setIsAdmin(Boolean(v)))
      .catch(() => {});
  }, [actor, isFetching]);

  const filteredModules = useMemo(
    () =>
      q
        ? modules.filter(
            (m) =>
              m.name.toLowerCase().includes(q) ||
              m.description.toLowerCase().includes(q) ||
              m.tips.some((t) => t.toLowerCase().includes(q)),
          )
        : modules,
    [q],
  );

  const filteredFaq = useMemo(
    () =>
      q
        ? faqCategories
            .map((cat) => ({
              ...cat,
              items: cat.items.filter(
                (item) =>
                  item.q.toLowerCase().includes(q) ||
                  item.a.toLowerCase().includes(q),
              ),
            }))
            .filter((cat) => cat.items.length > 0)
        : faqCategories,
    [q],
  );

  const filteredSteps = useMemo(
    () =>
      q
        ? gettingStartedSteps.filter(
            (s) =>
              s.title.toLowerCase().includes(q) ||
              s.body.toLowerCase().includes(q) ||
              s.tip.toLowerCase().includes(q),
          )
        : gettingStartedSteps,
    [q],
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-bold text-foreground">
                Help Center
              </h1>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-semibold">
                v8-A Live
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Complete documentation for all platform users — from first login
              to advanced integrations.
            </p>
          </div>
        </div>
        <div className="relative sm:ml-auto w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
            data-ocid="help.search_input"
          />
        </div>
      </div>

      <Tabs defaultValue="getting-started" className="w-full">
        <ScrollArea className="w-full" type="scroll">
          <TabsList className="flex w-max bg-card border border-border gap-1 p-1">
            <TabsTrigger
              value="getting-started"
              data-ocid="help.getting_started.tab"
              className="text-xs sm:text-sm"
            >
              Getting Started
            </TabsTrigger>
            <TabsTrigger
              value="modules"
              data-ocid="help.modules.tab"
              className="text-xs sm:text-sm"
            >
              All Modules
            </TabsTrigger>
            <TabsTrigger
              value="faq"
              data-ocid="help.faq.tab"
              className="text-xs sm:text-sm"
            >
              FAQ
            </TabsTrigger>
            <TabsTrigger
              value="architecture"
              data-ocid="help.architecture.tab"
              className="text-xs sm:text-sm"
            >
              Architecture
            </TabsTrigger>
            <TabsTrigger
              value="roadmap"
              data-ocid="help.roadmap.tab"
              className="text-xs sm:text-sm"
            >
              Roadmap
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        <TabsContent value="getting-started" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground mb-1">
              New to DecibelChain?
            </h2>
            <p className="text-sm text-muted-foreground">
              Follow these five steps to go from first login to receiving
              royalties on your works.
            </p>
          </div>
          {filteredSteps.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No results for &quot;{searchQuery}&quot;
            </p>
          )}
          <div className="space-y-4">
            {filteredSteps.map((step) => {
              const Icon = step.icon;
              return (
                <Card
                  key={step.num}
                  className="border-border bg-card hover:border-primary/40 transition-colors"
                  data-ocid={`help.step.item.${step.num}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {step.num}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                        <CardTitle className="text-base font-semibold text-foreground">
                          {step.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pl-[3.25rem]">
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      {step.body}
                    </p>
                    <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
                      <Star className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-primary/90">{step.tip}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card className="border-primary/30 bg-primary/5 mt-6">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Need more detail?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Each step maps to a full module documented in the{" "}
                    <strong className="text-foreground">All Modules</strong>{" "}
                    tab. The <strong className="text-foreground">FAQ</strong>{" "}
                    tab covers the most common questions by category. For
                    technical integrations, see{" "}
                    <strong className="text-foreground">Architecture</strong>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground mb-1">
              Platform Modules
            </h2>
            <p className="text-sm text-muted-foreground">
              Every section of DecibelChain explained — what it does, how to use
              it, and pro tips.
            </p>
          </div>
          {filteredModules.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No modules match &quot;{searchQuery}&quot;
            </p>
          )}
          <Accordion type="multiple" className="space-y-2">
            {filteredModules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <AccordionItem
                  key={mod.name}
                  value={mod.name}
                  className="border border-border rounded-lg bg-card px-1 data-[state=open]:border-primary/40"
                  data-ocid={`help.module.item.${idx + 1}`}
                >
                  <AccordionTrigger className="px-3 py-3 hover:no-underline group">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground text-left">
                        {mod.name}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3 pl-10">
                      {mod.description}
                    </p>
                    <div className="pl-10 space-y-1.5">
                      {mod.tips.map((tip) => (
                        <div key={tip} className="flex items-start gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
          {isAdmin && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-primary">
                  Admin Guides
                </h3>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  Admin Only
                </Badge>
              </div>
              <Accordion type="multiple" className="space-y-2">
                {[
                  {
                    title: "Two-Admin Approval Workflow",
                    body: "Any admin can propose a sensitive action (fee change, key revocation, contract execution, marketplace approval). The proposal is logged immediately. A second, distinct admin must then navigate to the relevant section and confirm. The confirming admin identity is verified cryptographically — you cannot approve your own proposal.",
                    tips: [
                      "Proposals expire if not confirmed within the configured window.",
                      "Both the proposer and approver are recorded in the Audit Trail.",
                      "There is no UI bypass — self-approval is blocked at the canister level.",
                    ],
                  },
                  {
                    title: "Fee Configuration",
                    body: "Platform fees are defined in basis points (bps) or percentage (%). To change a fee: Admin → Admin Panel → Fee Configuration → Propose New Fee. A second admin must confirm. Active fee changes take effect immediately after approval. All fee history is preserved in the Audit Trail.",
                    tips: [
                      "1 bps = 0.01%; 100 bps = 1%.",
                      "Pending proposals are shown in a banner — only one proposal per fee type can be active at once.",
                    ],
                  },
                  {
                    title: "User Management & Role Assignment",
                    body: "Admins can change any member role (Admin / User / Guest) from Admin Panel → User Management or Community → Member Directory. Role changes take effect immediately and are logged. Admins cannot modify their own role — a second admin must do so to prevent accidental self-demotion.",
                    tips: [
                      "Always maintain at least two active Admins per org for two-admin workflows.",
                      "Demoting an Admin removes their ability to approve pending proposals.",
                    ],
                  },
                  {
                    title: "Bulk Data Export",
                    body: "Platform → Reports → Bulk Data Exports. Four export types: Royalty Statements CSV, Audit Trail (up to 10,000 entries), Investment Portfolio Summary, and Consolidated Rights Report. Exports are generated client-side from on-chain data and downloaded as CSV. Non-admins see a lock notice.",
                    tips: [
                      "Schedule regular exports for accounting period closes.",
                      "The Consolidated Rights Report is the most complete: one row per work with all splits, territories, licenses, revenue, and performances.",
                    ],
                  },
                ].map((guide, i) => (
                  <AccordionItem
                    key={guide.title}
                    value={guide.title}
                    className="border border-primary/30 rounded-lg bg-primary/5 px-1"
                    data-ocid={`help.admin_guide.item.${i + 1}`}
                  >
                    <AccordionTrigger className="px-3 py-3 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground text-left">
                          {guide.title}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-4">
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3 pl-7">
                        {guide.body}
                      </p>
                      <div className="pl-7 space-y-1.5">
                        {guide.tips.map((tip) => (
                          <div key={tip} className="flex items-start gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground">
                              {tip}
                            </p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </TabsContent>

        <TabsContent value="faq" className="mt-6 space-y-6">
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground mb-1">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredFaq.reduce((n, c) => n + c.items.length, 0)} questions
              across {filteredFaq.length} categories.
            </p>
          </div>
          {filteredFaq.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No FAQ items match &quot;{searchQuery}&quot;
            </p>
          )}
          {filteredFaq.map((cat, catIdx) => {
            const CatIcon = cat.icon;
            return (
              <div key={cat.category}>
                <div className="flex items-center gap-2 mb-3">
                  <CatIcon className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    {cat.category}
                  </h3>
                  <div className="flex-1 h-px bg-border" />
                  <Badge
                    variant="outline"
                    className="text-xs border-border text-muted-foreground"
                  >
                    {cat.items.length}
                  </Badge>
                </div>
                <Accordion type="multiple" className="space-y-1.5">
                  {cat.items.map((item) => (
                    <AccordionItem
                      key={item.q}
                      value={`${catIdx}-${item.q}`}
                      className="border border-border rounded-lg bg-card px-1 data-[state=open]:border-primary/40"
                      data-ocid={`help.faq.item.${catIdx + 1}`}
                    >
                      <AccordionTrigger className="px-3 py-3 hover:no-underline text-left">
                        <div className="flex items-start gap-2">
                          <HelpCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm font-medium text-foreground text-left">
                            {item.q}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-4 pl-9">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.a}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="architecture" className="mt-6 space-y-6">
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground mb-1">
              How DecibelChain Works as a Multi-Tenant, Multi-Organization,
              Multi-Vendor PaaS
            </h2>
            <p className="text-sm text-muted-foreground">
              Understanding the platform architecture helps you get the most out
              of its capabilities — whether you are a solo artist, a publishing
              house, a technology integrator, or an enterprise PRO.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {architectureSections.map((sec, idx) => {
              const Icon = sec.icon;
              return (
                <Card
                  key={sec.title}
                  className="border-border bg-card border-l-4 border-l-primary/60 hover:border-l-primary transition-colors"
                  data-ocid={`help.architecture.item.${idx + 1}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {sec.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {sec.body}
                    </p>
                    <div className="space-y-1">
                      {sec.highlights.map((h) => (
                        <div key={h} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">{h}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-primary" />
                Platform Layer Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  {
                    label: "Internet Identity",
                    sub: "Cryptographic authentication layer",
                    shade: "bg-primary",
                  },
                  {
                    label: "ICP Canister (Motoko)",
                    sub: "On-chain logic, data storage, cryptographic provenance",
                    shade: "bg-primary/80",
                  },
                  {
                    label: "Multi-Tenant Org Layer",
                    sub: "Isolated data per org, cross-org collaboration via explicit grants",
                    shade: "bg-primary/60",
                  },
                  {
                    label: "Rights & Royalty Engine",
                    sub: "Works, splits, revenue, statements, certificates",
                    shade: "bg-primary/45",
                  },
                  {
                    label: "PaaS Integration Layer",
                    sub: "API Keys, Webhooks, HTTP Outcalls, Marketplace",
                    shade: "bg-primary/30",
                  },
                  {
                    label: "Frontend (React / ICP)",
                    sub: "Responsive UI — desktop sidebar, mobile nav, public discovery",
                    shade: "bg-primary/15",
                  },
                ].map((layer, i) => (
                  <div
                    key={layer.label}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-md ${layer.shade}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-foreground">
                        {i + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {layer.label}
                      </p>
                      <p className="text-[11px] text-foreground/70">
                        {layer.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground mb-1">
              Phase 8 Roadmap
            </h2>
            <p className="text-sm text-muted-foreground">
              What is live now and what is coming next in the DecibelChain
              platform build.
            </p>
          </div>
          <div className="space-y-3">
            {roadmap.map((item, idx) => (
              <Card
                key={item.part}
                className={`border-border bg-card transition-colors ${item.status === "live" ? "border-l-4 border-l-primary/80" : "border-l-4 border-l-border"}`}
                data-ocid={`help.roadmap.item.${idx + 1}`}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Badge
                        className={`text-[11px] font-mono ${item.status === "live" ? "bg-primary/20 text-primary border-primary/40" : "bg-muted text-muted-foreground border-border"}`}
                        variant="outline"
                      >
                        {item.part}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">
                          {item.title}
                        </p>
                        {item.status === "live" ? (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                            ✅ Live
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-muted-foreground border-border"
                          >
                            🔜 Planned
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-primary/30 bg-primary/5 mt-4">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    All Previous Phases Complete
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Phases 1–7 are all live and stable: Works Registry, Splits,
                    Revenue, Statements, Licensing, Financing, Portfolio,
                    Community, Compliance, Territories, Performances, Valuation,
                    Discovery, Intelligence, Contracts, Reports, API Keys,
                    Webhooks, Marketplace, Batch Operations, and Certificates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
