// ============================================================================
// SAFE STUB — DO NOT REPLACE THIS FILE WITH THE ORIGINAL LIBRARY
// ============================================================================
// The original useInternetIdentity library had three bugs that caused blank screens:
//   1. authClient stored in useState — triggered re-renders and effect re-runs
//   2. authClient + createOptions listed as useEffect dependencies — caused
//      the effect to re-run on every client creation, setting status back to
//      "initializing" and blanking the screen
//   3. A `finally` block that always ran `setStatus("idle")` — silently
//      overwrote successful logins, making the app think nobody was signed in
//
// This stub re-exports the correct auth hook from AuthContext so that any
// file that still imports from this path gets working auth instead of crashing.
// The app's primary auth entrypoint is AuthContext.tsx + useAuth.ts.
// ============================================================================

import { useAuthContext } from "../contexts/AuthContext";

// Safe re-export: anything importing useInternetIdentity gets the working hook
export function useInternetIdentity() {
  const { identity, login, clear, loginStatus, isLoggingIn, loginError } =
    useAuthContext();
  return {
    identity,
    login,
    clear,
    loginStatus,
    isInitializing: false, // never "initializing" — Strategy B
    isLoginIdle: loginStatus === "idle",
    isLoggingIn,
    isLoginSuccess: loginStatus === "success",
    isLoginError: loginStatus === "loginError",
    loginError,
  };
}

// Safe no-op provider stub — if anything still imports InternetIdentityProvider
// it won't crash; it just renders children directly with no broken loop
import type { ReactNode } from "react";
export function InternetIdentityProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Intentionally a pass-through. All auth is handled by AuthProvider in main.tsx.
  return children as React.ReactElement;
}

export type Status =
  | "initializing"
  | "idle"
  | "logging-in"
  | "success"
  | "loginError";
