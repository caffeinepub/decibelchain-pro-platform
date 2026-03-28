import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useTranslation } from "@/i18n";
import {
  CheckCircle,
  DollarSign,
  Globe,
  Info,
  Loader2,
  Lock,
  MessageSquare,
  Music,
  Plus,
  RefreshCw,
  Send,
  ShoppingBag,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type MarketplaceListing = {
  id: string;
  workId: string;
  workTitle: string;
  rightsHolderName: string;
  rightsHolderPrincipal: string;
  licenseType: string;
  territory: string;
  askingPrice: number;
  currency: string;
  genre: string;
  description: string;
  status: string;
  createdAt: bigint;
};

type LicenseRequest = {
  id: string;
  listingId: string;
  listingTitle: string;
  requestorPrincipal: string;
  requestorName: string;
  intendedUse: string;
  territory: string;
  duration: string;
  offeredTerms: string;
  contactInfo: string;
  status: string;
  counterOffer: string;
  createdAt: bigint;
  updatedAt: bigint;
};

const LICENSE_TYPES = ["Sync", "Master", "Print", "Blanket"];
const CURRENCIES = ["USD", "EUR", "GBP", "ICP"];

function statusColor(status: string) {
  if (status === "active")
    return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (status === "pending")
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-muted text-muted-foreground border-border";
}

function licenseColor(type: string) {
  const map: Record<string, string> = {
    Sync: "bg-primary/20 text-primary border-primary/30",
    Master: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    Print: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    Blanket: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };
  return map[type] ?? "bg-muted text-muted-foreground border-border";
}

function requestStatusColor(status: string) {
  const map: Record<string, string> = {
    pending: "bg-muted text-muted-foreground border-border",
    underReview: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    accepted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    countered: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };
  return map[status] ?? "bg-muted text-muted-foreground border-border";
}

function formatDate(ts: bigint) {
  if (!ts) return "—";
  return new Date(Number(ts) / 1_000_000).toLocaleDateString();
}

const SAMPLE_LISTINGS: MarketplaceListing[] = [
  {
    id: "sample-1",
    workId: "w-001",
    workTitle: "Midnight Frequency",
    rightsHolderName: "Solaris Music Group",
    rightsHolderPrincipal: "sample",
    licenseType: "Sync",
    territory: "Worldwide",
    askingPrice: 4500,
    currency: "USD",
    genre: "Electronic",
    description:
      "A cinematic electronic track ideal for film, TV, and advertising placements. Available for sync licensing globally.",
    status: "active",
    createdAt: BigInt(0),
  },
  {
    id: "sample-2",
    workId: "w-002",
    workTitle: "Rio de Fuego",
    rightsHolderName: "Tropicana Rights Ltd.",
    rightsHolderPrincipal: "sample",
    licenseType: "Master",
    territory: "Latin America",
    askingPrice: 2200,
    currency: "USD",
    genre: "Latin Pop",
    description:
      "Master recording rights for this viral Latin pop track. Streaming-ready, clearance included for digital distribution.",
    status: "active",
    createdAt: BigInt(0),
  },
  {
    id: "sample-3",
    workId: "w-003",
    workTitle: "Cathedral of Sound",
    rightsHolderName: "Veritas Publishing",
    rightsHolderPrincipal: "sample",
    licenseType: "Print",
    territory: "Europe",
    askingPrice: 800,
    currency: "EUR",
    genre: "Classical",
    description:
      "Sheet music and print rights for orchestral arrangement. Suitable for educational publishers and performance venues.",
    status: "active",
    createdAt: BigInt(0),
  },
  {
    id: "sample-4",
    workId: "w-004",
    workTitle: "Ghost Protocol",
    rightsHolderName: "Cipher Audio LLC",
    rightsHolderPrincipal: "sample",
    licenseType: "Blanket",
    territory: "North America",
    askingPrice: 12000,
    currency: "USD",
    genre: "Hip-Hop",
    description:
      "Blanket licensing deal for entire catalog of 40+ hip-hop instrumentals. Ideal for streaming platforms or content networks.",
    status: "pending",
    createdAt: BigInt(0),
  },
  {
    id: "sample-5",
    workId: "w-005",
    workTitle: "Sakura Digital",
    rightsHolderName: "Tokyo Wave Publishing",
    rightsHolderPrincipal: "sample",
    licenseType: "Sync",
    territory: "Asia-Pacific",
    askingPrice: 35,
    currency: "ICP",
    genre: "J-Pop",
    description:
      "Contemporary J-Pop track with strong cultural identity. Cleared for sync use across APAC digital platforms.",
    status: "active",
    createdAt: BigInt(0),
  },
  {
    id: "sample-6",
    workId: "w-006",
    workTitle: "The Last Vesper",
    rightsHolderName: "Dusk Recordings",
    rightsHolderPrincipal: "sample",
    licenseType: "Master",
    territory: "United Kingdom",
    askingPrice: 1750,
    currency: "GBP",
    genre: "Ambient",
    description:
      "Ambient master recording with full clearance for broadcast and streaming in the UK market.",
    status: "active",
    createdAt: BigInt(0),
  },
];

export function MarketplaceListings({
  isAuthenticated,
}: { isAuthenticated: boolean }) {
  const { t } = useTranslation();
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  const callerPrincipal = identity?.getPrincipal().toString() ?? "";

  // Browse state
  const [listings, setListings] =
    useState<MarketplaceListing[]>(SAMPLE_LISTINGS);
  const [loading, setLoading] = useState(false);
  const [filterGenre, setFilterGenre] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterTerritory, setFilterTerritory] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [selectedListing, setSelectedListing] =
    useState<MarketplaceListing | null>(null);

  // My listings state
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [myLoading, setMyLoading] = useState(false);
  const [newListingOpen, setNewListingOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New listing form
  const [form, setForm] = useState({
    workTitle: "",
    workId: "",
    licenseType: "Sync",
    territory: "",
    askingPrice: "",
    currency: "USD",
    genre: "",
    description: "",
  });

  // Request form state
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    intendedUse: "",
    territory: "",
    duration: "",
    offeredTerms: "",
    contactInfo: "",
  });
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  // My requests state
  const [submittedRequests, setSubmittedRequests] = useState<LicenseRequest[]>(
    [],
  );
  const [receivedRequests, setReceivedRequests] = useState<LicenseRequest[]>(
    [],
  );
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsSubTab, setRequestsSubTab] = useState("submitted");

  // Counter offer state
  const [counterOfferTarget, setCounterOfferTarget] =
    useState<LicenseRequest | null>(null);
  const [counterOfferText, setCounterOfferText] = useState("");
  const [counterSubmitting, setCounterSubmitting] = useState(false);
  const [respondingIds, setRespondingIds] = useState<Set<string>>(new Set());

  const fetchListings = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const data = await actor.getMarketplaceListings();
      if (data && data.length > 0)
        setListings(data as unknown as MarketplaceListing[]);
    } catch {
      /* use sample data */
    } finally {
      setLoading(false);
    }
  }, [actor]);

  const fetchMyListings = useCallback(async () => {
    if (!actor || !isAuthenticated) return;
    setMyLoading(true);
    try {
      const data = await actor.getMyListings();
      setMyListings(data as unknown as MarketplaceListing[]);
    } catch {
      /* ignore */
    } finally {
      setMyLoading(false);
    }
  }, [actor, isAuthenticated]);

  const fetchMyRequests = useCallback(async () => {
    if (!actor || !isAuthenticated) return;
    setRequestsLoading(true);
    try {
      const [submitted, received] = await Promise.all([
        (actor as any).getMySubmittedRequests(),
        (actor as any).getRequestsForMyListings(),
      ]);
      setSubmittedRequests(submitted as unknown as LicenseRequest[]);
      setReceivedRequests(received as unknown as LicenseRequest[]);
    } catch {
      /* ignore */
    } finally {
      setRequestsLoading(false);
    }
  }, [actor, isAuthenticated]);

  useEffect(() => {
    if (actor && !isFetching) {
      fetchListings();
      if (isAuthenticated) {
        fetchMyListings();
        fetchMyRequests();
      }
    }
  }, [
    actor,
    isFetching,
    fetchListings,
    fetchMyListings,
    fetchMyRequests,
    isAuthenticated,
  ]);

  const filteredListings = listings.filter((l) => {
    if (
      filterGenre &&
      !l.genre.toLowerCase().includes(filterGenre.toLowerCase())
    )
      return false;
    if (filterType !== "all" && l.licenseType !== filterType) return false;
    if (
      filterTerritory &&
      !l.territory.toLowerCase().includes(filterTerritory.toLowerCase())
    )
      return false;
    if (filterMaxPrice && l.askingPrice > Number(filterMaxPrice)) return false;
    return true;
  });

  const handleSubmitListing = async () => {
    if (!actor || !form.workTitle || !form.territory || !form.askingPrice) {
      toast.error(t("fillRequiredFields"));
      return;
    }
    setSubmitting(true);
    try {
      const result = await actor.createListing(
        form.workId || crypto.randomUUID(),
        form.workTitle,
        "",
        form.licenseType,
        form.territory,
        Number(form.askingPrice),
        form.currency,
        form.description,
        form.genre,
      );
      if ("ok" in result) {
        toast.success(t("listingCreated"));
        setNewListingOpen(false);
        setForm({
          workTitle: "",
          workId: "",
          licenseType: "Sync",
          territory: "",
          askingPrice: "",
          currency: "USD",
          genre: "",
          description: "",
        });
        fetchMyListings();
      } else {
        toast.error(String((result as any).err));
      }
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (listing: MarketplaceListing) => {
    if (!actor) return;
    const newStatus = listing.status === "active" ? "closed" : "active";
    try {
      const result = await actor.updateListingStatus(listing.id, newStatus);
      if ("ok" in result) {
        toast.success(t("statusUpdated"));
        fetchMyListings();
      } else {
        toast.error(String((result as any).err));
      }
    } catch (e) {
      toast.error(String(e));
    }
  };

  const openRequestModal = (listing: MarketplaceListing) => {
    setRequestForm({
      intendedUse: "",
      territory: listing.territory,
      duration: "",
      offeredTerms: "",
      contactInfo: "",
    });
    setRequestModalOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!actor || !selectedListing) return;
    if (
      !requestForm.intendedUse ||
      !requestForm.territory ||
      !requestForm.duration ||
      !requestForm.contactInfo
    ) {
      toast.error(t("fillRequiredFields"));
      return;
    }
    setRequestSubmitting(true);
    try {
      const result = await (actor as any).submitLicenseRequest(
        selectedListing.id,
        requestForm.intendedUse,
        requestForm.territory,
        requestForm.duration,
        requestForm.offeredTerms,
        requestForm.contactInfo,
      );
      if ("ok" in result) {
        toast.success(t("requestSubmitted"));
        setRequestModalOpen(false);
        setSelectedListing(null);
        fetchMyRequests();
      } else {
        toast.error(String((result as any).err));
      }
    } catch (e) {
      toast.error(String(e));
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleRespondToRequest = async (
    req: LicenseRequest,
    status: string,
    counterOffer = "",
  ) => {
    if (!actor) return;
    setRespondingIds((prev) => new Set(prev).add(req.id));
    try {
      const result = await (actor as any).respondToRequest(
        req.id,
        status,
        counterOffer,
      );
      if ("ok" in result) {
        toast.success(t("requestUpdated"));
        fetchMyRequests();
        if (counterOfferTarget?.id === req.id) {
          setCounterOfferTarget(null);
          setCounterOfferText("");
        }
      } else {
        toast.error(String((result as any).err));
      }
    } catch (e) {
      toast.error(String(e));
    } finally {
      setRespondingIds((prev) => {
        const next = new Set(prev);
        next.delete(req.id);
        return next;
      });
    }
  };

  const isMyListing = (listing: MarketplaceListing) =>
    isAuthenticated &&
    callerPrincipal &&
    listing.rightsHolderPrincipal === callerPrincipal;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              {t("marketplace")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("marketplaceDesc")}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="browse">
        <TabsList className="mb-2">
          <TabsTrigger value="browse" data-ocid="marketplace.browse.tab">
            {t("browseListings")}
          </TabsTrigger>
          <TabsTrigger value="my" data-ocid="marketplace.my.tab">
            {t("myListings")}
          </TabsTrigger>
          <TabsTrigger value="requests" data-ocid="marketplace.requests.tab">
            {t("myRequests")}
          </TabsTrigger>
        </TabsList>

        {/* BROWSE TAB */}
        <TabsContent value="browse">
          {/* Filter bar */}
          <div className="flex flex-wrap gap-3 mb-5 p-4 bg-card border border-border rounded-lg">
            <div className="flex flex-col gap-1 min-w-[140px]">
              <Label className="text-xs text-muted-foreground">
                {t("filterByGenre")}
              </Label>
              <Input
                data-ocid="marketplace.genre.input"
                placeholder={t("filterByGenre")}
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[150px]">
              <Label className="text-xs text-muted-foreground">
                {t("licenseType")}
              </Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger
                  data-ocid="marketplace.licensetype.select"
                  className="h-8 text-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allTypes")}</SelectItem>
                  {LICENSE_TYPES.map((lt) => (
                    <SelectItem key={lt} value={lt}>
                      {lt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <Label className="text-xs text-muted-foreground">
                {t("territory")}
              </Label>
              <Input
                data-ocid="marketplace.territory.input"
                placeholder={t("territory")}
                value={filterTerritory}
                onChange={(e) => setFilterTerritory(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[130px]">
              <Label className="text-xs text-muted-foreground">
                {t("maxPrice")}
              </Label>
              <Input
                data-ocid="marketplace.maxprice.input"
                type="number"
                placeholder={t("maxPrice")}
                value={filterMaxPrice}
                onChange={(e) => setFilterMaxPrice(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                data-ocid="marketplace.reset_filters.button"
                onClick={() => {
                  setFilterGenre("");
                  setFilterType("all");
                  setFilterTerritory("");
                  setFilterMaxPrice("");
                }}
              >
                {t("resetFilters")}
              </Button>
            </div>
          </div>

          {loading ? (
            <div
              data-ocid="marketplace.browse.loading_state"
              className="flex justify-center py-16"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredListings.length === 0 ? (
            <div
              data-ocid="marketplace.browse.empty_state"
              className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground"
            >
              <ShoppingBag className="w-10 h-10 opacity-30" />
              <p className="text-sm">{t("noListingsFound")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map((listing, idx) => (
                <button
                  key={listing.id}
                  type="button"
                  data-ocid={`marketplace.item.${idx + 1}`}
                  className="text-left"
                  onClick={() => setSelectedListing(listing)}
                >
                  <Card className="bg-card border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-semibold text-foreground leading-snug">
                          {listing.workTitle}
                        </CardTitle>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${statusColor(listing.status)}`}
                        >
                          {listing.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {listing.rightsHolderName}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${licenseColor(listing.licenseType)}`}
                        >
                          {listing.licenseType}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {listing.territory}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {listing.description}
                      </p>
                      <div className="flex items-center gap-1 text-primary font-semibold text-sm">
                        <DollarSign className="w-3.5 h-3.5" />
                        {listing.askingPrice.toLocaleString()}{" "}
                        {listing.currency}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        {/* MY LISTINGS TAB */}
        <TabsContent value="my">
          {!isAuthenticated ? (
            <div
              data-ocid="marketplace.my.empty_state"
              className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground"
            >
              <Lock className="w-10 h-10 opacity-30" />
              <p className="text-sm">{t("loginToManageListings")}</p>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Dialog open={newListingOpen} onOpenChange={setNewListingOpen}>
                  <DialogTrigger asChild>
                    <Button
                      data-ocid="marketplace.new_listing.open_modal_button"
                      size="sm"
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {t("newListing")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className="max-w-lg"
                    data-ocid="marketplace.new_listing.dialog"
                  >
                    <DialogHeader>
                      <DialogTitle>{t("newListing")}</DialogTitle>
                      <DialogDescription>
                        {t("newListingDesc")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 py-2">
                      <div className="col-span-2 flex flex-col gap-1">
                        <Label>{t("workTitle")} *</Label>
                        <Input
                          data-ocid="marketplace.work_title.input"
                          value={form.workTitle}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              workTitle: e.target.value,
                            }))
                          }
                          placeholder={t("workTitle")}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>{t("workId")}</Label>
                        <Input
                          data-ocid="marketplace.work_id.input"
                          value={form.workId}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, workId: e.target.value }))
                          }
                          placeholder="WRK-001"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>{t("licenseType")} *</Label>
                        <Select
                          value={form.licenseType}
                          onValueChange={(v) =>
                            setForm((f) => ({ ...f, licenseType: v }))
                          }
                        >
                          <SelectTrigger data-ocid="marketplace.form_licensetype.select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LICENSE_TYPES.map((lt) => (
                              <SelectItem key={lt} value={lt}>
                                {lt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>{t("territory")} *</Label>
                        <Input
                          data-ocid="marketplace.form_territory.input"
                          value={form.territory}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              territory: e.target.value,
                            }))
                          }
                          placeholder="Worldwide"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>{t("genre")}</Label>
                        <Input
                          data-ocid="marketplace.genre_field.input"
                          value={form.genre}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, genre: e.target.value }))
                          }
                          placeholder="Electronic"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>{t("askingPrice")} *</Label>
                        <Input
                          data-ocid="marketplace.asking_price.input"
                          type="number"
                          value={form.askingPrice}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              askingPrice: e.target.value,
                            }))
                          }
                          placeholder="1000"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>{t("currency")}</Label>
                        <Select
                          value={form.currency}
                          onValueChange={(v) =>
                            setForm((f) => ({ ...f, currency: v }))
                          }
                        >
                          <SelectTrigger data-ocid="marketplace.currency.select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 flex flex-col gap-1">
                        <Label>{t("description")}</Label>
                        <Textarea
                          data-ocid="marketplace.description.textarea"
                          value={form.description}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              description: e.target.value,
                            }))
                          }
                          rows={3}
                          placeholder={t("listingDescriptionPlaceholder")}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        data-ocid="marketplace.new_listing.cancel_button"
                        onClick={() => setNewListingOpen(false)}
                      >
                        {t("cancel")}
                      </Button>
                      <Button
                        data-ocid="marketplace.new_listing.submit_button"
                        onClick={handleSubmitListing}
                        disabled={submitting}
                      >
                        {submitting && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        {t("createListing")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {myLoading ? (
                <div
                  data-ocid="marketplace.my.loading_state"
                  className="flex justify-center py-16"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : myListings.length === 0 ? (
                <div
                  data-ocid="marketplace.my.empty_state"
                  className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground"
                >
                  <Music className="w-10 h-10 opacity-30" />
                  <p className="text-sm">{t("noMyListings")}</p>
                  <p className="text-xs opacity-60">{t("noMyListingsHint")}</p>
                </div>
              ) : (
                <Table data-ocid="marketplace.my.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("workTitle")}</TableHead>
                      <TableHead>{t("licenseType")}</TableHead>
                      <TableHead>{t("territory")}</TableHead>
                      <TableHead>{t("askingPrice")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead className="text-right">
                        {t("actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myListings.map((listing, idx) => (
                      <TableRow
                        key={listing.id}
                        data-ocid={`marketplace.my.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium">
                          {listing.workTitle}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${licenseColor(listing.licenseType)}`}
                          >
                            {listing.licenseType}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {listing.territory}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-primary">
                          {listing.askingPrice.toLocaleString()}{" "}
                          {listing.currency}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColor(listing.status)}`}
                          >
                            {listing.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            data-ocid={`marketplace.my.toggle_status.${idx + 1}`}
                            onClick={() => handleToggleStatus(listing)}
                            className="gap-1 text-xs"
                          >
                            {listing.status === "active" ? (
                              <>
                                <X className="w-3 h-3" />
                                {t("close")}
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3 h-3" />
                                {t("reactivate")}
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </TabsContent>

        {/* MY REQUESTS TAB */}
        <TabsContent value="requests">
          {!isAuthenticated ? (
            <div
              data-ocid="marketplace.requests.empty_state"
              className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground"
            >
              <Lock className="w-10 h-10 opacity-30" />
              <p className="text-sm">{t("loginToViewRequests")}</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                <Button
                  variant={
                    requestsSubTab === "submitted" ? "default" : "outline"
                  }
                  size="sm"
                  data-ocid="marketplace.submitted.tab"
                  onClick={() => setRequestsSubTab("submitted")}
                >
                  {t("submittedRequests")}
                </Button>
                <Button
                  variant={
                    requestsSubTab === "received" ? "default" : "outline"
                  }
                  size="sm"
                  data-ocid="marketplace.received.tab"
                  onClick={() => setRequestsSubTab("received")}
                >
                  {t("receivedRequests")}
                </Button>
              </div>

              {requestsLoading ? (
                <div
                  data-ocid="marketplace.requests.loading_state"
                  className="flex justify-center py-16"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : requestsSubTab === "submitted" ? (
                submittedRequests.length === 0 ? (
                  <div
                    data-ocid="marketplace.submitted.empty_state"
                    className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground"
                  >
                    <Send className="w-10 h-10 opacity-30" />
                    <p className="text-sm">{t("noSubmittedRequests")}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {submittedRequests.map((req, idx) => (
                      <div
                        key={req.id}
                        data-ocid={`marketplace.submitted.item.${idx + 1}`}
                        className="bg-card border border-border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              {req.listingTitle}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {t("submittedOn")} {formatDate(req.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${requestStatusColor(req.status)}`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">
                              {t("intendedUse")}
                            </p>
                            <p className="font-medium truncate">
                              {req.intendedUse}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              {t("territory")}
                            </p>
                            <p className="font-medium">{req.territory}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              {t("duration")}
                            </p>
                            <p className="font-medium">{req.duration}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              {t("contactInfo")}
                            </p>
                            <p className="font-medium truncate">
                              {req.contactInfo}
                            </p>
                          </div>
                        </div>
                        {req.status === "countered" && req.counterOffer && (
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                            <p className="text-xs font-semibold text-amber-400 mb-1">
                              {t("counterOfferReceived")}
                            </p>
                            <p className="text-xs text-foreground">
                              {req.counterOffer}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : // Received requests
              receivedRequests.length === 0 ? (
                <div
                  data-ocid="marketplace.received.empty_state"
                  className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground"
                >
                  <MessageSquare className="w-10 h-10 opacity-30" />
                  <p className="text-sm">{t("noReceivedRequests")}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {receivedRequests.map((req, idx) => (
                    <div
                      key={req.id}
                      data-ocid={`marketplace.received.item.${idx + 1}`}
                      className="bg-card border border-border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            {req.listingTitle}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t("from")}{" "}
                            <span className="text-foreground">
                              {req.requestorName || req.requestorPrincipal}
                            </span>{" "}
                            · {formatDate(req.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${requestStatusColor(req.status)}`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">
                            {t("intendedUse")}
                          </p>
                          <p className="font-medium truncate">
                            {req.intendedUse}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            {t("territory")}
                          </p>
                          <p className="font-medium">{req.territory}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            {t("duration")}
                          </p>
                          <p className="font-medium">{req.duration}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            {t("offeredTerms")}
                          </p>
                          <p className="font-medium truncate">
                            {req.offeredTerms || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            {t("contactInfo")}
                          </p>
                          <p className="font-medium truncate">
                            {req.contactInfo}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons for pending/underReview */}
                      {(req.status === "pending" ||
                        req.status === "underReview") && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            size="sm"
                            data-ocid={`marketplace.received.accept.${idx + 1}`}
                            className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                            disabled={respondingIds.has(req.id)}
                            onClick={() =>
                              handleRespondToRequest(req, "accepted")
                            }
                          >
                            {respondingIds.has(req.id) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            {t("accept")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            data-ocid={`marketplace.received.reject.${idx + 1}`}
                            className="gap-1 text-xs"
                            disabled={respondingIds.has(req.id)}
                            onClick={() =>
                              handleRespondToRequest(req, "rejected")
                            }
                          >
                            {respondingIds.has(req.id) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {t("reject")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`marketplace.received.counter.${idx + 1}`}
                            className="gap-1 text-xs border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                            disabled={respondingIds.has(req.id)}
                            onClick={() => {
                              setCounterOfferTarget(req);
                              setCounterOfferText("");
                            }}
                          >
                            <MessageSquare className="w-3 h-3" />
                            {t("counterOffer")}
                          </Button>
                        </div>
                      )}

                      {/* Inline counter offer form */}
                      {counterOfferTarget?.id === req.id && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-2">
                          <p className="text-xs font-semibold text-amber-400">
                            {t("enterCounterOffer")}
                          </p>
                          <Textarea
                            data-ocid="marketplace.counter_offer.textarea"
                            value={counterOfferText}
                            onChange={(e) =>
                              setCounterOfferText(e.target.value)
                            }
                            rows={3}
                            placeholder={t("counterOfferPlaceholder")}
                            className="text-xs"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              data-ocid="marketplace.counter_offer.submit_button"
                              className="text-xs gap-1"
                              disabled={
                                counterSubmitting || !counterOfferText.trim()
                              }
                              onClick={async () => {
                                setCounterSubmitting(true);
                                await handleRespondToRequest(
                                  req,
                                  "countered",
                                  counterOfferText,
                                );
                                setCounterSubmitting(false);
                              }}
                            >
                              {counterSubmitting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              {t("sendCounterOffer")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              data-ocid="marketplace.counter_offer.cancel_button"
                              className="text-xs"
                              onClick={() => setCounterOfferTarget(null)}
                            >
                              {t("cancel")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <Dialog
        open={!!selectedListing}
        onOpenChange={(o) => {
          if (!o) {
            setSelectedListing(null);
            setRequestModalOpen(false);
          }
        }}
      >
        <DialogContent
          className="max-w-lg"
          data-ocid="marketplace.detail.dialog"
        >
          {selectedListing && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle>{selectedListing.workTitle}</DialogTitle>
                    <DialogDescription>
                      {selectedListing.rightsHolderName}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${licenseColor(selectedListing.licenseType)}`}
                  >
                    {selectedListing.licenseType}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor(selectedListing.status)}`}
                  >
                    {selectedListing.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("territory")}
                    </p>
                    <p className="text-sm font-medium">
                      {selectedListing.territory}
                    </p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("genre")}
                    </p>
                    <p className="text-sm font-medium">
                      {selectedListing.genre || "—"}
                    </p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3 col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("askingPrice")}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {selectedListing.askingPrice.toLocaleString()}{" "}
                      {selectedListing.currency}
                    </p>
                  </div>
                </div>
                {selectedListing.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("description")}
                    </p>
                    <p className="text-sm leading-relaxed">
                      {selectedListing.description}
                    </p>
                  </div>
                )}

                {/* Request form (inline in detail modal) */}
                {requestModalOpen && (
                  <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
                    <p className="text-sm font-semibold text-foreground">
                      {t("submitLicenseRequest")}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 flex flex-col gap-1">
                        <Label className="text-xs">{t("intendedUse")} *</Label>
                        <Textarea
                          data-ocid="marketplace.request.intended_use.textarea"
                          value={requestForm.intendedUse}
                          onChange={(e) =>
                            setRequestForm((f) => ({
                              ...f,
                              intendedUse: e.target.value,
                            }))
                          }
                          rows={2}
                          placeholder={t("intendedUsePlaceholder")}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">{t("territory")} *</Label>
                        <Input
                          data-ocid="marketplace.request.territory.input"
                          value={requestForm.territory}
                          onChange={(e) =>
                            setRequestForm((f) => ({
                              ...f,
                              territory: e.target.value,
                            }))
                          }
                          placeholder="Worldwide"
                          className="text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">{t("duration")} *</Label>
                        <Input
                          data-ocid="marketplace.request.duration.input"
                          value={requestForm.duration}
                          onChange={(e) =>
                            setRequestForm((f) => ({
                              ...f,
                              duration: e.target.value,
                            }))
                          }
                          placeholder={t("durationPlaceholder")}
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-2 flex flex-col gap-1">
                        <Label className="text-xs">{t("offeredTerms")}</Label>
                        <Textarea
                          data-ocid="marketplace.request.offered_terms.textarea"
                          value={requestForm.offeredTerms}
                          onChange={(e) =>
                            setRequestForm((f) => ({
                              ...f,
                              offeredTerms: e.target.value,
                            }))
                          }
                          rows={2}
                          placeholder={t("offeredTermsPlaceholder")}
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-2 flex flex-col gap-1">
                        <Label className="text-xs">{t("contactInfo")} *</Label>
                        <Input
                          data-ocid="marketplace.request.contact_info.input"
                          value={requestForm.contactInfo}
                          onChange={(e) =>
                            setRequestForm((f) => ({
                              ...f,
                              contactInfo: e.target.value,
                            }))
                          }
                          placeholder={t("contactInfoPlaceholder")}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        data-ocid="marketplace.request.submit_button"
                        onClick={handleSubmitRequest}
                        disabled={requestSubmitting}
                        className="gap-1 text-xs"
                      >
                        {requestSubmitting ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        {t("submitRequest")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-ocid="marketplace.request.cancel_button"
                        onClick={() => setRequestModalOpen(false)}
                        className="text-xs"
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  data-ocid="marketplace.detail.close_button"
                  onClick={() => {
                    setSelectedListing(null);
                    setRequestModalOpen(false);
                  }}
                >
                  {t("close")}
                </Button>

                {/* Request License button logic */}
                {isMyListing(selectedListing) ? (
                  <span className="inline-flex items-center px-3 py-2 rounded-md bg-muted text-muted-foreground text-sm font-medium border border-border">
                    {t("yourListing")}
                  </span>
                ) : !isAuthenticated ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            data-ocid="marketplace.detail.request_license.button"
                            disabled
                            className="gap-2 opacity-60"
                          >
                            <Lock className="w-4 h-4" />
                            {t("loginToRequest")}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t("loginToRequestTooltip")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Button
                    data-ocid="marketplace.detail.request_license.button"
                    className="gap-2"
                    onClick={() => openRequestModal(selectedListing)}
                  >
                    <Send className="w-4 h-4" />
                    {t("requestLicense")}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
