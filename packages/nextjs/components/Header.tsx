"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${isActive ? "bg-brand/15 text-brand" : "text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary"}`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header — Doppel-style (match doppel-world HubNav)
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <header className="border-border/60 bg-bg-primary/80 sticky top-0 z-50 shrink-0 border-b backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 lg:px-10">
        {/* Left: mobile menu + logo + nav */}
        <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-6">
          <details className="dropdown shrink-0" ref={burgerMenuRef}>
            <summary className="btn btn-ghost lg:hidden hover:bg-bg-tertiary" aria-label="Open menu">
              <Bars3Icon className="h-6 w-6 text-text-primary" />
            </summary>
            <ul
              className="menu dropdown-content mt-3 w-52 rounded-lg border border-border bg-bg-secondary p-2 shadow-lg"
              onClick={() => {
                burgerMenuRef?.current?.removeAttribute("open");
              }}
            >
              <HeaderMenuLinks />
            </ul>
          </details>
          <Link href="/" className="flex shrink-0 items-baseline gap-3" aria-label="$DOPPEL Vesting home">
            <span className="text-brand text-xl font-bold tracking-tight transition-colors hover:text-brand-hover sm:text-2xl">
              $DOPPEL Vesting
            </span>
            <span className="text-text-muted hidden text-xs sm:inline">Linear vesting on Base</span>
          </Link>
        </div>

        {/* Right: optional Faucet, then account + balance (far right) */}
        <div className="flex shrink-0 items-center justify-end gap-2">
          {isLocalNetwork && <FaucetButton />}
          <div className="flex items-center gap-2">
            <RainbowKitCustomConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};
