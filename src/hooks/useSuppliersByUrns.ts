import { useEffect, useState } from 'react';

interface StakingUrn {
  owner: string;
}

interface StakingUrnsResponse {
  data: {
    stakingUrns: StakingUrn[];
  };
  errors?: any;
}

interface UseDelegatorsSumResult {
  totalDelegators: number;
  totalPositions: number;
  isLoading: boolean;
  error: string | null;
}
const GRAPHQL_LIMIT = 1000;

export const useSuppliersByUrns = (): UseDelegatorsSumResult => {
  const [totalDelegators, setTotalDelegators] = useState<number>(0);
  const [totalPositions, setTotalPositions] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStakingUrns = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let allStakingUrns: StakingUrn[] = [];
        let skip = 0;
        let hasMore = true;

        while (hasMore) {
          // Add a timeout to prevent hanging if the GraphQL endpoint is slow
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          try {
            const query = `
              {
                    stakingUrns(first: ${GRAPHQL_LIMIT}, skip: ${skip}, where: {skyLocked_gt: "0"}) {
                      owner
                      skyLocked
                    }
              }
            `;

            console.log(`Fetching stakingUrns: skip=${skip}, limit=${GRAPHQL_LIMIT}`);

            const response = await fetch('https://query-subgraph.sky.money/subgraphs/name/jetstreamgg/sky-subgraph-mainnet', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ query }),
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`Error fetching staking urns data: ${response.statusText}`);
            }

            const result: StakingUrnsResponse = await response.json();

            if (result.errors) {
              throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
            }

            if (!result.data || !result.data.stakingUrns) {
              throw new Error('GraphQL response missing staking urns data');
            }

            const stakingUrns = result.data.stakingUrns;
            console.log(`Batch ${skip / GRAPHQL_LIMIT + 1}: fetched ${stakingUrns.length} staking urns`);

            // Add batch to the accumulated results
            allStakingUrns = [...allStakingUrns, ...stakingUrns];

            // Check if we need to fetch more data
            if (stakingUrns.length === 0 || stakingUrns.length < GRAPHQL_LIMIT) {
              hasMore = false;
            } else {
              skip += GRAPHQL_LIMIT;
            }
          } catch (fetchError: any) {
            if (fetchError.name === 'AbortError') {
              throw new Error('GraphQL request timed out');
            }
            throw fetchError;
          }
        }

        console.log('Total staking urns from subgraph:', allStakingUrns.length);

        // Get unique owner addresses
        const uniqueSuppliers = new Set(allStakingUrns.map((urn) => urn.owner.toLowerCase()));
        const suppliers = Array.from(uniqueSuppliers);

        // Set the total number of positions (total staking URNs)
        setTotalPositions(allStakingUrns.length);

        // Set the total number of unique suppliers (owners)
        setTotalDelegators(suppliers.length);

        console.log('Total positions:', allStakingUrns.length);
        console.log('Total unique suppliers:', suppliers.length);
      } catch (err) {
        console.error('Error fetching or processing staking urns data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStakingUrns();
  }, []);

  // Combine loading and error states from both hooks
  const combinedIsLoading = isLoading;
  return {
    totalDelegators, // unique delegators
    totalPositions, // total staking positions
    isLoading: combinedIsLoading,
    error: error
  };
};
