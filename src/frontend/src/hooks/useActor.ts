import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
// CRITICAL: This file must NEVER import from useInternetIdentity.ts
// useInternetIdentity.ts is the broken library with authClient in useState.
// Identity is read from AuthContext (the correct custom hook) only.
import { useAuthContext } from "../contexts/AuthContext";
import { getSecretParameter } from "../utils/urlParams";

const ACTOR_QUERY_KEY = "actor";

export function useActor() {
  // Read identity from the CORRECT custom auth context — NOT from useInternetIdentity
  const { identity } = useAuthContext();
  const queryClient = useQueryClient();

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!identity) {
        // Anonymous actor for unauthenticated / guest users
        return await createActorWithConfig();
      }

      const actor = await createActorWithConfig({
        agentOptions: { identity },
      });

      // Admin bootstrap: ONLY run when an actual admin token is present in the URL.
      // NEVER call with an empty string — that causes a failing ICP update call that
      // corrupts the actor and blocks all saves for every authenticated user.
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

  // When the actor changes (e.g. after login), invalidate all dependent queries
  // so they refetch with the new authenticated identity.
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
      queryClient.refetchQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
