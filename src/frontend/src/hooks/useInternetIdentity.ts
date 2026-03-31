import { AuthClient, type AuthClientCreateOptions } from "@dfinity/auth-client";
import type { Identity } from "@icp-sdk/core/agent";
/**
 * CUSTOM AUTH HOOK — DO NOT REPLACE WITH LIBRARY VERSION
 *
 * Critical invariants that MUST be preserved:
 * 1. authClientRef is a useRef — NEVER useState
 * 2. useEffect has [] empty dependency array — runs exactly once on mount
 * 3. NO finally block anywhere — status is only set explicitly
 * 4. login/clear callbacks have [] empty deps — they read the client from ref
 *
 * Violating any of these causes the 3-second blank screen loop after login.
 */
import {
  type ReactNode,
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { loadConfig } from "../config";

export type Status =
  | "initializing"
  | "idle"
  | "logging-in"
  | "success"
  | "loginError";

export type InternetIdentityContext = {
  identity?: Identity;
  login: () => void;
  clear: () => void;
  loginStatus: Status;
  isInitializing: boolean;
  isLoginIdle: boolean;
  isLoggingIn: boolean;
  isLoginSuccess: boolean;
  isLoginError: boolean;
  loginError?: Error;
};

const ONE_HOUR_IN_NANOSECONDS = BigInt(3_600_000_000_000);
const DEFAULT_IDENTITY_PROVIDER = process.env.II_URL;

const InternetIdentityReactContext = createContext<
  InternetIdentityContext | undefined
>(undefined);

export const useInternetIdentity = (): InternetIdentityContext => {
  const context = useContext(InternetIdentityReactContext);
  if (!context) {
    throw new Error(
      "useInternetIdentity must be used within InternetIdentityProvider",
    );
  }
  return context;
};

export function InternetIdentityProvider({
  children,
  createOptions,
}: {
  children: ReactNode;
  createOptions?: AuthClientCreateOptions;
}) {
  // CRITICAL: authClient MUST live in a ref — never in state.
  // If it were in state, setting it would re-trigger the useEffect below,
  // causing an infinite initialization loop and blank screen after login.
  const authClientRef = useRef<AuthClient | null>(null);
  const createOptionsRef = useRef(createOptions);

  const [identity, setIdentity] = useState<Identity | undefined>(undefined);
  const [loginStatus, setStatus] = useState<Status>("initializing");
  const [loginError, setLoginError] = useState<Error | undefined>(undefined);

  // CRITICAL: Empty dependency array [] — this effect runs EXACTLY ONCE on mount.
  // Do NOT add any dependencies here.
  // Do NOT add a finally block — it would overwrite "success" status with "idle".
  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const config = await loadConfig();
        const client = await AuthClient.create({
          idleOptions: {
            disableDefaultIdleCallback: true,
            disableIdle: true,
            ...createOptionsRef.current?.idleOptions,
          },
          loginOptions: {
            derivationOrigin: config.ii_derivation_origin,
          },
          ...createOptionsRef.current,
        });

        if (!active) return;
        authClientRef.current = client;

        const isAuthenticated = await client.isAuthenticated();
        if (!active) return;

        if (isAuthenticated) {
          // Restore existing session
          setIdentity(client.getIdentity());
          setStatus("success");
        } else {
          setStatus("idle");
        }
        // NO finally block here — status is set explicitly above only
      } catch (err) {
        if (!active) return;
        setStatus("loginError");
        setLoginError(
          err instanceof Error ? err : new Error("Auth initialization failed"),
        );
      }
    }

    void init();
    return () => {
      active = false;
    };
  }, []); // <-- MUST remain empty

  // CRITICAL: Empty dependency array — login reads client from ref, not state
  const login = useCallback(() => {
    const client = authClientRef.current;
    if (!client) return;

    setStatus("logging-in");
    void client.login({
      identityProvider: DEFAULT_IDENTITY_PROVIDER,
      maxTimeToLive: ONE_HOUR_IN_NANOSECONDS * BigInt(24 * 30), // 30 days
      onSuccess: () => {
        const id = authClientRef.current?.getIdentity();
        if (id) {
          setIdentity(id);
          setStatus("success");
        } else {
          setStatus("loginError");
          setLoginError(new Error("Identity not found after login"));
        }
      },
      onError: (err) => {
        setStatus("loginError");
        setLoginError(new Error(err ?? "Login failed"));
      },
    });
  }, []); // <-- MUST remain empty

  // CRITICAL: Empty dependency array — clear reads client from ref, not state
  // Does NOT null out authClientRef so the client stays available for future logins
  const clear = useCallback(() => {
    const client = authClientRef.current;
    if (!client) return;

    void client
      .logout()
      .then(() => {
        setIdentity(undefined);
        setStatus("idle");
        setLoginError(undefined);
        // authClientRef.current is intentionally kept alive
      })
      .catch(() => {
        setStatus("idle");
        setIdentity(undefined);
      });
  }, []); // <-- MUST remain empty

  const value = useMemo<InternetIdentityContext>(
    () => ({
      identity,
      login,
      clear,
      loginStatus,
      isInitializing: loginStatus === "initializing",
      isLoginIdle: loginStatus === "idle",
      isLoggingIn: loginStatus === "logging-in",
      isLoginSuccess: loginStatus === "success",
      isLoginError: loginStatus === "loginError",
      loginError,
    }),
    [identity, login, clear, loginStatus, loginError],
  );

  return createElement(InternetIdentityReactContext.Provider, {
    value,
    children,
  });
}
