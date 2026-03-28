import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, FileMusic, Music, Users } from "lucide-react";
import type { Page } from "../App";
import type { CreativeWork, MemberProfile, Organization } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useTranslation } from "../i18n";

interface PublicOrgDetailProps {
  orgId: string;
  onBack: () => void;
  onSelectWork: (workId: string) => void;
  onNavigate: (page: Page) => void;
}

function getOrgTypeName(ot: any): string {
  if (!ot) return "Unknown";
  if ("recordLabel" in ot) return "Record Label";
  if ("publisher" in ot) return "Publisher";
  if ("cooperative" in ot) return "Cooperative";
  if ("indie" in ot) return "Indie";
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

export function PublicOrgDetail({
  orgId,
  onBack,
  onSelectWork,
}: PublicOrgDetailProps) {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();

  const { data: orgs = [], isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ["organizations"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listOrganizations();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: works = [], isLoading: worksLoading } = useQuery<
    CreativeWork[]
  >({
    queryKey: ["worksByOrg", orgId],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listWorksByOrg(orgId);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<
    MemberProfile[]
  >({
    queryKey: ["membersInOrg", orgId],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getMembersInOrg(orgId);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });

  const org = orgs.find((o) => o.id === orgId);

  if (orgsLoading) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("back")}
        </Button>
        <div
          data-ocid="org_detail.loading_state"
          className="flex justify-center py-20"
        >
          <div className="text-muted-foreground text-sm">
            Loading organization...
          </div>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("back")}
        </Button>
        <Card data-ocid="org_detail.error_state">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Organization not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button
        variant="ghost"
        onClick={onBack}
        data-ocid="org_detail.back.button"
        className="-ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> {t("back")}
      </Button>

      {/* Org header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-primary/10">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{org.name}</h1>
          <Badge variant="outline" className="mt-1 text-xs">
            {getOrgTypeName(org.orgType)}
          </Badge>
          {org.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {org.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileMusic className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{works.length}</p>
              <p className="text-xs text-muted-foreground">{t("worksCount")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{members.length}</p>
              <p className="text-xs text-muted-foreground">
                {t("membersCount")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Music className="h-4 w-4" />
            {t("allWorks")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {worksLoading ? (
            <div
              data-ocid="org_detail.works.loading_state"
              className="py-6 text-center text-sm text-muted-foreground"
            >
              Loading...
            </div>
          ) : works.length === 0 ? (
            <div
              data-ocid="org_detail.works.empty_state"
              className="py-6 text-center text-sm text-muted-foreground"
            >
              {t("noWorksFound")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {works.map((work, i) => (
                <button
                  type="button"
                  key={work.id}
                  data-ocid={`org_detail.works.item.${i + 1}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-card/80 cursor-pointer transition-all group text-left"
                  onClick={() => onSelectWork(work.id)}
                >
                  <div className="p-1.5 rounded bg-primary/10">
                    <Music className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {work.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getWorkTypeName(work.workType)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div
              data-ocid="org_detail.members.loading_state"
              className="py-6 text-center text-sm text-muted-foreground"
            >
              Loading...
            </div>
          ) : members.length === 0 ? (
            <div
              data-ocid="org_detail.members.empty_state"
              className="py-6 text-center text-sm text-muted-foreground"
            >
              No members found.
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((m, i) => (
                <div
                  key={m.principalId}
                  data-ocid={`org_detail.members.item.${i + 1}`}
                  className="flex items-center gap-3 p-2 rounded-lg border border-border/50"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {(m.displayName || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {m.displayName || "Anonymous"}
                    </p>
                    {m.country && (
                      <p className="text-xs text-muted-foreground">
                        {m.country}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
