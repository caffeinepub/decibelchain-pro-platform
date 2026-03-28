import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Copy,
  Search,
  ShieldOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MOCK_CERTIFICATES } from "./Certificates";

interface CertificateVerificationProps {
  onLogin?: () => void;
  isAuthenticated?: boolean;
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`${label} copied`);
  });
}

export function CertificateVerification({
  onLogin,
  isAuthenticated,
}: CertificateVerificationProps) {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);

  // Auto-lookup from URL ?verify=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyCertId = params.get("verify");
    if (verifyCertId) {
      setQuery(verifyCertId);
      setSearched(true);
    }
  }, []);

  const found = searched
    ? MOCK_CERTIFICATES.find(
        (c) => c.id.toLowerCase() === query.toLowerCase().trim(),
      )
    : undefined;

  function handleSearch() {
    if (!query.trim()) return;
    setSearched(true);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header bar */}
      <header className="border-b border-border/60 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "oklch(0.78 0.12 85 / 0.15)",
              border: "1px solid oklch(0.78 0.12 85 / 0.4)",
            }}
          >
            <Award
              className="w-4 h-4"
              style={{ color: "oklch(0.78 0.12 85)" }}
            />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">DecibelChain</p>
            <p className="text-xs text-muted-foreground">
              Certificate Verification
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-3xl space-y-8">
          {/* Hero */}
          <div className="text-center space-y-2">
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
              style={{
                background: "oklch(0.78 0.12 85 / 0.1)",
                border: "2px solid oklch(0.78 0.12 85 / 0.3)",
              }}
            >
              <Award
                className="w-8 h-8"
                style={{ color: "oklch(0.78 0.12 85)" }}
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Verify a Certificate of Rights
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Enter a Certificate ID below to verify provenance, ownership, and
              tamper-evident integrity on-chain.
            </p>
          </div>

          {/* Search */}
          <div className="flex gap-2" data-ocid="verify.search.panel">
            <Input
              data-ocid="verify.search_input"
              placeholder="e.g. CERT-7F3A2B9D1E4C"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearched(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="font-mono"
            />
            <Button
              data-ocid="verify.search.button"
              onClick={handleSearch}
              className="gap-2 flex-shrink-0"
            >
              <Search className="w-4 h-4" />
              Verify
            </Button>
          </div>

          {/* Results */}
          {searched && !found && (
            <Card data-ocid="verify.not_found.panel">
              <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
                <ShieldOff className="w-10 h-10 text-muted-foreground/50" />
                <p className="font-semibold text-foreground">
                  Certificate Not Found
                </p>
                <p className="text-sm text-muted-foreground">
                  No certificate matches the ID{" "}
                  <span className="font-mono">{query.trim()}</span>. Please
                  check the ID and try again.
                </p>
              </CardContent>
            </Card>
          )}

          {found && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex justify-center">
                {found.status === "Active" ? (
                  <div
                    className="flex items-center gap-3 px-6 py-3 rounded-full"
                    data-ocid="verify.verified.panel"
                    style={{
                      background: "oklch(0.42 0.18 145 / 0.15)",
                      border: "2px solid oklch(0.42 0.18 145 / 0.5)",
                    }}
                  >
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    <span className="text-xl font-bold text-emerald-400 tracking-widest uppercase">
                      Verified
                    </span>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-3 px-6 py-3 rounded-full"
                    data-ocid="verify.tampered.panel"
                    style={{
                      background: "oklch(0.35 0.22 25 / 0.15)",
                      border: "2px solid oklch(0.35 0.22 25 / 0.5)",
                    }}
                  >
                    <AlertTriangle className="w-7 h-7 text-red-400" />
                    <span className="text-xl font-bold text-red-400 tracking-widest uppercase">
                      Revoked
                    </span>
                  </div>
                )}
              </div>

              {/* Certificate Document */}
              <Card
                className="relative overflow-hidden"
                style={{
                  borderColor:
                    found.status === "Active"
                      ? "oklch(0.78 0.12 85 / 0.4)"
                      : "oklch(0.35 0.22 25 / 0.4)",
                }}
              >
                {/* Gold accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{
                    background:
                      found.status === "Active"
                        ? "linear-gradient(90deg, oklch(0.78 0.12 85 / 0), oklch(0.78 0.12 85), oklch(0.78 0.12 85 / 0))"
                        : "linear-gradient(90deg, oklch(0.35 0.22 25 / 0), oklch(0.35 0.22 25), oklch(0.35 0.22 25 / 0))",
                  }}
                />
                <CardContent className="pt-8 pb-6 space-y-5">
                  {/* Seal header */}
                  <div className="flex items-center gap-4 pb-4 border-b border-border">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "oklch(0.78 0.12 85 / 0.1)",
                        border: "2px solid oklch(0.78 0.12 85 / 0.4)",
                      }}
                    >
                      <Award
                        className="w-7 h-7"
                        style={{ color: "oklch(0.78 0.12 85)" }}
                      />
                    </div>
                    <div>
                      <p
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: "oklch(0.78 0.12 85)" }}
                      >
                        DecibelChain PRO Platform
                      </p>
                      <p className="font-bold text-lg text-foreground">
                        {found.workTitle}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        ISWC: {found.iswc} &nbsp;·&nbsp; ISRC: {found.isrc}
                      </p>
                    </div>
                    <Badge
                      className="ml-auto"
                      variant="outline"
                      style={
                        found.status === "Active"
                          ? {
                              color: "rgb(52, 211, 153)",
                              borderColor: "rgb(52, 211, 153 / 0.4)",
                            }
                          : {
                              color: "rgb(248, 113, 113)",
                              borderColor: "rgb(248 113 113 / 0.4)",
                            }
                      }
                    >
                      {found.status}
                    </Badge>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Certificate ID
                      </p>
                      <div className="flex items-center gap-1.5">
                        <p className="font-mono text-xs text-foreground">
                          {found.id}
                        </p>
                        <button
                          type="button"
                          data-ocid="verify.copy_id.button"
                          onClick={() =>
                            copyToClipboard(found.id, "Certificate ID")
                          }
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Registered Owner
                      </p>
                      <p className="font-semibold text-foreground">
                        {found.registeredOwner}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Registration Date
                      </p>
                      <p className="text-foreground">
                        {new Date(found.registrationDate).toLocaleString()}
                      </p>
                    </div>
                    <div className="col-span-2 md:col-span-3">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Territory Scope
                      </p>
                      <p className="text-foreground">{found.territories}</p>
                    </div>
                  </div>

                  {/* Ownership Snapshot */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Ownership Snapshot
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">
                            Rights Holder
                          </TableHead>
                          <TableHead className="text-xs text-right">
                            Share
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {found.splits.map((s) => (
                          <TableRow
                            key={s.name}
                            data-ocid={`verify.split.item.${found.splits.indexOf(s) + 1}`}
                          >
                            <TableCell className="text-sm">{s.name}</TableCell>
                            <TableCell className="text-sm text-right font-mono">
                              {s.percentage}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Hash */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Tamper-evident Hash
                    </p>
                    <div
                      className="rounded-md p-3 flex items-start justify-between gap-2"
                      style={{ background: "oklch(0.12 0.01 240)" }}
                    >
                      <p className="font-mono text-[11px] text-muted-foreground break-all leading-relaxed">
                        {found.hash}
                      </p>
                      <button
                        type="button"
                        data-ocid="verify.copy_hash.button"
                        onClick={() => copyToClipboard(found.hash, "Hash")}
                        className="text-muted-foreground hover:text-foreground flex-shrink-0 mt-0.5 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* CTA for non-authenticated */}
          {!isAuthenticated && (
            <Card className="border-dashed">
              <CardContent className="py-6 flex flex-col items-center gap-3 text-center">
                <Award className="w-8 h-8 text-muted-foreground/50" />
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    Manage Your Rights Certificates
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Connect to DecibelChain to issue on-chain certificates for
                    your works and share tamper-evident provenance proofs.
                  </p>
                </div>
                {onLogin && (
                  <Button
                    size="sm"
                    data-ocid="verify.login.button"
                    onClick={onLogin}
                    className="gap-2"
                  >
                    Connect to verify your own works
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 px-4 text-center text-xs text-muted-foreground/40 border-t border-border/30">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground transition-colors"
        >
          Built with ♥ using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
