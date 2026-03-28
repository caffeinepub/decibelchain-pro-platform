import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Globe,
  Mic2,
  Music,
  Users,
  XCircle,
} from "lucide-react";
import type { Page } from "../App";
import type {
  CreativeWork,
  Organization,
  OwnershipSplit,
  Performance,
  TerritoryRecord,
} from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useTranslation } from "../i18n";

interface PublicWorkDetailProps {
  workId: string;
  onBack: () => void;
  onNavigate: (page: Page) => void;
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString();
}

function shortPrincipal(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

function tcLabel(tc: any): string {
  if (!tc) return "Unknown";
  if ("world" in tc) return "World";
  if ("northAmerica" in tc) return "North America";
  if ("europe" in tc) return "Europe";
  if ("latinAmerica" in tc) return "Latin America";
  if ("asiaPacific" in tc) return "Asia Pacific";
  if ("africa" in tc) return "Africa";
  if ("middleEast" in tc) return "Middle East";
  if ("oceania" in tc) return "Oceania";
  if ("custom" in tc) return `Custom: ${tc.custom}`;
  return "Unknown";
}

function getWorkTypeName(wt: any): string {
  if (!wt) return "Unknown";
  if ("song" in wt) return "Song";
  if ("album" in wt) return "Album";
  if ("composition" in wt) return "Composition";
  if ("soundRecording" in wt) return "Sound Recording";
  return "Unknown";
}

export function PublicWorkDetail({ workId, onBack }: PublicWorkDetailProps) {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();

  const { data: work, isLoading: workLoading } = useQuery<CreativeWork | null>({
    queryKey: ["work", workId],
    queryFn: async () => {
      if (!actor) return null;
      return (actor as any).getWork(workId);
    },
    enabled: !!actor && !isFetching && !!workId,
  });

  const { data: orgs = [] } = useQuery<Organization[]>({
    queryKey: ["organizations"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listOrganizations();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: splits = [], isLoading: splitsLoading } = useQuery<
    OwnershipSplit[]
  >({
    queryKey: ["splits", workId],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getSplitsByWork(workId);
    },
    enabled: !!actor && !isFetching && !!workId,
  });

  const { data: territories = [], isLoading: territoriesLoading } = useQuery<
    TerritoryRecord[]
  >({
    queryKey: ["territories", workId],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getTerritoriesByWork(workId);
    },
    enabled: !!actor && !isFetching && !!workId,
  });

  const { data: allPerformances = [], isLoading: performancesLoading } =
    useQuery<Performance[]>({
      queryKey: ["allPerformances"],
      queryFn: async () => {
        if (!actor) return [];
        return (actor as any).listAllPerformances();
      },
      enabled: !!actor && !isFetching,
    });

  const workPerformances = allPerformances.filter((p) =>
    p.setlist.some((s) => s.workId === workId),
  );

  const orgName = work
    ? orgs.find((o) => o.id === work.orgId)?.name || work.orgId
    : "";

  if (workLoading) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("back")}
        </Button>
        <div
          data-ocid="work_detail.loading_state"
          className="flex justify-center py-20"
        >
          <div className="text-muted-foreground text-sm">Loading work...</div>
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("back")}
        </Button>
        <Card data-ocid="work_detail.error_state">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Work not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={onBack}
        data-ocid="work_detail.back.button"
        className="-ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> {t("back")}
      </Button>

      {/* Work header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-primary/10">
          <Music className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{work.title}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {getWorkTypeName(work.workType)}
            </Badge>
            {work.genre && (
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground"
              >
                {work.genre}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {orgName}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="overview" data-ocid="work_detail.overview.tab">
            <Music className="h-4 w-4 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="ownership" data-ocid="work_detail.ownership.tab">
            <Users className="h-4 w-4 mr-1.5" />
            {t("ownership")}
          </TabsTrigger>
          <TabsTrigger
            value="territories"
            data-ocid="work_detail.territories.tab"
          >
            <Globe className="h-4 w-4 mr-1.5" />
            {t("territories")}
          </TabsTrigger>
          <TabsTrigger
            value="performances"
            data-ocid="work_detail.performances.tab"
          >
            <Mic2 className="h-4 w-4 mr-1.5" />
            {t("performances")}
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {t("workTitle")}
                </p>
                <p className="text-sm font-medium">{work.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {t("workType")}
                </p>
                <p className="text-sm font-medium">
                  {getWorkTypeName(work.workType)}
                </p>
              </div>
              {work.isrc && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {t("isrc")}
                  </p>
                  <p className="text-sm font-mono">{work.isrc}</p>
                </div>
              )}
              {work.iswc && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {t("iswc")}
                  </p>
                  <p className="text-sm font-mono">{work.iswc}</p>
                </div>
              )}
              {work.genre && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {t("genre")}
                  </p>
                  <p className="text-sm">{work.genre}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {t("organization")}
                </p>
                <p className="text-sm">{orgName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {t("registeredDate")}
                </p>
                <p className="text-sm">{formatDate(work.createdAt)}</p>
              </div>
              {work.releaseDate && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {t("releaseDate")}
                  </p>
                  <p className="text-sm">{work.releaseDate}</p>
                </div>
              )}
              {work.description && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {t("description")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {work.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ownership */}
        <TabsContent value="ownership" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("ownership")}</CardTitle>
            </CardHeader>
            <CardContent>
              {splitsLoading ? (
                <div
                  data-ocid="work_detail.splits.loading_state"
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  Loading...
                </div>
              ) : splits.length === 0 ? (
                <div
                  data-ocid="work_detail.splits.empty_state"
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  {t("noSplitsFound")}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("holderID")}</TableHead>
                      <TableHead>{t("role")}</TableHead>
                      <TableHead className="text-right">
                        {t("percentage")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {splits.map((s, i) => (
                      <TableRow
                        key={s.holderId}
                        data-ocid={`work_detail.splits.item.${i + 1}`}
                      >
                        <TableCell className="font-mono text-xs">
                          {shortPrincipal(s.holderId)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {s.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {Number(s.percentage) / 100}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Territories */}
        <TabsContent value="territories" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("territories")}</CardTitle>
            </CardHeader>
            <CardContent>
              {territoriesLoading ? (
                <div
                  data-ocid="work_detail.territories.loading_state"
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  Loading...
                </div>
              ) : territories.length === 0 ? (
                <div
                  data-ocid="work_detail.territories.empty_state"
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  {t("noTerritoriesFound")}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("territoryCode")}</TableHead>
                      <TableHead>{t("subPublisher")}</TableHead>
                      <TableHead>{t("notes")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {territories.map((tr, i) => (
                      <TableRow
                        key={tr.id}
                        data-ocid={`work_detail.territories.item.${i + 1}`}
                      >
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {tcLabel(tr.territoryCode)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {tr.subPublisherId || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {tr.notes || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performances */}
        <TabsContent value="performances" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("performances")}</CardTitle>
            </CardHeader>
            <CardContent>
              {performancesLoading ? (
                <div
                  data-ocid="work_detail.performances.loading_state"
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  Loading...
                </div>
              ) : workPerformances.length === 0 ? (
                <div
                  data-ocid="work_detail.performances.empty_state"
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  {t("noPerformancesFound")}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("venue")}</TableHead>
                      <TableHead>{t("venueCity")}</TableHead>
                      <TableHead>{t("performanceDate")}</TableHead>
                      <TableHead>{t("verified")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workPerformances.map((p, i) => (
                      <TableRow
                        key={p.id}
                        data-ocid={`work_detail.performances.item.${i + 1}`}
                      >
                        <TableCell className="text-sm">{p.venueName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.venueCity}, {p.venueCountry}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.performanceDate}
                        </TableCell>
                        <TableCell>
                          {p.verified ? (
                            <span className="flex items-center gap-1 text-emerald-400 text-xs">
                              <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                              {t("verified")}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground text-xs">
                              <XCircle className="h-3.5 w-3.5" />{" "}
                              {t("unverified")}
                            </span>
                          )}
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
