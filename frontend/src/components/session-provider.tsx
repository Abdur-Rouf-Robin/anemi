"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getAccess, getMe, type Access, type Me } from "@/lib/client-api";

type Session = {
  user: Me | null | undefined;
  access: Access | undefined;
  refresh: () => Promise<Me | null>;
  setUser: (user: Me | null) => void;
};

const SessionContext = createContext<Session>({
  user: undefined,
  access: undefined,
  refresh: async () => null,
  setUser: () => undefined
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null | undefined>(undefined);
  const [access, setAccess] = useState<Access | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      const [data, nextAccess] = await Promise.all([
        getMe(),
        getAccess().catch(() => ({ signupMode: "invite" as const, resetEnabled: false }))
      ]);
      setUser(data.user);
      setAccess(nextAccess);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ user, access, refresh, setUser }), [user, access, refresh]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
