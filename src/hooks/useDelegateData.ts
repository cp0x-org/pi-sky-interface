import { useState, useEffect } from 'react';

export interface DelegatesResponse {
  paginationInfo: {
    page: number;
    numPages: number | null;
    hasNextPage: boolean;
  };
  stats: {
    total: number;
    shadow: number;
    aligned: number;
    totalSkyDelegated: string;
    totalDelegators: number;
  };
  delegates: Delegate[];
}

export interface Delegate {
  name: string;
  voteDelegateAddress: string;
  address: string;
  status: string;
  creationDate: string;
  communication: string;
  combinedParticipation: string;
  pollParticipation: string;
  executiveParticipation: string;
  skyDelegated: string;
  delegatorCount: number;
  lastVoteDate: string | null;
  proposalsSupported: number;
}

export interface DelegateData {
  delegates: Delegate[];
  stats: {
    total: number;
    shadow: number;
    aligned: number;
    totalSkyDelegated: string;
    totalDelegators: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

export const useDelegateData = (): DelegateData => {
  const [delegatesData, setDelegatesData] = useState<{
    delegates: Delegate[];
    stats: DelegatesResponse['stats'] | null;
  }>({
    delegates: [],
    stats: null
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch delegates data
  useEffect(() => {
    const fetchDelegatesData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use the network from chainId (mainnet = 1)
        const url = `https://vote.sky.money/api/delegates?network=mainnet`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Error fetching delegates data: ${response.statusText}`);
        }

        const data: DelegatesResponse = await response.json();

        setDelegatesData({
          delegates: data.delegates,
          stats: data.stats
        });

        console.log('Delegates data fetched:', {
          totalDelegates: data.delegates.length,
          stats: data.stats
        });
      } catch (err) {
        console.error('Error fetching delegates data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDelegatesData();
  }, []);

  return {
    ...delegatesData,
    isLoading,
    error
  };
};
