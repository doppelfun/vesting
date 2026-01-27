"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const CLAWD_TOKEN = "0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07";
const VESTING_CONTRACT = "0x8d094DA613827Ec6B6C667D10b0719b494D76049";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [depositAmount, setDepositAmount] = useState("");
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [clawdPrice, setClawdPrice] = useState<number | null>(null);

  // Fetch $CLAWD price from DexScreener
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CLAWD_TOKEN}`);
        const data = await res.json();
        const pairs = data?.pairs;
        if (pairs && pairs.length > 0) {
          setClawdPrice(parseFloat(pairs[0].priceUsd));
        }
      } catch (e) {
        console.error("Failed to fetch CLAWD price:", e);
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Update clock every second for the progress bar
  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Read $CLAWD balance of connected wallet ---
  const { data: clawdBalance } = useReadContract({
    address: CLAWD_TOKEN,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: connectedAddress ? [connectedAddress] : undefined,
    query: { enabled: !!connectedAddress, refetchInterval: 5000 },
  });

  const { data: clawdDecimals } = useReadContract({
    address: CLAWD_TOKEN,
    abi: erc20Abi,
    functionName: "decimals",
  });

  // --- Read $CLAWD allowance for vesting contract ---
  const { data: allowance } = useReadContract({
    address: CLAWD_TOKEN,
    abi: erc20Abi,
    functionName: "allowance",
    args: connectedAddress ? [connectedAddress, VESTING_CONTRACT] : undefined,
    query: { enabled: !!connectedAddress, refetchInterval: 5000 },
  });

  // --- Read $CLAWD balance OF the vesting contract ---
  const { data: contractBalance } = useReadContract({
    address: CLAWD_TOKEN,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [VESTING_CONTRACT],
    query: { refetchInterval: 5000 },
  });

  // --- Read vesting contract state ---
  const { data: vestingStart } = useScaffoldReadContract({
    contractName: "ClawdVesting",
    functionName: "start",
  });

  const { data: vestingDuration } = useScaffoldReadContract({
    contractName: "ClawdVesting",
    functionName: "duration",
  });

  const { data: released } = useScaffoldReadContract({
    contractName: "ClawdVesting",
    functionName: "released",
    watch: true,
  });

  const { data: releasable } = useScaffoldReadContract({
    contractName: "ClawdVesting",
    functionName: "releasable",
    watch: true,
  });

  const { data: vested } = useScaffoldReadContract({
    contractName: "ClawdVesting",
    functionName: "vested",
    watch: true,
  });

  const { data: beneficiary } = useScaffoldReadContract({
    contractName: "ClawdVesting",
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

  // --- Write: Transfer (deposit) ---
  const { writeContract: writeTransfer, data: transferTxHash } = useWriteContract();
  const { isLoading: isDepositing, isSuccess: depositConfirmed } = useWaitForTransactionReceipt({
    hash: transferTxHash,
  });

  // Clear deposit UI after successful deposit
  useEffect(() => {
    if (depositConfirmed) {
      setDepositAmount("");
      setApprovedSuccessfully(false);
    }
  }, [depositConfirmed]);

  // --- Write: Release ---
  const { writeContractAsync: writeRelease } = useScaffoldWriteContract("ClawdVesting");

  // Derived values
  const decimals = clawdDecimals ?? 18;
  const formattedBalance = clawdBalance !== undefined ? formatUnits(clawdBalance, decimals) : "0";
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
    if (!depositAmount) return;
    const amt = parseUnits(depositAmount, decimals);
    writeApprove({
      address: CLAWD_TOKEN,
      abi: erc20Abi,
      functionName: "approve",
      args: [VESTING_CONTRACT, amt],
    });
  };

  const handleDeposit = () => {
    if (!depositAmount) return;
    const amt = parseUnits(depositAmount, decimals);
    writeTransfer({
      address: CLAWD_TOKEN,
      abi: erc20Abi,
      functionName: "transfer",
      args: [VESTING_CONTRACT, amt],
    });
  };

  const handleRelease = async () => {
    await writeRelease({ functionName: "release" });
  };

  const hasReleasableTokens = releasable !== undefined && releasable > 0n;

  return (
    <div className="flex flex-col items-center grow pt-10 px-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Wallet Balance */}
        <div className="bg-base-200 rounded-3xl p-6">
          <div className="flex justify-between items-center">
            <span className="text-lg opacity-70">Your $CLAWD Balance</span>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {Number(formattedBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} $CLAWD
              </div>
              {clawdPrice !== null && clawdBalance !== undefined && (
                <div className="text-sm opacity-50">
                  ≈ $
                  {(Number(formattedBalance) * clawdPrice).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Deposit Section */}
        <div className="bg-base-200 rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-bold">📥 Deposit</h2>
          <p className="opacity-70 text-sm">
            Send $CLAWD to the vesting contract. Tokens will vest linearly and become claimable over time.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Amount of $CLAWD"
              className="input input-bordered flex-1 text-lg"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
            />
            <button
              className="btn btn-sm text-xs opacity-50"
              onClick={() => {
                if (clawdBalance !== undefined) setDepositAmount(formatUnits(clawdBalance, decimals));
              }}
            >
              MAX
            </button>
          </div>
          <div className="flex gap-3">
            {needsApproval ? (
              <button
                className="btn btn-primary flex-1"
                onClick={handleApprove}
                disabled={!depositAmount || isApproving || !!approveTxHash}
              >
                {isApproving || approveTxHash
                  ? "⏳ Approving..."
                  : `Approve ${depositAmount || "0"} $CLAWD${clawdPrice && depositAmount ? ` ($${(Number(depositAmount) * clawdPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })})` : ""}`}
              </button>
            ) : (
              <button
                className="btn btn-success flex-1"
                onClick={handleDeposit}
                disabled={!depositAmount || isDepositing || (!!transferTxHash && !depositConfirmed)}
              >
                {isDepositing || (transferTxHash && !depositConfirmed) ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span> Depositing...
                  </>
                ) : (
                  `Deposit ${depositAmount || "0"} $CLAWD${clawdPrice && depositAmount ? ` ($${(Number(depositAmount) * clawdPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })})` : ""}`
                )}
              </button>
            )}
          </div>
        </div>

        {/* Vesting Timeline */}
        <div className="bg-base-200 rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-bold">⏳ Vesting Timeline</h2>

          {/* Progress Bar */}
          <div className="w-full bg-base-300 rounded-full h-6 relative overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
              {progress.toFixed(1)}% vested
            </span>
          </div>

          {/* Time Info */}
          <div className="flex justify-between text-sm opacity-70">
            <span>Started: {startTime > 0 ? new Date(startTime * 1000).toLocaleString() : "—"}</span>
            <span>
              {timeRemaining > 0 ? `${minutesRemaining}m ${secondsRemaining}s remaining` : "✅ Fully vested!"}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-base-300 rounded-xl p-4 text-center">
              <div className="text-sm opacity-70">In Contract</div>
              <div className="text-xl font-bold">
                {Number(formattedContractBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              {clawdPrice !== null && (
                <div className="text-xs opacity-50">
                  ≈ $
                  {(Number(formattedContractBalance) * clawdPrice).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}
            </div>
            <div className="bg-base-300 rounded-xl p-4 text-center">
              <div className="text-sm opacity-70">Total Vested</div>
              <div className="text-xl font-bold">
                {Number(formattedVested).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              {clawdPrice !== null && (
                <div className="text-xs opacity-50">
                  ≈ $
                  {(Number(formattedVested) * clawdPrice).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}
            </div>
            <div className="bg-base-300 rounded-xl p-4 text-center">
              <div className="text-sm opacity-70">Already Released</div>
              <div className="text-xl font-bold">
                {Number(formattedReleased).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              {clawdPrice !== null && (
                <div className="text-xs opacity-50">
                  ≈ $
                  {(Number(formattedReleased) * clawdPrice).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}
            </div>
            <div className="bg-base-300 rounded-xl p-4 text-center text-success">
              <div className="text-sm opacity-70">Ready to Claim</div>
              <div className="text-xl font-bold">
                {Number(formattedReleasable).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              {clawdPrice !== null && (
                <div className="text-xs opacity-50">
                  ≈ $
                  {(Number(formattedReleasable) * clawdPrice).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Withdraw Section */}
        <div className="bg-base-200 rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-bold">💰 Withdraw</h2>
          <p className="opacity-70 text-sm">
            Claim vested tokens. Anyone can call this — tokens always go to the beneficiary.
          </p>
          <button className="btn btn-primary btn-lg w-full" onClick={handleRelease} disabled={!hasReleasableTokens}>
            {hasReleasableTokens
              ? `Claim ${Number(formattedReleasable).toLocaleString(undefined, { maximumFractionDigits: 2 })} $CLAWD`
              : "Nothing to claim yet"}
          </button>
          {beneficiary && <p className="text-xs opacity-50 text-center">Beneficiary: {beneficiary}</p>}
        </div>

        {/* Contract Info */}
        <div className="text-center opacity-50 text-sm pb-8">
          <a
            href={`https://basescan.org/address/${VESTING_CONTRACT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            View contract on BaseScan ↗
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;
