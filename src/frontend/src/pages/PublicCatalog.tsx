import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Building2, Compass, Music, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Page } from "../App";
import type { CreativeWork, Organization } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useTranslation } from "../i18n";

interface PublicCatalogProps {
  onNavigate: (page: Page) => void;
  onSelectWork: (workId: string) => void;
  onSelectOrg: (orgId: string) => void;
}

const WORK_TYPE_COLORS: Record<string, string> = {
  song: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  album: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  composition: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  soundRecording: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const ORG_TYPE_COLORS: Record<string, string> = {
  recordLabel: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  publisher: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  cooperative: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  indie: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

function getWorkTypeName(wt: any): string {
  if (!wt) return "Unknown";
  if ("song" in wt) return "Song";
  if ("album" in wt) return "Album";
  if ("composition" in wt) return "Composition";
  if ("soundRecording" in wt) return "Sound Recording";
  return "Unknown";
}

function getWorkTypeKey(wt: any): string {
  if (!wt) return "";
  if ("song" in wt) return "song";
  if ("album" in wt) return "album";
  if ("composition" in wt) return "composition";
  if ("soundRecording" in wt) return "soundRecording";
  return "";
}

function getOrgTypeName(ot: any): string {
  if (!ot) return "Unknown";
  if ("recordLabel" in ot) return "Record Label";
  if ("publisher" in ot) return "Publisher";
  if ("cooperative" in ot) return "Cooperative";
  if ("indie" in ot) return "Indie";
  return "Unknown";
}

function getOrgTypeKey(ot: any): string {
  if (!ot) return "";
  if ("recordLabel" in ot) return "recordLabel";
  if ("publisher" in ot) return "publisher";
  if ("cooperative" in ot) return "cooperative";
  if ("indie" in ot) return "indie";
  return "";
}

export function PublicCatalog({
  onSelectWork,
  onSelectOrg,
}: PublicCatalogProps) {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();

  const [workSearch, setWorkSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [orgSearch, setOrgSearch] = useState("");

  const { data: works = [], isLoading: worksLoading } = useQuery<
    CreativeWork[]
  >({
    queryKey: ["allWorks"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listAllWorks();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: orgs = [], isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ["organizations"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listOrganizations();
    },
    enabled: !!actor && !isFetching,
  });

  const orgMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const o of orgs) m[o.id] = o.name;
    return m;
  }, [orgs]);

  const genres = useMemo(() => {
    const s = new Set<string>();
    for (const w of works) if (w.genre) s.add(w.genre);
    return Array.from(s).sort();
  }, [works]);

  const filteredWorks = useMemo(() => {
    return works.filter((w) => {
      const q = workSearch.toLowerCase();
      const matchSearch =
        !q ||
        w.title.toLowerCase().includes(q) ||
        (orgMap[w.orgId] || "").toLowerCase().includes(q);
      const matchGenre = genreFilter === "all" || w.genre === genreFilter;
      const matchType =
        typeFilter === "all" || getWorkTypeKey(w.workType) === typeFilter;
      const matchOrg = orgFilter === "all" || w.orgId === orgFilter;
      return matchSearch && matchGenre && matchType && matchOrg;
    });
  }, [works, workSearch, genreFilter, typeFilter, orgFilter, orgMap]);

  const filteredOrgs = useMemo(() => {
    const q = orgSearch.toLowerCase();
    if (!q) return orgs;
    return orgs.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q),
    );
  }, [orgs, orgSearch]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Compass className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("publicCatalog")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("publicCatalogDesc")}
          </p>
        </div>
      </div>

      <Tabs defaultValue="works">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="works" data-ocid="catalog.works.tab">
            <Music className="h-4 w-4 mr-2" />
            {t("allWorks")}
          </TabsTrigger>
          <TabsTrigger value="organizations" data-ocid="catalog.orgs.tab">
            <Building2 className="h-4 w-4 mr-2" />
            {t("allOrganizations")}
          </TabsTrigger>
        </TabsList>

        {/* Works Tab */}
        <TabsContent value="works" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-ocid="catalog.search_input"
                placeholder={t("searchWorks")}
                value={workSearch}
                onChange={(e) => setWorkSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger data-ocid="catalog.genre.select" className="w-40">
                <SelectValue placeholder={t("filterByGenre")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filterByGenre")}</SelectItem>
                {genres.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger data-ocid="catalog.type.select" className="w-44">
                <SelectValue placeholder={t("filterByType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filterByType")}</SelectItem>
                <SelectItem value="song">{t("song")}</SelectItem>
                <SelectItem value="album">{t("album")}</SelectItem>
                <SelectItem value="composition">{t("composition")}</SelectItem>
                <SelectItem value="soundRecording">
                  {t("soundRecording")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger data-ocid="catalog.org.select" className="w-48">
                <SelectValue placeholder={t("filterByOrg")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allOrganizations")}</SelectItem>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {worksLoading ? (
            <div
              data-ocid="catalog.works.loading_state"
              className="flex justify-center py-12"
            >
              <div className="text-muted-foreground text-sm">
                Loading works...
              </div>
            </div>
          ) : filteredWorks.length === 0 ? (
            <Card data-ocid="catalog.works.empty_state">
              <CardContent className="py-12 text-center">
                <Music className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">{t("noWorksFound")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredWorks.map((work, i) => {
                const typeKey = getWorkTypeKey(work.workType);
                return (
                  <Card
                    key={work.id}
                    data-ocid={`catalog.works.item.${i + 1}`}
                    className="cursor-pointer hover:border-primary/50 hover:bg-card/80 transition-all duration-200 group"
                    onClick={() => onSelectWork(work.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {work.title}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${WORK_TYPE_COLORS[typeKey] || ""}`}
                        >
                          {getWorkTypeName(work.workType)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      {work.genre && (
                        <p className="text-xs text-muted-foreground">
                          {work.genre}
                        </p>
                      )}
                      {work.isrc && (
                        <p className="text-xs font-mono text-muted-foreground/70">
                          {t("isrc")}: {work.isrc}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground truncate">
                        {orgMap[work.orgId] || work.orgId}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-4 mt-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-ocid="catalog.orgsearch_input"
              placeholder="Search organizations..."
              value={orgSearch}
              onChange={(e) => setOrgSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {orgsLoading ? (
            <div
              data-ocid="catalog.orgs.loading_state"
              className="flex justify-center py-12"
            >
              <div className="text-muted-foreground text-sm">
                Loading organizations...
              </div>
            </div>
          ) : filteredOrgs.length === 0 ? (
            <Card data-ocid="catalog.orgs.empty_state">
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">{t("noOrgsFound")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrgs.map((org, i) => {
                const typeKey = getOrgTypeKey(org.orgType);
                return (
                  <Card
                    key={org.id}
                    data-ocid={`catalog.orgs.item.${i + 1}`}
                    className="cursor-pointer hover:border-primary/50 hover:bg-card/80 transition-all duration-200 group"
                    onClick={() => onSelectOrg(org.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors">
                          {org.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${ORG_TYPE_COLORS[typeKey] || ""}`}
                        >
                          {getOrgTypeName(org.orgType)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {org.description || "No description available."}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
