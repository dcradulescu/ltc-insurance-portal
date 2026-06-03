import { createContext, useContext, useState } from "react";

interface PolicyContextValue {
  activePolicyId: number | undefined;
  setActivePolicyId: (id: number | undefined) => void;
}

const PolicyContext = createContext<PolicyContextValue>({
  activePolicyId: undefined,
  setActivePolicyId: () => {},
});

export function PolicyProvider({ children }: { children: React.ReactNode }) {
  const [activePolicyId, setActivePolicyId] = useState<number | undefined>(undefined);
  return (
    <PolicyContext.Provider value={{ activePolicyId, setActivePolicyId }}>
      {children}
    </PolicyContext.Provider>
  );
}

export function usePolicyContext() {
  return useContext(PolicyContext);
}
