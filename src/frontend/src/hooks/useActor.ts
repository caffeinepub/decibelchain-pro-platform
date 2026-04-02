import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { useAuthContext } from "../contexts/AuthContext";
import { getSecretParameter } from "../utils/urlParams";

// CRITICAL: This file must import identity from AuthContext (our custom hook),
// NOT from useInternetIdentity (the broken library).
// Importing from the broken library causes the actor to always receive
// a cycling/anonymous identity after sign-in, breaking all saves.

const ACTOR_QUERY_KEY = "actor";

export function useActor() {
  // Read identity from our custom AuthContext — NEVER from useInternetIdentity
  const { identity } = useAuthContext();
  const queryClient = useQueryClient();

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!identity) {
        // Return anonymous actor when not authenticated
        return await createActorWithConfig();
      }

      const actor = await createActorWithConfig({
        agentOptions: { identity },
      });

      // CRITICAL: Only call _initializeAccessControlWithSecret when an actual
      // admin token is present in the URL. Never call it with an empty string —
      // that always fails with a 2-second ICP update call that corrupts the actor.
      const adminToken = getSecretParameter("caffeineAdminToken");
      if (adminToken) {
        try {
          await actor._initializeAccessControlWithSecret(adminToken);
        } catch (err) {
          console.warn("[useActor] admin bootstrap failed (non-fatal):", err);
        }
      }

      return actor;
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // When the actor changes, invalidate dependent queries
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
