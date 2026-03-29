import { AuthClient } from "@dfinity/auth-client";
import type { Identity } from "@icp-sdk/core/agent";
/**
 * Clean-slate authentication hook for DecibelChain.
 * Owns the AuthClient in a ref so it NEVER triggers re-renders or effect re-runs.
 * State machine: initializing -> idle (anonymous) | success (authenticated)
 */
import {
  type PropsWithChildren,
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

const InternetIdentityReactContext = createContext<
  InternetIdentityContext | undefined
>(undefined);

export const useInternetIdentity = (): InternetIdentityContext => {
  const ctx = useContext(InternetIdentityReactContext);
  if (!ctx) {
    throw new Error(
      "useInternetIdentity must be used inside InternetIdentityProvider",
    );
  }
  return ctx;
};

export function InternetIdentityProvider({
  children,
}: PropsWithChildren<{ children: ReactNode }>) {
  // AuthClient lives in a ref — NEVER in state, so it never triggers re-renders
  const clientRef = useRef<AuthClient | null>(null);
  const initStarted = useRef(false);

  const [identity, setIdentity] = useState<Identity | undefined>(undefined);
  const [loginStatus, setLoginStatus] = useState<Status>("initializing");
  const [loginError, setLoginError] = useState<Error | undefined>(undefined);

  // One-time initialization on mount
  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    let mounted = true;

    (async () => {
      try {
        const config = await loadConfig();
        const client = await AuthClient.create({
          idleOptions: {
            disableDefaultIdleCallback: true,
            disableIdle: true,
          },
          loginOptions: {
            derivationOrigin: config.ii_derivation_origin,
          },
        });

        if (!mounted) return;
        clientRef.current = client;

        const isAuthenticated = await client.isAuthenticated();
        if (!mounted) return;

        if (isAuthenticated) {
          const id = client.getIdentity();
          setIdentity(id);
          setLoginStatus("success");
        } else {
          setLoginStatus("idle");
        }
      } catch (err) {
        if (!mounted) return;
        setLoginStatus("loginError");
        setLoginError(
          err instanceof Error ? err : new Error("Initialization failed"),
        );
      }
    })();

    return () => {
      mounted = false;
    };
  }, []); // empty deps — runs exactly once

  const login = useCallback(() => {
    const client = clientRef.current;
    if (!client) {
      console.warn("AuthClient not ready yet");
      return;
    }

    setLoginStatus("logging-in");
    setLoginError(undefined);

    void (async () => {
      const config = await loadConfig();
      client.login({
        identityProvider: process.env.II_URL,
        derivationOrigin: config.ii_derivation_origin,
        maxTimeToLive: BigInt(30 * 24 * 3_600_000_000_000), // 30 days in ns
        onSuccess: () => {
          const id = client.getIdentity();
          setIdentity(id);
          setLoginStatus("success");
        },
        onError: (msg?: string) => {
          setLoginStatus("loginError");
          setLoginError(new Error(msg ?? "Login failed"));
        },
      });
    })();
  }, []);

  const clear = useCallback(() => {
    const client = clientRef.current;
    if (!client) return;

    void client
      .logout()
      .then(() => {
        setIdentity(undefined);
        setLoginStatus("idle");
        setLoginError(undefined);
      })
      .catch((err: unknown) => {
        setLoginStatus("loginError");
        setLoginError(err instanceof Error ? err : new Error("Logout failed"));
      });
  }, []);

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
