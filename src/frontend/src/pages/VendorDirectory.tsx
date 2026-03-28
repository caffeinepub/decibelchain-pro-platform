import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Loader2, Mail, Plus, Search, Store } from "lucide-react";
import { useState } from "react";
import {
  getServiceTypeLabel,
  useAddVendor,
  useAllVendors,
  useOrganizations,
} from "../hooks/useQueries";
import type { ServiceType } from "../hooks/useQueries";
import { useTranslation } from "../i18n";

const SERVICE_TYPES = [
  "distribution",
  "publishing",
  "licensing",
  "sync",
  "marketing",
  "legal",
] as const;

export function VendorDirectory() {
  const { t } = useTranslation();
  const { data: vendors, isLoading } = useAllVendors();
  const { data: orgs } = useOrganizations();
  const addVendor = useAddVendor();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState<string>("all");
  const [form, setForm] = useState({
    name: "",
    serviceType: "",
    contactEmail: "",
    website: "",
    country: "",
    orgId: "",
  });

  const serviceTypeMap: Record<string, ServiceType> = {
    distribution: { distribution: null },
    publishing: { publishing: null },
    licensing: { licensing: null },
    sync: { sync: null },
    marketing: { marketing: null },
    legal: { legal: null },
  };

  const filtered =
    vendors?.filter((v) => {
      const matchSearch =
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.country.toLowerCase().includes(search.toLowerCase());
      const matchService =
        filterService === "all" ||
        getServiceTypeLabel(v.serviceType).toLowerCase() === filterService;
      return matchSearch && matchService;
    }) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.serviceType) return;
    await addVendor.mutateAsync({
      ...form,
      serviceType: serviceTypeMap[form.serviceType],
    });
    setForm({
      name: "",
      serviceType: "",
      contactEmail: "",
      website: "",
      country: "",
      orgId: "",
    });
    setOpen(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl" data-ocid="vendor_directory.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">
            {t("vendorDirectory")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} {t("vendorDirectory").toLowerCase()}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="vendor_directory.add.primary_button"
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("addVendorBtn")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="bg-popover border-border"
            data-ocid="vendor_directory.add.dialog"
          >
            <DialogHeader>
              <DialogTitle className="font-display">
                {t("addVendorBtn")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div className="space-y-1.5">
                <Label>{t("vendorName")} *</Label>
                <Input
                  data-ocid="vendor_directory.name.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="bg-input border-border"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("serviceType")} *</Label>
                <Select
                  value={form.serviceType}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, serviceType: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="vendor_directory.service_type.select"
                    className="bg-input border-border"
                  >
                    <SelectValue placeholder={t("serviceType")} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {SERVICE_TYPES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {t(st)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("contactEmail")}</Label>
                  <Input
                    type="email"
                    data-ocid="vendor_directory.email.input"
                    value={form.contactEmail}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, contactEmail: e.target.value }))
                    }
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("country")}</Label>
                  <Input
                    data-ocid="vendor_directory.country.input"
                    value={form.country}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, country: e.target.value }))
                    }
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("website")}</Label>
                <Input
                  data-ocid="vendor_directory.website.input"
                  value={form.website}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, website: e.target.value }))
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
                    data-ocid="vendor_directory.org.select"
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
              <div className="flex gap-2 pt-1">
                <Button
                  type="submit"
                  data-ocid="vendor_directory.add.submit_button"
                  disabled={
                    addVendor.isPending || !form.name || !form.serviceType
                  }
                  className="bg-primary text-primary-foreground"
                >
                  {addVendor.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {t("addVendorBtn")}
                </Button>
                <Button
                  type="button"
                  data-ocid="vendor_directory.add.cancel_button"
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="vendor_directory.search.search_input"
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input border-border"
          />
        </div>
        <Tabs value={filterService} onValueChange={setFilterService}>
          <TabsList className="bg-muted h-9 flex-wrap">
            <TabsTrigger
              data-ocid="vendor_directory.filter_all.tab"
              value="all"
              className="text-xs"
            >
              {t("allServices")}
            </TabsTrigger>
            {SERVICE_TYPES.map((st) => (
              <TabsTrigger
                key={st}
                data-ocid={`vendor_directory.filter_${st}.tab`}
                value={st}
                className="text-xs"
              >
                {t(st)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="vendor_directory.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full bg-muted" />
          ))}
        </div>
      ) : !filtered.length ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="vendor_directory.empty_state"
        >
          <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("noVendors")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((vendor, i) => (
            <Card
              key={vendor.id}
              data-ocid={`vendor_directory.item.${i + 1}`}
              className="bg-card border-border hover:border-primary/30 transition-colors"
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {vendor.country}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-primary/30 text-primary text-xs"
                  >
                    {getServiceTypeLabel(vendor.serviceType)}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  {vendor.contactEmail && (
                    <a
                      href={`mailto:${vendor.contactEmail}`}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Mail className="w-3 h-3" />
                      {vendor.contactEmail}
                    </a>
                  )}
                  {vendor.website && (
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
                    >
                      <Globe className="w-3 h-3" />
                      {vendor.website}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
