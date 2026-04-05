// ============================================================
// HARD-ERROR STUB — DO NOT USE THIS FILE
// ============================================================
// This file intentionally replaces the broken useInternetIdentity library.
// The original library contained three bugs that caused a persistent blank
// screen loop after every sign-in:
//   1. authClient stored in useState — triggered effect re-runs on every update
//   2. authClient + createOptions listed as effect dependencies — infinite loop
//   3. `finally { setStatus("idle") }` — silently overwrote successful logins
//
// All auth is now handled by:
//   - hooks/useAuth.ts          (clean custom hook, authClient in a ref)
//   - contexts/AuthContext.tsx  (React context provider)
//
// If you see this error, update your import:
//   WRONG:   import { useInternetIdentity } from "./useInternetIdentity"
//   CORRECT: import { useAuthContext } from "../contexts/AuthContext"
// ============================================================

import type React from "react";

export function useInternetIdentity(): never {
  throw new Error(
    "[DecibelChain] useInternetIdentity is disabled. " +
      "Use useAuthContext() from contexts/AuthContext instead.",
  );
}

export function InternetIdentityProvider(_props: {
  children: React.ReactNode;
}): never {
  throw new Error(
    "[DecibelChain] InternetIdentityProvider is disabled. " +
      "Use AuthProvider from contexts/AuthContext instead.",
  );
}
