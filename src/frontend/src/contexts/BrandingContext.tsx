import { createContext, useContext, useEffect, useState } from "react";

interface BrandingState {
  logoUrl: string;
  accentColor: string;
  welcomeMessage: string;
}

interface BrandingContextValue extends BrandingState {
  setBranding: (updates: Partial<BrandingState>) => void;
  resetBranding: () => void;
}

const DEFAULTS: BrandingState = {
  logoUrl: "",
  accentColor: "#D4AF37",
  welcomeMessage: "",
};

const STORAGE_KEY = "dc_branding";

function loadFromStorage(): BrandingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULTS };
}

function applyAccentColor(color: string) {
  document.documentElement.style.setProperty("--brand-accent", color);
}

export const BrandingContext = createContext<BrandingContextValue>({
  ...DEFAULTS,
  setBranding: () => {},
  resetBranding: () => {},
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBrandingState] = useState<BrandingState>(loadFromStorage);

  useEffect(() => {
    applyAccentColor(branding.accentColor);
  }, [branding.accentColor]);

  const setBranding = (updates: Partial<BrandingState>) => {
    setBrandingState((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetBranding = () => {
    localStorage.removeItem(STORAGE_KEY);
    setBrandingState({ ...DEFAULTS });
  };

  return (
    <BrandingContext.Provider
      value={{ ...branding, setBranding, resetBranding }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
