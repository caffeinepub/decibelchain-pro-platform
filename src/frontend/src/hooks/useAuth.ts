import { AuthClient } from "@dfinity/auth-client";
import type { Identity } from "@icp-sdk/core/agent";
// CRITICAL: This file must never import from useInternetIdentity.ts
// This is a standalone custom auth hook. The library file is no longer used.
import { useCallback, useEffect, useRef, useState } from "react";
import { loadConfig } from "../config";

const ONE_HOUR_IN_NANOSECONDS = BigInt(3_600_000_000_000);

export type AuthStatus = "idle" | "logging-in" | "success" | "loginError";

export interface AuthState {
  identity: Identity | undefined;
  loginStatus: AuthStatus;
  isLoggedIn: boolean;
  isLoggingIn: boolean;
  loginError: Error | undefined;
  login: () => void;
  clear: () => void;
}

export function useAuth(): AuthState {
  // authClient lives in a ref — NEVER in state. Refs do not trigger re-renders.
  const authClientRef = useRef<AuthClient | null>(null);
  const [identity, setIdentity] = useState<Identity | undefined>(undefined);
  // Start as "idle" — NEVER "initializing" — Strategy B: app renders immediately
  const [loginStatus, setLoginStatus] = useState<AuthStatus>("idle");
  const [loginError, setLoginError] = useState<Error | undefined>(undefined);

  // Background auth initialization — runs EXACTLY ONCE (empty deps array)
  // No finally block — status is only set explicitly in success/error branches
  useEffect(() => {
    let cancelled = false;
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
        if (cancelled) return;
        authClientRef.current = client;
        // Silently check for an existing valid session
        const isAuthenticated = await client.isAuthenticated();
        if (cancelled) return;
        if (isAuthenticated) {
          setIdentity(client.getIdentity());
          setLoginStatus("success");
        }
        // If not authenticated: stay "idle". Do NOT set any status here.
      } catch (err) {
        // Non-fatal: log but don't crash the app. User can still try sign-in manually.
        if (!cancelled) console.error("[useAuth] init error (non-fatal):", err);
      }
      // NO finally block — this is intentional and critical.
    })();
    return () => {
      cancelled = true;
    };
  }, []); // EMPTY DEPS — runs exactly once on mount

  const login = useCallback(() => {
    const client = authClientRef.current;
    if (!client) return; // Not ready yet — silently ignore
    setLoginStatus("logging-in");
    void client.login({
      identityProvider: process.env.II_URL,
      maxTimeToLive: ONE_HOUR_IN_NANOSECONDS * BigInt(24 * 30), // 30 days
      onSuccess: () => {
        const newIdentity = authClientRef.current?.getIdentity();
        if (newIdentity) {
          setIdentity(newIdentity);
          setLoginStatus("success");
        }
      },
      onError: (err) => {
        setLoginStatus("loginError");
        setLoginError(new Error(err ?? "Login failed"));
      },
    });
  }, []);

  const clear = useCallback(() => {
    void authClientRef.current?.logout().then(() => {
      setIdentity(undefined);
      setLoginStatus("idle");
      setLoginError(undefined);
    });
  }, []);

  return {
    identity,
    loginStatus,
    isLoggedIn: loginStatus === "success",
    isLoggingIn: loginStatus === "logging-in",
    loginError,
    login,
    clear,
  };
}
