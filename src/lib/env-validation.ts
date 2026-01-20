import 'server-only';

/**
 * Environment Variable Validation
 * Validates required environment variables on startup
 */

interface EnvConfig {
  required: Record<string, { description: string; validate?: (value: string) => boolean }>;
  optional: Record<string, { description: string; defaultValue?: string }>;
}

const envConfig: EnvConfig = {
  required: {
    DATABASE_URL: {
      description: 'Database connection string (Prisma)',
      validate: (value: string) => {
        // Must be a valid database URL
        return value.startsWith('postgresql://') || value.startsWith('file:') || value.startsWith('mysql://') || value.startsWith('sqlite:');
      },
    },
  },
  optional: {
    NEXT_PUBLIC_BASE_RPC_URL: {
      description: 'Base Mainnet RPC URL',
      defaultValue: 'https://mainnet.base.org',
    },
    NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL: {
      description: 'Base Sepolia RPC URL',
      defaultValue: 'https://sepolia.base.org',
    },
    NEXT_PUBLIC_CHAIN_ID: {
      description: 'Chain ID for EIP-712 signing',
      defaultValue: '8453',
    },
    NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS: {
      description: 'Reputation registry contract address for EIP-712',
      defaultValue: '0x0000000000000000000000000000000000000000',
    },
    NEYNAR_API_KEY: {
      description: 'Neynar API key for Farcaster integration',
    },
    ZORA_API_KEY: {
      description: 'Zora API key for NFT minting data',
    },
    ONCHAIN_SUMMER_SCHEMA_UID: {
      description: 'EAS schema UID for Onchain Summer attestations',
    },
    HACKATHON_SCHEMA_UID: {
      description: 'EAS schema UID for Hackathon attestations',
    },
    NEXT_PUBLIC_ONCHAINKIT_API_KEY: {
      description: 'OnchainKit API key (optional)',
    },
    NEXT_PUBLIC_SUPABASE_URL: {
      description: 'Supabase project URL (for client-side features like Auth, Storage)',
    },
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: {
      description: 'Supabase anon/public key (for client-side features)',
    },
  },
};

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const [key, config] of Object.entries(envConfig.required)) {
    const value = process.env[key];

    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${key}\n  Description: ${config.description}`);
      continue;
    }

    // Run custom validation if provided
    if (config.validate && !config.validate(value)) {
      errors.push(`Invalid value for ${key}\n  Description: ${config.description}\n  Value: ${value}`);
    }
  }

  // Check optional variables and warn if missing when they might be needed
  for (const [key, config] of Object.entries(envConfig.optional)) {
    const value = process.env[key];

    if (!value || value.trim() === '') {
      if (!config.defaultValue) {
        // Only warn if no default and feature might be used
        warnings.push(`Optional environment variable not set: ${key}\n  Description: ${config.description}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get validated environment variable or throw error
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  
  if (!value || value.trim() === '') {
    const config = envConfig.required[key];
    if (config) {
      throw new Error(
        `Missing required environment variable: ${key}\n` +
        `Description: ${config.description}\n` +
        `Please set ${key} in your .env file.`
      );
    }
    throw new Error(`Unknown required environment variable: ${key}`);
  }

  return value;
}

/**
 * Get optional environment variable with default
 */
export function getOptionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * Validate and log environment on module load (server-side only)
 */
export function validateEnvironmentOnStartup(): void {
  // Only validate on server
  if (typeof window !== 'undefined') {
    return;
  }

  const result = validateEnvironment();

  if (!result.valid) {
    console.error('\n❌ Environment Variable Validation Failed:\n');
    result.errors.forEach((error) => {
      console.error(`  ${error}\n`);
    });
    console.error('Please fix the above errors and restart the server.\n');
    throw new Error('Environment validation failed. See logs above.');
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Variable Warnings:\n');
    result.warnings.forEach((warning) => {
      console.warn(`  ${warning}\n`);
    });
    console.warn('Some features may not work without these variables.\n');
  }
}

// Auto-validate on module import (server-side only)
if (typeof window === 'undefined') {
  try {
    validateEnvironmentOnStartup();
  } catch (error) {
    // Log but don't crash during build/dev if validation fails
    // The actual error will be thrown when the app tries to use invalid env vars
    console.warn('Environment validation warning:', error);
  }
}
