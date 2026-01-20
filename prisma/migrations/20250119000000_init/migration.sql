-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "primaryAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signature" TEXT NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reputation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'TOURIST',
    "baseTenureScore" INTEGER NOT NULL DEFAULT 0,
    "zoraMintsScore" INTEGER NOT NULL DEFAULT 0,
    "timelinessScore" INTEGER NOT NULL DEFAULT 0,
    "farcasterScore" INTEGER NOT NULL DEFAULT 0,
    "builderScore" INTEGER NOT NULL DEFAULT 0,
    "creatorScore" INTEGER NOT NULL DEFAULT 0,
    "onchainSummerScore" INTEGER NOT NULL DEFAULT 0,
    "hackathonScore" INTEGER NOT NULL DEFAULT 0,
    "earlyAdopterScore" INTEGER NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reputation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricsCache" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricsCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionCache" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "firstTxTimestamp" INTEGER NOT NULL,
    "transactionCount" INTEGER NOT NULL,
    "lastBlockNumber" BIGINT,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionRecord" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "gasUsed" TEXT NOT NULL,
    "gasPrice" TEXT NOT NULL,
    "to" TEXT,
    "value" TEXT NOT NULL,
    "blockNumber" BIGINT,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefiMetrics" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "DefiMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EconomicVector" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "capitalPillar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "diversityPillar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "identityPillar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "breakdown" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EconomicVector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_primaryAddress_key" ON "User"("primaryAddress");

-- CreateIndex
CREATE INDEX "User_primaryAddress_idx" ON "User"("primaryAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_address_idx" ON "Wallet"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Reputation_userId_key" ON "Reputation"("userId");

-- CreateIndex
CREATE INDEX "Reputation_totalScore_idx" ON "Reputation"("totalScore");

-- CreateIndex
CREATE INDEX "Reputation_tier_idx" ON "Reputation"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "MetricsCache_address_key" ON "MetricsCache"("address");

-- CreateIndex
CREATE INDEX "MetricsCache_address_metricType_idx" ON "MetricsCache"("address", "metricType");

-- CreateIndex
CREATE INDEX "MetricsCache_expiresAt_idx" ON "MetricsCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionCache_address_key" ON "TransactionCache"("address");

-- CreateIndex
CREATE INDEX "TransactionCache_address_idx" ON "TransactionCache"("address");

-- CreateIndex
CREATE INDEX "TransactionCache_expiresAt_idx" ON "TransactionCache"("expiresAt");

-- CreateIndex
CREATE INDEX "TransactionRecord_address_idx" ON "TransactionRecord"("address");

-- CreateIndex
CREATE INDEX "TransactionRecord_txHash_idx" ON "TransactionRecord"("txHash");

-- CreateIndex
CREATE INDEX "TransactionRecord_timestamp_idx" ON "TransactionRecord"("timestamp");

-- CreateIndex
CREATE INDEX "TransactionRecord_address_timestamp_idx" ON "TransactionRecord"("address", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "DefiMetrics_address_key" ON "DefiMetrics"("address");

-- CreateIndex
CREATE INDEX "DefiMetrics_address_idx" ON "DefiMetrics"("address");

-- CreateIndex
CREATE INDEX "DefiMetrics_lastUpdated_idx" ON "DefiMetrics"("lastUpdated");

-- CreateIndex
CREATE UNIQUE INDEX "EconomicVector_address_key" ON "EconomicVector"("address");

-- CreateIndex
CREATE INDEX "EconomicVector_address_idx" ON "EconomicVector"("address");

-- CreateIndex
CREATE INDEX "EconomicVector_calculatedAt_idx" ON "EconomicVector"("calculatedAt");

-- CreateIndex
CREATE INDEX "EconomicVector_totalScore_idx" ON "EconomicVector"("totalScore");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reputation" ADD CONSTRAINT "Reputation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
