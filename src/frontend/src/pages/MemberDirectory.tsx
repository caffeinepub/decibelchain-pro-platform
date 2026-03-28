import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  MessageCircle,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Page } from "../App";
import type { MemberProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useTranslation } from "../i18n";

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

interface MemberDirectoryProps {
  onNavigate?: (page: Page) => void;
  onViewProfile?: (principalId: string) => void;
}

export function MemberDirectory({
  onNavigate,
  onViewProfile,
}: MemberDirectoryProps) {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString() ?? "";

  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [pendingFollow, setPendingFollow] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [orgs, followingList] = await Promise.all([
        (actor as any).listOrganizations(),
        (actor as any).getMyFollowing(),
      ]);
      const followingIds = new Set<string>(
        followingList.map((f: { followeeId: string }) => f.followeeId),
      );
      setFollowing(followingIds);
      if (orgs.length > 0) {
        const allMembers = await (actor as any).getMembersInOrg(orgs[0].id);
        setMembers(allMembers.filter((m) => m.principalId !== myPrincipal));
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [actor, myPrincipal]);

  useEffect(() => {
    if (actor && !isFetching) load();
  }, [actor, isFetching, load]);

  const handleToggleFollow = async (memberId: string) => {
    if (!actor || pendingFollow.has(memberId)) return;
    setPendingFollow((prev) => new Set(prev).add(memberId));
    try {
      const isFollowed = following.has(memberId);
      if (isFollowed) {
        await (actor as any).unfollowMember(memberId);
        setFollowing((prev) => {
          const s = new Set(prev);
          s.delete(memberId);
          return s;
        });
      } else {
        await (actor as any).followMember(memberId);
        setFollowing((prev) => new Set(prev).add(memberId));
      }
    } catch {
      /* ignore */
    } finally {
      setPendingFollow((prev) => {
        const s = new Set(prev);
        s.delete(memberId);
        return s;
      });
    }
  };

  const handleMessage = (memberId: string) => {
    if (onNavigate) onNavigate("messages");
    // store target in sessionStorage for Messages page to pick up
    sessionStorage.setItem("dc_msg_target", memberId);
  };

  const filtered = members.filter(
    (m) =>
      m.displayName.toLowerCase().includes(search.toLowerCase()) ||
      m.country?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-foreground">
              {t("memberDirectory")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {members.length} {t("members")}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="directory.search_input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchMembers")}
          className="pl-9 bg-muted/30 border-border/40"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-ocid="directory.empty_state"
          className="flex flex-col items-center justify-center py-20 text-muted-foreground"
        >
          <Users className="w-14 h-14 mb-4 opacity-10" />
          <p className="text-sm">{t("noMembers")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((member, i) => {
            const hue = avatarHue(member.principalId);
            const isFollowed = following.has(member.principalId);
            return (
              <div
                key={member.principalId}
                data-ocid={`directory.member.item.${i + 1}`}
                className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-3 hover:border-border transition-colors"
              >
                {/* Avatar + name */}
                <div className="flex flex-col items-center text-center gap-2">
                  <Avatar className="w-14 h-14">
                    <AvatarFallback
                      className="text-lg font-bold"
                      style={{
                        background: `oklch(0.25 0.05 ${hue})`,
                        color: `oklch(0.85 0.12 ${hue})`,
                      }}
                    >
                      {initials(member.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {member.displayName}
                    </p>
                    {member.country && (
                      <p className="text-xs text-muted-foreground">
                        {member.country}
                      </p>
                    )}
                  </div>
                  {member.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 text-center">
                      {member.bio}
                    </p>
                  )}
                  {member.orgIds && member.orgIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {member.orgIds.slice(0, 2).map((orgId) => (
                        <Badge
                          key={orgId}
                          variant="outline"
                          className="text-[9px] px-1 h-3.5 border-border/40"
                        >
                          {orgId.slice(0, 6)}…
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <Button
                    data-ocid={`directory.follow.button.${i + 1}`}
                    size="sm"
                    variant={isFollowed ? "secondary" : "outline"}
                    className="flex-1 gap-1 text-xs h-8"
                    onClick={() => handleToggleFollow(member.principalId)}
                    disabled={pendingFollow.has(member.principalId)}
                  >
                    {isFollowed ? (
                      <>
                        <UserCheck className="w-3 h-3" /> {t("following")}
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" /> {t("follow")}
                      </>
                    )}
                  </Button>
                  <Button
                    data-ocid={`directory.message.button.${i + 1}`}
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1 text-xs h-8"
                    onClick={() => handleMessage(member.principalId)}
                  >
                    <MessageCircle className="w-3 h-3" />
                    {t("sendDirectMessage")}
                  </Button>
                </div>
                {onViewProfile && (
                  <Button
                    data-ocid={`directory.view_profile.button.${i + 1}`}
                    size="sm"
                    variant="ghost"
                    className="w-full gap-1 text-xs h-7 text-muted-foreground hover:text-primary"
                    onClick={() => onViewProfile(member.principalId)}
                  >
                    <Eye className="w-3 h-3" />
                    {t("viewProfile")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
