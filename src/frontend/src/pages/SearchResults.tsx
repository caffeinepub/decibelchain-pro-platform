import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Building2, FileMusic, Search, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Page } from "../App";
import type {
  CreativeWork,
  MemberProfile,
  Organization,
  Vendor,
} from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useTranslation } from "../i18n";

interface SearchResultsProps {
  query: string;
  onNavigate: (page: Page) => void;
}

function highlight(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/30 text-foreground rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function matchesQuery(fields: string[], q: string): boolean {
  const lower = q.toLowerCase();
  return fields.some((f) => f.toLowerCase().includes(lower));
}

export function SearchResults({ query, onNavigate }: SearchResultsProps) {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();

  const [works, setWorks] = useState<CreativeWork[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [w, o, m, v] = await Promise.all([
        (actor as any).listAllWorks(),
        (actor as any).listOrganizations(),
        (actor as any).listAllMembers(),
        (actor as any).listAllVendors(),
      ]);
      setWorks(w);
      setOrgs(o);
      setMembers(m);
      setVendors(v);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor && !isFetching) load();
  }, [actor, isFetching, load]);

  const q = query.trim();

  const filteredWorks = q
    ? works.filter((w) =>
        matchesQuery([w.title, w.isrc, w.iswc, w.genre, w.description], q),
      )
    : works;

  const filteredOrgs = q
    ? orgs.filter((o) => matchesQuery([o.name, o.description], q))
    : orgs;

  const filteredMembers = q
    ? members.filter((m) => matchesQuery([m.displayName, m.bio, m.country], q))
    : members;

  const filteredVendors = q
    ? vendors.filter((v) => matchesQuery([v.name, v.country, v.website], q))
    : vendors;

  const totalResults =
    filteredWorks.length +
    filteredOrgs.length +
    filteredMembers.length +
    filteredVendors.length;

  return (
    <div className="p-6 space-y-6 max-w-4xl" data-ocid="search.page">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Search className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-display text-foreground">
            {t("searchResults")}
          </h2>
          {q ? (
            <p className="text-xs text-muted-foreground">
              {loading ? "Searching..." : `${totalResults} results for "${q}"`}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Enter a search term</p>
          )}
        </div>
      </div>

      {!q && !loading ? (
        <div
          data-ocid="search.empty_state"
          className="flex flex-col items-center justify-center py-20 text-muted-foreground"
        >
          <Search className="w-14 h-14 mb-4 opacity-10" />
          <p className="text-sm">Type something in the search bar above</p>
        </div>
      ) : (
        <Tabs defaultValue="works" data-ocid="search.tab">
          <TabsList className="bg-muted/30 border border-border/40">
            <TabsTrigger
              data-ocid="search.works.tab"
              value="works"
              className="gap-1.5 text-xs"
            >
              <FileMusic className="w-3.5 h-3.5" />
              Works
              <Badge className="h-4 min-w-4 px-1 text-[9px] bg-muted text-muted-foreground">
                {filteredWorks.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              data-ocid="search.orgs.tab"
              value="orgs"
              className="gap-1.5 text-xs"
            >
              <Building2 className="w-3.5 h-3.5" />
              Orgs
              <Badge className="h-4 min-w-4 px-1 text-[9px] bg-muted text-muted-foreground">
                {filteredOrgs.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              data-ocid="search.members.tab"
              value="members"
              className="gap-1.5 text-xs"
            >
              <Users className="w-3.5 h-3.5" />
              Members
              <Badge className="h-4 min-w-4 px-1 text-[9px] bg-muted text-muted-foreground">
                {filteredMembers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              data-ocid="search.vendors.tab"
              value="vendors"
              className="gap-1.5 text-xs"
            >
              <Briefcase className="w-3.5 h-3.5" />
              Vendors
              <Badge className="h-4 min-w-4 px-1 text-[9px] bg-muted text-muted-foreground">
                {filteredVendors.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="works" className="mt-4 space-y-2">
            {filteredWorks.length === 0 ? (
              <p
                data-ocid="search.works.empty_state"
                className="text-sm text-muted-foreground py-8 text-center"
              >
                No works found
              </p>
            ) : (
              filteredWorks.map((w, i) => (
                <button
                  type="button"
                  key={w.id}
                  data-ocid={`search.works.item.${i + 1}`}
                  onClick={() => onNavigate("creativeWorks")}
                  className="w-full text-left bg-card border border-border/50 rounded-lg px-4 py-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileMusic className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground">
                        {highlight(w.title, q)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Object.keys(w.workType)[0]}
                        {w.isrc ? ` · ISRC: ${highlight(w.isrc, q)}` : ""}
                        {w.genre ? ` · ${highlight(w.genre, q)}` : ""}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </TabsContent>

          <TabsContent value="orgs" className="mt-4 space-y-2">
            {filteredOrgs.length === 0 ? (
              <p
                data-ocid="search.orgs.empty_state"
                className="text-sm text-muted-foreground py-8 text-center"
              >
                No organizations found
              </p>
            ) : (
              filteredOrgs.map((o, i) => (
                <button
                  type="button"
                  key={o.id}
                  data-ocid={`search.orgs.item.${i + 1}`}
                  onClick={() => onNavigate("organizations")}
                  className="w-full text-left bg-card border border-border/50 rounded-lg px-4 py-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground">
                        {highlight(o.name, q)}
                      </p>
                      {o.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {highlight(o.description, q)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-4 space-y-2">
            {filteredMembers.length === 0 ? (
              <p
                data-ocid="search.members.empty_state"
                className="text-sm text-muted-foreground py-8 text-center"
              >
                No members found
              </p>
            ) : (
              filteredMembers.map((m, i) => (
                <button
                  type="button"
                  key={m.principalId}
                  data-ocid={`search.members.item.${i + 1}`}
                  onClick={() => onNavigate("memberDirectory")}
                  className="w-full text-left bg-card border border-border/50 rounded-lg px-4 py-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground">
                        {highlight(m.displayName, q)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.country ? highlight(m.country, q) : ""}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </TabsContent>

          <TabsContent value="vendors" className="mt-4 space-y-2">
            {filteredVendors.length === 0 ? (
              <p
                data-ocid="search.vendors.empty_state"
                className="text-sm text-muted-foreground py-8 text-center"
              >
                No vendors found
              </p>
            ) : (
              filteredVendors.map((v, i) => (
                <button
                  type="button"
                  key={v.id}
                  data-ocid={`search.vendors.item.${i + 1}`}
                  onClick={() => onNavigate("vendorDirectory")}
                  className="w-full text-left bg-card border border-border/50 rounded-lg px-4 py-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground">
                        {highlight(v.name, q)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Object.keys(v.serviceType)[0]}
                        {v.country ? ` · ${v.country}` : ""}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
