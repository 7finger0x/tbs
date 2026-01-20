# Manual Migration SQL for Supabase

Since Prisma migrations can't connect due to network/firewall issues, you can run this SQL directly in Supabase SQL Editor.

## Steps

1. Go to: https://supabase.com/dashboard/project/ughginxfooubmikfxxkk/editor
2. Click **SQL Editor**
3. Click **New query**
4. Paste the SQL below
5. Click **Run** (or press Ctrl+Enter)

## SQL Migration

```sql
-- Create TransactionCache table
CREATE TABLE IF NOT EXISTS "TransactionCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "firstTxTimestamp" INTEGER NOT NULL,
    "transactionCount" INTEGER NOT NULL,
    "lastBlockNumber" BIGINT,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TransactionCache_address_key" UNIQUE ("address")
);

CREATE INDEX IF NOT EXISTS "TransactionCache_address_idx" ON "TransactionCache"("address");
CREATE INDEX IF NOT EXISTS "TransactionCache_expiresAt_idx" ON "TransactionCache"("expiresAt");

-- Create TransactionRecord table
CREATE TABLE IF NOT EXISTS "TransactionRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "gasUsed" TEXT NOT NULL,
    "gasPrice" TEXT NOT NULL,
    "to" TEXT,
    "value" TEXT NOT NULL,
    "blockNumber" BIGINT,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "TransactionRecord_address_idx" ON "TransactionRecord"("address");
CREATE INDEX IF NOT EXISTS "TransactionRecord_txHash_idx" ON "TransactionRecord"("txHash");
CREATE INDEX IF NOT EXISTS "TransactionRecord_timestamp_idx" ON "TransactionRecord"("timestamp");
CREATE INDEX IF NOT EXISTS "TransactionRecord_address_timestamp_idx" ON "TransactionRecord"("address", "timestamp");

-- Create DefiMetrics table
CREATE TABLE IF NOT EXISTS "DefiMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "uniqueProtocols" INTEGER NOT NULL DEFAULT 0,
    "vintageContracts" INTEGER NOT NULL DEFAULT 0,
    "protocolCategories" TEXT[],
    "totalInteractions" INTEGER NOT NULL DEFAULT 0,
    "gasUsedETH" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volumeUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "liquidityDurationDays" INTEGER NOT NULL DEFAULT 0,
    "liquidityPositions" INTEGER NOT NULL DEFAULT 0,
    "lendingUtilization" INTEGER NOT NULL DEFAULT 0,
    "capitalTier" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DefiMetrics_address_key" UNIQUE ("address")
);

CREATE INDEX IF NOT EXISTS "DefiMetrics_address_idx" ON "DefiMetrics"("address");
CREATE INDEX IF NOT EXISTS "DefiMetrics_lastUpdated_idx" ON "DefiMetrics"("lastUpdated");

-- Create EconomicVector table
CREATE TABLE IF NOT EXISTS "EconomicVector" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "capitalPillar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "diversityPillar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "identityPillar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "breakdown" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EconomicVector_address_key" UNIQUE ("address")
);

CREATE INDEX IF NOT EXISTS "EconomicVector_address_idx" ON "EconomicVector"("address");
CREATE INDEX IF NOT EXISTS "EconomicVector_calculatedAt_idx" ON "EconomicVector"("calculatedAt");
CREATE INDEX IF NOT EXISTS "EconomicVector_totalScore_idx" ON "EconomicVector"("totalScore");
```

## After Running SQL

1. Verify tables were created:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('TransactionCache', 'TransactionRecord', 'DefiMetrics', 'EconomicVector');
   ```

2. Update your Prisma schema to include these models (if not already there)

3. Generate Prisma client:
   ```powershell
   npx prisma generate
   ```

## Note

This creates the tables directly in Supabase. Once the network issue is resolved, you can sync Prisma with:
```powershell
npx prisma db pull
```

This will update your `schema.prisma` to match the database.
