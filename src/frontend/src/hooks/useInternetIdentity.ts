import {
  AuthClient,
  type AuthClientCreateOptions,
  type AuthClientLoginOptions,
} from "@dfinity/auth-client";
import type { Identity } from "@icp-sdk/core/agent";
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
}: PropsWithChildren<{
  children: ReactNode;
  createOptions?: AuthClientCreateOptions;
}>) {
  // ── Auth client lives in a ref — NEVER in state.
  // Storing it in state would make it a useEffect dependency, which re-triggers
  // the init effect on every creation and causes the blank-screen loop.
  const authClientRef = useRef<AuthClient | null>(null);
  const createOptionsRef = useRef(createOptions);

  const [identity, setIdentity] = useState<Identity | undefined>(undefined);
  const [loginStatus, setStatus] = useState<Status>("initializing");
  const [loginError, setLoginError] = useState<Error | undefined>(undefined);

  // ── Initialization — runs EXACTLY ONCE on mount.
  // Empty dep array is intentional and correct: we must never re-run this
  // effect, as re-running it calls setStatus("initializing") which blanks
  // the screen and overwrites any authenticated state.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const config = await loadConfig();
        const options: AuthClientCreateOptions = {
          idleOptions: {
            disableDefaultIdleCallback: true,
            disableIdle: true,
            ...createOptionsRef.current?.idleOptions,
          },
          loginOptions: {
            derivationOrigin: config.ii_derivation_origin,
          },
          ...(createOptionsRef.current ?? {}),
        };

        const client = await AuthClient.create(options);
        if (cancelled) return;

        authClientRef.current = client;

        const isAuthenticated = await client.isAuthenticated();
        if (cancelled) return;

        if (isAuthenticated) {
          const loadedIdentity = client.getIdentity();
          setIdentity(loadedIdentity);
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
      // NO finally block — status is set only in explicit branches above.
      // A finally block would unconditionally overwrite "success" with "idle".
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- empty deps: runs once, never again

  const login = useCallback(() => {
    const client = authClientRef.current;
    if (!client) {
      setStatus("loginError");
      setLoginError(new Error("AuthClient not ready"));
      return;
    }

    const options: AuthClientLoginOptions = {
      identityProvider: DEFAULT_IDENTITY_PROVIDER,
      maxTimeToLive: ONE_HOUR_IN_NANOSECONDS * BigInt(24 * 30), // 30 days
      onSuccess: () => {
        const newIdentity = authClientRef.current?.getIdentity();
        if (newIdentity) {
          setIdentity(newIdentity);
          setStatus("success");
        } else {
          setStatus("loginError");
          setLoginError(new Error("Identity not found after login"));
        }
      },
      onError: (err?: string) => {
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

    void client
      .logout()
      .then(() => {
        setIdentity(undefined);
        setStatus("idle");
        setLoginError(undefined);
      })
      .catch((err: unknown) => {
        setStatus("loginError");
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
