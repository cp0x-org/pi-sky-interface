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
  reward: string; // reward amounts
  transactions: {
    lockHash?: string;
    freeHash?: string;
  };
}

/**
 * Response from staking positions hook
 */
export interface StakingPositionData {
  positions: StakingPosition[];
  isLoading: boolean;
  error: string | null;
}
