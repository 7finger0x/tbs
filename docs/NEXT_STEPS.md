# Next Steps After Migration

## ✅ Migration Complete

All database tables are created and Prisma client is ready.

## Available Models

You can now use these Prisma models in your code:

```typescript
import { prisma } from '@/lib/db';

// Transaction Cache
await prisma.transactionCache.upsert({
  where: { address },
  update: { transactionCount, expiresAt },
  create: { address, firstTxTimestamp, transactionCount, expiresAt }
});

// Transaction Records
await prisma.transactionRecord.create({
  data: { address, txHash, timestamp, gasUsed, gasPrice, value }
});

// DeFi Metrics
await prisma.defiMetrics.upsert({
  where: { address },
  update: { uniqueProtocols, volumeUSD, lastUpdated: new Date() },
  create: { address, uniqueProtocols, volumeUSD, capitalTier: 'low' }
});

// Economic Vector
await prisma.economicVector.upsert({
  where: { address },
  update: { 
    capitalPillar, 
    diversityPillar, 
    identityPillar,
    totalScore,
    breakdown: JSON.stringify(breakdown),
    calculatedAt: new Date()
  },
  create: { 
    address, 
    capitalPillar, 
    diversityPillar, 
    identityPillar,
    totalScore,
    breakdown: JSON.stringify(breakdown)
  }
});
```

## Optional Enhancements

### 1. Create Database Service Methods

If you want a service layer, create `src/lib/database-service.ts`:

```typescript
import { prisma } from '@/lib/db';

export class DatabaseService {
  async getTransactionCache(address: string) {
    return prisma.transactionCache.findUnique({ where: { address } });
  }

  async setTransactionCache(address: string, data: {...}) {
    // Implementation
  }

  async getDefiMetrics(address: string) {
    return prisma.defiMetrics.findUnique({ where: { address } });
  }

  async upsertDefiMetrics(address: string, data: {...}) {
    // Implementation
  }

  async getEconomicVector(address: string) {
    return prisma.economicVector.findUnique({ where: { address } });
  }

  async upsertEconomicVector(address: string, data: {...}) {
    // Implementation
  }
}

export const dbService = new DatabaseService();
```

### 2. Create Economic Endpoint

Create `src/app/api/reputation/[address]/economic/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const { address } = params;
  
  const economicVector = await prisma.economicVector.findUnique({
    where: { address: address.toLowerCase() }
  });

  const defiMetrics = await prisma.defiMetrics.findUnique({
    where: { address: address.toLowerCase() }
  });

  return NextResponse.json({
    address,
    economicVector: economicVector ? {
      ...economicVector,
      breakdown: JSON.parse(economicVector.breakdown)
    } : null,
    defiMetrics
  });
}
```

### 3. Integration Points

- **Metrics Collector**: Use `TransactionCache` to cache transaction data
- **PVC Framework**: Persist `EconomicVector` after calculations
- **DeFi Analysis**: Store results in `DefiMetrics`
- **API Endpoints**: Return cached data from these tables

## Testing

Test the models work:

```typescript
// Test transaction cache
const cache = await prisma.transactionCache.create({
  data: {
    address: '0x123...',
    firstTxTimestamp: 1234567890,
    transactionCount: 100,
    expiresAt: new Date(Date.now() + 3600000)
  }
});

// Test DeFi metrics
const metrics = await prisma.defiMetrics.create({
  data: {
    address: '0x123...',
    uniqueProtocols: 5,
    volumeUSD: 10000,
    capitalTier: 'mid'
  }
});
```

## Status

🟢 **READY FOR INTEGRATION**

All database infrastructure is in place. You can now integrate these models into your application logic.
