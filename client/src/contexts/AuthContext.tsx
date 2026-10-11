import { createContext, useContext, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { clearAccountDrafts, setStorageAccount } from "@/lib/accountStorage";

type Account = { id: number; name: string | null; email: string | null; role: "user" | "admin" };
const AuthContext = createContext<{ user: Account | null; loading: boolean; error: boolean }>({ user: null, loading: true, error: false });
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: true, refetchInterval: 60_000, staleTime: 0 });
  const utils = trpc.useUtils();
  useEffect(() => {
    const expire = () => { clearAccountDrafts(); setStorageAccount(null); utils.auth.me.setData(undefined, null); };
    window.addEventListener("ltc-session-expired", expire);
    return () => window.removeEventListener("ltc-session-expired", expire);
  }, [utils]);
  const user = auth.isError ? null : auth.data || null;
  const previousAccount = useRef<number | null | undefined>(undefined);
  const currentAccount = user?.id ?? null;
  const accountChanged = !auth.isPending && previousAccount.current !== undefined && previousAccount.current !== currentAccount;
  useEffect(() => {
    if (auth.isPending) return;
    if (accountChanged) {
      if (previousAccount.current != null) clearAccountDrafts(previousAccount.current);
      setStorageAccount(null);
      // Includes a cookie/account change in another tab. Discard all query caches
      // before mounting the next account's private pages.
      window.location.reload();
      return;
    }
    previousAccount.current = currentAccount;
  }, [currentAccount, accountChanged, auth.isPending]);
  if (accountChanged) return <p className="p-10 text-center" role="status">Updating your session…</p>;
  // Set before private components mount and read their account-scoped draft cache.
  setStorageAccount(user?.id ?? null);
  return <AuthContext.Provider value={{ user, loading: auth.isPending, error: auth.isError }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
