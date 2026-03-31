import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageSquare, PenSquare, Rss, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { CommunityPost, Organization, PostComment } from "../backend.d";
import { useAuthContext } from "../contexts/AuthContext";
import { useActor } from "../hooks/useActor";
import { useTranslation } from "../i18n";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}

function PostCard({
  post,
  myPrincipal,
  actor,
  t,
}: {
  post: CommunityPost;
  myPrincipal: string;
  actor: any;
  t: (k: string) => string;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Number(post.likeCount));
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(Number(post.commentCount));

  useEffect(() => {
    if (actor && myPrincipal) {
      actor
        .hasLikedPost(post.id, myPrincipal)
        .then(setLiked)
        .catch(() => {});
    }
  }, [actor, post.id, myPrincipal]);

  const toggleLike = async () => {
    if (!actor) return;
    try {
      const nowLiked = await (actor as any).likePost(post.id);
      setLiked(nowLiked);
      setLikeCount((prev) => (nowLiked ? prev + 1 : prev - 1));
    } catch {
      /* ignore */
    }
  };

  const loadComments = async () => {
    if (!actor) return;
    setLoadingComments(true);
    try {
      const c = await (actor as any).getPostComments(post.id);
      setComments(c);
    } catch {
      /* ignore */
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) loadComments();
  };

  const handleAddComment = async () => {
    if (!actor || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const c = await (actor as any).addComment(post.id, commentText.trim());
      setComments((prev) => [...prev, c]);
      setCommentText("");
      setCommentCount((prev) => prev + 1);
    } catch {
      toast.error(t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="bg-card border border-border/50 rounded-2xl p-5 space-y-3 hover:border-border transition-colors">
      {/* Author row */}
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {initials(post.authorName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">
              {post.authorName}
            </span>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 h-4 border-border/60 text-muted-foreground"
            >
              {post.orgId.slice(0, 8)}…
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {timeAgo(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1 border-t border-border/30">
        <button
          type="button"
          onClick={toggleLike}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            liked
              ? "text-rose-400"
              : "text-muted-foreground hover:text-rose-400"
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-rose-400" : ""}`} />
          <span>{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>
            {commentCount} {t("comments")}
          </span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="space-y-3 pt-2 border-t border-border/30">
          {loadingComments ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              {t("noComments")}
            </p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar className="w-7 h-7 flex-shrink-0">
                    <AvatarFallback className="bg-muted text-[10px]">
                      {initials(c.authorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-muted/30 rounded-xl px-3 py-2">
                    <p className="text-[11px] font-semibold text-foreground">
                      {c.authorName}
                    </p>
                    <p className="text-xs text-foreground/80">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t("writeAComment")}
              rows={1}
              className="flex-1 resize-none text-xs bg-muted/30 border-border/40"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="flex-shrink-0 h-8 w-8"
              onClick={handleAddComment}
              disabled={submitting || !commentText.trim()}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

export function ActivityFeed() {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();
  const { identity } = useAuthContext();
  const myPrincipal = identity?.getPrincipal().toString() ?? "";

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostOrg, setNewPostOrg] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [feed, orgsData] = await Promise.all([
        (actor as any).getGlobalFeed(0n, 20n),
        (actor as any).listOrganizations(),
      ]);
      setPosts(feed);
      setOrgs(orgsData);
      if (orgsData.length > 0) setNewPostOrg(orgsData[0].id);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor && !isFetching) load();
  }, [actor, isFetching, load]);

  const handleCreate = async () => {
    if (!actor || !newPostContent.trim() || !newPostOrg) return;
    setCreating(true);
    try {
      const post = await (actor as any).createPost(
        newPostOrg,
        newPostContent.trim(),
      );
      setPosts((prev) => [post, ...prev]);
      setNewPostContent("");
      setDialogOpen(false);
      toast.success(t("postCreated"));
    } catch {
      toast.error(t("error"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Rss className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold font-display text-foreground">
            {t("activityFeed")}
          </h2>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-ocid="feed.new_post.button" className="gap-2">
              <PenSquare className="w-4 h-4" />
              {t("newPost")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display">
                {t("createPost")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {orgs.length > 0 && (
                <Select value={newPostOrg} onValueChange={setNewPostOrg}>
                  <SelectTrigger
                    data-ocid="feed.post_org.select"
                    className="bg-muted/30 border-border/50"
                  >
                    <SelectValue placeholder={t("selectOrg")} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {orgs.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Textarea
                data-ocid="feed.post_content.textarea"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder={t("whatsOnYourMind")}
                rows={4}
                className="bg-muted/30 border-border/50 resize-none"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button
                data-ocid="feed.create_post.button"
                onClick={handleCreate}
                disabled={creating || !newPostContent.trim()}
              >
                {t("createPost")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div
          data-ocid="feed.empty_state"
          className="flex flex-col items-center justify-center py-20 text-muted-foreground"
        >
          <Rss className="w-14 h-14 mb-4 opacity-10" />
          <p className="text-sm">{t("noPostsYet")}</p>
          <p className="text-xs mt-1">{t("beFirstToPost")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, i) => (
            <div key={post.id} data-ocid={`feed.post.item.${i + 1}`}>
              <PostCard
                post={post}
                myPrincipal={myPrincipal}
                actor={actor}
                t={t}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
