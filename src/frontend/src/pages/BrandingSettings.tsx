import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Music, Palette, RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useBranding } from "../contexts/BrandingContext";

export function BrandingSettings() {
  const { logoUrl, accentColor, welcomeMessage, setBranding, resetBranding } =
    useBranding();

  const [localLogo, setLocalLogo] = useState(logoUrl);
  const [localColor, setLocalColor] = useState(accentColor);
  const [localMsg, setLocalMsg] = useState(welcomeMessage);
  const [logoValid, setLogoValid] = useState(true);

  const handleSave = () => {
    setBranding({
      logoUrl: localLogo,
      accentColor: localColor,
      welcomeMessage: localMsg,
    });
    toast.success("Branding settings saved successfully");
  };

  const handleReset = () => {
    resetBranding();
    setLocalLogo("");
    setLocalColor("#D4AF37");
    setLocalMsg("");
    toast.success("Branding reset to defaults");
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl" data-ocid="branding.page">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          White-Label Branding
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Customize your organization's logo, accent color, and welcome message.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="space-y-5">
          {/* Logo URL */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Organization Logo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="branding-logo">Logo URL</Label>
                <Input
                  id="branding-logo"
                  data-ocid="branding.logo.input"
                  placeholder="https://example.com/logo.png"
                  value={localLogo}
                  onChange={(e) => {
                    setLocalLogo(e.target.value);
                    setLogoValid(true);
                  }}
                  className="mt-1.5"
                />
              </div>
              <div className="flex items-center justify-center h-20 rounded-md border border-dashed border-border bg-muted/30">
                {localLogo ? (
                  <img
                    src={localLogo}
                    alt="Logo preview"
                    className="max-h-14 max-w-full object-contain"
                    onError={() => setLogoValid(false)}
                    onLoad={() => setLogoValid(true)}
                  />
                ) : null}
                {(!localLogo || !logoValid) && (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Music className="w-6 h-6" />
                    <span className="text-xs">
                      {!localLogo ? "No logo set" : "Invalid URL"}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Accent Color */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Accent Color
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-md border border-border flex-shrink-0"
                  style={{ backgroundColor: localColor }}
                />
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="branding-color">Hex value</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="branding-color"
                      data-ocid="branding.color.input"
                      type="color"
                      value={localColor}
                      onChange={(e) => setLocalColor(e.target.value)}
                      className="w-10 h-9 rounded cursor-pointer border border-border bg-transparent p-0.5"
                    />
                    <Input
                      value={localColor}
                      onChange={(e) => setLocalColor(e.target.value)}
                      className="font-mono text-sm uppercase"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Welcome Message */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Welcome Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="branding-msg">Message shown on Dashboard</Label>
              <Textarea
                id="branding-msg"
                data-ocid="branding.welcome.textarea"
                placeholder="Welcome to your DecibelChain workspace!"
                value={localMsg}
                onChange={(e) => setLocalMsg(e.target.value.slice(0, 200))}
                rows={3}
                className="mt-1.5 resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {localMsg.length}/200
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              data-ocid="branding.save.primary_button"
              onClick={handleSave}
              className="flex-1"
              style={{ backgroundColor: localColor, borderColor: localColor }}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Branding
            </Button>
            <Button
              data-ocid="branding.reset.secondary_button"
              variant="outline"
              onClick={handleReset}
              className="border-border"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Live Preview
          </p>
          <Card
            className="bg-sidebar border overflow-hidden"
            style={{ borderColor: `${localColor}40` }}
          >
            {/* Simulated sidebar header */}
            <div
              className="flex items-center gap-3 px-4 py-4 border-b"
              style={{ borderColor: `${localColor}30` }}
            >
              {localLogo && logoValid ? (
                <img
                  src={localLogo}
                  alt="Logo"
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: localColor }}
                >
                  <Music className="w-5 h-5 text-black" />
                </div>
              )}
              <div>
                <p className="font-bold text-sm text-sidebar-foreground">
                  Your Organization
                </p>
                <p className="text-xs text-muted-foreground">PRO Platform</p>
              </div>
            </div>

            {/* Simulated nav items */}
            <CardContent className="p-3 space-y-1">
              {/* Active nav item */}
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-md"
                style={{ backgroundColor: `${localColor}20` }}
              >
                <Music className="w-4 h-4" style={{ color: localColor }} />
                <span
                  className="text-sm font-medium"
                  style={{ color: localColor }}
                >
                  Dashboard
                </span>
              </div>
              {/* Inactive item */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground">
                <Music className="w-4 h-4 opacity-50" />
                <span className="text-sm opacity-60">Works Registry</span>
              </div>

              {/* Welcome banner preview */}
              {localMsg && (
                <div
                  className="mt-3 rounded-md p-3 border-l-4"
                  style={{
                    borderLeftColor: localColor,
                    backgroundColor: `${localColor}10`,
                    borderColor: `${localColor}40`,
                  }}
                >
                  <p className="text-xs text-foreground">{localMsg}</p>
                </div>
              )}

              {/* Sample button */}
              <div className="pt-2">
                <button
                  type="button"
                  className="w-full py-2 px-4 rounded-md text-sm font-medium text-black transition-opacity hover:opacity-90"
                  style={{ backgroundColor: localColor }}
                >
                  Sample Action Button
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
