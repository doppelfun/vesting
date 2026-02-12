import { useQuery } from "@tanstack/react-query";
import { parseAbiItem } from "viem";
import { useBlockNumber, usePublicClient } from "wagmi";
import { useSelectedNetwork } from "~~/hooks/scaffold-eth";

const BATCH_SIZE = 2000n;
/** Common burn address (0x...dead) used by many tokens. */
const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD" as const;
/** When fromBlock is not provided, only scan this many blocks back (avoids scanning from genesis). */
const DEFAULT_BLOCK_RANGE = 50_000n;

export type TokenBurnEvent = {
  from: `0x${string}`;
  value: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  logIndex: number;
};

export function useTokenBurns(
  tokenAddress: `0x${string}` | undefined,
  fromBlock?: number,
): { burns: TokenBurnEvent[]; isLoading: boolean; error: Error | null } {
  const selectedNetwork = useSelectedNetwork();
  const publicClient = usePublicClient({ chainId: selectedNetwork.id });
  const { data: blockNumber } = useBlockNumber({ chainId: selectedNetwork.id });

  const query = useQuery({
    queryKey: ["tokenBurns", tokenAddress, fromBlock?.toString(), blockNumber?.toString(), selectedNetwork.id],
    queryFn: async (): Promise<TokenBurnEvent[]> => {
      if (!publicClient || !tokenAddress || blockNumber === undefined) return [];

      const end = BigInt(blockNumber);
      const start =
        fromBlock !== undefined ? BigInt(fromBlock) : end - DEFAULT_BLOCK_RANGE > 0n ? end - DEFAULT_BLOCK_RANGE : 0n;
      if (start > end) return [];

      const burns: TokenBurnEvent[] = [];
      let currentFrom = start;

      const transferEvent = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");

      while (currentFrom <= end) {
        const currentTo = currentFrom + BATCH_SIZE - 1n > end ? end : currentFrom + BATCH_SIZE - 1n;
        const logs = await publicClient.getLogs({
          address: tokenAddress,
          event: transferEvent,
          args: { to: BURN_ADDRESS },
          fromBlock: currentFrom,
          toBlock: currentTo,
        });

        for (const log of logs) {
          const args = log.args as { from: `0x${string}`; to: `0x${string}`; value: bigint } | undefined;
          if (args?.from !== undefined && args?.value !== undefined) {
            burns.push({
              from: args.from,
              value: args.value,
              blockNumber: log.blockNumber ?? 0n,
              transactionHash: log.transactionHash ?? "0x",
              logIndex: log.logIndex ?? 0,
            });
          }
        }
        currentFrom = currentTo + 1n;
      }

      burns.sort((a, b) => {
        const blockA = Number(a.blockNumber);
        const blockB = Number(b.blockNumber);
        if (blockB !== blockA) return blockB - blockA; // DESC by block (newest first)
        return b.logIndex - a.logIndex;
      });
      return burns;
    },
    enabled: Boolean(publicClient && tokenAddress && blockNumber !== undefined),
  });

  return {
    burns: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}
