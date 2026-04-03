import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
// CRITICAL: This file MUST import identity from AuthContext — NEVER from useInternetIdentity.
// The useInternetIdentity library has a broken loop (authClient in state + effect deps + finally block)
// that causes blank screens. It is neutralized as a stub but we never use it here.
import { useAuthContext } from "../contexts/AuthContext";
import { getSecretParameter } from "../utils/urlParams";

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  // Read identity from the CORRECT custom auth context — not the broken library
  const { identity } = useAuthContext();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor if not authenticated
        return await createActorWithConfig();
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);

      // CRITICAL: Only call _initializeAccessControlWithSecret when an actual
      // admin token is present in the URL. NEVER call it with an empty string —
      // that causes a failing ICP update call that corrupts the actor for ALL users.
      const adminToken = getSecretParameter("caffeineAdminToken");
      if (adminToken) {
        try {
          await actor._initializeAccessControlWithSecret(adminToken);
        } catch (e) {
          console.warn("[useActor] admin token init failed (non-fatal):", e);
        }
      }

      return actor;
    },
    // Only refetch when identity changes
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // When the actor changes, invalidate dependent queries
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
