import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

// NOTE: InternetIdentityProvider is intentionally NOT imported or used here.
// It contains a broken auth loop (authClient in useState + effect deps + finally reset).
// All auth is handled by AuthProvider (contexts/AuthContext.tsx) + useAuth (hooks/useAuth.ts).

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
