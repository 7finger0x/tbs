import 'server-only';
import type { Address } from 'viem';
import { normalizeAddress } from '@/lib/utils';

/**
 * Coinbase Verification Integration
 * 
 * Checks if an address is verified with Coinbase through:
 * - Coinbase Attestations (EAS - Ethereum Attestation Service)
 * - Coinbase Base Name Service (BNS)
 * - Direct Coinbase account verification
 */

export interface CoinbaseVerification {
  isVerified: boolean;
  attestationAddress?: string;
  attestationChainId?: number;
  verifiedAt?: Date;
  verificationMethod: 'attestation' | 'bns' | 'account' | 'none';
}

/**
 * Check Coinbase Attestation via EAS
 * Coinbase uses EAS (Ethereum Attestation Service) for verifications
 */
async function checkCoinbaseAttestation(address: Address): Promise<{
  verified: boolean;
  attestationAddress?: string;
  chainId?: number;
}> {
  try {
    // EAS schema for Coinbase verifications on Base
    // Schema UID: 0x... (would need actual schema UID)
    const baseEasContract = '0x4200000000000000000000000000000000000021'; // Base EAS contract
    const coinbaseAttestationSchema = process.env.COINBASE_ATTESTATION_SCHEMA_UID;
    
    if (!coinbaseAttestationSchema) {
      return { verified: false };
    }
    
    // Query EAS for attestations
    const easGraphUrl = 'https://base.easscan.org/graphql';
    const query = `
      query GetAttestations($where: AttestationWhereInput) {
        attestations(where: $where) {
          id
          attester
          recipient
          schemaId
          data
          timeCreated
        }
      }
    `;
    
    const variables = {
      where: {
        recipient: { equals: address.toLowerCase() },
        schemaId: { equals: coinbaseAttestationSchema },
        revoked: { equals: false },
      },
    };
    
    const response = await fetch(easGraphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });
    
    if (response.ok) {
      const data = await response.json();
      const attestations = data.data?.attestations || [];
      
      if (attestations.length > 0) {
        const attestation = attestations[0];
        return {
          verified: true,
          attestationAddress: attestation.id,
          chainId: 8453, // Base mainnet
        };
      }
    }
    
    return { verified: false };
  } catch (error) {
    console.error('Error checking Coinbase attestation:', error);
    return { verified: false };
  }
}

/**
 * Check Coinbase Base Name Service (BNS) verification
 */
async function checkCoinbaseBNS(address: Address): Promise<boolean> {
  try {
    // BNS resolver contract on Base
    const bnsResolver = '0x...'; // Would need actual BNS resolver address
    
    // Query BNS for reverse lookup (address -> name)
    // This would require contract interaction or API
    // For now, return false as placeholder
    
    return false;
  } catch (error) {
    console.error('Error checking Coinbase BNS:', error);
    return false;
  }
}

/**
 * Check Coinbase account verification via Coinbase API
 * Requires Coinbase API integration
 */
async function checkCoinbaseAccount(address: Address): Promise<boolean> {
  try {
    // This would require Coinbase API access
    // Coinbase provides verification for users who link wallets
    // For now, return false as placeholder
    
    // In production, would:
    // 1. Query Coinbase API with API key
    // 2. Check if address is verified account
    // 3. Return verification status
    
    return false;
  } catch (error) {
    console.error('Error checking Coinbase account:', error);
    return false;
  }
}

/**
 * Main function to check Coinbase verification
 * Checks multiple methods and returns the strongest verification
 */
export async function checkCoinbaseVerification(
  address: Address
): Promise<CoinbaseVerification> {
  const normalizedAddress = normalizeAddress(address);
  
  // Try attestation first (strongest proof)
  const attestationCheck = await checkCoinbaseAttestation(normalizedAddress);
  if (attestationCheck.verified) {
    return {
      isVerified: true,
      attestationAddress: attestationCheck.attestationAddress,
      attestationChainId: attestationCheck.chainId,
      verificationMethod: 'attestation',
    };
  }
  
  // Try BNS verification
  const bnsVerified = await checkCoinbaseBNS(normalizedAddress);
  if (bnsVerified) {
    return {
      isVerified: true,
      verificationMethod: 'bns',
    };
  }
  
  // Try account verification
  const accountVerified = await checkCoinbaseAccount(normalizedAddress);
  if (accountVerified) {
    return {
      isVerified: true,
      verificationMethod: 'account',
    };
  }
  
  return {
    isVerified: false,
    verificationMethod: 'none',
  };
}

/**
 * Cache Coinbase verification status
 * Verifications rarely change, so cache for 24 hours
 */
const verificationCache = new Map<string, { result: CoinbaseVerification; expiresAt: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedCoinbaseVerification(
  address: Address
): Promise<CoinbaseVerification> {
  const normalizedAddress = normalizeAddress(address);
  const cached = verificationCache.get(normalizedAddress);
  
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }
  
  // Fetch fresh verification
  const result = await checkCoinbaseVerification(normalizedAddress);
  
  // Cache result
  verificationCache.set(normalizedAddress, {
    result,
    expiresAt: Date.now() + CACHE_TTL,
  });
  
  return result;
}
