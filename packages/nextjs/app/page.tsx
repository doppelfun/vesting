"use client";

import { useEffect, useState } from "react";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
  useDeployedContractInfo,
  useScaffoldReadContract,
  useScaffoldWriteContract,
  useTargetNetwork,
} from "~~/hooks/scaffold-eth";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const [depositAmount, setDepositAmount] = useState("");
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [doppelPrice, setDoppelPrice] = useState<number | null>(null);

  // Vesting contract address for the current chain (from deployedContracts)
  const { data: vestingContract } = useDeployedContractInfo({ contractName: "DoppelVesting" });
  const vestingContractAddress = vestingContract?.address;

  // Read token, beneficiary, start, duration, allocation, released from the contract
  const { data: doppelTokenAddress } = useScaffoldReadContract({
    contractName: "DoppelVesting",
    functionName: "token",
  });
  const DOPPEL_TOKEN = doppelTokenAddress as `0x${string}` | undefined;

  // Token symbol from the ERC20 contract (for display)
  const { data: tokenSymbol } = useReadContract({
    address: DOPPEL_TOKEN,
    abi: erc20Abi,
    functionName: "symbol",
    query: { enabled: !!DOPPEL_TOKEN },
  });
  const symbol = tokenSymbol != null ? String(tokenSymbol).replace(/^"+|"+$/g, "") : "TOKEN";

  // Fetch $DOPPEL price from DexScreener
  useEffect(() => {
    if (!DOPPEL_TOKEN) return;
    const fetchPrice = async () => {
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${DOPPEL_TOKEN}`);
        const data = await res.json();
        const pairs = data?.pairs;
        if (pairs && pairs.length > 0) {
          setDoppelPrice(parseFloat(pairs[0].priceUsd));
        }
      } catch (e) {
        console.error("Failed to fetch DOPPEL price:", e);
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [DOPPEL_TOKEN]);

  // Update clock every second for the progress bar
  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Read $DOPPEL balance of connected wallet ---
  const { data: doppelBalance } = useReadContract({
    address: DOPPEL_TOKEN,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: connectedAddress ? [connectedAddress] : undefined,
    query: { enabled: !!connectedAddress && !!DOPPEL_TOKEN, refetchInterval: 5000 },
  });

  const { data: doppelDecimals } = useReadContract({
    address: DOPPEL_TOKEN,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: !!DOPPEL_TOKEN },
  });

  // --- Read token allowance for vesting contract ---
  const { data: allowance } = useReadContract({
    address: DOPPEL_TOKEN,
    abi: erc20Abi,
    functionName: "allowance",
    args: connectedAddress && vestingContractAddress ? [connectedAddress, vestingContractAddress] : undefined,
    query: {
      enabled: !!connectedAddress && !!DOPPEL_TOKEN && !!vestingContractAddress,
      refetchInterval: 5000,
    },
  });

  // --- Read token balance OF the vesting contract ---
  const { data: contractBalance } = useReadContract({
    address: DOPPEL_TOKEN,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: vestingContractAddress ? [vestingContractAddress] : undefined,
    query: { enabled: !!DOPPEL_TOKEN && !!vestingContractAddress, refetchInterval: 5000 },
  });

  // --- Read vesting contract state ---
  const { data: vestingStart } = useScaffoldReadContract({
    contractName: "DoppelVesting",
    functionName: "start",
  });

  const { data: vestingDuration } = useScaffoldReadContract({
    contractName: "DoppelVesting",
    functionName: "duration",
  });

  const { data: released } = useScaffoldReadContract({
    contractName: "DoppelVesting",
    functionName: "released",
    watch: true,
  });

  const { data: releasable } = useScaffoldReadContract({
    contractName: "DoppelVesting",
    functionName: "releasable",
    watch: true,
  });

  const { data: vested } = useScaffoldReadContract({
    contractName: "DoppelVesting",
    functionName: "vested",
    watch: true,
  });

  const { data: totalAllocation } = useScaffoldReadContract({
    contractName: "DoppelVesting",
    functionName: "totalAllocation",
    watch: true,
  });

  const { data: beneficiary } = useScaffoldReadContract({
    contractName: "DoppelVesting",
    functionName: "beneficiary",
  });

  // --- Write: Approve ---
  const { writeContract: writeApprove, data: approveTxHash } = useWriteContract();
  const { isLoading: isApproving, isSuccess: approveConfirmed } = useWaitForTransactionReceipt({ hash: approveTxHash });
  const [approvedSuccessfully, setApprovedSuccessfully] = useState(false);

  // When approve tx confirms, mark it so we switch to deposit button
  useEffect(() => {
    if (approveConfirmed) {
      setApprovedSuccessfully(true);
    }
  }, [approveConfirmed]);

  // Reset approval state if deposit amount changes
  useEffect(() => {
    setApprovedSuccessfully(false);
  }, [depositAmount]);

  // --- Write: Deposit ---
  const { writeContractAsync: writeDeposit, data: depositTxHash } = useScaffoldWriteContract("DoppelVesting");
  const { isLoading: isDepositing, isSuccess: depositConfirmed } = useWaitForTransactionReceipt({
    hash: depositTxHash,
  });

  // Clear deposit UI after successful deposit
  useEffect(() => {
    if (depositConfirmed) {
      setDepositAmount("");
      setApprovedSuccessfully(false);
    }
  }, [depositConfirmed]);

  // --- Write: Release ---
  const { writeContractAsync: writeRelease } = useScaffoldWriteContract("DoppelVesting");

  // Derived values
  const decimals = doppelDecimals ?? 18;
  const formattedBalance = doppelBalance !== undefined ? formatUnits(doppelBalance, decimals) : "0";
  const formattedContractBalance = contractBalance !== undefined ? formatUnits(contractBalance, decimals) : "0";
  const formattedReleased = released !== undefined ? formatUnits(released, decimals) : "0";
  const formattedReleasable = releasable !== undefined ? formatUnits(releasable, decimals) : "0";
  const formattedVested = vested !== undefined ? formatUnits(vested, decimals) : "0";

  const startTime = vestingStart ? Number(vestingStart) : 0;
  const duration = vestingDuration ? Number(vestingDuration) : 600;
  const endTime = startTime + duration;
  const elapsed = Math.max(0, now - startTime);
  const progress = Math.min(100, (elapsed / duration) * 100);
  const timeRemaining = Math.max(0, endTime - now);
  const minutesRemaining = Math.floor(timeRemaining / 60);
  const secondsRemaining = timeRemaining % 60;

  const needsApproval = (() => {
    // If we just approved successfully, skip straight to deposit
    if (approvedSuccessfully) return false;
    // If approve tx is pending, stay on approve (disabled)
    if (isApproving) return true;
    if (!depositAmount || !allowance) return true;
    try {
      const amt = parseUnits(depositAmount, decimals);
      return allowance < amt;
    } catch {
      return true;
    }
  })();

  const handleApprove = () => {
    if (!depositAmount || !DOPPEL_TOKEN || !vestingContractAddress) return;
    const amt = parseUnits(depositAmount, decimals);
    writeApprove({
      address: DOPPEL_TOKEN,
      abi: erc20Abi,
      functionName: "approve",
      args: [vestingContractAddress, amt],
    });
  };

  const handleDeposit = () => {
    if (!depositAmount) return;
    const amt = parseUnits(depositAmount, decimals);
    writeDeposit({ functionName: "deposit", args: [amt] });
  };

  const handleRelease = async () => {
    await writeRelease({ functionName: "release" });
  };

  const hasReleasableTokens = releasable !== undefined && releasable > 0n;

  return (
    <div className="flex grow flex-col items-center px-4 pt-10">
      <div className="w-full max-w-2xl space-y-8">
        {/* Wallet Balance */}
        <div className="bg-bg-secondary border-border rounded-2xl border p-6">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-lg">Your {symbol} Balance</span>
            <div className="text-right">
              <div className="text-text-primary text-2xl font-bold">
                {Number(formattedBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} {symbol}
              </div>
              {doppelPrice !== null && doppelBalance !== undefined && (
                <div className="text-text-muted text-sm">
                  ≈ $
                  {(Number(formattedBalance) * doppelPrice).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Deposit Section — hidden once funded */}
        {(!totalAllocation || totalAllocation === 0n) && (
          <div className="bg-bg-secondary border-border rounded-2xl border p-6 space-y-4">
            <h2 className="text-text-primary text-xl font-bold">Deposit</h2>
            <p className="text-text-secondary text-sm">
              Send {symbol} to the vesting contract. Tokens will vest linearly and become claimable over time.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder={`Amount of ${symbol}`}
                className="input input-bordered border-border bg-bg-tertiary text-text-primary placeholder:text-text-muted flex-1 rounded-lg text-lg focus:border-brand focus:outline-brand"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
              />
              <button
                className="btn btn-ghost text-text-muted hover:text-text-primary btn-sm text-xs"
                onClick={() => {
                  if (doppelBalance !== undefined) setDepositAmount(formatUnits(doppelBalance, decimals));
                }}
              >
                MAX
              </button>
            </div>
            <div className="flex gap-3">
              {needsApproval ? (
                <button
                  className="btn bg-brand hover:bg-brand-hover text-brand-dark flex-1 border-0 font-semibold disabled:cursor-not-allowed disabled:bg-bg-tertiary disabled:text-text-muted disabled:hover:bg-bg-tertiary"
                  onClick={handleApprove}
                  disabled={!depositAmount || isApproving || !!approveTxHash || !vestingContractAddress}
                >
                  {isApproving || approveTxHash
                    ? "Approving..."
                    : `Approve ${depositAmount || "0"} ${symbol}${doppelPrice && depositAmount ? ` ($${(Number(depositAmount) * doppelPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })})` : ""}`}
                </button>
              ) : (
                <button
                  className="btn bg-brand hover:bg-brand-hover text-brand-dark flex-1 border-0 font-semibold disabled:cursor-not-allowed disabled:bg-bg-tertiary disabled:text-text-muted disabled:hover:bg-bg-tertiary"
                  onClick={handleDeposit}
                  disabled={
                    !depositAmount || isDepositing || (!!depositTxHash && !depositConfirmed) || !vestingContractAddress
                  }
                >
                  {isDepositing || (depositTxHash && !depositConfirmed) ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span> Depositing...
                    </>
                  ) : (
                    `Deposit ${depositAmount || "0"} ${symbol}${doppelPrice && depositAmount ? ` ($${(Number(depositAmount) * doppelPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })})` : ""}`
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Vesting Timeline */}
        <div className="bg-bg-secondary border-border rounded-2xl border p-6 space-y-4">
          <h2 className="text-text-primary text-xl font-bold">Vesting Timeline</h2>

          {/* Progress Bar — label below so we never show white-on-green */}
          <div className="space-y-1.5">
            <div className="bg-bg-tertiary relative h-6 w-full overflow-hidden rounded-full">
              <div
                className="bg-brand h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-text-secondary text-center text-sm font-medium">{progress.toFixed(1)}% vested</p>
          </div>

          {/* Time Info */}
          <div className="text-text-secondary flex justify-between text-sm">
            <span>Started: {startTime > 0 ? new Date(startTime * 1000).toLocaleString() : "—"}</span>
            <span>{timeRemaining > 0 ? `${minutesRemaining}m ${secondsRemaining}s remaining` : "Fully vested!"}</span>
          </div>

          {/* Stats Grid */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-bg-tertiary rounded-xl p-4 text-center">
              <div className="text-text-secondary text-sm">In Contract</div>
              <div className="text-text-primary text-xl font-bold">
                {Number(formattedContractBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              {doppelPrice !== null && (
                <div className="text-text-muted text-xs">
                  ≈ $
                  {(Number(formattedContractBalance) * doppelPrice).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}
            </div>
            <div className="bg-bg-tertiary rounded-xl p-4 text-center">
              <div className="text-text-secondary text-sm">Total Vested</div>
              <div className="text-text-primary text-xl font-bold">
                {Number(formattedVested).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              {doppelPrice !== null && (
                <div className="text-text-muted text-xs">
                  ≈ $
                  {(Number(formattedVested) * doppelPrice).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}
            </div>
            <div className="bg-bg-tertiary rounded-xl p-4 text-center">
              <div className="text-text-secondary text-sm">Already Released</div>
              <div className="text-text-primary text-xl font-bold">
                {Number(formattedReleased).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              {doppelPrice !== null && (
                <div className="text-text-muted text-xs">
                  ≈ $
                  {(Number(formattedReleased) * doppelPrice).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}
            </div>
            <div className="bg-brand/15 border-brand/40 text-brand rounded-xl border p-4 text-center">
              <div className="text-sm font-medium">Ready to Claim</div>
              <div className="text-xl font-bold">
                {Number(formattedReleasable).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              {doppelPrice !== null && (
                <div className="text-brand/80 text-xs">
                  ≈ $
                  {(Number(formattedReleasable) * doppelPrice).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Withdraw Section */}
        <div className="bg-bg-secondary border-border rounded-2xl border p-6 space-y-4">
          <h2 className="text-text-primary text-xl font-bold">Withdraw</h2>
          <p className="text-text-secondary text-sm">
            Claim vested tokens. Anyone can call this — tokens always go to the beneficiary.
          </p>
          <button
            className="btn bg-brand hover:bg-brand-hover text-brand-dark w-full border-0 py-3 font-semibold disabled:cursor-not-allowed disabled:bg-bg-tertiary disabled:text-text-muted disabled:hover:bg-bg-tertiary"
            onClick={handleRelease}
            disabled={!hasReleasableTokens || !vestingContractAddress}
          >
            {hasReleasableTokens
              ? `Claim ${Number(formattedReleasable).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`
              : "Nothing to claim yet"}
          </button>
          {beneficiary && (
            <div className="text-text-muted flex items-center justify-center gap-1 text-center text-xs">
              Beneficiary: <Address address={beneficiary as `0x${string}`} size="xs" />
            </div>
          )}
        </div>

        {/* Contract Info — explorer link for current network */}
        {vestingContractAddress && (
          <div className="text-text-muted pb-8 text-center text-sm">
            <a
              href={getBlockExplorerAddressLink(targetNetwork, vestingContractAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand transition-colors"
            >
              View contract on {targetNetwork.blockExplorers?.default?.name ?? "Explorer"} ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
