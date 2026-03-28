import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "./useActor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Actor = any;

export type OrgType =
  | { recordLabel: null }
  | { publisher: null }
  | { cooperative: null }
  | { indie: null };

export type WorkType =
  | { song: null }
  | { album: null }
  | { composition: null }
  | { soundRecording: null };

export type ServiceType =
  | { distribution: null }
  | { publishing: null }
  | { licensing: null }
  | { sync: null }
  | { marketing: null }
  | { legal: null };

export type UserRole = { admin: null } | { user: null } | { guest: null };

export interface Organization {
  id: string;
  name: string;
  description: string;
  orgType: OrgType;
  owner: { toString(): string };
  createdAt: bigint;
}

export interface MemberProfile {
  principalId: string;
  displayName: string;
  bio: string;
  country: string;
  website: string;
  languages: string[];
  orgIds: string[];
  createdAt: bigint;
  updatedAt: bigint;
}

export interface CreativeWork {
  id: string;
  title: string;
  workType: WorkType;
  isrc: string;
  iswc: string;
  genre: string;
  description: string;
  releaseDate: string;
  orgId: string;
  creatorId: string;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface OwnershipSplit {
  workId: string;
  holderId: string;
  percentage: bigint;
  role: string;
  updatedAt: bigint;
}

export interface Vendor {
  id: string;
  name: string;
  serviceType: ServiceType;
  contactEmail: string;
  website: string;
  country: string;
  orgId: string;
  addedById: string;
  createdAt: bigint;
}

export interface AuditEntry {
  id: bigint;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: bigint;
}

export function useMyRole() {
  const { actor, isFetching } = useActor();
  return useQuery<UserRole | null>({
    queryKey: ["myRole"],
    queryFn: async () => {
      if (!actor) return null;
      return (actor as Actor).getMyRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<MemberProfile | null>({
    queryKey: ["myProfile"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await (actor as Actor).getMyProfile();
      return result[0] ?? null;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOrganizations() {
  const { actor, isFetching } = useActor();
  return useQuery<Organization[]>({
    queryKey: ["organizations"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as Actor).listOrganizations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllWorks() {
  const { actor, isFetching } = useActor();
  return useQuery<CreativeWork[]>({
    queryKey: ["allWorks"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as Actor).listAllWorks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllVendors() {
  const { actor, isFetching } = useActor();
  return useQuery<Vendor[]>({
    queryKey: ["allVendors"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as Actor).listAllVendors();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSplitsByWork(workId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<OwnershipSplit[]>({
    queryKey: ["splits", workId],
    queryFn: async () => {
      if (!actor || !workId) return [];
      return (actor as Actor).getSplitsByWork(workId);
    },
    enabled: !!actor && !isFetching && !!workId,
  });
}

export function useAuditLog(offset: number, limit: number) {
  const { actor, isFetching } = useActor();
  return useQuery<AuditEntry[]>({
    queryKey: ["auditLog", offset, limit],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as Actor).getAuditLog(BigInt(offset), BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateOrganization() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      orgType: OrgType;
    }) => {
      return (actor as Actor).createOrganization(
        data.name,
        data.description,
        data.orgType,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      qc.invalidateQueries({ queryKey: ["auditLog"] });
      toast.success("Organization created");
    },
    onError: () => toast.error("Failed to create organization"),
  });
}

export function useRegisterWork() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      workType: WorkType;
      isrc: string;
      iswc: string;
      genre: string;
      description: string;
      releaseDate: string;
      orgId: string;
    }) => {
      return (actor as Actor).registerWork(
        data.title,
        data.workType,
        data.isrc,
        data.iswc,
        data.genre,
        data.description,
        data.releaseDate,
        data.orgId,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allWorks"] });
      qc.invalidateQueries({ queryKey: ["auditLog"] });
      toast.success("Work registered");
    },
    onError: () => toast.error("Failed to register work"),
  });
}

export function useSetSplit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      workId: string;
      holderId: string;
      percentage: number;
      role: string;
    }) => {
      return (actor as Actor).setSplit(
        data.workId,
        data.holderId,
        BigInt(data.percentage),
        data.role,
      );
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["splits", vars.workId] });
      toast.success("Split updated");
    },
    onError: () => toast.error("Failed to update split"),
  });
}

export function useAddVendor() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      serviceType: ServiceType;
      contactEmail: string;
      website: string;
      country: string;
      orgId: string;
    }) => {
      return (actor as Actor).addVendor(
        data.name,
        data.serviceType,
        data.contactEmail,
        data.website,
        data.country,
        data.orgId,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allVendors"] });
      qc.invalidateQueries({ queryKey: ["auditLog"] });
      toast.success("Vendor added");
    },
    onError: () => toast.error("Failed to add vendor"),
  });
}

export function useUpsertProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      displayName: string;
      bio: string;
      country: string;
      website: string;
      languages: string[];
      orgIds: string[];
    }) => {
      return (actor as Actor).upsertProfile(
        data.displayName,
        data.bio,
        data.country,
        data.website,
        data.languages,
        data.orgIds,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myProfile"] });
    },
    onError: () => toast.error("Failed to save profile"),
  });
}

export function formatTimestamp(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleString();
}

export function getOrgTypeLabel(orgType: OrgType): string {
  if ("recordLabel" in orgType) return "Record Label";
  if ("publisher" in orgType) return "Publisher";
  if ("cooperative" in orgType) return "Cooperative";
  if ("indie" in orgType) return "Indie Artist";
  return "Unknown";
}

export function getWorkTypeLabel(workType: WorkType): string {
  if ("song" in workType) return "Song";
  if ("album" in workType) return "Album";
  if ("composition" in workType) return "Composition";
  if ("soundRecording" in workType) return "Sound Recording";
  return "Unknown";
}

export function getServiceTypeLabel(serviceType: ServiceType): string {
  if ("distribution" in serviceType) return "Distribution";
  if ("publishing" in serviceType) return "Publishing";
  if ("licensing" in serviceType) return "Licensing";
  if ("sync" in serviceType) return "Sync";
  if ("marketing" in serviceType) return "Marketing";
  if ("legal" in serviceType) return "Legal";
  return "Unknown";
}

export interface RevenueStats {
  totalRevenueCents: bigint;
  totalDistributedCents: bigint;
  pendingPayoutsCents: bigint;
  statementCount: bigint;
}

export function useRevenueStats(orgId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<RevenueStats | null>({
    queryKey: ["revenueStats", orgId],
    queryFn: async () => {
      if (!actor || !orgId) return null;
      return (actor as Actor).getRevenueStats(orgId);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}

export function useRevenueSourcesByOrg(orgId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<any[]>({
    queryKey: ["revenueSources", orgId],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      return (actor as Actor).listRevenueSourcesByOrg(orgId);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}

export function useStatementsByOrg(orgId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<any[]>({
    queryKey: ["statements", orgId],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      return (actor as Actor).listStatementsByOrg(orgId);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}

export function usePayoutsByStatement(statementId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<any[]>({
    queryKey: ["payouts", statementId],
    queryFn: async () => {
      if (!actor || !statementId) return [];
      return (actor as Actor).listPayoutsByStatement(statementId);
    },
    enabled: !!actor && !isFetching && !!statementId,
  });
}
