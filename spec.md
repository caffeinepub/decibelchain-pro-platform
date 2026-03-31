# DecibelChain PRO Platform

## Current State

The app has a persistent blank-screen bug that has survived every fix attempt because the root cause is in a library-generated file (`src/frontend/src/hooks/useInternetIdentity.ts`) that keeps regenerating with broken code:
- `authClient` stored in `useState` AND listed as a `useEffect` dependency — triggers an infinite re-initialization loop on every auth state change
- A `finally` block that always runs `setStatus("idle")` — silently overwrites successful logins
- App.tsx has a guard `if (loginStatus === "initializing") { return <spinner> }` that blanks the entire screen whenever the hook re-initializes

Every attempted fix to the library file reverts on the next code generation cycle, causing the regression loop.

## Requested Changes (Diff)

### Add
- `src/frontend/src/hooks/useAuth.ts` — brand new standalone auth hook in a non-library file that is never regenerated:
  - `authClient` lives in `useRef`, never in state — cannot trigger re-renders
  - `useEffect` has empty dependency array `[]` — runs exactly once on mount
  - Starts as `"idle"` (never sets `"initializing"` — Strategy B: app always renders immediately)
  - No `finally` block — status only set explicitly in success/error branches
  - `login()` calls Internet Identity directly (works via modal overlay — Strategy D)
  - `clear()` logs out cleanly
  - Background session restoration: silently checks for existing session on mount, sets `"success"` if found, stays `"idle"` if not
- `src/frontend/src/contexts/AuthContext.tsx` — React context wrapping `useAuth` for app-wide sharing. Exports `AuthProvider` and `useAuthContext`.
- `showSignInModal` state in `AppInner` — all sign-in requests anywhere in the app open the existing `SignInPromptModal` as an overlay (Strategy D: current page always stays mounted)

### Modify
- `src/frontend/src/main.tsx` — Replace `InternetIdentityProvider` import/wrapper with `AuthProvider` from new `AuthContext.tsx`. Remove the import of `useInternetIdentity.ts`.
- `src/frontend/src/App.tsx`:
  - Replace `useInternetIdentity()` call with `useAuthContext()` from new context
  - **Remove the `if (loginStatus === "initializing") { return spinner }` guard entirely** — the app ALWAYS renders its full UI immediately (this is the primary fix for Strategy B)
  - All `onLogin` callbacks passed to Sidebar, IndustryHub, etc. now call `() => setShowSignInModal(true)` instead of `login()` directly
  - After login success (detected via `useEffect` watching `isLoggedIn`), close the modal and optionally navigate to Dashboard
  - Add `showSignInModal` state + render `<SignInPromptModal>` overlay at the App root level
- `src/frontend/src/hooks/useActor.ts` — Replace `useInternetIdentity()` with `useAuthContext()` from new context to get `identity`

### Remove
- The `if (loginStatus === "initializing") { return spinner }` blank screen guard from `App.tsx`
- All direct imports of `useInternetIdentity` from `App.tsx` and `useActor.ts` (the library file itself is left in place but no longer imported by anything critical)

## Implementation Plan

1. Create `src/frontend/src/hooks/useAuth.ts` with the clean standalone implementation
2. Create `src/frontend/src/contexts/AuthContext.tsx` as a context provider wrapping `useAuth`
3. Update `src/frontend/src/main.tsx` — swap `InternetIdentityProvider` for `AuthProvider`
4. Update `src/frontend/src/hooks/useActor.ts` — use `useAuthContext().identity`
5. Update `src/frontend/src/App.tsx` — use `useAuthContext()`, remove blank screen gate, wire up modal-only sign-in flow
6. Validate (lint + typecheck + build) and fix any errors
