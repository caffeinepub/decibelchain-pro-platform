import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  formatTimestamp,
  useMyProfile,
  useOrganizations,
  useUpsertProfile,
} from "../hooks/useQueries";
import { useTranslation } from "../i18n";

export function Profile() {
  const { t } = useTranslation();
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading } = useMyProfile();
  const { data: orgs } = useOrganizations();
  const upsertProfile = useUpsertProfile();

  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    country: "",
    website: "",
    languages: "",
    orgIds: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName,
        bio: profile.bio,
        country: profile.country,
        website: profile.website,
        languages: profile.languages.join(", "),
        orgIds: profile.orgIds.join(", "),
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertProfile.mutateAsync({
      displayName: form.displayName,
      bio: form.bio,
      country: form.country,
      website: form.website,
      languages: form.languages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      orgIds: form.orgIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    toast.success(t("profileSaved"));
  };

  const principal = identity?.getPrincipal().toString();

  return (
    <div className="p-6 space-y-6 max-w-2xl" data-ocid="profile.page">
      <div>
        <h2 className="font-display text-2xl font-bold">{t("myProfile")}</h2>
        {principal && (
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {principal}
          </p>
        )}
      </div>

      {isLoading ? (
        <Card
          className="bg-card border-border"
          data-ocid="profile.loading_state"
        >
          <CardContent className="pt-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full bg-muted" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-display font-semibold text-lg">
                    {form.displayName || t("myProfile")}
                  </p>
                  {profile?.updatedAt && (
                    <p className="text-xs text-muted-foreground">
                      {t("timestamp")}: {formatTimestamp(profile.updatedAt)}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="displayName">{t("displayName")}</Label>
                <Input
                  id="displayName"
                  data-ocid="profile.display_name.input"
                  value={form.displayName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, displayName: e.target.value }))
                  }
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bio">{t("bio")}</Label>
                <Textarea
                  id="bio"
                  data-ocid="profile.bio.textarea"
                  value={form.bio}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bio: e.target.value }))
                  }
                  className="bg-input border-border resize-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="country">{t("country")}</Label>
                  <Input
                    id="country"
                    data-ocid="profile.country.input"
                    value={form.country}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, country: e.target.value }))
                    }
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="website">{t("website")}</Label>
                  <Input
                    id="website"
                    data-ocid="profile.website.input"
                    value={form.website}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, website: e.target.value }))
                    }
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="languages">{t("languages")}</Label>
                <Input
                  id="languages"
                  data-ocid="profile.languages.input"
                  value={form.languages}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, languages: e.target.value }))
                  }
                  className="bg-input border-border"
                  placeholder="en, es, fr"
                />
              </div>

              {/* Org memberships */}
              {orgs && orgs.length > 0 && (
                <div className="space-y-2">
                  <Label>{t("orgMemberships")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {orgs.map((org) => {
                      const isMember = form.orgIds
                        .split(",")
                        .map((s) => s.trim())
                        .includes(org.id);
                      return (
                        <Badge
                          key={org.id}
                          variant={isMember ? "default" : "outline"}
                          className={
                            isMember
                              ? "bg-primary text-primary-foreground cursor-pointer"
                              : "border-border text-muted-foreground cursor-pointer"
                          }
                          onClick={() => {
                            const ids = form.orgIds
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean);
                            const updated = isMember
                              ? ids.filter((id) => id !== org.id)
                              : [...ids, org.id];
                            setForm((p) => ({
                              ...p,
                              orgIds: updated.join(", "),
                            }));
                          }}
                        >
                          {org.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                data-ocid="profile.save.submit_button"
                disabled={upsertProfile.isPending}
                className="bg-primary text-primary-foreground w-full"
              >
                {upsertProfile.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {t("saveProfile")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
