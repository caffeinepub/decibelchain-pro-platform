// ============================================================
// SAFE STUB — DO NOT MODIFY OR RESTORE THE ORIGINAL CONTENT
// ============================================================
// The original useInternetIdentity library had three bugs that
// caused a blank screen loop after every sign-in:
//
//   1. authClient stored in useState — re-renders on every creation
//   2. authClient + createOptions listed as useEffect dependencies —
//      the effect re-ran every time the client was set, calling
//      setStatus("initializing") and blanking the screen
//   3. A finally block that always reset status to "idle", silently
//      overwriting a successful login
//
// This stub exists to prevent any file from accidentally importing
// the broken implementation. All auth logic has moved to:
//   src/frontend/src/hooks/useAuth.ts          (custom hook)
//   src/frontend/src/contexts/AuthContext.tsx  (provider + context)
//
// If you see a blank screen after sign-in, the first thing to check
// is whether anything has started importing from this file again.
// ============================================================

export function useInternetIdentity(): never {
  throw new Error(
    "[DecibelChain] useInternetIdentity is disabled. " +
      "Import useAuthContext from contexts/AuthContext instead.",
  );
}

export function InternetIdentityProvider(): never {
  throw new Error(
    "[DecibelChain] InternetIdentityProvider is disabled. " +
      "Use AuthProvider from contexts/AuthContext instead.",
  );
}
