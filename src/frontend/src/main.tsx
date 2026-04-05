import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

// CRITICAL: InternetIdentityProvider is NOT used here.
// The broken library (useInternetIdentity.ts) caused authClient to be stored in
// useState with effect deps, creating a re-initialization loop after every login.
// AuthProvider wraps the correct custom useAuth hook (authClient in a ref, effect
// runs once, no finally block). DO NOT replace AuthProvider with InternetIdentityProvider.

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
