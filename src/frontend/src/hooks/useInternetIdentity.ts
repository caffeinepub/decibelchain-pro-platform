// ============================================================
// SAFE STUB — DO NOT RESTORE THE ORIGINAL CONTENT OF THIS FILE
// ============================================================
// The original useInternetIdentity.ts stored authClient in useState and listed
// it as a useEffect dependency. This caused an infinite re-initialization loop:
//   1. Effect runs → creates authClient → sets it in state
//   2. State change → effect re-runs → setStatus("initializing") → blank screen
//   3. Finally block always resets to "idle", overwriting successful logins
//
// This file is intentionally a stub. All authentication is handled by:
//   - useAuth.ts (the custom hook — authClient in a ref, effect runs once)
//   - AuthContext.tsx (the provider and context accessor)
//
// If you need to access auth state, import from:
//   import { useAuthContext } from "../contexts/AuthContext";
// ============================================================

export function useInternetIdentity(): never {
  throw new Error(
    "[DecibelChain] useInternetIdentity is disabled. " +
      "Import useAuthContext from '../contexts/AuthContext' instead. " +
      "See useInternetIdentity.ts for the reason.",
  );
}

export function InternetIdentityProvider(): never {
  throw new Error(
    "[DecibelChain] InternetIdentityProvider is disabled. " +
      "Wrap your app with AuthProvider from '../contexts/AuthContext' instead.",
  );
}
