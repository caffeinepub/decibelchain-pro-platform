import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

// CRITICAL: InternetIdentityProvider is intentionally NOT used here.
// It stores authClient in useState which causes an infinite re-render loop
// after every sign-in. AuthProvider uses the custom useAuth hook instead,
// which stores authClient in a useRef and runs the init effect exactly once.

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
