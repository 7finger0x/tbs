'use client';

import { useQuery } from '@tanstack/react-query';
import { getReputationAction } from '@/server/actions/reputation';
import type { Address } from 'viem';
import type { ReputationData } from '@/types/reputation';

export function useReputation(address: Address | undefined) {
  return useQuery<ReputationData>({
    queryKey: ['reputation', address],
    queryFn: async () => {
      if (!address) {
        throw new Error('Address is required');
      }
      const result = await getReputationAction(address);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch reputation');
      }
      return result.data;
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
