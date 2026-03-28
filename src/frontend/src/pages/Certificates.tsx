import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Award, CheckCircle2, Copy, ExternalLink, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Certificate {
  id: string;
  workTitle: string;
  iswc: string;
  isrc: string;
  registeredOwner: string;
  registrationDate: string;
  status: "Active" | "Revoked";
  hash: string;
  territories: string;
  splits: { name: string; percentage: number }[];
}

const MOCK_CERTIFICATES: Certificate[] = [
  {
    id: "CERT-7F3A2B9D1E4C",
    workTitle: "Midnight Horizon",
    iswc: "T-034.524.680-1",
    isrc: "USRC17607839",
    registeredOwner: "Elena Vasquez",
    registrationDate: "2024-11-15T10:22:00Z",
    status: "Active",
    hash: "a4f8c3d921e6b705f18c4a97d3e2f0a1b5c8d7e3f2a1b4c9d6e3f0a2b5c8d1e4",
    territories: "Worldwide",
    splits: [
      { name: "Elena Vasquez", percentage: 60 },
      { name: "Ryo Tanaka", percentage: 25 },
      { name: "Nova Sound LLC", percentage: 15 },
    ],
  },
  {
    id: "CERT-2C8E1F4A7D9B",
    workTitle: "Broken Architecture",
    iswc: "T-071.293.445-6",
    isrc: "GBAYE0601477",
    registeredOwner: "Marcus Bell",
    registrationDate: "2025-01-08T14:05:00Z",
    status: "Active",
    hash: "b2e5a8f1c4d7b0e3a6f9c2d5b8e1a4f7c0d3b6e9a2f5c8d1b4e7a0f3c6d9b2e5",
    territories: "North America, Europe",
    splits: [
      { name: "Marcus Bell", percentage: 75 },
      { name: "Lyric House Publishing", percentage: 25 },
    ],
  },
  {
    id: "CERT-9D5B3E0F2A6C",
    workTitle: "Solstice",
    iswc: "T-905.111.302-7",
    isrc: "FRUM71600053",
    registeredOwner: "Amara Osei",
    registrationDate: "2025-03-01T09:47:00Z",
    status: "Active",
    hash: "c7d0b3e6a9f2c5d8b1e4a7f0c3d6b9e2a5f8c1d4b7e0a3f6c9d2b5e8a1f4c7d0",
    territories: "Worldwide",
    splits: [
      { name: "Amara Osei", percentage: 50 },
      { name: "Synthesis Records", percentage: 30 },
      { name: "Beat Architecture Co.", percentage: 20 },
    ],
  },
  {
    id: "CERT-1A6C4E8B2F0D",
    workTitle: "Glass Frequencies",
    iswc: "T-448.827.113-3",
    isrc: "DEUM71800044",
    registeredOwner: "Jin-ho Park",
    registrationDate: "2025-02-14T16:33:00Z",
    status: "Revoked",
    hash: "d9e2b5a8f1c4d7b0e3a6f9c2d5b8e1a4f7c0d3b6e9a2f5c8d1b4e7a0f3c6d9b2",
    territories: "Asia Pacific",
    splits: [{ name: "Jin-ho Park", percentage: 100 }],
  },
];

const MOCK_WORKS = [
  { id: "w1", title: "New Dawn", iswc: "T-123.456.789-0" },
  { id: "w2", title: "Electric Requiem", iswc: "T-234.567.890-1" },
  { id: "w3", title: "Atlas", iswc: "T-345.678.901-2" },
  { id: "w4", title: "Frequency Drift", iswc: "T-456.789.012-3" },
  { id: "w5", title: "Parallax", iswc: "T-567.890.123-4" },
];

function generateHash(workId: string): string {
  const seed = workId + Date.now().toString();
  let hash = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < 64; i++) {
    const code = seed.charCodeAt(i % seed.length) ^ (i * 31 + 7);
    hash += chars[code & 0xf];
  }
  return hash;
}

function generateCertId(workId: string): string {
  const chars = "0123456789ABCDEF";
  let id = "CERT-";
  for (let i = 0; i < 12; i++) {
    id += chars[(workId.charCodeAt(i % workId.length) ^ (i * 17)) & 0xf];
  }
  return id;
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`${label} copied to clipboard`);
  });
}

function CertCard({ cert }: { cert: Certificate }) {
  const verifyUrl = `${window.location.href.split("?")[0]}?verify=${cert.id}`;
  const index = MOCK_CERTIFICATES.indexOf(cert) + 1;

  return (
    <Card
      data-ocid={`certificates.item.${index}`}
      className="relative border border-border bg-card overflow-hidden"
      style={{
        borderColor:
          cert.status === "Active" ? "oklch(0.78 0.12 85 / 0.4)" : undefined,
      }}
    >
      {/* Decorative gold top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background:
            cert.status === "Active"
              ? "linear-gradient(90deg, oklch(0.78 0.12 85 / 0), oklch(0.78 0.12 85), oklch(0.78 0.12 85 / 0))"
              : "transparent",
        }}
      />
      <CardHeader className="pb-2 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: "oklch(0.78 0.12 85 / 0.1)",
                border: "1px solid oklch(0.78 0.12 85 / 0.3)",
              }}
            >
              <Award
                className="w-5 h-5"
                style={{ color: "oklch(0.78 0.12 85)" }}
              />
            </div>
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "oklch(0.78 0.12 85)" }}
              >
                Certificate of Rights
              </p>
              <h3 className="font-semibold text-foreground">
                {cert.workTitle}
              </h3>
            </div>
          </div>
          <Badge
            className={
              cert.status === "Active"
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-destructive/20 text-destructive border-destructive/30"
            }
            variant="outline"
          >
            {cert.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">ISWC</p>
            <p className="font-mono text-foreground">{cert.iswc}</p>
          </div>
          <div>
            <p className="text-muted-foreground">ISRC</p>
            <p className="font-mono text-foreground">{cert.isrc}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Registered Owner</p>
            <p className="text-foreground">{cert.registeredOwner}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Date</p>
            <p className="text-foreground">
              {new Date(cert.registrationDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Certificate ID */}
        <div
          className="rounded-md p-2 flex items-center justify-between gap-2"
          style={{ background: "oklch(0.12 0.01 240)" }}
        >
          <p className="font-mono text-xs text-muted-foreground truncate">
            {cert.id}
          </p>
          <button
            type="button"
            data-ocid="certificates.copy.button"
            onClick={() => copyToClipboard(cert.id, "Certificate ID")}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hash */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            Tamper-evident Hash
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/70 break-all leading-relaxed">
            {cert.hash}
          </p>
        </div>

        {/* Share */}
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-2 text-xs"
          data-ocid="certificates.share.button"
          onClick={() => copyToClipboard(verifyUrl, "Verification link")}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Share Verification Link
        </Button>
      </CardContent>
    </Card>
  );
}

interface IssuedCert {
  id: string;
  hash: string;
  workTitle: string;
  iswc: string;
}

export function Certificates() {
  const [selectedWork, setSelectedWork] = useState("");
  const [notes, setNotes] = useState("");
  const [issuedCert, setIssuedCert] = useState<IssuedCert | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  function handleGenerate() {
    if (!selectedWork) {
      toast.error("Please select a work");
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const work = MOCK_WORKS.find((w) => w.id === selectedWork);
      if (!work) return;
      const certId = generateCertId(selectedWork);
      const hash = generateHash(selectedWork);
      setIssuedCert({
        id: certId,
        hash,
        workTitle: work.title,
        iswc: work.iswc,
      });
      setIsGenerating(false);
      toast.success("Certificate issued successfully");
    }, 1200);
  }

  function handleReset() {
    setIssuedCert(null);
    setSelectedWork("");
    setNotes("");
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: "oklch(0.78 0.12 85 / 0.15)",
            border: "1px solid oklch(0.78 0.12 85 / 0.3)",
          }}
        >
          <Award className="w-5 h-5" style={{ color: "oklch(0.78 0.12 85)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Certificates of Rights
          </h1>
          <p className="text-sm text-muted-foreground">
            Issue and manage on-chain provenance certificates
          </p>
        </div>
      </div>

      <Tabs defaultValue="my-certs">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="my-certs" data-ocid="certificates.my_certs.tab">
            My Certificates
          </TabsTrigger>
          <TabsTrigger value="issue" data-ocid="certificates.issue.tab">
            Issue Certificate
          </TabsTrigger>
        </TabsList>

        {/* My Certificates */}
        <TabsContent value="my-certs" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_CERTIFICATES.map((cert) => (
              <CertCard key={cert.id} cert={cert} />
            ))}
          </div>
        </TabsContent>

        {/* Issue Certificate */}
        <TabsContent value="issue" className="mt-4 max-w-xl">
          {issuedCert ? (
            <Card
              className="border"
              style={{ borderColor: "oklch(0.78 0.12 85 / 0.4)" }}
            >
              <CardContent className="pt-6 space-y-5">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: "oklch(0.78 0.12 85 / 0.1)",
                      border: "2px solid oklch(0.78 0.12 85 / 0.5)",
                    }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ color: "oklch(0.78 0.12 85)" }}
                    >
                      Certificate Issued
                    </p>
                    <h3 className="font-bold text-lg text-foreground">
                      {issuedCert.workTitle}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      {issuedCert.iswc}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Certificate ID
                    </p>
                    <div
                      className="rounded-md p-3 flex items-center justify-between gap-2"
                      data-ocid="certificates.new_cert.panel"
                      style={{ background: "oklch(0.12 0.01 240)" }}
                    >
                      <p className="font-mono text-sm text-foreground font-semibold">
                        {issuedCert.id}
                      </p>
                      <button
                        type="button"
                        data-ocid="certificates.copy_id.button"
                        onClick={() =>
                          copyToClipboard(issuedCert.id, "Certificate ID")
                        }
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Tamper-evident Hash (SHA-256)
                    </p>
                    <div
                      className="rounded-md p-3 flex items-start justify-between gap-2"
                      style={{ background: "oklch(0.12 0.01 240)" }}
                    >
                      <p className="font-mono text-[11px] text-muted-foreground break-all leading-relaxed">
                        {issuedCert.hash}
                      </p>
                      <button
                        type="button"
                        data-ocid="certificates.copy_hash.button"
                        onClick={() =>
                          copyToClipboard(issuedCert.hash, "Certificate hash")
                        }
                        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    data-ocid="certificates.share_new.button"
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.href.split("?")[0]}?verify=${issuedCert.id}`,
                        "Verification link",
                      )
                    }
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    data-ocid="certificates.issue_another.button"
                    onClick={handleReset}
                  >
                    Issue Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Shield
                    className="w-4 h-4"
                    style={{ color: "oklch(0.78 0.12 85)" }}
                  />
                  <h2 className="font-semibold text-sm">
                    Generate New Certificate
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Issue an on-chain certificate of rights with a tamper-evident
                  hash anchored to the ICP blockchain.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="work-select">Work</Label>
                  <Select value={selectedWork} onValueChange={setSelectedWork}>
                    <SelectTrigger
                      id="work-select"
                      data-ocid="certificates.work.select"
                    >
                      <SelectValue placeholder="Select a work to certify..." />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_WORKS.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.title} — {w.iswc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cert-notes">Notes (optional)</Label>
                  <Textarea
                    id="cert-notes"
                    data-ocid="certificates.notes.textarea"
                    placeholder="Additional context or provenance notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <Button
                  className="w-full gap-2"
                  data-ocid="certificates.generate.button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedWork}
                >
                  <Award className="w-4 h-4" />
                  {isGenerating
                    ? "Generating Certificate..."
                    : "Generate Certificate"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { MOCK_CERTIFICATES };
