import { CHAINS, type ChainType } from "@/constants";
import { selectedChain$ } from "@/components/ChainSelector/chain.state";

// Legacy function for backward compatibility
export const formatToken = (value: bigint | null | undefined) => {
  if (value == null) return "";

  // Get current chain configuration
  const currentChain = selectedChain$.getValue() as ChainType;
  const chainConfig = CHAINS[currentChain];

  return `${(Number(value) / 10 ** chainConfig.decimals).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  })} ${chainConfig.symbol}`;
};

// New chain-aware format function
export const formatTokenForChain = (value: bigint | null | undefined, chainType: ChainType) => {
  if (value == null) return "";

  const chainConfig = CHAINS[chainType];

  return `${(Number(value) / 10 ** chainConfig.decimals).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  })} ${chainConfig.symbol}`;
};

export const formatCurrency = (
  value: number | null | undefined,
  symbol: string,
  maximumFractionDigits = 2
) => {
  if (value == null) return "";

  const valueStr = value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits,
  });

  if (symbol === "$") return `$${valueStr}`;
  return `${valueStr} ${symbol}`;
};

export const formatUsd = (value: number | null | undefined) =>
  formatCurrency(value, "$");
