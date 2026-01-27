"use client";

import dynamic from "next/dynamic";

const ScaffoldEthAppWithProviders = dynamic(
  () => import("~~/components/ScaffoldEthAppWithProviders").then(mod => mod.ScaffoldEthAppWithProviders),
  { ssr: false },
);

export const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  return <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>;
};
