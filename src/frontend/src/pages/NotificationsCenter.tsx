import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CheckCheck,
  Heart,
  MessageCircle,
  MessageSquare,
  Music2,
  UserPlus,
  Wallet,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Notification } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useTranslation } from "../i18n";

function notifIcon(type: string) {
  switch (type) {
    case "message":
      return <MessageCircle className="w-4 h-4 text-blue-400" />;
    case "like":
      return <Heart className="w-4 h-4 text-rose-400" />;
    case "comment":
      return <MessageSquare className="w-4 h-4 text-amber-400" />;
    case "follow":
      return <UserPlus className="w-4 h-4 text-green-400" />;
    case "payout":
      return <Wallet className="w-4 h-4 text-emerald-400" />;
    case "license":
      return <Music2 className="w-4 h-4 text-purple-400" />;
    default:
      return <Zap className="w-4 h-4 text-primary" />;
  }
}

function timeAgo(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationsCenter() {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const items = await (actor as any).getMyNotifications(0n, 50n);
      setNotifications(items);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor && !isFetching) load();
  }, [actor, isFetching, load]);

  const handleMarkRead = async (id: string) => {
    if (!actor) return;
    try {
      await (actor as any).markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch {
      /* ignore */
    }
  };

  const handleMarkAll = async () => {
    if (!actor) return;
    setMarkingAll(true);
    try {
      await (actor as any).markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success(t("allMarkedRead"));
    } catch {
      toast.error(t("error"));
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const systemTypes = ["payout", "license"];
  const systemNotifs = notifications.filter((n) =>
    systemTypes.includes(n.notifType),
  );
  const unreadNotifs = notifications.filter((n) => !n.read);

  function NotifItem({ notif }: { notif: Notification }) {
    return (
      <button
        type="button"
        data-ocid={`notif.item.${notifications.indexOf(notif) + 1}`}
        onClick={() => !notif.read && handleMarkRead(notif.id)}
        className={`w-full flex gap-3 p-4 rounded-xl border transition-all text-left hover:border-primary/40 ${
          notif.read
            ? "bg-card/30 border-border/30 opacity-70"
            : "bg-card border-border hover:bg-card/80"
        }`}
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center mt-0.5">
          {notifIcon(notif.notifType)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{notif.title}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {!notif.read && (
                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
              <span className="text-xs text-muted-foreground">
                {timeAgo(notif.createdAt)}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notif.body}
          </p>
        </div>
      </button>
    );
  }

  function NotifList({ items }: { items: Notification[] }) {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div
          data-ocid="notif.empty_state"
          className="flex flex-col items-center justify-center py-16 text-muted-foreground"
        >
          <Bell className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm">{t("noNotifications")}</p>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {items.map((n) => (
          <NotifItem key={n.id} notif={n} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-foreground">
              {t("notificationsCenter")}
            </h2>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} {t("unreadNotifications")}
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            data-ocid="notif.mark_all.button"
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={markingAll}
            className="gap-2 border-border/60 hover:border-primary/50"
          >
            <CheckCheck className="w-4 h-4" />
            {t("markAllRead")}
          </Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4 bg-muted/30">
          <TabsTrigger data-ocid="notif.all.tab" value="all">
            {t("all")}
            {notifications.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1.5 h-4 px-1 text-[10px]"
              >
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger data-ocid="notif.unread.tab" value="unread">
            {t("unread")}
            {unreadCount > 0 && (
              <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-primary text-primary-foreground">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger data-ocid="notif.system.tab" value="system">
            {t("system")}
          </TabsTrigger>
        </TabsList>
        <ScrollArea className="h-[calc(100vh-260px)]">
          <TabsContent value="all" className="mt-0">
            <NotifList items={notifications} />
          </TabsContent>
          <TabsContent value="unread" className="mt-0">
            <NotifList items={unreadNotifs} />
          </TabsContent>
          <TabsContent value="system" className="mt-0">
            <NotifList items={systemNotifs} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
