import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { useAuthContext } from "../contexts/AuthContext";
import { getSecretParameter } from "../utils/urlParams";

// CRITICAL: Identity must come from AuthContext (the custom useAuth hook),
// NOT from useInternetIdentity. The library hook stores authClient in useState
// which causes an infinite loop after sign-in. This file must never import
// from useInternetIdentity.ts.

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  const { identity } = useAuthContext();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor for guest mode (Strategy B)
        return await createActorWithConfig();
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);

      // CRITICAL: Only run the admin bootstrap call when a real token is present.
      // Calling _initializeAccessControlWithSecret("") with an empty string always
      // throws an error, which corrupts the actor and causes all saves to fail.
      const adminToken = getSecretParameter("caffeineAdminToken");
      if (adminToken) {
        try {
          await actor._initializeAccessControlWithSecret(adminToken);
        } catch (e) {
          console.warn("[useActor] admin bootstrap failed (non-fatal):", e);
        }
      }

      return actor;
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // When the actor changes, invalidate dependent queries so they refetch with new identity
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
