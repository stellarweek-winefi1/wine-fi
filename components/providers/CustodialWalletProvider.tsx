"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import supabaseClient from "@/lib/supabaseClient";

type WalletInfo = {
  publicKey: string;
  provider?: string | null;
  createdAt?: string | null;
};

type CustodialWalletContextValue = {
  session: Session | null;
  wallet: WalletInfo | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isWalletReady: boolean;
  ensureWallet: () => Promise<WalletInfo | null>;
  signPayment: (payload: {
    destination: string;
    amount: number | string;
    asset?: { code?: string; issuer?: string };
    memo?: string;
    submit?: boolean;
  }) => Promise<{ txHash?: string; xdr?: string }>;
};

const CustodialWalletContext = createContext<CustodialWalletContextValue | null>(
  null,
);

const FUNCTIONS_BASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
  .replace(/\/$/, "")
  .concat("/functions/v1");

async function parseJsonResponse(response: Response) {
  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    return await response.json();
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text || "Unexpected response from server" };
  }
}

export const CustodialWalletProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (!currentSession) {
        setWallet(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const callWalletFunction = useCallback(
    async (path: string, init?: RequestInit) => {
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }
      if (!FUNCTIONS_BASE_URL || FUNCTIONS_BASE_URL === "/functions/v1") {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
      }

      const response = await fetch(`${FUNCTIONS_BASE_URL}/${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          ...(init?.headers || {}),
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await parseJsonResponse(response);
        const message =
          typeof payload.error === "string"
            ? payload.error
            : `Request failed (${response.status})`;
        throw new Error(message);
      }

      return (await parseJsonResponse(response)) as Record<string, any>;
    },
    [session?.access_token],
  );

  const ensureWallet = useCallback(async () => {
    if (!session) {
      setWallet(null);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const { wallet } = await callWalletFunction("wallets-default", {
        method: "GET",
      });
      setWallet(wallet ?? null);
      return wallet ?? null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setWallet(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [callWalletFunction, session]);

  const signPayment = useCallback(
    async (payload: {
      destination: string;
      amount: number | string;
      asset?: { code?: string; issuer?: string };
      memo?: string;
      submit?: boolean;
    }) => {
      if (!session) {
        throw new Error("You must be logged in to send payments.");
      }
      const result = await callWalletFunction("wallets-sign-payment", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (result.txHash) {
        return { txHash: result.txHash as string };
      }
      return { xdr: result.xdr as string | undefined };
    },
    [callWalletFunction, session],
  );

  useEffect(() => {
    if (session) {
      ensureWallet();
    } else {
      setWallet(null);
    }
  }, [session, ensureWallet]);

  const value = useMemo<CustodialWalletContextValue>(
    () => ({
      session,
      wallet,
      loading,
      error,
      isAuthenticated: !!session,
      isWalletReady: !!wallet,
      ensureWallet,
      signPayment,
    }),
    [session, wallet, loading, error, ensureWallet, signPayment],
  );

  return (
    <CustodialWalletContext.Provider value={value}>
      {children}
    </CustodialWalletContext.Provider>
  );
};

export function useCustodialWallet() {
  const context = useContext(CustodialWalletContext);
  if (!context) {
    throw new Error(
      "useCustodialWallet must be used inside a CustodialWalletProvider",
    );
  }
  return context;
}



