import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

// CRITICAL: InternetIdentityProvider is intentionally NOT imported here.
// The broken library (useInternetIdentity.ts) runs authClient in state with
// effect deps, causing a re-initialization loop on every sign-in.
// AuthProvider (custom hook) is the sole auth mechanism.

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>,
);
