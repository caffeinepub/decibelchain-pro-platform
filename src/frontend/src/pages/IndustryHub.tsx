import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GitFork,
  KeyRound,
  Loader2,
  Lock,
  Music2,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Unlock,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface IndustryHubProps {
  onNavigate: (page: string) => void;
  isLoggedIn?: boolean;
  onLogin?: () => void;
  isLoggingIn?: boolean;
}

const STATS = [
  {
    value: "$2.65B+",
    label: 'Annual "black box" royalties unclaimed each year',
    source: "CISAC",
    color: "text-amber-400",
  },
  {
    value: "12\u201318mo",
    label: "Average wait between performance and PRO payment",
    source: "Industry avg",
    color: "text-red-400",
  },
  {
    value: "12%",
    label: "Revenue share to indie artists who create 40%+ of content",
    source: "MIDiA Research 2023",
    color: "text-orange-400",
  },
  {
    value: "$0.003",
    label:
      "Average per-stream payout \u2014 royalty chain invisible to creators",
    source: "Spotify avg",
    color: "text-amber-400",
  },
  {
    value: "75%",
    label: "Songwriters who cannot trace all their royalty streams",
    source: "Industry surveys",
    color: "text-yellow-400",
  },
  {
    value: "0%",
    label: "Backend master royalties session musicians receive by default",
    source: "Standard contracts",
    color: "text-red-400",
  },
  {
    value: "$10.9B",
    label:
      "Total royalties collected globally in 2023 \u2014 15\u201320% unmatched",
    source: "CISAC 2023",
    color: "text-amber-400",
  },
  {
    value: "40\u201360%",
    label: "Sync licensing deals never fully reported back to composers",
    source: "Industry audit data",
    color: "text-orange-400",
  },
];

const CASE_STUDIES = [
  {
    id: "taylor",
    title: "Taylor Swift & The Masters Dispute",
    year: "2019",
    category: "Ownership Rights",
    summary:
      "Taylor Swift publicly revealed her masters were sold without her consent, forcing her to re-record 6 albums to regain creative and commercial control. A defining moment in modern artist ownership.",
    detail:
      "When talent manager Scooter Braun acquired Big Machine Records in 2019, he gained ownership of Taylor Swift's first six albums without her knowledge or consent. The sale price was reportedly $300 million. Swift had no contractual right to purchase her own masters. She spent years re-recording every album under the \"Taylor's Version\" brand, a $50M+ undertaking, to give fans a version she owned.",
    decibelSolution:
      "On-chain rights registration from day one means no entity can transfer or sell your masters without your cryptographic signature. Your keys, your rights \u2014 immutably recorded and cryptographically enforced.",
    icon: Lock,
  },
  {
    id: "blackbox",
    title: "The Black Box Fund Problem",
    year: "2021",
    category: "Unclaimed Royalties",
    summary:
      "ASCAP, BMI, and PRS collectively hold hundreds of millions in black box funds \u2014 royalties collected but unable to be matched to rights owners. PRS for Music alone had \u00a377M in unallocated royalties in 2021.",
    detail:
      "The black box is a systemic failure of the global PRO infrastructure. Royalties are collected from broadcasters, streaming services, and venues \u2014 but when metadata is missing or inconsistent across registries, the money cannot be matched to its rightful owner. It sits in a fund, accruing interest for the PRO, and is often distributed proportionally to already-known rights holders \u2014 effectively rewarding large catalog owners at the expense of independents.",
    decibelSolution:
      "DecibelChain's BlackBoxSplits\u2122 closes this gap permanently. Our proprietary algorithm scans global PRO databases for unmatched royalties bearing your works' identifiers \u2014 ISRC, ISWC, and on-chain registration hashes \u2014 and claims them automatically on your behalf.",
    icon: Search,
  },
  {
    id: "session",
    title: "The Invisible Session Musician",
    year: "Legacy",
    category: "Session Rights",
    summary:
      "Hal Blaine played drums on 40+ #1 hits including 'Mrs. Robinson' and 'Good Vibrations.' Despite being on some of the most profitable recordings in history, session players received flat fees and zero ongoing royalties.",
    detail:
      "Hal Blaine was the most recorded drummer in history, appearing on over 6,000 recordings and more than 150 Top 10 hits between 1957 and 1988. He was a core member of the legendary Wrecking Crew \u2014 the uncredited session musicians who played on countless iconic records. Despite his incomparable contribution to popular music, Blaine received flat session fees with no royalty participation. Modern session musicians continue to face the same barriers today.",
    decibelSolution:
      "FairerSplits\u2122 + InstaSplits\u2122 ensures every contributor is listed on-chain and paid automatically. No more \"I didn't know I wasn't getting that 3%\" \u2014 every split is agreed, signed, and locked before the work is registered.",
    icon: Music2,
  },
  {
    id: "prince",
    title: 'Prince: Writing "SLAVE" on His Face',
    year: "1993",
    category: "Artist Freedom",
    summary:
      'Prince wrote "SLAVE" on his face in protest of Warner Bros owning his master recordings. He changed his name to an unpronounceable symbol to escape his contract. His fight became the defining artist rights case of the era.',
    detail:
      "In 1993, Prince began writing the word SLAVE on his cheek in public appearances. His contract with Warner Bros. gave the label full ownership of his master recordings \u2014 meaning they could license, sell, and profit from his art without his approval. He changed his name to an unpronounceable symbol to technically nullify his recording contract. After his Warner contract expired in 1996, Prince fought for the rest of his life to own his catalog. He never fully recovered it before his death in 2016.",
    decibelSolution:
      "DecibelChain's decentralized ownership model means you register your works, you hold your cryptographic keys, and no label can transfer your rights without on-chain consent. Your music. Your rights. Your future.",
    icon: Shield,
  },
];

const COMPARISON_ROWS = [
  {
    label: "Payout Speed",
    traditional: "12\u201318 months",
    decibelchain: "Real-time (InstaSplits\u2122)",
    icon: Zap,
  },
  {
    label: "Transparency",
    traditional: "Opaque black box",
    decibelchain: "Full on-chain audit trail",
    icon: Search,
  },
  {
    label: "Split Accuracy",
    traditional: "Manual, error-prone",
    decibelchain: "Cryptographically locked (FairerSplits\u2122)",
    icon: GitFork,
  },
  {
    label: "Black Box Handling",
    traditional: "Retained by PRO",
    decibelchain: "Claimed for you (BlackBoxSplits\u2122)",
    icon: Unlock,
  },
  {
    label: "Global Coverage",
    traditional: "Multiple PROs per territory",
    decibelchain: "Single platform, all territories",
    icon: TrendingUp,
  },
  {
    label: "Cost",
    traditional: "Annual fees + % of royalties",
    decibelchain: "Transparent platform fees only",
    icon: Sparkles,
  },
  {
    label: "Works Registration",
    traditional: "Manual, weeks to process",
    decibelchain: "Instant, on-chain",
    icon: CheckCircle2,
  },
  {
    label: "Dispute Resolution",
    traditional: "Months-long arbitration",
    decibelchain: "On-chain evidence, dispute center",
    icon: Shield,
  },
  {
    label: "Ownership Certificates",
    traditional: "Paper certificates only",
    decibelchain: "Tamper-evident on-chain certificates",
    icon: Lock,
  },
];

const PLEDGE_EXAMPLES = [
  { name: "Maria Santos", role: "Independent Artist", location: "Brazil" },
  { name: "James O.", role: "Session Guitarist", location: "UK" },
  { name: "Priya Nair", role: "Publisher", location: "India" },
  { name: "Carlos Reyes", role: "Songwriter", location: "Mexico" },
  { name: "Amara Osei", role: "Music Supervisor", location: "Ghana" },
  { name: "Li Wei", role: "Independent Artist", location: "China" },
  { name: "Sophie Blanc", role: "Producer", location: "France" },
  { name: "Kwame Asante", role: "Label Owner", location: "Nigeria" },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function IndustryHub({
  onNavigate,
  isLoggedIn,
  onLogin,
  isLoggingIn,
}: IndustryHubProps) {
  const [openCase, setOpenCase] = useState<string | null>(null);
  const [streams, setStreams] = useState(100000);
  const [currentPro, setCurrentPro] = useState("ASCAP");
  const [pledgeName, setPledgeName] = useState("");
  const [pledgeEmail, setPledgeEmail] = useState("");
  const [pledgeRole, setPledgeRole] = useState("");
  const [pledged, setPledged] = useState(false);
  const [pledgeCount, setPledgeCount] = useState(2847);
  const [tickerIdx, setTickerIdx] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIdx((i) => (i + 1) % PLEDGE_EXAMPLES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const scrollToStats = () =>
    statsRef.current?.scrollIntoView({ behavior: "smooth" });

  const annualStreams = streams * 12;
  const proRoyalty = annualStreams * 0.0009;
  const blackboxRecovery = proRoyalty * 0.15;
  const totalPotential = proRoyalty + blackboxRecovery;

  const handlePledge = () => {
    if (!pledgeName || !pledgeEmail || !pledgeRole) return;
    setPledgeCount((c) => c + 1);
    setPledged(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <img
          src="/assets/generated/campaign-hero.dim_1200x500.jpg"
          alt="DecibelChain Music Ownership Revolution"
          className="w-full h-[480px] object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-widest text-primary border border-primary/40 rounded-full bg-primary/10">
              The Ownership Generation
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
              The Music Industry{" "}
              <span className="text-primary">Owes You More.</span>
              <br />
              Take It Back.
            </h1>
            <p className="text-base sm:text-lg text-white/75 max-w-2xl mx-auto mb-8 leading-relaxed">
              DecibelChain gives every artist, songwriter, label, publisher,
              producer, and session musician direct ownership and control of
              their rights \u2014 with full transparency, instant payouts, and
              zero missing royalties.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                data-ocid="hub.onboarding.primary_button"
                size="lg"
                onClick={() => onNavigate("tenantOnboarding")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 h-12 shadow-lg shadow-primary/30"
              >
                Start Claiming Your Royalties
              </Button>
              <Button
                data-ocid="hub.stats.secondary_button"
                size="lg"
                variant="outline"
                onClick={scrollToStats}
                className="border-white/30 text-white hover:bg-white/10 h-12 px-8"
              >
                See the Evidence
              </Button>
            </div>
            {!isLoggedIn && onLogin && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={onLogin}
                  disabled={isLoggingIn}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/30 text-white text-sm font-medium hover:bg-white/20 transition-colors disabled:opacity-60"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  {isLoggingIn
                    ? "Opening Internet Identity..."
                    : "Sign in free with Internet Identity"}
                </button>
                <p className="text-white/40 text-xs mt-2">
                  Internet Identity is free, private, and runs on ICP — no email
                  or password required.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section
        id="stats-section"
        ref={statsRef}
        className="px-6 py-16 max-w-7xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">
              The Evidence
            </span>
            <h2 className="font-display text-3xl font-bold mt-2 text-foreground">
              The Numbers Don&apos;t Lie
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              These are the systemic failures the music industry has normalised.
              DecibelChain was built to end every one of them.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-colors"
                data-ocid={`hub.stats.item.${i + 1}`}
              >
                <p
                  className={`font-display text-3xl font-bold mb-2 ${stat.color}`}
                >
                  {stat.value}
                </p>
                <p className="text-sm text-foreground leading-snug mb-3">
                  {stat.label}
                </p>
                <p className="text-xs text-muted-foreground/60 font-mono">
                  Source: {stat.source}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <div className="border-t border-primary/20 mx-6" />

      {/* AUDIENCE TABS */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold">
            Who We Serve
          </span>
          <h2 className="font-display text-3xl font-bold mt-2">
            Your Industry. Your Problem. Our Solution.
          </h2>
        </div>
        <Tabs defaultValue="indie" className="w-full">
          <TabsList
            data-ocid="hub.audience.tab"
            className="w-full bg-card border border-border rounded-xl p-1 mb-8 grid grid-cols-3 h-auto"
          >
            <TabsTrigger
              value="indie"
              className="rounded-lg py-3 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Independents & Songwriters
            </TabsTrigger>
            <TabsTrigger
              value="labels"
              className="rounded-lg py-3 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Labels, Publishers & Producers
            </TabsTrigger>
            <TabsTrigger
              value="session"
              className="rounded-lg py-3 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Session Musicians
            </TabsTrigger>
          </TabsList>

          <TabsContent value="indie">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  You Create Everything.{" "}
                  <span className="text-primary">You Own Almost Nothing.</span>
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Independent artists and songwriters are the most underpaid
                  creators in the global economy. You write the hits. You record
                  the songs. You tour, promote, and build the audiences that
                  generate billions. Yet the independent sector receives just
                  12% of total music revenue despite creating over 40% of all
                  content released globally.
                </p>
                <div className="space-y-4 mb-8">
                  {[
                    {
                      pain: "Payments delayed 12\u201318 months",
                      fix: "InstaSplits\u2122 pays the moment revenue is recognised",
                    },
                    {
                      pain: "Opaque splits you can't verify",
                      fix: "FairerSplits\u2122 locks every share on-chain before registration",
                    },
                    {
                      pain: "PRO registration confusion",
                      fix: "Instant one-click works registration with full metadata",
                    },
                    {
                      pain: "Unregistered works earning nothing",
                      fix: "Batch registration catches your entire back catalog",
                    },
                    {
                      pain: "Unmatched recordings in black box",
                      fix: "BlackBoxSplits\u2122 finds and claims money owed to you",
                    },
                  ].map((item) => (
                    <div key={item.pain} className="flex gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mt-0.5">
                        <span className="text-red-400 text-xs font-bold">
                          \u2715
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          {item.pain}
                        </p>
                        <p className="text-xs text-primary mt-0.5">
                          \u2192 {item.fix}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground text-sm leading-relaxed">
                  &ldquo;I had songs on 3 major streaming platforms for two
                  years and received zero PRO royalties because I didn&apos;t
                  know how to register properly. DecibelChain would have caught
                  all of that automatically.&rdquo;
                  <footer className="text-xs text-primary mt-2 not-italic font-semibold">
                    \u2014 Independent Artist
                  </footer>
                </blockquote>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl overflow-hidden border border-border"
              >
                <img
                  src="/assets/generated/campaign-indie-artists.dim_800x450.jpg"
                  alt="Independent artists and songwriters"
                  className="w-full h-auto object-cover"
                />
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="labels">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Your Catalog Revenue Is Leaking.{" "}
                  <span className="text-primary">Here&apos;s How Much.</span>
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Labels and publishers manage catalogs of hundreds \u2014
                  sometimes thousands \u2014 of tracks, with royalty income
                  distributed through multiple PROs, sub-publishers, and
                  licensees. The complexity creates gaps. Producers receive
                  their points only after label recoupment, meaning complex
                  revenue chains where numbers are regularly wrong, disputed,
                  and unresolved.
                </p>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                  <p className="text-sm font-semibold text-primary mb-1">
                    Industry Data Point
                  </p>
                  <p className="text-sm text-foreground">
                    Major labels dispute an estimated{" "}
                    <span className="font-bold text-primary">20\u201330%</span>{" "}
                    of royalty statements they receive from PROs and licensees
                    each year. Each dispute costs thousands in legal and
                    administrative fees \u2014 and most are never fully
                    resolved.
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      pain: "Sub-publisher float delays",
                      fix: "Direct on-chain distribution, no intermediary float",
                    },
                    {
                      pain: "PRO metadata mismatches",
                      fix: "Automated cross-territory reconciliation",
                    },
                    {
                      pain: "Unreported sync licensing",
                      fix: "License Registry with mandatory reporting",
                    },
                    {
                      pain: "Producer point calculation errors",
                      fix: "FairerSplits\u2122 locks producer points at contract signing",
                    },
                    {
                      pain: "Territory discrepancies",
                      fix: "Batch territory assignment with global coverage",
                    },
                  ].map((item) => (
                    <div key={item.pain} className="flex gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mt-0.5">
                        <span className="text-red-400 text-xs font-bold">
                          \u2715
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          {item.pain}
                        </p>
                        <p className="text-xs text-primary mt-0.5">
                          \u2192 {item.fix}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl overflow-hidden border border-border"
              >
                <img
                  src="/assets/generated/campaign-royalty-flow.dim_800x450.jpg"
                  alt="Royalty flow visualization"
                  className="w-full h-auto object-cover"
                />
                <div className="bg-card p-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Traditional royalty chains introduce up to 7 intermediary
                    layers between a streaming play and the rights holder.
                    DecibelChain collapses this to 1.
                  </p>
                </div>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="session">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                You Played on the Record.{" "}
                <span className="text-primary">Where&apos;s Your Share?</span>
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-8 max-w-3xl">
                Session musicians are the invisible backbone of the music
                industry. They play on albums, film scores, TV shows \u2014 and
                rarely see backend royalties. Music supervisors manage complex
                sync deals across huge catalogs, often with no real-time
                visibility into what&apos;s been reported or paid.
              </p>
              <div className="grid sm:grid-cols-3 gap-6 mb-10">
                {[
                  {
                    name: "FairerSplits\u2122",
                    icon: GitFork,
                    color: "text-amber-400",
                    borderColor: "border-amber-400/40",
                    bgColor: "bg-amber-400/5",
                    description:
                      "On-chain split agreements that every contributor signs digitally. Immutable and fully auditable. No more 'I didn't know I wasn't getting that 3%.'",
                  },
                  {
                    name: "InstaSplits\u2122",
                    icon: Zap,
                    color: "text-yellow-400",
                    borderColor: "border-yellow-400/40",
                    bgColor: "bg-yellow-400/5",
                    description:
                      "Real-time royalty distribution the moment revenue is recognised. When a sync fee clears, every split recipient gets paid immediately \u2014 not 12 months later.",
                  },
                  {
                    name: "BlackBoxSplits\u2122",
                    icon: Search,
                    color: "text-orange-400",
                    borderColor: "border-orange-400/40",
                    bgColor: "bg-orange-400/5",
                    description:
                      "Proprietary identification and routing that finds royalties in PRO black box funds and matches them to rightful owners \u2014 including session players who never knew they were owed money.",
                  },
                ].map((feature) => (
                  <div
                    key={feature.name}
                    className={`rounded-xl border ${feature.borderColor} ${feature.bgColor} p-6 shadow-lg`}
                  >
                    <feature.icon className={`w-8 h-8 ${feature.color} mb-4`} />
                    <h4
                      className={`font-display text-xl font-bold ${feature.color} mb-3`}
                    >
                      {feature.name}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
              <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground text-sm leading-relaxed max-w-2xl">
                &ldquo;I played on 6 tracks that went into major TV shows. I
                found out three years later through DecibelChain&apos;s
                BlackBoxSplits\u2122 that I was owed sync royalties I never
                received.&rdquo;
                <footer className="text-xs text-primary mt-2 not-italic font-semibold">
                  \u2014 Session Guitarist
                </footer>
              </blockquote>
            </motion.div>
          </TabsContent>
        </Tabs>
      </section>

      <div className="border-t border-primary/20 mx-6" />

      {/* NEWWAYSNOW FEATURE SHOWCASE */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold">
            NewWaysNow\u2122
          </span>
          <h2 className="font-display text-3xl font-bold mt-2">
            Three Innovations That Change Everything
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Proprietary technologies exclusive to DecibelChain \u2014 designed
            for the creators the industry left behind.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              name: "FairerSplits\u2122",
              icon: GitFork,
              tagline: "Every share, locked on-chain forever.",
              body: "Every contributor's percentage, agreed on-chain and cryptographically locked at the time of registration. No disputes. No missing names. No 'I thought you were handling that.' The split sheet is the law.",
              ocid: "hub.fairersplits.card",
            },
            {
              name: "InstaSplits\u2122",
              icon: Zap,
              tagline: "Revenue flows the moment it arrives.",
              body: "Revenue flows to rights holders the moment it's recognised \u2014 not 12 months later. Real-time distribution for the streaming age. The instant a sync fee, mechanical, or performance royalty is confirmed, every rights holder receives their share automatically.",
              ocid: "hub.instasplits.card",
            },
            {
              name: "BlackBoxSplits\u2122",
              icon: Search,
              tagline: "Found money, claimed automatically.",
              body: "Our proprietary algorithm scans global PRO databases for unmatched royalties bearing your works' identifiers \u2014 ISRC, ISWC, and on-chain registration hashes. Found money is claimed and routed to you automatically, with a full audit trail.",
              ocid: "hub.blackboxsplits.card",
            },
          ].map((feat) => (
            <motion.div
              key={feat.name}
              data-ocid={feat.ocid}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative rounded-2xl border border-primary/50 bg-card p-8 overflow-hidden group hover:border-primary transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
              <feat.icon className="w-10 h-10 text-primary mb-6" />
              <h3 className="font-display text-xl font-bold text-primary mb-2">
                {feat.name}
              </h3>
              <p className="text-sm font-semibold text-foreground mb-4 italic">
                {feat.tagline}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feat.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="border-t border-primary/20 mx-6" />

      {/* CASE STUDIES */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold">
            Case Studies
          </span>
          <h2 className="font-display text-3xl font-bold mt-2">
            History Repeats Itself. Until Now.
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            These are real stories from the music industry. Each one would have
            ended differently with DecibelChain.
          </p>
        </div>
        <div className="space-y-4">
          {CASE_STUDIES.map((cs, i) => (
            <motion.div
              key={cs.id}
              data-ocid={`hub.case_studies.item.${i + 1}`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <button
                type="button"
                className="w-full flex items-center gap-4 p-6 text-left hover:bg-primary/5 transition-colors"
                onClick={() => setOpenCase(openCase === cs.id ? null : cs.id)}
                data-ocid={`hub.case.${cs.id}.toggle`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <cs.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-primary/70 bg-primary/10 px-2 py-0.5 rounded">
                      {cs.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {cs.year}
                    </span>
                  </div>
                  <p className="font-display font-bold text-foreground">
                    {cs.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {cs.summary}
                  </p>
                </div>
                <div className="flex-shrink-0 text-muted-foreground">
                  {openCase === cs.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {openCase === cs.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-0 border-t border-border">
                      <p className="text-sm text-muted-foreground leading-relaxed mt-4 mb-4">
                        {cs.detail}
                      </p>
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">
                          What DecibelChain Would Have Done
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {cs.decibelSolution}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="border-t border-primary/20 mx-6" />

      {/* COMPARISON TABLE */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold">
            Side by Side
          </span>
          <h2 className="font-display text-3xl font-bold mt-2">
            Traditional PRO vs. DecibelChain
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Every dimension where the old system fails, the new one wins.
          </p>
        </div>
        <div
          data-ocid="hub.comparison.table"
          className="rounded-xl overflow-hidden border border-border"
        >
          <div className="grid grid-cols-3 bg-card border-b border-border">
            <div className="p-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Feature
            </div>
            <div className="p-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold text-center border-x border-border">
              Traditional PRO
            </div>
            <div className="p-4 text-xs uppercase tracking-wider text-primary font-semibold text-center bg-primary/5">
              DecibelChain \u2736
            </div>
          </div>
          {COMPARISON_ROWS.map((row, i) => (
            <div
              key={row.label}
              data-ocid={`hub.comparison.row.${i + 1}`}
              className="grid grid-cols-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
            >
              <div className="p-4 flex items-center gap-2">
                <row.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">
                  {row.label}
                </span>
              </div>
              <div className="p-4 flex items-center justify-center border-x border-border">
                <span className="text-sm text-muted-foreground text-center">
                  {row.traditional}
                </span>
              </div>
              <div className="p-4 flex items-center justify-center gap-2 bg-primary/5">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-primary font-medium text-center">
                  {row.decibelchain}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-primary/20 mx-6" />

      {/* ROYALTY CALCULATOR */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold">
            Interactive Tool
          </span>
          <h2 className="font-display text-3xl font-bold mt-2">
            How Much Are You Leaving on the Table?
          </h2>
          <p className="text-muted-foreground mt-2">
            Estimate your annual royalties and potential recovery with
            DecibelChain.
          </p>
        </div>
        <Card
          data-ocid="hub.calculator.card"
          className="border-primary/30 bg-card"
        >
          <CardContent className="p-8">
            <div className="grid sm:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-foreground">
                  Monthly streams:{" "}
                  <span className="text-primary font-bold">
                    {streams.toLocaleString()}
                  </span>
                </Label>
                <Slider
                  data-ocid="hub.calculator.streams_input"
                  value={[streams]}
                  onValueChange={([v]) => setStreams(v)}
                  min={1000}
                  max={10000000}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1K</span>
                  <span>10M</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Your current PRO
                </Label>
                <Select
                  data-ocid="hub.calculator.pro_select"
                  value={currentPro}
                  onValueChange={setCurrentPro}
                >
                  <SelectTrigger className="border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "ASCAP",
                      "BMI",
                      "SOCAN",
                      "PRS",
                      "SESAC",
                      "SACEM",
                      "GEMA",
                      "APRA AMCOS",
                      "Other / None",
                    ].map((pro) => (
                      <SelectItem key={pro} value={pro}>
                        {pro}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-lg bg-muted/30 border border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    Estimated annual royalties
                  </p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {formatNumber(proRoyalty)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Paid over 12\u201318 months
                  </p>
                </div>
                <div className="rounded-lg bg-primary/5 border border-primary/30 p-4 text-center">
                  <p className="text-xs text-primary mb-1">
                    With InstaSplits\u2122
                  </p>
                  <p className="font-display text-2xl font-bold text-primary">
                    {formatNumber(proRoyalty)}
                  </p>
                  <p className="text-xs text-primary/70 mt-1">
                    Paid monthly, not annually
                  </p>
                </div>
                <div className="rounded-lg bg-amber-500/5 border border-amber-500/30 p-4 text-center">
                  <p className="text-xs text-amber-400 mb-1">
                    BlackBoxSplits\u2122 recovery
                  </p>
                  <p className="font-display text-2xl font-bold text-amber-400">
                    +{formatNumber(blackboxRecovery)}
                  </p>
                  <p className="text-xs text-amber-400/70 mt-1">
                    ~15% unclaimed avg
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-primary/10 border border-primary/30 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">
                    Total potential with DecibelChain
                  </span>
                  <span className="font-display text-xl font-bold text-primary">
                    {formatNumber(totalPotential)}/yr
                  </span>
                </div>
                <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-4">
              * Estimates based on industry average performance royalty data
              (~$0.0009/stream). Actual results vary significantly by territory,
              usage type, PRO agreements, and catalog metadata quality.
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="border-t border-primary/20 mx-6" />

      {/* PLEDGE */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold">
            Join The Movement
          </span>
          <h2 className="font-display text-3xl font-bold mt-2">
            Join the Ownership Movement
          </h2>
          <p className="text-muted-foreground mt-2">
            Thousands of music creators are taking back control. Add your name.
          </p>
        </div>
        <div className="text-center mb-8">
          <motion.p
            key={pledgeCount}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
            className="font-display text-5xl font-bold text-foreground"
          >
            {pledgeCount.toLocaleString()}
          </motion.p>
          <p className="text-muted-foreground text-sm mt-1">
            creators have pledged ownership
          </p>
          <div className="mt-3 h-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={tickerIdx}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-xs text-primary"
              >
                {PLEDGE_EXAMPLES[tickerIdx].name} (
                {PLEDGE_EXAMPLES[tickerIdx].role},{" "}
                {PLEDGE_EXAMPLES[tickerIdx].location}) just pledged
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        {pledged ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            data-ocid="hub.pledge.success_state"
            className="text-center bg-primary/10 border border-primary/30 rounded-2xl p-10"
          >
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">
              You&apos;re in.
            </h3>
            <p className="text-muted-foreground">
              Welcome to the Ownership Generation.
            </p>
            <Button
              className="mt-6 bg-primary text-primary-foreground"
              onClick={() => onNavigate("tenantOnboarding")}
              data-ocid="hub.pledge.onboarding.button"
            >
              Register Your Works Now
            </Button>
          </motion.div>
        ) : (
          <Card data-ocid="hub.pledge.modal" className="border-border bg-card">
            <CardContent className="p-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="pledge-name">Full Name</Label>
                <Input
                  id="pledge-name"
                  data-ocid="hub.pledge.name_input"
                  placeholder="Your name"
                  value={pledgeName}
                  onChange={(e) => setPledgeName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pledge-email">Email Address</Label>
                <Input
                  id="pledge-email"
                  data-ocid="hub.pledge.email_input"
                  type="email"
                  placeholder="your@email.com"
                  value={pledgeEmail}
                  onChange={(e) => setPledgeEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Your Role</Label>
                <Select
                  data-ocid="hub.pledge.role_select"
                  value={pledgeRole}
                  onValueChange={setPledgeRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Independent Artist",
                      "Songwriter",
                      "Label",
                      "Publisher",
                      "Producer",
                      "Session Musician",
                      "Music Supervisor",
                      "Other",
                    ].map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                data-ocid="hub.pledge.submit_button"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-12"
                onClick={handlePledge}
                disabled={!pledgeName || !pledgeEmail || !pledgeRole}
              >
                Pledge to Own My Music
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <div className="border-t border-primary/20 mx-6" />

      {/* FOOTER CTA */}
      <section className="px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Your music. <span className="text-primary">Your rights.</span>
            <br />
            Your future.
          </p>
          <p className="text-muted-foreground mb-10 max-w-md mx-auto">
            Join a growing movement of music creators who refuse to leave their
            earnings behind.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              data-ocid="hub.footer.register.primary_button"
              size="lg"
              onClick={() => onNavigate("creativeWorks")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 h-12 shadow-lg shadow-primary/20"
            >
              Register Your Works Now
            </Button>
            <Button
              data-ocid="hub.footer.explore.secondary_button"
              size="lg"
              variant="outline"
              onClick={() => onNavigate("dashboard")}
              className="border-border hover:bg-muted/30 h-12 px-8"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Explore DecibelChain
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
