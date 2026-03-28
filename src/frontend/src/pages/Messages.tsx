import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  MessageCircle,
  Plus,
  Search,
  Send,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  ConversationSummary,
  DirectMessage,
  MemberProfile,
} from "../backend.d";
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

function timeAgo(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function Messages() {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString() ?? "";

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [newMsgContent, setNewMsgContent] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [orgMembers, setOrgMembers] = useState<MemberProfile[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!actor) return;
    setLoadingConvs(true);
    try {
      const convs = await (actor as any).getMyConversations();
      setConversations(convs);
    } catch {
      /* ignore */
    } finally {
      setLoadingConvs(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor && !isFetching) loadConversations();
  }, [actor, isFetching, loadConversations]);

  const loadThread = useCallback(
    async (partnerId: string) => {
      if (!actor) return;
      setLoadingMsgs(true);
      try {
        const msgs = await (actor as any).getConversation(partnerId, 0n, 50n);
        setMessages(msgs);
        await (actor as any).markConversationRead(partnerId);
        setConversations((prev) =>
          prev.map((c) =>
            c.partnerId === partnerId ? { ...c, unreadCount: 0n } : c,
          ),
        );
      } catch {
        /* ignore */
      } finally {
        setLoadingMsgs(false);
      }
    },
    [actor],
  );

  useEffect(() => {
    if (selectedPartner) loadThread(selectedPartner);
  }, [selectedPartner, loadThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }); // eslint-disable-next-line

  const handleSend = async () => {
    if (!actor || !selectedPartner || !newMsgContent.trim()) return;
    setSending(true);
    try {
      const msg = await (actor as any).sendMessage(
        selectedPartner,
        newMsgContent.trim(),
      );
      setMessages((prev) => [...prev, msg]);
      setNewMsgContent("");
      await loadConversations();
    } catch {
      toast.error(t("error"));
    } finally {
      setSending(false);
    }
  };

  const loadMembers = useCallback(async () => {
    if (!actor) return;
    try {
      const orgs = await (actor as any).listOrganizations();
      if (orgs.length > 0) {
        const members = await (actor as any).getMembersInOrg(orgs[0].id);
        setOrgMembers(members);
      }
    } catch {
      /* ignore */
    }
  }, [actor]);

  const handleNewChat = async () => {
    setShowNewChat(true);
    await loadMembers();
  };

  const startChat = (memberId: string) => {
    setShowNewChat(false);
    setSelectedPartner(memberId);
    const existing = conversations.find((c) => c.partnerId === memberId);
    if (!existing) {
      const member = orgMembers.find((m) => m.principalId === memberId);
      setConversations((prev) => [
        {
          partnerId: memberId,
          partnerName: member?.displayName || memberId.slice(0, 8),
          lastMessage: "",
          lastMessageAt: BigInt(Date.now()) * 1_000_000n,
          unreadCount: 0n,
        },
        ...prev,
      ]);
    }
  };

  const selectedConv = conversations.find(
    (c) => c.partnerId === selectedPartner,
  );
  const filteredConvs = conversations.filter((c) =>
    c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredMembers = orgMembers.filter(
    (m) =>
      m.displayName.toLowerCase().includes(memberSearch.toLowerCase()) &&
      m.principalId !== myPrincipal,
  );

  const ConvPanel = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h2 className="font-display font-bold text-foreground flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          {t("messages")}
        </h2>
        <Button
          data-ocid="messages.new_chat.button"
          size="sm"
          variant="outline"
          onClick={handleNewChat}
          className="gap-1 border-border/60 hover:border-primary/50"
        >
          <Plus className="w-4 h-4" />
          {t("newMessage")}
        </Button>
      </div>
      {/* Search */}
      <div className="p-3 border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            data-ocid="messages.search_input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchMembers")}
            className="pl-8 h-8 text-sm bg-muted/30 border-border/40"
          />
        </div>
      </div>
      {/* Conversations */}
      <ScrollArea className="flex-1">
        {loadingConvs ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : filteredConvs.length === 0 ? (
          <div
            data-ocid="messages.empty_state"
            className="flex flex-col items-center justify-center py-12 text-muted-foreground"
          >
            <MessageCircle className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">{t("noMessages")}</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredConvs.map((conv, i) => (
              <button
                type="button"
                key={conv.partnerId}
                data-ocid={`messages.conv.item.${i + 1}`}
                onClick={() => setSelectedPartner(conv.partnerId)}
                className={cn(
                  "w-full flex gap-3 p-3 rounded-lg text-left transition-all",
                  selectedPartner === conv.partnerId
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/30 border border-transparent",
                )}
              >
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarFallback className="bg-muted text-xs font-medium">
                    {initials(conv.partnerName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">
                      {conv.partnerName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {conv.unreadCount > 0n && (
                        <Badge className="h-4 px-1 text-[10px] bg-primary text-primary-foreground">
                          {conv.unreadCount.toString()}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {timeAgo(conv.lastMessageAt)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.lastMessage || t("noMessages")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const ThreadPanel = selectedConv ? (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="p-4 border-b border-border/50 flex items-center gap-3">
        <button
          type="button"
          data-ocid="messages.back.button"
          onClick={() => setSelectedPartner(null)}
          className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Avatar className="w-9 h-9">
          <AvatarFallback className="bg-muted text-xs font-medium">
            {initials(selectedConv.partnerName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {selectedConv.partnerName}
          </p>
        </div>
      </div>
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loadingMsgs ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className={cn(
                  "h-10 w-2/3 rounded-2xl",
                  i % 2 === 0 && "ml-auto",
                )}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div
            data-ocid="messages.thread.empty_state"
            className="flex flex-col items-center justify-center h-full text-muted-foreground"
          >
            <MessageCircle className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">{t("noMessages")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => {
              const isMine = msg.fromId === myPrincipal;
              return (
                <div
                  key={msg.id}
                  data-ocid={`messages.msg.item.${i + 1}`}
                  className={cn("flex", isMine && "justify-end")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm",
                    )}
                  >
                    <p>{msg.content}</p>
                    <p
                      className={cn(
                        "text-[10px] mt-1",
                        isMine
                          ? "text-primary-foreground/60"
                          : "text-muted-foreground",
                      )}
                    >
                      {new Date(
                        Number(msg.createdAt / 1_000_000n),
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      {/* Input */}
      <div className="p-4 border-t border-border/50 flex gap-2">
        <Textarea
          data-ocid="messages.message.textarea"
          value={newMsgContent}
          onChange={(e) => setNewMsgContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={t("typeAMessage")}
          rows={1}
          className="flex-1 resize-none min-h-0 bg-muted/30 border-border/40 text-sm"
        />
        <Button
          data-ocid="messages.send.button"
          onClick={handleSend}
          disabled={sending || !newMsgContent.trim()}
          size="icon"
          className="flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  ) : (
    <div className="hidden lg:flex flex-col items-center justify-center h-full text-muted-foreground">
      <Users className="w-16 h-16 mb-4 opacity-10" />
      <p className="text-sm">{t("selectConversation")}</p>
    </div>
  );

  return (
    <div className="h-[calc(100vh-56px)] flex">
      {/* New Chat Modal */}
      {showNewChat && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
          onClick={() => setShowNewChat(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowNewChat(false)}
          role="presentation"
        >
          <dialog
            open
            className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm mx-4 m-0"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              {t("newMessage")}
            </h3>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                data-ocid="messages.member_search.input"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder={t("searchMembers")}
                className="pl-8 bg-muted/30 border-border/40"
                autoFocus
              />
            </div>
            <ScrollArea className="h-48">
              {filteredMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("noMembers")}
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredMembers.map((m, i) => (
                    <button
                      type="button"
                      key={m.principalId}
                      data-ocid={`messages.member.item.${i + 1}`}
                      onClick={() => startChat(m.principalId)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors text-left"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-muted text-xs">
                          {initials(m.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {m.displayName}
                        </p>
                        {m.country && (
                          <p className="text-xs text-muted-foreground">
                            {m.country}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </dialog>
        </div>
      )}

      {/* Left: conversations list */}
      <div
        className={cn(
          "w-full lg:w-72 xl:w-80 border-r border-border/50 flex flex-col flex-shrink-0",
          selectedPartner && "hidden lg:flex",
        )}
      >
        {ConvPanel}
      </div>

      {/* Right: thread */}
      <div
        className={cn(
          "flex-1 flex flex-col",
          !selectedPartner && "hidden lg:flex",
        )}
      >
        {ThreadPanel}
      </div>
    </div>
  );
}
