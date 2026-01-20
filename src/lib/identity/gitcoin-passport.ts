import 'server-only';
import type { Address } from 'viem';
import { normalizeAddress } from '@/lib/utils';
// Environment variable helper
function getEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * Gitcoin Passport Integration
 * 
 * Gitcoin Passport provides a decentralized identity verification system
 * that aggregates attestations from various sources.
 */

export interface GitcoinPassportScore {
  score: number;
  stamps: GitcoinStamp[];
  lastUpdated: Date;
}

export interface GitcoinStamp {
  provider: string;
  credential: {
    type: string[];
    proof: {
      type: string;
      created: string;
      proofPurpose: string;
      verificationMethod: string;
      jws: string;
    };
  };
  verified: boolean;
}

/**
 * Get Gitcoin Passport score for an address
 * 
 * @param address - Ethereum address to check
 * @returns Passport score (0-100) or null if not found
 */
export async function getGitcoinPassportScore(address: Address): Promise<number | null> {
  try {
    const apiKey = getEnv('GITCOIN_PASSPORT_API_KEY');
    
    if (!apiKey) {
      // If no API key, return null (graceful degradation)
      return null;
    }

    const normalizedAddress = normalizeAddress(address);
    
    // Gitcoin Passport API endpoint
    const apiUrl = `https://api.scorer.gitcoin.co/registry/score/${normalizedAddress}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Address doesn't have a passport
        return null;
      }
      throw new Error(`Gitcoin API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Gitcoin returns score as a number (0-100)
    if (data.score !== undefined && typeof data.score === 'number') {
      return Math.min(100, Math.max(0, data.score));
    }

    return null;
  } catch (error) {
    console.error('Error fetching Gitcoin Passport score:', error);
    return null;
  }
}

/**
 * Get Gitcoin Passport stamps for an address
 * 
 * @param address - Ethereum address to check
 * @returns Array of verified stamps
 */
export async function getGitcoinPassportStamps(address: Address): Promise<GitcoinStamp[]> {
  try {
    const apiKey = getEnv('GITCOIN_PASSPORT_API_KEY');
    
    if (!apiKey) {
      return [];
    }

    const normalizedAddress = normalizeAddress(address);
    
    // Gitcoin Passport Stamps API endpoint
    const apiUrl = `https://api.scorer.gitcoin.co/registry/stamps/${normalizedAddress}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Gitcoin API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter for verified stamps only
    if (Array.isArray(data.items)) {
      return data.items.filter((stamp: GitcoinStamp) => stamp.verified === true);
    }

    return [];
  } catch (error) {
    console.error('Error fetching Gitcoin Passport stamps:', error);
    return [];
  }
}

/**
 * Get cached Gitcoin Passport score
 * Uses database cache if available, otherwise fetches from API
 */
export async function getCachedGitcoinPassportScore(address: Address): Promise<number | null> {
  try {
    // Check cache first (would use MetricsCache table)
    // For now, always fetch fresh
    return await getGitcoinPassportScore(address);
  } catch (error) {
    console.error('Error getting cached Gitcoin Passport score:', error);
    return null;
  }
}
