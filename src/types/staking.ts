/**
 * Types for staking functionality
 */

/**
 * Represents a single staking position
 */
export interface StakingPosition {
  indexPosition: string;
  delegateID: string;
  wad: string;
  lockTimestamp: string;
  rewards: Record<string, RewardRecord>; // Map of reward ids to reward records
  defaultRewardId: string;
  transactions: {
    lockHash?: string;
    freeHash?: string;
  };
}

export interface RewardRecord {
  id: string;
  amount: string;
  symbol: string;
}

/**
 * Response from staking positions hook
 */
export interface StakingPositionData {
  positions: StakingPosition[];
  isLoading: boolean;
  error: string | null;
}
