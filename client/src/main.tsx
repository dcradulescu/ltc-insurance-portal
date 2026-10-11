import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpLink, splitLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import superjson from "superjson";
import App from "./App";
import { PolicyProvider } from "./contexts/PolicyContext";

import "./index.css";

const queryClient = new QueryClient();

// Private screens react immediately when their server session expires.

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED") window.dispatchEvent(new Event("ltc-session-expired"));
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED" && error.data?.path !== "auth.login") window.dispatchEvent(new Event("ltc-session-expired"));
  }
});

const trpcClient = trpc.createClient({
  links: [
    splitLink({ condition: op => op.type === "mutation",
      true: httpLink({ url: "/api/trpc", transformer: superjson, headers: { "x-ltc-request": "1" } }),
      false: httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers: { "x-ltc-request": "1" },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }) }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <PolicyProvider>
          <App />
        </PolicyProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
