"use client";

import { CustodialWalletProvider } from "./providers/CustodialWalletProvider";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustodialWalletProvider>{children}</CustodialWalletProvider>;
}


