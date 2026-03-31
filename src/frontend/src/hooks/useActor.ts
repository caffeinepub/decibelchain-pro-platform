import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { useAuthContext } from "../contexts/AuthContext";
import { getSecretParameter } from "../utils/urlParams";

const ACTOR_QUERY_KEY = "actor";

export function useActor() {
  // Read identity from the CUSTOM auth context — never from the broken library
  const { identity } = useAuthContext();
  const queryClient = useQueryClient();

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!identity) {
        // Anonymous actor for unauthenticated users
        return await createActorWithConfig();
      }

      const actor = await createActorWithConfig({
        agentOptions: { identity },
      });

      // ONLY call _initializeAccessControlWithSecret when an actual admin token
      // is present in the URL. Never call it with an empty string — that is a
      // failing ICP update call that corrupts the actor for all regular users.
      const adminToken = getSecretParameter("caffeineAdminToken");
      if (adminToken) {
        try {
          await actor._initializeAccessControlWithSecret(adminToken);
        } catch (err) {
          console.warn("[useActor] admin token init failed (non-fatal):", err);
        }
      }

      return actor;
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // When actor changes, invalidate all dependent queries so UI refreshes
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
