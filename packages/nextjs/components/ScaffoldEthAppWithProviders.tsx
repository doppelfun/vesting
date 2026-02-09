"use client";

import React from "react";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
// import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <style>{`body { overflow: auto !important; }`}</style>
      <div className="bg-bg-primary text-text-primary relative flex min-h-screen flex-col overflow-x-hidden">
        {/* Coordinate grid background (match doppel-world) */}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.035]"
          style={{
            backgroundImage: [
              "linear-gradient(to right, #c5fd90 1px, transparent 1px)",
              "linear-gradient(to bottom, #c5fd90 1px, transparent 1px)",
            ].join(", "),
            backgroundSize: "80px 80px",
          }}
        />
        <Header />
        <main className="relative z-10 flex flex-1 flex-col">{children}</main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider avatar={BlockieAvatar} theme={darkTheme()}>
          <ProgressBar height="3px" color="#c5fd90" />
          <ScaffoldEthApp>{children}</ScaffoldEthApp>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
