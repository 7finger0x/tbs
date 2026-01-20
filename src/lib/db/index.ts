import 'server-only';
import { validateEnvironmentOnStartup, isBuildContext } from '@/lib/env-validation';

// Validate environment variables on module load (skips during build)
validateEnvironmentOnStartup();

type PrismaClientLike = {
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientLike | undefined;
};

// Lazy validation: validate DATABASE_URL when PrismaClient is actually created
function createPrismaClient() {
  // During build/Vercel deployment, DATABASE_URL may not be available yet
  // We'll validate it lazily when actually used, not when the module loads
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl || databaseUrl.trim() === '') {
    // Check if we're in a build context
    const isBuild = isBuildContext();
    
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

  // Prisma can't switch providers dynamically inside a single schema.
  // We generate two Prisma clients:
  // - @prisma/client-sqlite (dev: sqlite)
  // - @prisma/client-postgres (prod: postgres/supabase)
  const useSqlite = !!databaseUrl && databaseUrl.trim().startsWith('file:');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = useSqlite
    ? require('@prisma/client-sqlite')
    : require('@prisma/client-postgres');

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }) as PrismaClientLike;
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
