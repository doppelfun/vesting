import React from "react";
import Link from "next/link";
import { useFetchNativeCurrencyPrice } from "@scaffold-ui/hooks";
import { hardhat } from "viem/chains";
import { CurrencyDollarIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Faucet } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

/**
 * Site footer — Doppel-style (match doppel-world)
 */
export const Footer = () => {
  const { targetNetwork } = useTargetNetwork();
  const { data: vestingContract } = useDeployedContractInfo({ contractName: "DoppelVesting" });
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const { price: nativeCurrencyPrice } = useFetchNativeCurrencyPrice();
  const vestingContractAddress = vestingContract?.address;
  const explorerName = targetNetwork.blockExplorers?.default?.name ?? "Explorer";

  return (
    <footer className="border-border relative z-10 mt-auto shrink-0 border-t">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center lg:px-10">
        <div className="flex items-baseline gap-3">
          <span className="text-brand text-lg font-bold">$DOPPEL Vesting</span>
          <span className="text-text-muted text-xs">Linear token vesting on Base</span>
        </div>
        <div className="text-text-muted flex flex-wrap items-center gap-4 text-xs sm:gap-6">
          {nativeCurrencyPrice > 0 && (
            <span className="inline-flex items-center gap-1">
              <CurrencyDollarIcon className="h-4 w-4" />
              {nativeCurrencyPrice.toFixed(2)}
            </span>
          )}
          {isLocalNetwork && (
            <>
              <Faucet />
              <Link href="/blockexplorer" className="hover:text-brand inline-flex items-center gap-1 transition-colors">
                <MagnifyingGlassIcon className="h-4 w-4" />
                Block Explorer
              </Link>
            </>
          )}
          <a
            href="https://github.com/doppelfun/vesting"
            target="_blank"
            rel="noreferrer"
            className="hover:text-brand transition-colors"
          >
            GitHub
          </a>
          {vestingContractAddress && (
            <a
              href={getBlockExplorerAddressLink(targetNetwork, vestingContractAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand transition-colors"
            >
              {explorerName}
            </a>
          )}
          <a
            href="https://x.com/doppelfun"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand transition-colors"
          >
            @doppelfun
          </a>
        </div>
      </div>
    </footer>
  );
};
