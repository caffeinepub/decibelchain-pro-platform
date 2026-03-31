import { Toaster } from "@/components/ui/sonner";
import React, { useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { Sidebar } from "./components/Sidebar";
import { SignInPromptModal } from "./components/SignInPromptModal";
import { useAuthContext } from "./contexts/AuthContext";
import { BrandingProvider } from "./contexts/BrandingContext";
import { useActor } from "./hooks/useActor";
import { useMyProfile } from "./hooks/useQueries";
import { I18nContext, useI18nState } from "./i18n";
import { ActivityFeed } from "./pages/ActivityFeed";
import { AdminSetup } from "./pages/AdminSetup";
import { ApiKeyManager } from "./pages/ApiKeyManager";
import { AuditTrail } from "./pages/AuditTrail";
import BatchOperations from "./pages/BatchOperations";
import { BrandingSettings } from "./pages/BrandingSettings";
import { CatalogValuation } from "./pages/CatalogValuation";
import { CertificateVerification } from "./pages/CertificateVerification";
import { Certificates } from "./pages/Certificates";
import { ContractGenerator } from "./pages/ContractGenerator";
import { CreativeWorks } from "./pages/CreativeWorks";
import { CrossOrgRoyalties } from "./pages/CrossOrgRoyalties";
import { Dashboard } from "./pages/Dashboard";
import { DisputeCenter } from "./pages/DisputeCenter";
import { DistributionStatements } from "./pages/DistributionStatements";
import { DspLookup } from "./pages/DspLookup";
import { FinancingOffers } from "./pages/FinancingOffers";
import { HelpCenter } from "./pages/HelpCenter";
import { IndustryHub } from "./pages/IndustryHub";
import { IntelligenceDashboard } from "./pages/IntelligenceDashboard";
import { InvestmentPortfolio } from "./pages/InvestmentPortfolio";
import { LicensingManager } from "./pages/LicensingManager";
import { MarketplaceAdmin } from "./pages/MarketplaceAdmin";
import { MarketplaceListings } from "./pages/MarketplaceListings";
import { MemberDirectory } from "./pages/MemberDirectory";
import { Messages } from "./pages/Messages";
import { NotificationsCenter } from "./pages/NotificationsCenter";
import { Organizations } from "./pages/Organizations";
import { OwnershipSplits } from "./pages/OwnershipSplits";
import { PerformanceTracker } from "./pages/PerformanceTracker";
import { PlatformAdmin } from "./pages/PlatformAdmin";
import { Profile } from "./pages/Profile";
import { PublicCatalog } from "./pages/PublicCatalog";
import { PublicOrgDetail } from "./pages/PublicOrgDetail";
import { PublicProfile } from "./pages/PublicProfile";
import { PublicWorkDetail } from "./pages/PublicWorkDetail";
import { Reports } from "./pages/Reports";
import { RevenueDashboard } from "./pages/RevenueDashboard";
import { SearchResults } from "./pages/SearchResults";
import { TenantOnboarding } from "./pages/TenantOnboarding";
import { TerritoryManager } from "./pages/TerritoryManager";
import { VendorDirectory } from "./pages/VendorDirectory";
import { VendorPortal } from "./pages/VendorPortal";
import { WebhookManager } from "./pages/WebhookManager";

export type Page =
  | "dashboard"
  | "organizations"
  | "creativeWorks"
  | "ownershipSplits"
  | "vendorDirectory"
  | "auditTrail"
  | "profile"
  | "revenueDashboard"
  | "distributionStatements"
  | "licensingManager"
  | "financingOffers"
  | "investmentPortfolio"
  | "notificationsCenter"
  | "messages"
  | "activityFeed"
  | "memberDirectory"
  | "reports"
  | "searchResults"
  | "publicProfile"
  | "disputeCenter"
  | "territoryManager"
  | "performanceTracker"
  | "catalogValuation"
  | "publicCatalog"
  | "publicWorkDetail"
  | "publicOrgDetail"
  | "contractGenerator"
  | "intelligenceDashboard"
  | "crossOrgRoyalties"
  | "platformAdmin"
  | "apiKeyManager"
  | "webhookManager"
  | "dspLookup"
  | "marketplaceListings"
  | "marketplaceAdmin"
  | "batchOperations"
  | "certificates"
  | "certificateVerification"
  | "helpCenter"
  | "tenantOnboarding"
  | "brandingSettings"
  | "vendorPortal"
  | "adminSetup"
  | "industryHub";

const PAGE_TITLES: Record<Page, string> = {
  dashboard: "dashboard",
  organizations: "organizations",
  creativeWorks: "creativeWorks",
  ownershipSplits: "ownershipSplits",
  vendorDirectory: "vendorDirectory",
  auditTrail: "auditTrail",
  profile: "profile",
  revenueDashboard: "revenueDashboard",
  distributionStatements: "distributionStatements",
  licensingManager: "licensingManager",
  financingOffers: "financingOffers",
  investmentPortfolio: "investmentPortfolio",
  notificationsCenter: "notificationsCenter",
  messages: "messages",
  activityFeed: "activityFeed",
  memberDirectory: "memberDirectory",
  reports: "reports",
  searchResults: "searchResults",
  publicProfile: "publicProfile",
  disputeCenter: "disputeCenter",
  territoryManager: "territoryManager",
  performanceTracker: "performanceTracker",
  catalogValuation: "catalogValuation",
  publicCatalog: "publicCatalog",
  publicWorkDetail: "publicWorkDetail",
  publicOrgDetail: "publicOrgDetail",
  contractGenerator: "contractGenerator",
  intelligenceDashboard: "intelligenceDashboard",
  crossOrgRoyalties: "crossOrgRoyalties",
  platformAdmin: "platformAdmin",
  apiKeyManager: "apiKeyManager",
  webhookManager: "webhookManager",
  dspLookup: "dspLookup",
  marketplaceListings: "marketplaceListings",
  marketplaceAdmin: "marketplaceAdmin",
  batchOperations: "batchOperations",
  certificates: "certificates",
  certificateVerification: "certificateVerification",
  helpCenter: "helpCenter",
  tenantOnboarding: "tenantOnboarding",
  brandingSettings: "brandingSettings",
  vendorPortal: "vendorPortal",
  adminSetup: "adminSetup",
  industryHub: "industryHub",
};

class PageErrorBoundary extends React.Component<
  { onReset: () => void; children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { onReset: () => void; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Page render error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="bg-card border border-border rounded-lg p-8 max-w-md">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              This page encountered an error. Your session is still active.
            </p>
            <button
              type="button"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onReset();
              }}
            >
              Go back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppInner() {
  const i18n = useI18nState();
  // Strategy B + D: useAuthContext never sets "initializing" — app renders immediately.
  // Sign-in happens via modal overlay — the current page NEVER unmounts during login.
  const { login, clear, isLoggedIn, isLoggingIn } = useAuthContext();
  const { actor, isFetching } = useActor();
  const { data: profile } = useMyProfile();

  // ── Default landing page is the Campaign Hub (industryHub) ──────────────────
  const [currentPage, setCurrentPage] = useState<Page>("industryHub");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [publicProfileId, setPublicProfileId] = useState("");
  const [selectedWorkId, setSelectedWorkId] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  // Strategy D: sign-in modal state — page never unmounts when this opens/closes
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Track previous login state to detect transitions without causing loops
  const prevLoggedIn = useRef(isLoggedIn);

  // When user successfully signs in, redirect to the dashboard and close the modal
  useEffect(() => {
    if (!prevLoggedIn.current && isLoggedIn) {
      setCurrentPage("dashboard");
      setShowSignInModal(false);
    }
    prevLoggedIn.current = isLoggedIn;
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && actor && !isFetching && !registered) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (actor as any)
        .registerUser()
        .then(() => setRegistered(true))
        .catch(() => setRegistered(true));
    }
  }, [isLoggedIn, actor, isFetching, registered]);

  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
      if (touchStartX < 30 && dx > 60 && dy < 80) {
        setMobileSidebarOpen(true);
      }
    };
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verify")) {
      setCurrentPage("certificateVerification");
    }
  }, []);

  const pageTitle = i18n.t(PAGE_TITLES[currentPage]);

  // Strategy D: open the sign-in modal instead of calling login() directly.
  // The current page NEVER unmounts — the modal is a pure overlay.
  const handleRequestLogin = () => setShowSignInModal(true);

  // NOTE: There is no "initializing" state and no full-screen spinner here.
  // Strategy B: the app always renders immediately in guest mode.
  // Auth resolves silently in the background via useAuth's useEffect.

  return (
    <I18nContext.Provider value={i18n}>
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[100] focus-visible:px-4 focus-visible:py-2 focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:rounded-md focus-visible:font-medium focus-visible:text-sm"
      >
        Skip to main content
      </a>

      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onLogout={clear}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          displayName={profile?.displayName || undefined}
          isLoggedIn={isLoggedIn}
          onLogin={handleRequestLogin}
        />
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onLogout={clear}
          collapsed={false}
          onToggleCollapse={() => {}}
          displayName={profile?.displayName || undefined}
          isMobile
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
          isLoggedIn={isLoggedIn}
          onLogin={handleRequestLogin}
        />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header
            title={pageTitle}
            onMobileMenuOpen={() => setMobileSidebarOpen(true)}
            onNavigate={setCurrentPage}
            onSearch={(q) => {
              setSearchQuery(q);
              setCurrentPage("searchResults");
            }}
          />
          <main
            id="main-content"
            aria-label="Main content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto pb-16 lg:pb-0"
          >
            <PageErrorBoundary
              key={currentPage}
              onReset={() => setCurrentPage("dashboard")}
            >
              <div className="page-enter h-full">
                {currentPage === "dashboard" && (
                  <Dashboard
                    onNavigate={setCurrentPage}
                    displayName={profile?.displayName || undefined}
                  />
                )}
                {currentPage === "organizations" && <Organizations />}
                {currentPage === "creativeWorks" && <CreativeWorks />}
                {currentPage === "ownershipSplits" && <OwnershipSplits />}
                {currentPage === "vendorDirectory" && <VendorDirectory />}
                {currentPage === "auditTrail" && <AuditTrail />}
                {currentPage === "profile" && <Profile />}
                {currentPage === "revenueDashboard" && <RevenueDashboard />}
                {currentPage === "licensingManager" && <LicensingManager />}
                {currentPage === "distributionStatements" && (
                  <DistributionStatements />
                )}
                {currentPage === "financingOffers" && <FinancingOffers />}
                {currentPage === "investmentPortfolio" && (
                  <InvestmentPortfolio />
                )}
                {currentPage === "notificationsCenter" && (
                  <NotificationsCenter />
                )}
                {currentPage === "messages" && <Messages />}
                {currentPage === "activityFeed" && <ActivityFeed />}
                {currentPage === "memberDirectory" && (
                  <MemberDirectory
                    onNavigate={setCurrentPage}
                    onViewProfile={(id) => {
                      setPublicProfileId(id);
                      setCurrentPage("publicProfile");
                    }}
                  />
                )}
                {currentPage === "reports" && <Reports />}
                {currentPage === "crossOrgRoyalties" && <CrossOrgRoyalties />}
                {currentPage === "intelligenceDashboard" && (
                  <IntelligenceDashboard />
                )}
                {currentPage === "searchResults" && (
                  <SearchResults
                    query={searchQuery}
                    onNavigate={setCurrentPage}
                  />
                )}
                {currentPage === "disputeCenter" && <DisputeCenter />}
                {currentPage === "territoryManager" && <TerritoryManager />}
                {currentPage === "performanceTracker" && <PerformanceTracker />}
                {currentPage === "catalogValuation" && <CatalogValuation />}
                {currentPage === "publicCatalog" && (
                  <PublicCatalog
                    onNavigate={setCurrentPage}
                    onSelectWork={(id) => {
                      setSelectedWorkId(id);
                      setCurrentPage("publicWorkDetail");
                    }}
                    onSelectOrg={(id) => {
                      setSelectedOrgId(id);
                      setCurrentPage("publicOrgDetail");
                    }}
                  />
                )}
                {currentPage === "publicWorkDetail" && (
                  <PublicWorkDetail
                    workId={selectedWorkId}
                    onBack={() => setCurrentPage("publicCatalog")}
                    onNavigate={setCurrentPage}
                  />
                )}
                {currentPage === "publicOrgDetail" && (
                  <PublicOrgDetail
                    orgId={selectedOrgId}
                    onBack={() => setCurrentPage("publicCatalog")}
                    onSelectWork={(id) => {
                      setSelectedWorkId(id);
                      setCurrentPage("publicWorkDetail");
                    }}
                    onNavigate={setCurrentPage}
                  />
                )}
                {currentPage === "contractGenerator" && <ContractGenerator />}
                {currentPage === "platformAdmin" && <PlatformAdmin />}
                {currentPage === "apiKeyManager" && <ApiKeyManager />}
                {currentPage === "webhookManager" && <WebhookManager />}
                {currentPage === "dspLookup" && <DspLookup />}
                {currentPage === "marketplaceAdmin" && <MarketplaceAdmin />}
                {currentPage === "batchOperations" && <BatchOperations />}
                {currentPage === "marketplaceListings" && (
                  <MarketplaceListings isAuthenticated={isLoggedIn} />
                )}
                {currentPage === "publicProfile" && (
                  <PublicProfile
                    profilePrincipalId={publicProfileId}
                    onBack={() => setCurrentPage("memberDirectory")}
                  />
                )}
                {currentPage === "certificates" && <Certificates />}
                {currentPage === "certificateVerification" && (
                  <CertificateVerification
                    onLogin={handleRequestLogin}
                    isAuthenticated={isLoggedIn}
                  />
                )}
                {currentPage === "helpCenter" && <HelpCenter />}
                {currentPage === "tenantOnboarding" && (
                  <TenantOnboarding
                    onNavigate={(p) => setCurrentPage(p as Page)}
                  />
                )}
                {currentPage === "brandingSettings" && <BrandingSettings />}
                {currentPage === "vendorPortal" && <VendorPortal />}
                {currentPage === "adminSetup" && <AdminSetup />}
                {currentPage === "industryHub" && (
                  <IndustryHub
                    onNavigate={(p) => setCurrentPage(p as Page)}
                    isLoggedIn={isLoggedIn}
                    onLogin={handleRequestLogin}
                    isLoggingIn={isLoggingIn}
                  />
                )}
              </div>
            </PageErrorBoundary>
          </main>

          <MobileBottomNav
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onMoreOpen={() => setMobileSidebarOpen(true)}
            unreadCount={0}
          />

          <footer className="py-2 px-4 text-center text-xs text-muted-foreground/40 border-t border-border/30">
            \u00a9 {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground transition-colors"
            >
              Built with \u2665 using caffeine.ai
            </a>
          </footer>
        </div>
      </div>

      {/* Strategy D: Sign-in modal overlay — page content NEVER unmounts */}
      <SignInPromptModal
        open={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onLogin={login}
        isLoggingIn={isLoggingIn}
      />

      <Toaster />
    </I18nContext.Provider>
  );
}

export default function App() {
  return (
    <BrandingProvider>
      <AppInner />
    </BrandingProvider>
  );
}
