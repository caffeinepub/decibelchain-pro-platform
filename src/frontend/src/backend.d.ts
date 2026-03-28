import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface WebhookEndpoint {
    id: string;
    url: string;
    active: boolean;
    name: string;
    createdAt: bigint;
    createdById: string;
    secret: string;
    events: Array<string>;
}
export interface ContractTemplate {
    id: string;
    name: string;
    createdAt: bigint;
    createdBy: string;
    contractType: ContractType;
    bodyTemplate: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface PlatformHealthMetrics {
    totalRevenueSourcesCents: bigint;
    activeLicenses: bigint;
    totalOrgs: bigint;
    openDisputes: bigint;
    totalPayoutsProcessed: bigint;
    totalContractsExecuted: bigint;
    totalMembers: bigint;
    totalWorks: bigint;
}
export interface MemberProfile {
    bio: string;
    country: string;
    displayName: string;
    orgIds: Array<string>;
    createdAt: bigint;
    languages: Array<string>;
    website: string;
    updatedAt: bigint;
    principalId: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface PlatformFeeConfig {
    pendingRoyaltyProcessingFeeBps: bigint;
    licenseFeeBps: bigint;
    pendingLicenseFeeBps: bigint;
    pendingFinancingPlatformFeeBps: bigint;
    lastUpdatedAt: bigint;
    lastUpdatedBy: string;
    royaltyProcessingFeeBps: bigint;
    proposedAt: bigint;
    proposedBy: string;
    financingPlatformFeeBps: bigint;
}
export interface MarketplaceListing {
    id: string;
    territory: string;
    status: string;
    rightsHolderPrincipal: Principal;
    askingPrice: number;
    createdAt: bigint;
    rightsHolderName: string;
    description: string;
    genre: string;
    licenseType: string;
    currency: string;
    workId: string;
    workTitle: string;
}
export interface LicenseRequest {
    id: string;
    listingId: string;
    listingTitle: string;
    requestorPrincipal: Principal;
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
}
export interface MarketplaceApprovalProposal {
    id: string;
    requestId: string;
    requestTitle: string;
    listingId: string;
    proposedBy: string;
    proposedAt: bigint;
    reason: string;
    status: string;
    confirmedBy: string;
    confirmedAt: bigint;
}
export interface ApiKey {
    id: string;
    status: ApiKeyStatus;
    lastUsedAt: bigint;
    expiresAt: bigint;
    scopes: Array<string>;
    name: string;
    createdAt: bigint;
    createdById: string;
    keyHash: string;
    prefix: string;
    revokedById: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface ApiKeyRevokeProposal {
    id: string;
    keyName: string;
    keyId: string;
    proposedAt: bigint;
    proposerId: string;
    reason: string;
}
export interface WebhookDeliveryLog {
    id: string;
    responsePreview: string;
    webhookId: string;
    event: string;
    timestamp: bigint;
    statusCode: bigint;
    success: boolean;
}
export interface ContractParty {
    name: string;
    role: string;
    principalId: string;
}
export interface Contract {
    id: string;
    status: ContractStatus;
    terms: string;
    title: string;
    orgId: string;
    templateId: string;
    approvedBy: string;
    createdAt: bigint;
    createdBy: string;
    contractType: ContractType;
    updatedAt: bigint;
    licenseId: string;
    financingOfferId: string;
    workId: string;
    proposedBy: string;
    parties: Array<ContractParty>;
}
export enum ApiKeyStatus {
    active = "active",
    revoked = "revoked"
}
export enum ContractStatus {
    voided = "voided",
    pendingApproval = "pendingApproval",
    approved = "approved",
    executed = "executed",
    draft = "draft"
}
export enum ContractType {
    custom = "custom",
    financing = "financing",
    license = "license"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface Organization {
    id: string;
    name: string;
    description: string;
    country: string;
    orgType: string;
    principalId: string;
    createdAt: bigint;
    updatedAt: bigint;
    memberIds: Array<string>;
    adminIds: Array<string>;
}
export interface CreativeWork {
    id: string;
    title: string;
    iswc: string;
    isrc: string;
    genre: string;
    workType: string;
    orgId: string;
    registeredBy: string;
    createdAt: bigint;
    updatedAt: bigint;
    status: string;
    description: string;
    territories: Array<string>;
    creatorId: string;
    releaseDate: string;
}
export interface OwnershipSplit {
    id: string;
    workId: string;
    principalId: string;
    memberName: string;
    percentage: number;
    role: string;
    createdAt: bigint;
    holderId: string;
}
export interface TerritoryRecord {
    id: string;
    workId: string;
    territory: string;
    territoryCode: TerritoryCode;
    licenseType: LicenseType;
    status: string;
    startDate: bigint;
    endDate: bigint;
    createdAt: bigint;
    subPublisherId: string;
    notes: string;
}
export interface Performance {
    id: string;
    workId: string;
    workTitle: string;
    venue: string;
    date: bigint;
    territory: string;
    performanceType: PerformanceType;
    broadcastStation: string;
    audience: bigint;
    revenue: number;
    currency: string;
    createdAt: bigint;
    setlist: Array<SetlistEntry>;
    venueName: string;
    venueCity: string;
    venueCountry: string;
    performanceDate: string;
    verified: boolean;
}
export interface RevenueSource {
    id: string;
    orgId: string;
    sourceName: string;
    sourceType: Record<string, null>;
    amountCents: bigint;
    currency: string;
    periodStart: string;
    periodEnd: string;
    createdAt: bigint;
    notes: string;
    description: string;
}
export interface PayoutRecord {
    id: string;
    statementId: string;
    principalId: string;
    memberName: string;
    amountCents: bigint;
    currency: string;
    percentage: number;
    status: Record<string, null>;
    paidAt: bigint;
    createdAt: bigint;
    holderId: string;
}
export interface DistributionStatement {
    id: string;
    orgId: string;
    revenueSourceId: string;
    title: string;
    totalAmountCents: bigint;
    currency: string;
    status: Record<string, null>;
    createdAt: bigint;
    processedAt: bigint;
    createdBy: string;
    payouts: Array<PayoutRecord>;
    workId: string;
    periodStart: string;
    periodEnd: string;
}
export type LicenseStatus =
    | { active: null }
    | { revoked: null }
    | { expired: null }
    | { pendingApproval: null }
    | { rejected: null };
export interface LicenseRecord {
    id: string;
    workId: string;
    workTitle: string;
    orgId: string;
    licenseeId: string;
    licenseeName: string;
    licenseType: LicenseType;
    territory: string;
    startDate: bigint;
    endDate: bigint;
    feeAmountCents: bigint;
    currency: string;
    status: LicenseStatus;
    notes: string;
    createdAt: bigint;
    createdBy: string;
    approvedBy: string;
    feeCents: bigint;
    termStart: string;
    termEnd: string;
    exclusivity: string;
}
export interface FinancingOffer {
    id: string;
    orgId: string;
    title: string;
    description: string;
    targetAmountCents: bigint;
    raisedAmountCents: bigint;
    currency: string;
    interestRate: number;
    termMonths: bigint;
    status: Record<string, null>;
    createdAt: bigint;
    createdBy: string;
    approvedBy: string;
    workId: string;
    deadline: string;
    revenueShareBps: bigint;
}
export interface InvestorCommitment {
    id: string;
    offerId: string;
    investorPrincipal: string;
    investorName: string;
    amountCents: bigint;
    currency: string;
    status: Record<string, null>;
    createdAt: bigint;
    investorId: string;
    commitmentAmountCents: bigint;
}
export interface CommunityPost {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    postType: string;
    orgId: string;
    workId: string;
    createdAt: bigint;
    updatedAt: bigint;
    likes: bigint;
    likeCount: bigint;
    commentCount: bigint;
}
export interface PostComment {
    id: string;
    postId: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: bigint;
}
export interface Notification {
    id: string;
    recipientId: string;
    title: string;
    body: string;
    notificationType: string;
    notifType: string;
    read: boolean;
    createdAt: bigint;
    linkId: string;
}
export interface DirectMessage {
    id: string;
    senderId: string;
    senderName: string;
    recipientId: string;
    recipientName: string;
    content: string;
    read: boolean;
    createdAt: bigint;
    fromId: string;
}
export interface ConversationSummary {
    otherPartyId?: string;
    otherPartyName?: string;
    lastMessage: string;
    lastMessageAt: bigint;
    unreadCount: bigint;
    partnerId: string;
    partnerName: string;
}
export interface AuditEntry {
    id: string;
    actorId: string;
    actorName: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string;
    timestamp: bigint;
}
export interface Vendor {
    id: string;
    name: string;
    vendorType: string;
    country: string;
    contactEmail: string;
    contactName: string;
    website: string;
    notes: string;
    status: string;
    createdAt: bigint;
    createdBy: string;
    serviceType: string;
}
export type DisputeCategory =
    | { royalty: null }
    | { split: null }
    | { license: null }
    | { financing: null }
    | { other: null };
export type DisputeStatus =
    | { filed: null }
    | { inReview: null }
    | { awaitingResponse: null }
    | { resolved: null }
    | { rejected: null }
    | { closed: null };
export type LicenseType =
    | { sync: null }
    | { mechanical: null }
    | { performance: null }
    | { master: null }
    | { blanket: null };
export type PerformanceType =
    | { concert: null }
    | { festival: null }
    | { broadcast: null }
    | { streamingLive: null }
    | { privateEvent: null }
    | { other: null };
export type TerritoryCode =
    | { world: null }
    | { northAmerica: null }
    | { europe: null }
    | { latinAmerica: null }
    | { asiaPacific: null }
    | { africa: null }
    | { middleEast: null }
    | { oceania: null }
    | { custom: string };
export type AdjustmentStatus =
    | { pending: null }
    | { approved: null }
    | { rejected: null };
export type AdjustmentFieldName =
    | { feeCents: null }
    | { amountCents: null }
    | { percentage: null };
export interface SetlistEntry {
    workId: string;
    workTitle?: string;
    duration?: bigint;
    durationSeconds?: bigint;
    position: bigint;
}
export interface AdjustmentRequest {
    id: string;
    entityType: string;
    entityId: string;
    fieldName: AdjustmentFieldName;
    currentValue: string;
    proposedValue: bigint;
    reason: string;
    status: AdjustmentStatus;
    proposedBy: string;
    proposedAt: bigint;
    approvedBy: string;
    approvedAt: string;
    oldValue: bigint;
    requestedBy: string;
    reviewedBy: string;
    reviewNotes: string;
}
export type AdjustmentEntityType =
    | { license: null }
    | { financing: null }
    | { work: null }
    | { split: null }
    | { territory: null };
export interface backendInterface {
    approveContractExecution(id: string): Promise<Contract | null>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelRevokeProposal(proposalId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    confirmFeeChange(): Promise<PlatformFeeConfig>;
    confirmRevokeApiKey(proposalId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createContract(orgId: string, contractType: ContractType, templateId: string, title: string, parties: Array<ContractParty>, workId: string, licenseId: string, financingOfferId: string, terms: string): Promise<Contract>;
    createContractTemplate(name: string, contractType: ContractType, bodyTemplate: string): Promise<ContractTemplate>;
    createListing(workId: string, workTitle: string, rightsHolderName: string, licenseType: string, territory: string, askingPrice: number, currency: string, description: string, genre: string): Promise<{
        __kind__: "ok";
        ok: MarketplaceListing;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteWebhook(id: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    generateApiKey(name: string, scopes: Array<string>, expiresInDays: bigint): Promise<{
        key: string;
        metadata: ApiKey;
    }>;
    getCallerUserRole(): Promise<UserRole>;
    getContractById(id: string): Promise<Contract | null>;
    getContractsByOrg(orgId: string): Promise<Array<Contract>>;
    getMarketplaceListings(): Promise<Array<MarketplaceListing>>;
    getMyListings(): Promise<Array<MarketplaceListing>>;
    getMySubmittedRequests(): Promise<Array<LicenseRequest>>;
    getRequestsForMyListings(): Promise<Array<LicenseRequest>>;
    getPlatformFeeConfig(): Promise<PlatformFeeConfig>;
    getPlatformHealthMetrics(): Promise<PlatformHealthMetrics>;
    getTemplateById(id: string): Promise<ContractTemplate | null>;
    isCallerAdmin(): Promise<boolean>;
    listAllContracts(): Promise<Array<Contract>>;
    listAllProfiles(): Promise<Array<MemberProfile>>;
    listApiKeys(): Promise<Array<ApiKey>>;
    listContractTemplates(): Promise<Array<ContractTemplate>>;
    listRevokeProposals(): Promise<Array<ApiKeyRevokeProposal>>;
    listWebhookLogs(): Promise<Array<WebhookDeliveryLog>>;
    listWebhooks(): Promise<Array<WebhookEndpoint>>;
    lookupByISRC(isrc: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    lookupByISWC(iswc: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    pingWebhook(id: string): Promise<{
        __kind__: "ok";
        ok: WebhookDeliveryLog;
    } | {
        __kind__: "err";
        err: string;
    }>;
    proposeContractExecution(id: string): Promise<Contract | null>;
    proposeFeeChange(royaltyProcessingFeeBps: bigint, licenseFeeBps: bigint, financingPlatformFeeBps: bigint): Promise<PlatformFeeConfig>;
    proposeRevokeApiKey(keyId: string, reason: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    registerWebhook(name: string, url: string, events: Array<string>): Promise<{
        __kind__: "ok";
        ok: WebhookEndpoint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    respondToRequest(requestId: string, status: string, counterOffer: string): Promise<{
        __kind__: "ok";
        ok: LicenseRequest;
    } | {
        __kind__: "err";
        err: string;
    }>;
    submitLicenseRequest(listingId: string, intendedUse: string, territory: string, duration: string, offeredTerms: string, contactInfo: string): Promise<{
        __kind__: "ok";
        ok: LicenseRequest;
    } | {
        __kind__: "err";
        err: string;
    }>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateContractTerms(id: string, terms: string): Promise<Contract | null>;
    updateListingStatus(id: string, status: string): Promise<{
        __kind__: "ok";
        ok: MarketplaceListing;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateWebhookStatus(id: string, active: boolean): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    voidContract(id: string): Promise<Contract | null>;
    proposeApprovalForRequest(requestId: string, reason: string): Promise<{
        __kind__: "ok";
        ok: MarketplaceApprovalProposal;
    } | {
        __kind__: "err";
        err: string;
    }>;
    confirmApprovalForRequest(proposalId: string): Promise<{
        __kind__: "ok";
        ok: LicenseRecord;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminRejectMarketplaceRequest(requestId: string, reason: string): Promise<{
        __kind__: "ok";
        ok: LicenseRequest;
    } | {
        __kind__: "err";
        err: string;
    }>;
    listApprovalProposals(): Promise<Array<MarketplaceApprovalProposal>>;
    listAllLicenseRequests(): Promise<Array<LicenseRequest>>;
}
