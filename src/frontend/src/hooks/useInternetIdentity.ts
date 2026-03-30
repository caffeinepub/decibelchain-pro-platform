import {
  AuthClient,
  type AuthClientCreateOptions,
  type AuthClientLoginOptions,
} from "@dfinity/auth-client";
import type { Identity } from "@icp-sdk/core/agent";
import { useCallback, useEffect, useRef, useState } from "react";
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

/**
 * Custom auth hook — authClient lives in a ref (never in state),
 * initialization effect runs exactly once (empty dep array),
 * no finally block that can silently reset status after a successful login.
 */
export function useInternetIdentity(): InternetIdentityContext {
  const authClientRef = useRef<AuthClient | null>(null);
  const [identity, setIdentity] = useState<Identity | undefined>(undefined);
  const [loginStatus, setStatus] = useState<Status>("initializing");
  const [loginError, setLoginError] = useState<Error | undefined>(undefined);

  // Runs exactly once on mount — no dependencies that can re-trigger it
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const config = await loadConfig();
        const createOptions: AuthClientCreateOptions = {
          idleOptions: {
            disableDefaultIdleCallback: true,
            disableIdle: true,
          },
          loginOptions: {
            derivationOrigin: config.ii_derivation_origin,
          },
        };
        const client = await AuthClient.create(createOptions);
        if (cancelled) return;
        authClientRef.current = client;
        const isAuthenticated = await client.isAuthenticated();
        if (cancelled) return;
        if (isAuthenticated) {
          const loaded = client.getIdentity();
          setIdentity(loaded);
          setStatus("success");
        } else {
          setStatus("idle");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("loginError");
          setLoginError(
            err instanceof Error ? err : new Error("Initialization failed"),
          );
        }
      }
      // No finally block — status is set explicitly in success/error branches only
    })();
    return () => {
      cancelled = true;
    };
  }, []); // Empty array — runs once, period

  const login = useCallback(() => {
    const client = authClientRef.current;
    if (!client) {
      setStatus("loginError");
      setLoginError(new Error("AuthClient not ready. Please try again."));
      return;
    }
    const options: AuthClientLoginOptions = {
      identityProvider: DEFAULT_IDENTITY_PROVIDER,
      maxTimeToLive: ONE_HOUR_IN_NANOSECONDS * BigInt(24 * 30),
      onSuccess: () => {
        const id = authClientRef.current?.getIdentity();
        if (!id) {
          setStatus("loginError");
          setLoginError(new Error("Identity not found after login"));
          return;
        }
        setIdentity(id);
        setStatus("success");
        // Status is set to "success" here and NOTHING can overwrite it
      },
      onError: (err) => {
        setStatus("loginError");
        setLoginError(new Error(err ?? "Login failed"));
      },
    };
    setStatus("logging-in");
    void client.login(options);
  }, []);

  const clear = useCallback(() => {
    const client = authClientRef.current;
    if (!client) return;
    void client.logout().then(() => {
      authClientRef.current = null;
      setIdentity(undefined);
      setStatus("idle");
      setLoginError(undefined);
      // Re-initialize a fresh client for next login
      void (async () => {
        try {
          const config = await loadConfig();
          const newClient = await AuthClient.create({
            idleOptions: {
              disableDefaultIdleCallback: true,
              disableIdle: true,
            },
            loginOptions: { derivationOrigin: config.ii_derivation_origin },
          });
          authClientRef.current = newClient;
        } catch {
          // Non-critical — user can reload
        }
      })();
    });
  }, []);

  return {
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
  };
}
