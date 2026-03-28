import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Building2,
  Check,
  Copy,
  ExternalLink,
  FileMusic,
  Share2,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CreativeWork, MemberProfile, Organization } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useTranslation } from "../i18n";

interface PublicProfileProps {
  profilePrincipalId: string;
  onBack: () => void;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const HUES = [200, 220, 260, 280, 300, 340, 30, 60, 160];
function avatarHue(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return HUES[Math.abs(hash) % HUES.length];
}

function getWorkTypeLabel(wt: Record<string, null>): string {
  return Object.keys(wt)[0] ?? "unknown";
}

export function PublicProfile({
  profilePrincipalId,
  onBack,
}: PublicProfileProps) {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [works, setWorks] = useState<CreativeWork[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const load = useCallback(async () => {
    if (!actor || !profilePrincipalId) return;
    setLoading(true);
    try {
      const [p, allWorks, allOrgs] = await Promise.all([
        (actor as any).getProfile(profilePrincipalId),
        (actor as any).listAllWorks(),
        (actor as any).listOrganizations(),
      ]);
      setProfile(p);
      setWorks(
        (allWorks as CreativeWork[]).filter(
          (w) => w.creatorId === profilePrincipalId,
        ),
      );
      if (p) {
        setOrgs(
          (allOrgs as Organization[]).filter((o) =>
            (p as MemberProfile).orgIds.includes(o.id),
          ),
        );
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [actor, profilePrincipalId]);

  useEffect(() => {
    if (actor && !isFetching) load();
  }, [actor, isFetching, load]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profilePrincipalId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const hue = avatarHue(profilePrincipalId);

  return (
    <div className="p-6 space-y-6 max-w-2xl" data-ocid="profile.public.page">
      <Button
        data-ocid="profile.public.back.button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("memberDirectory")}
      </Button>

      {loading ? (
        <div className="space-y-4" data-ocid="profile.public.loading_state">
          <Skeleton className="h-32 rounded-xl bg-muted" />
          <Skeleton className="h-16 rounded-xl bg-muted" />
          <Skeleton className="h-48 rounded-xl bg-muted" />
        </div>
      ) : !profile ? (
        <div
          data-ocid="profile.public.error_state"
          className="flex flex-col items-center justify-center py-20 text-muted-foreground"
        >
          <User className="w-14 h-14 mb-4 opacity-10" />
          <p className="text-sm">Profile not found</p>
        </div>
      ) : (
        <>
          {/* Profile card */}
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback
                    className="text-2xl font-bold"
                    style={{
                      background: `oklch(0.25 0.05 ${hue})`,
                      color: `oklch(0.85 0.12 ${hue})`,
                    }}
                  >
                    {initials(profile.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold font-display text-foreground">
                    {profile.displayName}
                  </h2>
                  {profile.country && (
                    <p className="text-sm text-muted-foreground">
                      {profile.country}
                    </p>
                  )}
                  {profile.website && (
                    <a
                      href={
                        profile.website.startsWith("http")
                          ? profile.website
                          : `https://${profile.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {profile.website}
                    </a>
                  )}
                </div>
              </div>

              <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="profile.public.share.open_modal_button"
                    variant="outline"
                    size="sm"
                    className="gap-2 border-border/50"
                  >
                    <Share2 className="w-4 h-4" />
                    {t("shareProfile")}
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="bg-popover border-border"
                  data-ocid="profile.public.share.dialog"
                >
                  <DialogHeader>
                    <DialogTitle className="font-display">
                      {t("shareProfile")}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <p className="text-sm text-muted-foreground">
                      Share this Principal ID to let others view this profile:
                    </p>
                    <div className="bg-muted/30 rounded-lg p-3 font-mono text-xs text-foreground break-all">
                      {profilePrincipalId}
                    </div>
                    <Button
                      data-ocid="profile.public.share.copy.button"
                      onClick={handleCopy}
                      className="w-full gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copy to Clipboard
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {profile.bio && (
              <p className="mt-4 text-sm text-muted-foreground">
                {profile.bio}
              </p>
            )}

            {orgs.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                  Organizations
                </p>
                <div className="flex flex-wrap gap-2">
                  {orgs.map((org) => (
                    <Badge
                      key={org.id}
                      variant="outline"
                      className="gap-1.5 border-primary/30 text-primary"
                    >
                      <Building2 className="w-3 h-3" />
                      {org.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Works */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileMusic className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">
                {t("registeredWorks")}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {works.length}
              </Badge>
            </div>

            {works.length === 0 ? (
              <div
                data-ocid="profile.works.empty_state"
                className="text-center py-10 text-muted-foreground"
              >
                <FileMusic className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No registered works</p>
              </div>
            ) : (
              <div className="space-y-2">
                {works.map((work, i) => (
                  <div
                    key={work.id}
                    data-ocid={`profile.works.item.${i + 1}`}
                    className="bg-card border border-border/50 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground">
                          {work.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {getWorkTypeLabel(work.workType as any)}
                          {work.genre ? ` · ${work.genre}` : ""}
                          {work.releaseDate ? ` · ${work.releaseDate}` : ""}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {work.isrc && (
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                              ISRC: {work.isrc}
                            </span>
                          )}
                          {work.iswc && (
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                              ISWC: {work.iswc}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
