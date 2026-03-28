import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActor } from "@/hooks/useActor";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Disc3,
  Loader2,
  Music2,
  Search,
  User2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type LookupMode = "isrc" | "iswc";

type ParsedResult = {
  title?: string;
  artist?: string;
  label?: string;
  releaseDate?: string;
  duration?: string;
  code?: string;
  workType?: string;
  raw: string;
};

function parseISRCResult(json: any): ParsedResult {
  // MusicBrainz /recording?query=isrc:... format
  const recordings = json?.recordings ?? [];
  if (recordings.length === 0) return { raw: JSON.stringify(json, null, 2) };
  const r = recordings[0];
  const artistCredit = r?.["artist-credit"];
  const artist = artistCredit?.[0]?.name ?? artistCredit?.[0]?.artist?.name;
  const release = r?.releases?.[0];
  return {
    title: r?.title,
    artist: artist,
    label: release?.["label-info"]?.[0]?.label?.name,
    releaseDate: release?.date ?? release?.["release-events"]?.[0]?.date,
    duration: r?.length
      ? `${Math.floor(r.length / 60000)}:${String(Math.floor((r.length % 60000) / 1000)).padStart(2, "0")}`
      : undefined,
    code: r?.isrcs?.[0],
    workType: "Recording",
    raw: JSON.stringify(json, null, 2),
  };
}

function parseISWCResult(json: any): ParsedResult {
  // MusicBrainz /work?query=iswc:... format
  const works = json?.works ?? [];
  if (works.length === 0) return { raw: JSON.stringify(json, null, 2) };
  const w = works[0];
  const artistRel = w?.relations?.find(
    (r: any) =>
      r?.type === "composer" || r?.type === "lyricist" || r?.type === "writer",
  );
  return {
    title: w?.title,
    artist: artistRel?.artist?.name,
    label: undefined,
    releaseDate: undefined,
    duration: undefined,
    code: w?.iswcs?.[0],
    workType: w?.type ?? "Musical Work",
    raw: JSON.stringify(json, null, 2),
  };
}

export function DspLookup() {
  const { actor } = useActor();
  const [mode, setMode] = useState<LookupMode>("isrc");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!actor || !query.trim()) {
      toast.error("Please enter a lookup code");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setShowRaw(false);
    try {
      const res =
        mode === "isrc"
          ? await (actor as any).lookupByISRC(query.trim().toUpperCase())
          : await (actor as any).lookupByISWC(query.trim());

      if ("ok" in res) {
        const parsed = JSON.parse(res.ok);
        const structured =
          mode === "isrc" ? parseISRCResult(parsed) : parseISWCResult(parsed);
        setResult(structured);
      } else {
        setError(res.err);
        toast.error(res.err);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lookup failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const placeholder =
    mode === "isrc" ? "e.g. USRC17607839" : "e.g. T-034.524.680-1";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Disc3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            DSP Registry Lookup
          </h1>
          <p className="text-sm text-muted-foreground">
            Query external metadata sources by ISRC or ISWC
          </p>
        </div>
      </div>

      {/* Search form */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6 space-y-4">
          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(v as LookupMode);
              setResult(null);
              setError(null);
            }}
          >
            <TabsList className="bg-background border border-border">
              <TabsTrigger value="isrc" data-ocid="dsp_lookup.tab">
                ISRC Lookup
              </TabsTrigger>
              <TabsTrigger value="iswc" data-ocid="dsp_lookup.tab">
                ISWC Lookup
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-1.5">
            <Label htmlFor="lookup-query">
              {mode === "isrc" ? "ISRC Code" : "ISWC Code"}
            </Label>
            <div className="flex gap-2">
              <Input
                id="lookup-query"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="font-mono"
                data-ocid="dsp_lookup.search_input"
              />
              <Button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="gap-2 shrink-0"
                data-ocid="dsp_lookup.primary_button"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === "isrc"
                ? "International Standard Recording Code — identifies audio recordings"
                : "International Standard Musical Work Code — identifies compositions"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && (
        <div
          className="flex items-center justify-center py-12 gap-3"
          data-ocid="dsp_lookup.loading_state"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">
            Querying external registry…
          </span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card
          className="border-destructive/30 bg-destructive/5"
          data-ocid="dsp_lookup.error_state"
        >
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && !loading && (
        <Card className="border-primary/20 bg-card" data-ocid="dsp_lookup.card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Music2 className="h-5 w-5 text-primary" />
              Lookup Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Structured fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.title && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Title
                  </p>
                  <p className="font-semibold text-foreground">
                    {result.title}
                  </p>
                </div>
              )}
              {result.artist && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Artist / Creator
                  </p>
                  <div className="flex items-center gap-1.5">
                    <User2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="font-medium">{result.artist}</p>
                  </div>
                </div>
              )}
              {result.label && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Label
                  </p>
                  <p className="font-medium">{result.label}</p>
                </div>
              )}
              {result.releaseDate && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Release Date
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="font-medium">{result.releaseDate}</p>
                  </div>
                </div>
              )}
              {result.duration && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Duration
                  </p>
                  <p className="font-medium font-mono">{result.duration}</p>
                </div>
              )}
              {result.code && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {mode.toUpperCase()}
                  </p>
                  <p className="font-medium font-mono text-primary">
                    {result.code}
                  </p>
                </div>
              )}
              {result.workType && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Work Type
                  </p>
                  <Badge variant="outline">{result.workType}</Badge>
                </div>
              )}
            </div>

            {/* Raw JSON toggle */}
            <div className="border-t border-border pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRaw((v) => !v)}
                className="gap-2 text-muted-foreground hover:text-foreground"
                data-ocid="dsp_lookup.toggle"
              >
                {showRaw ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {showRaw ? "Hide" : "Show"} Raw JSON
              </Button>
              {showRaw && (
                <pre className="mt-2 p-4 bg-background rounded-md border border-border text-xs font-mono overflow-auto max-h-72 text-muted-foreground">
                  {result.raw}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
