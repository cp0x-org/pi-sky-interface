import { useStakingData } from './useStakingData';

export interface StakingPositionData {
  positions: Array<{
    indexPosition: string;
    delegateID: string;
    wad: string;
    lockTimestamp: string;
    transactions: {
      lockHash?: string;
      freeHash?: string;
    };
  }>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook that returns staking positions with delegateID, indexPosition, and wad amount
 * The wad amount represents the difference between stakingLocks and stakingFrees
 */
export const useStakingPositions = (): StakingPositionData => {
  const { positions, isLoading, error } = useStakingData();

  // Simple debug log without using hooks
  if (positions) {
    console.log('Staking positions in hook:', positions);
  }

  return {
    positions,
    isLoading,
    error
  };
};
