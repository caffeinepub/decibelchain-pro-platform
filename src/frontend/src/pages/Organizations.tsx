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
import { Building2, ChevronRight, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import {
  formatTimestamp,
  getOrgTypeLabel,
  useCreateOrganization,
  useOrganizations,
} from "../hooks/useQueries";
import type { OrgType, Organization } from "../hooks/useQueries";
import { useTranslation } from "../i18n";

export function Organizations() {
  const { t } = useTranslation();
  const { data: orgs, isLoading } = useOrganizations();
  const createOrg = useCreateOrganization();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Organization | null>(null);
  const [form, setForm] = useState({ name: "", description: "", orgType: "" });

  const orgTypeMap: Record<string, OrgType> = {
    recordLabel: { recordLabel: null },
    publisher: { publisher: null },
    cooperative: { cooperative: null },
    indie: { indie: null },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.orgType) return;
    await createOrg.mutateAsync({
      name: form.name,
      description: form.description,
      orgType: orgTypeMap[form.orgType],
    });
    setForm({ name: "", description: "", orgType: "" });
    setOpen(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl" data-ocid="organizations.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">
            {t("organizations")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {orgs?.length ?? 0} {t("organizations").toLowerCase()}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="organizations.create.primary_button"
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("createOrg")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="bg-popover border-border"
            data-ocid="organizations.create.dialog"
          >
            <DialogHeader>
              <DialogTitle className="font-display">
                {t("createOrg")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="orgName">{t("orgName")} *</Label>
                <Input
                  id="orgName"
                  data-ocid="organizations.name.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="bg-input border-border"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="orgDesc">{t("orgDescription")}</Label>
                <Textarea
                  id="orgDesc"
                  data-ocid="organizations.description.textarea"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="bg-input border-border resize-none"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("orgType")} *</Label>
                <Select
                  value={form.orgType}
                  onValueChange={(v) => setForm((p) => ({ ...p, orgType: v }))}
                >
                  <SelectTrigger
                    data-ocid="organizations.type.select"
                    className="bg-input border-border"
                  >
                    <SelectValue placeholder={t("orgType")} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="recordLabel">
                      {t("recordLabel")}
                    </SelectItem>
                    <SelectItem value="publisher">{t("publisher")}</SelectItem>
                    <SelectItem value="cooperative">
                      {t("cooperative")}
                    </SelectItem>
                    <SelectItem value="indie">{t("indie")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  data-ocid="organizations.create.submit_button"
                  disabled={createOrg.isPending || !form.name || !form.orgType}
                  className="bg-primary text-primary-foreground"
                >
                  {createOrg.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {t("createOrg")}
                </Button>
                <Button
                  type="button"
                  data-ocid="organizations.create.cancel_button"
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

      {/* Detail panel */}
      {selected && (
        <Card
          className="bg-card border-primary/30"
          data-ocid="organizations.detail.card"
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="font-display text-base">
              {t("orgDetails")}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(null)}
              data-ocid="organizations.detail.close_button"
            >
              ×
            </Button>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div>
              <span className="text-muted-foreground">{t("orgName")}:</span>{" "}
              <span className="font-medium">{selected.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("orgType")}:</span>{" "}
              <Badge
                variant="outline"
                className="border-primary/30 text-primary"
              >
                {getOrgTypeLabel(selected.orgType)}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">
                {t("orgDescription")}:
              </span>{" "}
              <span>{selected.description || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("owner")}:</span>{" "}
              <span className="font-mono text-xs">
                {selected.owner.toString()}
              </span>
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
        <div className="space-y-3" data-ocid="organizations.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full bg-muted" />
          ))}
        </div>
      ) : !orgs?.length ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="organizations.empty_state"
        >
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("noOrgs")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orgs.map((org, i) => (
            <Card
              key={org.id}
              data-ocid={`organizations.item.${i + 1}`}
              className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setSelected(org)}
            >
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{org.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getOrgTypeLabel(org.orgType)}
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
