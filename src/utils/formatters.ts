import { formatEther } from 'viem';

/**
 * Formats a blockchain amount (in wei) to a human-readable format
 * @param amount - Amount in wei as string
 * @param decimals - Number of decimal places to display
 * @returns Formatted amount as string
 */
export const formatTokenAmount = (amount: string, decimals: number = 4): string => {
  try {
    return Number(formatEther(BigInt(amount))).toFixed(decimals);
  } catch (error) {
    console.error('Error formatting amount:', error);
    return '0.0000';
  }
};

/**
 * Shortens an Ethereum address for display
 * @param address - Ethereum address
 * @returns Shortened address (e.g. 0x1234...5678)
 */
export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
