import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  ChevronRight,
  FileMusic,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import {
  formatTimestamp,
  getWorkTypeLabel,
  useAllWorks,
  useOrganizations,
  useRegisterWork,
} from "../hooks/useQueries";
import type { CreativeWork, WorkType } from "../hooks/useQueries";
import { useTranslation } from "../i18n";

export function CreativeWorks() {
  const { t } = useTranslation();
  const { data: works, isLoading } = useAllWorks();
  const { data: orgs } = useOrganizations();
  const registerWork = useRegisterWork();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CreativeWork | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    workType: "",
    isrc: "",
    iswc: "",
    genre: "",
    description: "",
    releaseDate: "",
    orgId: "",
  });
  const { actor } = useActor();
  const [isrcLookup, setIsrcLookup] = useState<{
    loading: boolean;
    result: { title: string; artists: string[] } | null;
  }>({ loading: false, result: null });
  const [iswcLookup, setIswcLookup] = useState<{
    loading: boolean;
    result: { title: string; workType: string; artists: string[] } | null;
  }>({ loading: false, result: null });

  const handleLookupIsrc = async () => {
    if (!actor || !form.isrc.trim()) return;
    setIsrcLookup({ loading: true, result: null });
    try {
      const r = await (actor as any).lookupISRC(form.isrc.trim());
      setIsrcLookup({ loading: false, result: r.title ? r : null });
    } catch {
      setIsrcLookup({ loading: false, result: null });
    }
  };

  const handleLookupIswc = async () => {
    if (!actor || !form.iswc.trim()) return;
    setIswcLookup({ loading: true, result: null });
    try {
      const r = await (actor as any).lookupISWC(form.iswc.trim());
      setIswcLookup({ loading: false, result: r.title ? r : null });
    } catch {
      setIswcLookup({ loading: false, result: null });
    }
  };

  const workTypeMap: Record<string, WorkType> = {
    song: { song: null },
    album: { album: null },
    composition: { composition: null },
    soundRecording: { soundRecording: null },
  };

  const filtered =
    works?.filter(
      (w) =>
        w.title.toLowerCase().includes(search.toLowerCase()) ||
        w.genre.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.workType) return;
    await registerWork.mutateAsync({
      ...form,
      workType: workTypeMap[form.workType],
    });
    setForm({
      title: "",
      workType: "",
      isrc: "",
      iswc: "",
      genre: "",
      description: "",
      releaseDate: "",
      orgId: "",
    });
    setOpen(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl" data-ocid="creative_works.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">
            {t("creativeWorks")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} {t("creativeWorks").toLowerCase()}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="creative_works.register.primary_button"
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("registerNewWork")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="bg-popover border-border max-w-lg"
            data-ocid="creative_works.register.dialog"
          >
            <DialogHeader>
              <DialogTitle className="font-display">
                {t("registerNewWork")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div className="space-y-1.5">
                <Label>{t("workTitle")} *</Label>
                <Input
                  data-ocid="creative_works.title.input"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="bg-input border-border"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("workType")} *</Label>
                  <Select
                    value={form.workType}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, workType: v }))
                    }
                  >
                    <SelectTrigger
                      data-ocid="creative_works.type.select"
                      className="bg-input border-border"
                    >
                      <SelectValue placeholder={t("workType")} />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="song">{t("song")}</SelectItem>
                      <SelectItem value="album">{t("album")}</SelectItem>
                      <SelectItem value="composition">
                        {t("composition")}
                      </SelectItem>
                      <SelectItem value="soundRecording">
                        {t("soundRecording")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("genre")}</Label>
                  <Input
                    data-ocid="creative_works.genre.input"
                    value={form.genre}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, genre: e.target.value }))
                    }
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("isrc")}</Label>
                  <div className="flex gap-1.5">
                    <Input
                      data-ocid="creative_works.isrc.input"
                      value={form.isrc}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, isrc: e.target.value }));
                        setIsrcLookup({ loading: false, result: null });
                      }}
                      className="bg-input border-border"
                    />
                    <button
                      type="button"
                      data-ocid="creative_works.isrc.lookup.button"
                      onClick={handleLookupIsrc}
                      disabled={isrcLookup.loading || !form.isrc.trim()}
                      className="px-2 text-xs border border-border rounded-md text-muted-foreground hover:text-primary hover:border-primary/50 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {isrcLookup.loading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        t("lookupIsrc")
                      )}
                    </button>
                  </div>
                  {isrcLookup.result && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-2 text-xs">
                      <div className="flex items-center gap-1.5 text-primary font-medium mb-1">
                        <CheckCircle2 className="w-3 h-3" /> {t("lookupResult")}
                      </div>
                      <p className="text-foreground">
                        {isrcLookup.result.title}
                      </p>
                      {isrcLookup.result.artists.length > 0 && (
                        <p className="text-muted-foreground">
                          {isrcLookup.result.artists.join(", ")}
                        </p>
                      )}
                      <button
                        type="button"
                        data-ocid="creative_works.isrc.use_data.button"
                        onClick={() => {
                          setForm((p) => ({
                            ...p,
                            title: isrcLookup.result!.title,
                          }));
                          setIsrcLookup({ loading: false, result: null });
                        }}
                        className="mt-1.5 text-primary underline hover:no-underline"
                      >
                        {t("useThisData")}
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>{t("iswc")}</Label>
                  <div className="flex gap-1.5">
                    <Input
                      data-ocid="creative_works.iswc.input"
                      value={form.iswc}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, iswc: e.target.value }));
                        setIswcLookup({ loading: false, result: null });
                      }}
                      className="bg-input border-border"
                    />
                    <button
                      type="button"
                      data-ocid="creative_works.iswc.lookup.button"
                      onClick={handleLookupIswc}
                      disabled={iswcLookup.loading || !form.iswc.trim()}
                      className="px-2 text-xs border border-border rounded-md text-muted-foreground hover:text-primary hover:border-primary/50 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {iswcLookup.loading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        t("lookupIswc")
                      )}
                    </button>
                  </div>
                  {iswcLookup.result && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-2 text-xs">
                      <div className="flex items-center gap-1.5 text-primary font-medium mb-1">
                        <CheckCircle2 className="w-3 h-3" /> {t("lookupResult")}
                      </div>
                      <p className="text-foreground">
                        {iswcLookup.result.title}
                      </p>
                      {iswcLookup.result.artists.length > 0 && (
                        <p className="text-muted-foreground">
                          {iswcLookup.result.artists.join(", ")}
                        </p>
                      )}
                      <button
                        type="button"
                        data-ocid="creative_works.iswc.use_data.button"
                        onClick={() => {
                          setForm((p) => ({
                            ...p,
                            title: p.title || iswcLookup.result!.title,
                            workType: iswcLookup.result!.workType || p.workType,
                          }));
                          setIswcLookup({ loading: false, result: null });
                        }}
                        className="mt-1.5 text-primary underline hover:no-underline"
                      >
                        {t("useThisData")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("releaseDate")}</Label>
                  <Input
                    type="date"
                    data-ocid="creative_works.release_date.input"
                    value={form.releaseDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, releaseDate: e.target.value }))
                    }
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("organization")}</Label>
                  <Select
                    value={form.orgId}
                    onValueChange={(v) => setForm((p) => ({ ...p, orgId: v }))}
                  >
                    <SelectTrigger
                      data-ocid="creative_works.org.select"
                      className="bg-input border-border"
                    >
                      <SelectValue placeholder={t("selectOrg")} />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {orgs?.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("description")}</Label>
                <Textarea
                  data-ocid="creative_works.description.textarea"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="bg-input border-border resize-none"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  type="submit"
                  data-ocid="creative_works.register.submit_button"
                  disabled={
                    registerWork.isPending || !form.title || !form.workType
                  }
                  className="bg-primary text-primary-foreground"
                >
                  {registerWork.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {t("registerNewWork")}
                </Button>
                <Button
                  type="button"
                  data-ocid="creative_works.register.cancel_button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="border-border"
                >
                  {t("cancel")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="creative_works.search.search_input"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-input border-border"
        />
      </div>

      {/* Detail panel */}
      {selected && (
        <Card
          className="bg-card border-primary/30"
          data-ocid="creative_works.detail.card"
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="font-display text-base">
              {t("workDetails")}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(null)}
              data-ocid="creative_works.detail.close_button"
            >
              ×
            </Button>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div>
              <span className="text-muted-foreground">{t("workTitle")}:</span>{" "}
              <span className="font-medium">{selected.title}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("workType")}:</span>{" "}
              <Badge
                variant="outline"
                className="border-primary/30 text-primary"
              >
                {getWorkTypeLabel(selected.workType)}
              </Badge>
            </div>
            {selected.isrc && (
              <div>
                <span className="text-muted-foreground">ISRC:</span>{" "}
                <span className="font-mono text-xs">{selected.isrc}</span>
              </div>
            )}
            {selected.iswc && (
              <div>
                <span className="text-muted-foreground">ISWC:</span>{" "}
                <span className="font-mono text-xs">{selected.iswc}</span>
              </div>
            )}
            {selected.genre && (
              <div>
                <span className="text-muted-foreground">{t("genre")}:</span>{" "}
                <span>{selected.genre}</span>
              </div>
            )}
            {selected.releaseDate && (
              <div>
                <span className="text-muted-foreground">
                  {t("releaseDate")}:
                </span>{" "}
                <span>{selected.releaseDate}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">{t("creator")}:</span>{" "}
              <span className="font-mono text-xs">{selected.creatorId}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("created")}:</span>{" "}
              <span>{formatTimestamp(selected.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="creative_works.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full bg-muted" />
          ))}
        </div>
      ) : !filtered.length ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="creative_works.empty_state"
        >
          <FileMusic className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("noWorks")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((work, i) => (
            <Card
              key={work.id}
              data-ocid={`creative_works.item.${i + 1}`}
              className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setSelected(work)}
            >
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileMusic className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{work.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {getWorkTypeLabel(work.workType)}
                      {work.genre ? ` • ${work.genre}` : ""}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
