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
 * Clean, standalone auth hook. AuthClient is stored in a ref so it never
 * triggers re-renders or effect re-runs. The init effect runs exactly once.
 * Status is only ever set explicitly — no finally block can overwrite success.
 */
export function useInternetIdentity(
  createOptions?: AuthClientCreateOptions,
): InternetIdentityContext {
  const clientRef = useRef<AuthClient | null>(null);
  // Store createOptions in a ref so it doesn't need to be in effect deps
  const createOptionsRef = useRef(createOptions);
  createOptionsRef.current = createOptions;

  const [identity, setIdentity] = useState<Identity | undefined>(undefined);
  const [loginStatus, setLoginStatus] = useState<Status>("initializing");
  const [loginError, setLoginError] = useState<Error | undefined>(undefined);

  // Init runs exactly once on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const opts = createOptionsRef.current;
        const config = await loadConfig();
        const client = await AuthClient.create({
          idleOptions: {
            disableDefaultIdleCallback: true,
            disableIdle: true,
            ...opts?.idleOptions,
          },
          loginOptions: {
            derivationOrigin: config.ii_derivation_origin,
          },
          ...opts,
        });

        if (cancelled) return;
        clientRef.current = client;

        const isAuthenticated = await client.isAuthenticated();
        if (cancelled) return;

        if (isAuthenticated) {
          setIdentity(client.getIdentity());
          setLoginStatus("success");
        } else {
          setLoginStatus("idle");
        }
      } catch (err) {
        if (cancelled) return;
        setLoginStatus("loginError");
        setLoginError(
          err instanceof Error ? err : new Error("Initialization failed"),
        );
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(() => {
    const client = clientRef.current;
    if (!client) return;

    const options: AuthClientLoginOptions = {
      identityProvider: DEFAULT_IDENTITY_PROVIDER,
      maxTimeToLive: ONE_HOUR_IN_NANOSECONDS * BigInt(24 * 30),
      onSuccess: () => {
        const id = client.getIdentity();
        setIdentity(id);
        setLoginStatus("success");
        setLoginError(undefined);
      },
      onError: (msg) => {
        setLoginStatus("loginError");
        setLoginError(new Error(msg ?? "Login failed"));
      },
    };

    setLoginStatus("logging-in");
    void client.login(options);
  }, []);

  const clear = useCallback(() => {
    const client = clientRef.current;
    if (!client) return;

    void client.logout().then(() => {
      setIdentity(undefined);
      setLoginStatus("idle");
      setLoginError(undefined);
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
