import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import AccessControl "authorization/access-control";

import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import HttpOutcalls "http-outcalls/outcall";
import Int "mo:core/Int";
import Nat "mo:core/Nat";


persistent actor {
  // ========== SYSTEM ==========
  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // ========== MARKETPLACE LISTINGS ==========
  public type MarketplaceListing = {
    id : Text;
    workId : Text;
    workTitle : Text;
    rightsHolderPrincipal : Principal;
    rightsHolderName : Text;
    licenseType : Text;
    territory : Text;
    askingPrice : Float;
    currency : Text;
    description : Text;
    genre : Text;
    status : Text;
    createdAt : Int;
  };

  let marketplaceListings = Map.empty<Text, MarketplaceListing>();

  public shared ({ caller }) func createListing(workId : Text, workTitle : Text, rightsHolderName : Text, licenseType : Text, territory : Text, askingPrice : Float, currency : Text, description : Text, genre : Text) : async { #ok : MarketplaceListing; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Only registered users can create listings");
    };

    if (workId == "" or workTitle == "" or licenseType == "" or territory == "" or currency == "") {
      return #err("Missing required fields");
    };

    if (askingPrice <= 0.0) {
      return #err("Invalid asking price");
    };

    let id = workId # "." # Time.now().toText();
    let listing : MarketplaceListing = {
      id;
      workId;
      workTitle;
      rightsHolderPrincipal = caller;
      rightsHolderName;
      licenseType;
      territory;
      askingPrice;
      currency;
      description;
      genre;
      status = "active";
      createdAt = Time.now();
    };

    marketplaceListings.add(id, listing);
    #ok(listing);
  };

  public query func getMarketplaceListings() : async [MarketplaceListing] {
    marketplaceListings.values().toArray().filter(func(listing) { listing.status == "active" });
  };

  public query ({ caller }) func getMyListings() : async [MarketplaceListing] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can view their listings");
    };
    marketplaceListings.values().toArray().filter(func(listing) { listing.rightsHolderPrincipal == caller });
  };

  public shared ({ caller }) func updateListingStatus(id : Text, status : Text) : async { #ok : MarketplaceListing; #err : Text } {
    switch (marketplaceListings.get(id)) {
      case (null) {
        #err("Listing not found");
      };
      case (?listing) {
        if (listing.rightsHolderPrincipal != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          #err("Unauthorized: Only the owner or platform admins can update the listing");
        } else {
          if (status != "active" and status != "pending" and status != "closed") {
            #err("Invalid status: Allowed values are `active`, `pending` and `closed`");
          } else {
            let updated = { listing with status };
            marketplaceListings.add(id, updated);
            #ok(updated);
          };
        };
      };
    };
  };

  // ========== TYPES ==========
  public type OrgType = { #recordLabel; #publisher; #cooperative; #indie };
  public type WorkType = { #song; #album; #composition; #soundRecording };
  public type ServiceType = { #distribution; #publishing; #licensing; #sync; #marketing; #legal };

  public type Organization = {
    id : Text;
    name : Text;
    description : Text;
    orgType : OrgType;
    owner : Principal;
    createdAt : Int;
  };

  public type MemberProfile = {
    principalId : Text;
    displayName : Text;
    bio : Text;
    country : Text;
    website : Text;
    languages : [Text];
    orgIds : [Text];
    createdAt : Int;
    updatedAt : Int;
  };

  public type CreativeWork = {
    id : Text;
    title : Text;
    workType : WorkType;
    thumbnail : ?Storage.ExternalBlob;
    isrc : Text;
    iswc : Text;
    genre : Text;
    description : Text;
    releaseDate : Text;
    orgId : Text;
    creatorId : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  public type OwnershipSplit = {
    workId : Text;
    holderId : Text;
    percentage : Nat;
    role : Text;
    updatedAt : Int;
  };

  public type Vendor = {
    id : Text;
    name : Text;
    serviceType : ServiceType;
    contactEmail : Text;
    website : Text;
    country : Text;
    orgId : Text;
    addedById : Text;
    createdAt : Int;
  };

  public type AuditEntry = {
    id : Nat;
    actorId : Text;
    action : Text;
    entityType : Text;
    entityId : Text;
    details : Text;
    timestamp : Int;
  };

  type StatementStatus = { #draft; #finalized; #paid };
  type LineItem = { holderId : Text; percentage : Nat; amountCents : Nat };
  public type DistributionStatement = {
    id : Text;
    orgId : Text;
    workId : Text;
    periodStart : Text;
    periodEnd : Text;
    totalAmountCents : Nat;
    currency : Text;
    status : StatementStatus;
    lineItems : [LineItem];
    createdBy : Text;
    createdAt : Int;
    finalizedAt : Int;
  };

  public type PayoutStatus = { #pending; #processing; #completed; #failed };
  public type PayoutRecord = {
    id : Text;
    statementId : Text;
    holderId : Text;
    amountCents : Nat;
    currency : Text;
    status : PayoutStatus;
    notes : Text;
    processedAt : Int;
    createdAt : Int;
  };

  public type RevenueSource = {
    id : Text;
    orgId : Text;
    workId : Text;
    sourceType : { #streaming; #sync; #performance; #mechanical; #digital; #other };
    amountCents : Nat;
    currency : Text;
    periodStart : Text;
    periodEnd : Text;
    description : Text;
    createdBy : Text;
    createdAt : Int;
  };

  public type RevenueStats = {
    totalRevenueCents : Nat;
    totalDistributedCents : Nat;
    pendingPayoutsCents : Nat;
    statementCount : Nat;
  };

  // License Registry Types
  public type LicenseType = { #sync; #mechanical; #performance; #master; #blanket };
  public type LicenseStatus = { #pendingApproval; #active; #expired; #revoked; #rejected };
  public type LicenseRecord = {
    id : Text;
    workId : Text;
    orgId : Text;
    licenseType : LicenseType;
    territory : Text;
    termStart : Text;
    termEnd : Text;
    exclusivity : Bool;
    feeCents : Nat;
    currency : Text;
    licenseeId : Text;
    status : LicenseStatus;
    notes : Text;
    createdBy : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  // Adjustment Request Types
  public type AdjustmentEntityType = { #license; #split; #payout };
  public type AdjustmentFieldName = { #feeCents; #percentage; #amountCents };
  public type AdjustmentStatus = { #pending; #approved; #rejected };
  public type AdjustmentRequest = {
    id : Text;
    entityType : AdjustmentEntityType;
    entityId : Text;
    fieldName : AdjustmentFieldName;
    oldValue : Nat;
    proposedValue : Nat;
    reason : Text;
    requestedBy : Text;
    requestedAt : Int;
    status : AdjustmentStatus;
    reviewedBy : Text;
    reviewedAt : Int;
    reviewNotes : Text;
  };

  // ========== FINANCING TYPES (FinFracFran(TM)) ==========
  public type DealStructure = { #standard; #newWaysNow; #cooperative };
  public type OfferStatus = { #draft; #open; #funded; #closed };
  public type CommitmentStatus = { #pending; #confirmed; #cancelled; #refunded };
  public type FinancingAdjEntityType = { #financingOffer; #commitment };
  public type FinancingAdjFieldName = { #offerPercentBps; #targetAmountCents; #revenueShareBps; #commitmentAmountCents };

  public type FinancingOffer = {
    id : Text;
    workId : Text;
    orgId : Text;
    title : Text;
    description : Text;
    offerPercentBps : Nat;
    targetAmountCents : Nat;
    currency : Text;
    deadline : Text;
    minCommitmentCents : Nat;
    maxCommitmentCents : Nat;
    revenueShareBps : Nat;
    dealStructure : DealStructure;
    status : OfferStatus;
    createdBy : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  public type InvestorCommitment = {
    id : Text;
    offerId : Text;
    investorId : Text;
    commitmentAmountCents : Nat;
    currency : Text;
    status : CommitmentStatus;
    notes : Text;
    confirmedAt : Int;
    createdAt : Int;
  };

  public type FinancingAdjustment = {
    id : Text;
    entityType : FinancingAdjEntityType;
    entityId : Text;
    fieldName : FinancingAdjFieldName;
    oldValue : Nat;
    proposedValue : Nat;
    reason : Text;
    requestedBy : Text;
    requestedAt : Int;
    status : AdjustmentStatus;
    reviewedBy : Text;
    reviewedAt : Int;
    reviewNotes : Text;
  };

  public type FinancingStats = {
    totalOffersCount : Nat;
    openOffersCount : Nat;
    totalTargetAmountCents : Nat;
    totalCommittedAmountCents : Nat;
    fundedOffersCount : Nat;
  };

  // ========== 2-D TYPES ==========
  public type Notification = {
    id : Text;
    recipientId : Text;
    notifType : Text;
    title : Text;
    body : Text;
    entityType : Text;
    entityId : Text;
    read : Bool;
    createdAt : Int;
  };

  public type DirectMessage = {
    id : Text;
    fromId : Text;
    toId : Text;
    content : Text;
    createdAt : Int;
    readByRecipient : Bool;
  };

  public type ConversationSummary = {
    partnerId : Text;
    partnerName : Text;
    lastMessage : Text;
    lastMessageAt : Int;
    unreadCount : Nat;
  };

  public type CommunityPost = {
    id : Text;
    authorId : Text;
    authorName : Text;
    orgId : Text;
    content : Text;
    createdAt : Int;
    likeCount : Nat;
    commentCount : Nat;
  };

  public type PostComment = {
    id : Text;
    postId : Text;
    authorId : Text;
    authorName : Text;
    content : Text;
    createdAt : Int;
  };

  public type MemberFollow = {
    followerId : Text;
    followeeId : Text;
    createdAt : Int;
  };

  // ========== PHASE 4 TYPES ==========
  public type DisputeCategory = { #royalty; #split; #license; #financing; #other };
  public type DisputeStatus = { #filed; #inReview; #awaitingResponse; #resolved; #rejected; #closed };
  public type Dispute = {
    id : Text;
    filedBy : Text;
    orgId : Text;
    category : DisputeCategory;
    subject : Text;
    description : Text;
    targetEntityType : Text;
    targetEntityId : Text;
    status : DisputeStatus;
    assignedAdmin : Text;
    adminNotes : Text;
    resolution : Text;
    proposedResolutionBy : Text;
    createdAt : Int;
    updatedAt : Int;
    resolvedAt : Int;
  };

  // Territory Management
  public type TerritoryCode = { #world; #northAmerica; #europe; #latinAmerica; #asiaPacific; #africa; #middleEast; #oceania; #custom : Text };
  public type TerritoryRecord = {
    id : Text;
    workId : Text;
    orgId : Text;
    territoryCode : TerritoryCode;
    subPublisherId : Text;
    notes : Text;
    registeredBy : Text;
    registeredAt : Int;
  };

  // Performance Tracking
  public type PerformanceType = { #concert; #festival; #broadcast; #streamingLive; #privateEvent; #other };
  public type SetlistEntry = { workId : Text; position : Nat; durationSeconds : Nat };
  public type Performance = {
    id : Text;
    orgId : Text;
    venueName : Text;
    venueCity : Text;
    venueCountry : Text;
    performanceDate : Text;
    performanceType : PerformanceType;
    promoter : Text;
    setlist : [SetlistEntry];
    revenueSourceId : Text;
    verified : Bool;
    verifiedBy : Text;
    createdBy : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  // Catalog Valuation
  public type CatalogValuation = {
    id : Text;
    orgId : Text;
    snapshotDate : Text;
    workCount : Nat;
    activeLicenseCount : Nat;
    totalDistributedCents : Nat;
    multiplierBps : Nat;
    estimatedValueCents : Nat;
    notes : Text;
    createdBy : Text;
    createdAt : Int;
  };

  public type ValuationConfig = {
    defaultMultiplierBps : Nat;
    pendingMultiplierBps : Nat;
    proposedBy : Text;
    proposedAt : Int;
    lastUpdatedBy : Text;
    lastUpdatedAt : Int;
  };

  // ========== PHASE 6-C TYPES ==========
  public type PlatformFeeConfig = {
    royaltyProcessingFeeBps : Nat;
    licenseFeeBps : Nat;
    financingPlatformFeeBps : Nat;
    pendingRoyaltyProcessingFeeBps : Nat;
    pendingLicenseFeeBps : Nat;
    pendingFinancingPlatformFeeBps : Nat;
    proposedBy : Text;
    proposedAt : Int;
    lastUpdatedBy : Text;
    lastUpdatedAt : Int;
  };

  public type PlatformHealthMetrics = {
    totalOrgs : Nat;
    totalMembers : Nat;
    totalWorks : Nat;
    activeLicenses : Nat;
    openDisputes : Nat;
    totalPayoutsProcessed : Nat;
    totalRevenueSourcesCents : Nat;
    totalContractsExecuted : Nat;
  };

  // ========== PHASE 5-B: CONTRACT MANAGEMENT ==========
  public type ContractType = { #license; #financing; #custom };
  public type ContractStatus = { #draft; #pendingApproval; #approved; #executed; #voided };
  public type ContractParty = { principalId : Text; role : Text; name : Text };
  public type ContractTemplate = {
    id : Text;
    name : Text;
    contractType : ContractType;
    bodyTemplate : Text;
    createdBy : Text;
    createdAt : Int;
  };
  public type Contract = {
    id : Text;
    orgId : Text;
    contractType : ContractType;
    templateId : Text;
    title : Text;
    parties : [ContractParty];
    workId : Text;
    licenseId : Text;
    financingOfferId : Text;
    terms : Text;
    status : ContractStatus;
    createdBy : Text;
    proposedBy : Text;
    approvedBy : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  // ========== PHASE 7-A-1: API KEY TYPES ==========
  public type ApiKeyStatus = { #active; #revoked };
  public type ApiKey = {
    id : Text;
    name : Text;
    prefix : Text;
    keyHash : Text;
    scopes : [Text];
    status : ApiKeyStatus;
    createdAt : Int;
    expiresAt : Int;
    lastUsedAt : Int;
    createdById : Text;
    revokedById : Text;
  };

  public type ApiKeyRevokeProposal = {
    id : Text;
    keyId : Text;
    keyName : Text;
    reason : Text;
    proposerId : Text;
    proposedAt : Int;
  };

  // ========== STORAGE ==========
  var nextId : Nat = 0;
  let orgs = Map.empty<Text, Organization>();
  let profiles = Map.empty<Text, MemberProfile>();
  let works = Map.empty<Text, CreativeWork>();
  let splits = Map.empty<Text, OwnershipSplit>();
  let vendors = Map.empty<Text, Vendor>();
  var auditLog : [AuditEntry] = [];

  let revenueSources = Map.empty<Text, RevenueSource>();
  let statements = Map.empty<Text, DistributionStatement>();
  let payouts = Map.empty<Text, PayoutRecord>();

  let licenses = Map.empty<Text, LicenseRecord>();
  let adjustments = Map.empty<Text, AdjustmentRequest>();
  let financingOffers = Map.empty<Text, FinancingOffer>();
  let investorCommitments = Map.empty<Text, InvestorCommitment>();
  let financingAdjustments = Map.empty<Text, FinancingAdjustment>();

  let notifications = Map.empty<Text, Notification>();
  let directMessages = Map.empty<Text, DirectMessage>();
  let communityPosts = Map.empty<Text, CommunityPost>();
  let postComments = Map.empty<Text, PostComment>();
  let postLikes = Map.empty<Text, Bool>();
  let memberFollows = Map.empty<Text, MemberFollow>();

  // Phase 4 storage
  let disputes = Map.empty<Text, Dispute>();
  let territories = Map.empty<Text, TerritoryRecord>();
  let performances = Map.empty<Text, Performance>();
  let catalogValuations = Map.empty<Text, CatalogValuation>();

  var valuationConfig : ValuationConfig = {
    defaultMultiplierBps = 300;
    pendingMultiplierBps = 0;
    proposedBy = "";
    proposedAt = 0;
    lastUpdatedBy = "";
    lastUpdatedAt = 0;
  };

  // Phase 5-B Storage
  let contractTemplates = Map.empty<Text, ContractTemplate>();
  let contracts = Map.empty<Text, Contract>();

  // Phase 6-C Storage
  var platformFeeConfig : PlatformFeeConfig = {
    royaltyProcessingFeeBps = 200;
    licenseFeeBps = 200;
    financingPlatformFeeBps = 200;
    pendingRoyaltyProcessingFeeBps = 0;
    pendingLicenseFeeBps = 0;
    pendingFinancingPlatformFeeBps = 0;
    proposedBy = "";
    proposedAt = 0;
    lastUpdatedBy = "";
    lastUpdatedAt = 0;
  };

  // Phase 7-A-1 Storage
  let apiKeys = Map.empty<Text, ApiKey>();
  let apiKeyProposals = Map.empty<Text, ApiKeyRevokeProposal>();

  // ========== HELPERS ==========
  func newId() : Text {
    nextId += 1;
    nextId.toText();
  };

  func newNatId() : Nat {
    nextId += 1;
    nextId;
  };

  func addAudit(actorId : Text, action : Text, entityType : Text, entityId : Text, details : Text) {
    let entry : AuditEntry = {
      id = newNatId();
      actorId;
      action;
      entityType;
      entityId;
      details;
      timestamp = Time.now();
    };
    auditLog := auditLog.concat([entry]);
  };

  func isOrgOwnerOrAdmin(caller : Principal, orgId : Text) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    switch (orgs.get(orgId)) {
      case (null) { false };
      case (?org) { org.owner == caller };
    };
  };

  func canAccessWork(caller : Principal, workId : Text) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    switch (works.get(workId)) {
      case (null) { false };
      case (?work) {
        if (work.creatorId == caller.toText()) {
          return true;
        };
        switch (orgs.get(work.orgId)) {
          case (null) { false };
          case (?org) { org.owner == caller };
        };
      };
    };
  };

  func getEntityOrgId(entityType : AdjustmentEntityType, entityId : Text) : ?Text {
    switch (entityType) {
      case (#license) {
        switch (licenses.get(entityId)) {
          case (null) { null };
          case (?lic) { ?lic.orgId };
        };
      };
      case (#split) {
        switch (splits.get(entityId)) {
          case (null) { null };
          case (?split) {
            switch (works.get(split.workId)) {
              case (null) { null };
              case (?work) { ?work.orgId };
            };
          };
        };
      };
      case (#payout) {
        switch (payouts.get(entityId)) {
          case (null) { null };
          case (?payout) {
            switch (statements.get(payout.statementId)) {
              case (null) { null };
              case (?stmt) { ?stmt.orgId };
            };
          };
        };
      };
    };
  };

  func canAccessContract(caller : Principal, contract : Contract) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    if (isOrgOwnerOrAdmin(caller, contract.orgId)) {
      return true;
    };
    let callerText = caller.toText();
    for (party in contract.parties.vals()) {
      if (party.principalId == callerText) {
        return true;
      };
    };
    false;
  };

  // ========== PHASE 6-C: PLATFORM ADMIN ==========
  public query ({ caller }) func getPlatformFeeConfig() : async PlatformFeeConfig {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can get fee config");
    };
    platformFeeConfig;
  };

  public shared ({ caller }) func proposeFeeChange(royaltyProcessingFeeBps : Nat, licenseFeeBps : Nat, financingPlatformFeeBps : Nat) : async PlatformFeeConfig {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can propose fee changes");
    };
    let now = Time.now();

    let updatedConfig : PlatformFeeConfig = {
      platformFeeConfig with
      pendingRoyaltyProcessingFeeBps = royaltyProcessingFeeBps;
      pendingLicenseFeeBps = licenseFeeBps;
      pendingFinancingPlatformFeeBps = financingPlatformFeeBps;
      proposedBy = caller.toText();
      proposedAt = now;
    };
    platformFeeConfig := updatedConfig;
    let actionDesc = "Proposed royalty " # royaltyProcessingFeeBps.toText() # "bps, license " # licenseFeeBps.toText() # " bps, financing " # financingPlatformFeeBps.toText();
    addAudit(caller.toText(), "proposeFeeChange", "platformFeeConfig", "", actionDesc);
    updatedConfig;
  };

  public shared ({ caller }) func confirmFeeChange() : async PlatformFeeConfig {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can confirm fee changes");
    };

    if (platformFeeConfig.proposedBy == caller.toText()) {
      Runtime.trap("Self-approval not allowed");
    };

    let updatedConfig : PlatformFeeConfig = {
      platformFeeConfig with
      royaltyProcessingFeeBps = platformFeeConfig.pendingRoyaltyProcessingFeeBps;
      licenseFeeBps = platformFeeConfig.pendingLicenseFeeBps;
      financingPlatformFeeBps = platformFeeConfig.pendingFinancingPlatformFeeBps;
      pendingRoyaltyProcessingFeeBps = 0;
      pendingLicenseFeeBps = 0;
      pendingFinancingPlatformFeeBps = 0;
      lastUpdatedBy = caller.toText();
      lastUpdatedAt = Time.now();
      proposedBy = "";
      proposedAt = 0;
    };

    platformFeeConfig := updatedConfig;
    let actionDesc = "Confirmed royalty " # updatedConfig.royaltyProcessingFeeBps.toText() # "bps, license " # updatedConfig.licenseFeeBps.toText() # " bps, financing " # updatedConfig.financingPlatformFeeBps.toText();
    addAudit(caller.toText(), "confirmFeeChange", "platformFeeConfig", "", actionDesc);
    updatedConfig;
  };

  public query ({ caller }) func listAllProfiles() : async [MemberProfile] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list all profiles");
    };
    profiles.values().toArray();
  };

  public query ({ caller }) func getPlatformHealthMetrics() : async PlatformHealthMetrics {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can get health metrics");
    };

    let totalOrgs = orgs.size();
    let totalMembers = profiles.size();
    let totalWorks = works.size();
    let activeLicenses = licenses.values().toArray().filter(func(l) { l.status == #active }).size();
    let openDisputes = disputes.values().toArray().filter(func(d) { switch (d.status) { case (#filed or #inReview or #awaitingResponse) { true }; case (_) { false } } }).size();
    let totalPayoutsProcessed = payouts.values().toArray().filter(func(p) { switch (p.status) { case (#completed) { true }; case (_) { false } } }).size();
    let totalRevenueSourcesCents = revenueSources.values().toArray().foldLeft(0, func(acc, r) { acc + r.amountCents });
    let totalContractsExecuted = contracts.values().toArray().filter(func(c) { switch (c.status) { case (#executed) { true }; case (_) { false } } }).size();

    let metrics : PlatformHealthMetrics = {
      totalOrgs;
      totalMembers;
      totalWorks;
      activeLicenses;
      openDisputes;
      totalPayoutsProcessed;
      totalRevenueSourcesCents;
      totalContractsExecuted;
    };
    metrics;
  };

  // ========== PHASE 5-B: CONTRACT MANAGEMENT ==========
  public shared ({ caller }) func createContractTemplate(name : Text, contractType : ContractType, bodyTemplate : Text) : async ContractTemplate {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create contract templates");
    };
    let id = newId();
    let tmpl : ContractTemplate = {
      id;
      name;
      contractType;
      bodyTemplate;
      createdBy = caller.toText();
      createdAt = Time.now();
    };
    contractTemplates.add(id, tmpl);
    addAudit(caller.toText(), "createContractTemplate", "contractTemplate", id, name);
    tmpl;
  };

  public query ({ caller }) func listContractTemplates() : async [ContractTemplate] {
    contractTemplates.values().toArray();
  };

  public query ({ caller }) func getTemplateById(id : Text) : async ?ContractTemplate {
    contractTemplates.get(id);
  };

  public shared ({ caller }) func createContract(
    orgId : Text, contractType : ContractType, templateId : Text, title : Text, parties : [ContractParty], workId : Text, licenseId : Text, financingOfferId : Text, terms : Text
  ) : async Contract {
    if (not isOrgOwnerOrAdmin(caller, orgId)) {
      Runtime.trap("Unauthorized: Only org owners or admins can create contracts");
    };
    let id = newId();
    let c : Contract = {
      id;
      orgId;
      contractType;
      templateId;
      title;
      parties;
      workId;
      licenseId;
      financingOfferId;
      terms;
      status = #draft;
      createdBy = caller.toText();
      proposedBy = "";
      approvedBy = "";
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    contracts.add(id, c);
    addAudit(caller.toText(), "createContract", "contract", id, title);
    c;
  };

  public query ({ caller }) func getContractsByOrg(orgId : Text) : async [Contract] {
    if (not isOrgOwnerOrAdmin(caller, orgId)) {
      Runtime.trap("Unauthorized: Only org owners or admins can view org contracts");
    };
    contracts.values().toArray().filter(func(c : Contract) : Bool { c.orgId == orgId });
  };

  public query ({ caller }) func getContractById(id : Text) : async ?Contract {
    switch (contracts.get(id)) {
      case (null) { null };
      case (?contract) {
        if (not canAccessContract(caller, contract)) {
          Runtime.trap("Unauthorized: Cannot access this contract");
        };
        ?contract;
      };
    };
  };

  public query ({ caller }) func listAllContracts() : async [Contract] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list all contracts");
    };
    contracts.values().toArray();
  };

  public shared ({ caller }) func updateContractTerms(id : Text, terms : Text) : async ?Contract {
    switch (contracts.get(id)) {
      case (null) { null };
      case (?contract) {
        if (contract.status != #draft) {
          Runtime.trap("Can only edit draft contracts");
        };
        if (not isOrgOwnerOrAdmin(caller, contract.orgId)) {
          Runtime.trap("Unauthorized: Only org owners or admins can update contract terms");
        };
        let updated = { contract with terms; updatedAt = Time.now() };
        contracts.add(id, updated);
        addAudit(caller.toText(), "updateContractTerms", "contract", id, "");
        ?updated;
      };
    };
  };

  public shared ({ caller }) func proposeContractExecution(id : Text) : async ?Contract {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can propose contract execution");
    };
    switch (contracts.get(id)) {
      case (null) { null };
      case (?contract) {
        if (contract.status != #draft) {
          Runtime.trap("Can only propose execution for draft contracts");
        };
        let updated = { contract with proposedBy = caller.toText(); status = #pendingApproval; updatedAt = Time.now() };
        contracts.add(id, updated);
        addAudit(caller.toText(), "proposeContractExecution", "contract", id, "");
        ?updated;
      };
    };
  };

  public shared ({ caller }) func approveContractExecution(id : Text) : async ?Contract {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can approve contract execution");
    };
    switch (contracts.get(id)) {
      case (null) { null };
      case (?contract) {
        if (contract.status != #pendingApproval) {
          Runtime.trap("Contract must be in pending approval status");
        };
        if (contract.proposedBy == caller.toText()) {
          Runtime.trap("Self-approval not allowed");
        };
        let updated = { contract with approvedBy = caller.toText(); status = #executed; updatedAt = Time.now() };
        contracts.add(id, updated);
        addAudit(caller.toText(), "approveContractExecution", "contract", id, "");
        ?updated;
      };
    };
  };

  public shared ({ caller }) func voidContract(id : Text) : async ?Contract {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can void contracts");
    };
    switch (contracts.get(id)) {
      case (null) { null };
      case (?contract) {
        let updated = { contract with status = #voided; updatedAt = Time.now() };
        contracts.add(id, updated);
        addAudit(caller.toText(), "voidContract", "contract", id, "");
        ?updated;
      };
    };
  };

  // ========== PHASE 7-A-1: API KEY MANAGEMENT ==========
  public shared ({ caller }) func generateApiKey(name : Text, scopes : [Text], expiresInDays : Nat) : async { key : Text; metadata : ApiKey } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can generate API keys");
    };
    let id = newId();
    let now = Time.now();
    let rawKey = "dck_" # now.toText() # id;
    let prefix = Text.fromIter(rawKey.chars().take(12));
    let keyHash = "sha256:" # nextId.toText() # "_" # id;
    let expiresAt : Int = if (expiresInDays == 0) { 0 } else { now + (expiresInDays * 86_400_000_000_000) };
    let key : ApiKey = {
      id;
      name;
      prefix;
      keyHash;
      scopes;
      status = #active;
      createdAt = now;
      expiresAt;
      lastUsedAt = 0;
      createdById = caller.toText();
      revokedById = "";
    };
    apiKeys.add(id, key);
    addAudit(caller.toText(), "generateApiKey", "apiKey", id, name);
    { key = rawKey; metadata = key };
  };

  public query ({ caller }) func listApiKeys() : async [ApiKey] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list API keys");
    };
    apiKeys.values().toArray();
  };

  public shared ({ caller }) func proposeRevokeApiKey(keyId : Text, reason : Text) : async { #ok : Text; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can propose key revocation");
    };
    switch (apiKeys.get(keyId)) {
      case (null) { return #err("Key not found") };
      case (?k) {
        if (k.status == #revoked) { return #err("Key is already revoked") };
        let existing = apiKeyProposals.values().toArray().filter(func(p : ApiKeyRevokeProposal) : Bool { p.keyId == keyId });
        if (existing.size() > 0) { return #err("A revoke proposal already exists for this key") };
        let proposalId = newId();
        let proposal : ApiKeyRevokeProposal = {
          id = proposalId;
          keyId;
          keyName = k.name;
          reason;
          proposerId = caller.toText();
          proposedAt = Time.now();
        };
        apiKeyProposals.add(proposalId, proposal);
        addAudit(caller.toText(), "proposeRevokeApiKey", "apiKey", keyId, reason);
        #ok(proposalId);
      };
    };
  };

  public shared ({ caller }) func confirmRevokeApiKey(proposalId : Text) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can confirm key revocation");
    };
    switch (apiKeyProposals.get(proposalId)) {
      case (null) { return #err("Proposal not found") };
      case (?proposal) {
        if (proposal.proposerId == caller.toText()) {
          return #err("Self-approval not allowed");
        };
        switch (apiKeys.get(proposal.keyId)) {
          case (null) { return #err("Key not found") };
          case (?k) {
            let updated = { k with status = #revoked; revokedById = caller.toText() };
            apiKeys.add(proposal.keyId, updated);
            apiKeyProposals.remove(proposalId);
            addAudit(caller.toText(), "confirmRevokeApiKey", "apiKey", proposal.keyId, proposal.reason);
            #ok;
          };
        };
      };
    };
  };

  public shared ({ caller }) func cancelRevokeProposal(proposalId : Text) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can cancel revoke proposals");
    };
    switch (apiKeyProposals.get(proposalId)) {
      case (null) { return #err("Proposal not found") };
      case (?proposal) {
        if (proposal.proposerId != caller.toText()) {
          return #err("Only the original proposer can cancel this proposal");
        };
        apiKeyProposals.remove(proposalId);
        addAudit(caller.toText(), "cancelRevokeProposal", "apiKey", proposal.keyId, "Cancelled by proposer");
        #ok;
      };
    };
  };

  public query ({ caller }) func listRevokeProposals() : async [ApiKeyRevokeProposal] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list revoke proposals");
    };
    apiKeyProposals.values().toArray();
  };

  // ========== PHASE 7-A-2: WEBHOOK TYPES ==========
  public type WebhookEndpoint = {
    id : Text;
    name : Text;
    url : Text;
    events : [Text];
    secret : Text;
    active : Bool;
    createdAt : Int;
    createdById : Text;
  };

  public type WebhookDeliveryLog = {
    id : Text;
    webhookId : Text;
    event : Text;
    statusCode : Nat;
    success : Bool;
    responsePreview : Text;
    timestamp : Int;
  };

  // Phase 7-A-2 Storage
  let webhooks = Map.empty<Text, WebhookEndpoint>();
  let webhookLogs = Map.empty<Text, WebhookDeliveryLog>();

  // ========== PHASE 7-A-2: WEBHOOK FUNCTIONS ==========
  public shared ({ caller }) func registerWebhook(name : Text, url : Text, events : [Text]) : async { #ok : WebhookEndpoint; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can register webhooks");
    };
    let id = newId();
    let wh : WebhookEndpoint = {
      id;
      name;
      url;
      events;
      secret = "whsec_" # id # "_" # (Time.now() / 1_000_000_000).toText();
      active = true;
      createdAt = Time.now();
      createdById = caller.toText();
    };
    webhooks.add(id, wh);
    addAudit(caller.toText(), "registerWebhook", "webhook", id, name);
    #ok(wh);
  };

  public query ({ caller }) func listWebhooks() : async [WebhookEndpoint] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list webhooks");
    };
    webhooks.values().toArray();
  };

  public shared ({ caller }) func updateWebhookStatus(id : Text, active : Bool) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can update webhooks");
    };
    switch (webhooks.get(id)) {
      case (null) { #err("Webhook not found") };
      case (?wh) {
        webhooks.add(id, { wh with active });
        addAudit(caller.toText(), "updateWebhook", "webhook", id, if (active) { "enabled" } else { "disabled" });
        #ok;
      };
    };
  };

  public shared ({ caller }) func deleteWebhook(id : Text) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can delete webhooks");
    };
    switch (webhooks.get(id)) {
      case (null) { #err("Webhook not found") };
      case (?wh) {
        webhooks.remove(id);
        addAudit(caller.toText(), "deleteWebhook", "webhook", id, wh.name);
        #ok;
      };
    };
  };

  public query ({ caller }) func listWebhookLogs() : async [WebhookDeliveryLog] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view webhook logs");
    };
    webhookLogs.values().toArray();
  };

  public shared ({ caller }) func pingWebhook(id : Text) : async { #ok : WebhookDeliveryLog; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can ping webhooks");
    };
    switch (webhooks.get(id)) {
      case (null) { #err("Webhook not found") };
      case (?wh) {
        let payload = "{\"event\":\"ping\",\"webhook_id\":\"" # wh.id # "\",\"timestamp\":" # (Time.now() / 1_000_000_000).toText() # "}";
        let logId = newId();
        var statusCode : Nat = 0;
        var success = false;
        var responsePreview = "";
        try {
          let resp = await HttpOutcalls.httpPostRequest(wh.url, [{ name = "Content-Type"; value = "application/json" }], payload, transform);
          statusCode := 200;
          success := true;
          responsePreview := resp;
        } catch (_) {
          statusCode := 500;
          success := false;
          responsePreview := "Connection failed";
        };
        let log : WebhookDeliveryLog = {
          id = logId;
          webhookId = id;
          event = "ping";
          statusCode;
          success;
          responsePreview;
          timestamp = Time.now();
        };
        webhookLogs.add(logId, log);
        #ok(log);
      };
    };
  };

  // ========== PHASE 7-A-2: DSP LOOKUP ==========
  public shared func lookupByISRC(isrc : Text) : async { #ok : Text; #err : Text } {
    let url = "https://musicbrainz.org/ws/2/recording?query=isrc:" # isrc # "&fmt=json&limit=1";
    try {
      let resp = await HttpOutcalls.httpGetRequest(url, [{ name = "Accept"; value = "application/json" }], transform);
      #ok(resp);
    } catch (_) {
      #err("Lookup failed: network error");
    };
  };

  public shared func lookupByISWC(iswc : Text) : async { #ok : Text; #err : Text } {
    let url = "https://musicbrainz.org/ws/2/work?query=iswc:" # iswc # "&fmt=json&limit=1";
    try {
      let resp = await HttpOutcalls.httpGetRequest(url, [{ name = "Accept"; value = "application/json" }], transform);
      #ok(resp);
    } catch (_) {
      #err("Lookup failed: network error");
    };
  };

  public query func transform(input : HttpOutcalls.TransformationInput) : async HttpOutcalls.TransformationOutput {
    HttpOutcalls.transform(input);
  };


  // ========== PHASE 7-B-2: LICENSE REQUESTS ==========
  public type LicenseRequest = {
    id : Text;
    listingId : Text;
    listingTitle : Text;
    requestorPrincipal : Principal;
    requestorName : Text;
    intendedUse : Text;
    territory : Text;
    duration : Text;
    offeredTerms : Text;
    contactInfo : Text;
    status : Text;
    counterOffer : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  let licenseRequests = Map.empty<Text, LicenseRequest>();

  public shared ({ caller }) func submitLicenseRequest(listingId : Text, intendedUse : Text, territory : Text, duration : Text, offeredTerms : Text, contactInfo : Text) : async { #ok : LicenseRequest; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in to submit requests");
    };
    switch (marketplaceListings.get(listingId)) {
      case (null) { #err("Listing not found") };
      case (?listing) {
        if (listing.status != "active") {
          return #err("Listing is not active");
        };
        let id = newId();
        let req : LicenseRequest = {
          id;
          listingId;
          listingTitle = listing.workTitle;
          requestorPrincipal = caller;
          requestorName = caller.toText();
          intendedUse;
          territory;
          duration;
          offeredTerms;
          contactInfo;
          status = "pending";
          counterOffer = "";
          createdAt = Time.now();
          updatedAt = Time.now();
        };
        licenseRequests.add(id, req);
        addAudit(caller.toText(), "submitLicenseRequest", "licenseRequest", id, listing.workTitle);
        #ok(req);
      };
    };
  };

  public query ({ caller }) func getMySubmittedRequests() : async [LicenseRequest] {
    licenseRequests.values().toArray().filter(func(r) { r.requestorPrincipal == caller });
  };

  public query ({ caller }) func getRequestsForMyListings() : async [LicenseRequest] {
    licenseRequests.values().toArray().filter(func(r) {
      switch (marketplaceListings.get(r.listingId)) {
        case (?listing) { listing.rightsHolderPrincipal == caller };
        case (null) { false };
      }
    });
  };

  public shared ({ caller }) func respondToRequest(id : Text, status : Text, counterOffer : Text) : async { #ok : LicenseRequest; #err : Text } {
    switch (licenseRequests.get(id)) {
      case (null) { #err("Request not found") };
      case (?req) {
        switch (marketplaceListings.get(req.listingId)) {
          case (null) { #err("Listing not found") };
          case (?listing) {
            if (listing.rightsHolderPrincipal != caller) {
              return #err("Unauthorized: Only the rights holder can respond to requests");
            };
            let updated : LicenseRequest = { req with
              status;
              counterOffer;
              updatedAt = Time.now();
            };
            licenseRequests.add(id, updated);
            addAudit(caller.toText(), "respondToRequest", "licenseRequest", id, status);
            #ok(updated);
          };
        };
      };
    };
  };

  // ========== PHASE 7-B-3: ADMIN APPROVAL & LICENSE REGISTRY INTEGRATION ==========
  public type MarketplaceApprovalProposal = {
    id : Text;
    requestId : Text;
    requestTitle : Text;
    listingId : Text;
    proposedBy : Text;
    proposedAt : Int;
    reason : Text;
    status : Text; // "pending" | "confirmed" | "rejected"
    confirmedBy : Text;
    confirmedAt : Int;
  };

  let approvalProposals = Map.empty<Text, MarketplaceApprovalProposal>();

  public shared ({ caller }) func proposeApprovalForRequest(requestId : Text, reason : Text) : async { #ok : MarketplaceApprovalProposal; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Admin only");
    };
    switch (licenseRequests.get(requestId)) {
      case (null) { #err("Request not found") };
      case (?req) {
        if (req.status != "accepted") {
          return #err("Request must be in 'accepted' status to propose approval");
        };
        let id = newId();
        let proposal : MarketplaceApprovalProposal = {
          id;
          requestId;
          requestTitle = req.listingTitle;
          listingId = req.listingId;
          proposedBy = caller.toText();
          proposedAt = Time.now();
          reason;
          status = "pending";
          confirmedBy = "";
          confirmedAt = 0;
        };
        approvalProposals.add(id, proposal);
        addAudit(caller.toText(), "proposeApprovalForRequest", "marketplaceApproval", id, req.listingTitle);
        #ok(proposal);
      };
    };
  };

  public shared ({ caller }) func confirmApprovalForRequest(proposalId : Text) : async { #ok : LicenseRecord; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Admin only");
    };
    switch (approvalProposals.get(proposalId)) {
      case (null) { #err("Proposal not found") };
      case (?proposal) {
        if (proposal.proposedBy == caller.toText()) {
          return #err("Self-approval is not allowed: a different admin must confirm");
        };
        if (proposal.status != "pending") {
          return #err("Proposal is no longer pending");
        };
        switch (licenseRequests.get(proposal.requestId)) {
          case (null) { #err("License request not found") };
          case (?req) {
            // Create LicenseRecord in the Registry
            let licId = newId();
            let licenseTypeVariant : LicenseType = switch (req.listingId) {
              case _ { #performance }; // default; actual type comes from listing
            };
            // Resolve license type from the listing
            let resolvedType : LicenseType = switch (marketplaceListings.get(req.listingId)) {
              case (null) { #performance };
              case (?listing) {
                switch (listing.licenseType) {
                  case ("sync") { #sync };
                  case ("mechanical") { #mechanical };
                  case ("master") { #master };
                  case ("blanket") { #blanket };
                  case _ { #performance };
                };
              };
            };
            let licRecord : LicenseRecord = {
              id = licId;
              workId = switch (marketplaceListings.get(req.listingId)) {
                case (?l) { l.workId };
                case (null) { "" };
              };
              orgId = "";
              licenseType = resolvedType;
              territory = req.territory;
              termStart = "";
              termEnd = "";
              exclusivity = false;
              feeCents = 0;
              currency = "USD";
              licenseeId = req.requestorPrincipal.toText();
              status = #active;
              notes = "Converted from Marketplace Request #" # req.id # ". Use: " # req.intendedUse;
              createdBy = caller.toText();
              createdAt = Time.now();
              updatedAt = Time.now();
            };
            licenses.add(licId, licRecord);

            // Update request status
            let updatedReq : LicenseRequest = { req with status = "registry_approved"; updatedAt = Time.now() };
            licenseRequests.add(proposal.requestId, updatedReq);

            // Close the listing
            switch (marketplaceListings.get(req.listingId)) {
              case (?listing) {
                let closedListing : MarketplaceListing = { listing with status = "closed" };
                marketplaceListings.add(req.listingId, closedListing);
              };
              case (null) {};
            };

            // Update proposal
            let updatedProposal : MarketplaceApprovalProposal = {
              proposal with
              status = "confirmed";
              confirmedBy = caller.toText();
              confirmedAt = Time.now();
            };
            approvalProposals.add(proposalId, updatedProposal);

            addAudit(caller.toText(), "confirmApprovalForRequest", "licenseRecord", licId, req.listingTitle);
            #ok(licRecord);
          };
        };
      };
    };
  };

  public shared ({ caller }) func adminRejectMarketplaceRequest(requestId : Text, reason : Text) : async { #ok : LicenseRequest; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Admin only");
    };
    switch (licenseRequests.get(requestId)) {
      case (null) { #err("Request not found") };
      case (?req) {
        let updated : LicenseRequest = { req with status = "admin_rejected"; updatedAt = Time.now() };
        licenseRequests.add(requestId, updated);
        addAudit(caller.toText(), "adminRejectRequest", "licenseRequest", requestId, reason);
        #ok(updated);
      };
    };
  };

  public query ({ caller }) func listApprovalProposals() : async [MarketplaceApprovalProposal] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return [];
    };
    approvalProposals.values().toArray();
  };

  public query ({ caller }) func listAllLicenseRequests() : async [LicenseRequest] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return [];
    };
    licenseRequests.values().toArray();
  };

};
