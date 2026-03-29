# DecibelChain PRO Platform

## Current State
The app currently requires Internet Identity login to access any page. A landing page is shown to unauthenticated users. The backend uses an access-control system where the first logged-in user who calls `_initializeAccessControlWithSecret` with the right token becomes admin. There is no UI to manually seed admin principal IDs without logging in first.

## Requested Changes (Diff)

### Add
- **Public read access everywhere**: All pages/modules are visible to unauthenticated (anonymous) visitors without login. The landing page is replaced by the full app shell shown to everyone.
- **Sign-in prompt on write actions**: Any button/form/action that creates, submits, or modifies data shows a modal prompt to sign in with Internet Identity when the user is not authenticated. After login, the action can proceed.
- **Admin Setup screen**: A dedicated page (accessible from the sidebar and without login) where principal IDs can be pasted in to designate as admins. This is the bootstrapping mechanism for the very first admin. Once at least one admin exists, existing admins can also promote other principals to admin from this same screen.
- **Backend `seedAdminPrincipal`**: A public function callable by anyone that seeds a principal as the first admin — only works when no admin has been assigned yet (bootstrap protection). After the first admin is set, this function becomes a no-op and only `assignCallerUserRole` (admin-only) can promote new admins.
- **Backend `listAdmins`**: Public query that returns the list of all current admin principal IDs so the setup screen can display them.
- **Backend `demoteAdmin`**: Admin-callable function to remove admin status from a principal (requires a different admin, not self).

### Modify
- **App.tsx**: Remove the `if (!isLoggedIn)` guard that shows only the landing page. Instead render the full app shell for all visitors. Pass `isLoggedIn`, `login`, and `isLoggingIn` down as props so pages can gate write actions.
- **Sidebar**: Add "Admin Setup" nav item visible to all users (or at minimum unauthenticated users before first admin is set).
- **Pages with write actions**: Wrap create/submit/edit handlers with a `requireAuth` guard that fires the sign-in prompt if not logged in.

### Remove
- Hard login gate that blocks the entire app for unauthenticated users.

## Implementation Plan
1. Add `seedAdminPrincipal(principalText: Text)`, `listAdmins()`, and `demoteAdmin(target: Principal)` to `main.mo`.
2. Regenerate `backend.d.ts` bindings.
3. Rewrite `App.tsx` to always render the full app shell, passing `isLoggedIn`/`login` as props.
4. Create `SignInPromptModal` component triggered when unauthenticated users attempt write actions.
5. Create `AdminSetup` page: paste-in form for principal IDs (bootstrap when no admins exist), list current admins, promote/demote panel for logged-in admins.
6. Add `AdminSetup` to sidebar nav and Page type.
7. Apply `requireAuth` guards to write-action buttons across key pages (CreativeWorks, MarketplaceListings, Certificates, Organizations, etc.).
