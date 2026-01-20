import 'server-only';
import { PrismaClient } from '@prisma/client';
import { validateEnvironmentOnStartup, getRequiredEnv } from '@/lib/env-validation';

// Validate environment variables on module load (skips during build)
validateEnvironmentOnStartup();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Lazy validation: validate DATABASE_URL when PrismaClient is actually created
function createPrismaClient() {
  // During build/Vercel deployment, DATABASE_URL may not be available yet
  // We'll validate it lazily when actually used, not when the module loads
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl || databaseUrl.trim() === '') {
    // Check if we're in a build context
    const isBuild = 
      process.env.NEXT_PHASE === 'phase-production-build' ||
      (process.env.VERCEL === '1' && (!databaseUrl || databaseUrl.trim() === ''));
    
    if (!isBuild) {
      // Runtime but no DATABASE_URL - this is a real error
      throw new Error(
        'Missing required environment variable: DATABASE_URL\n' +
        'Description: Database connection string (Prisma)\n' +
        'Please set DATABASE_URL in your environment variables.\n' +
        'For Vercel: Go to Project Settings → Environment Variables and add DATABASE_URL.'
      );
    }
    // During build, Prisma will validate when actually used at runtime
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
