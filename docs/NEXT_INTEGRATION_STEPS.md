# Next Integration Steps 🚀

## Overview

Now that Week 2 database persistence is complete, here's what needs to be integrated next.

---

## ✅ What's Complete

1. **Database Tables** - 4 tables created in Supabase
2. **Query Functions** - 7 functions ready in `src/lib/db/queries.ts`
3. **API Endpoint** - Economic endpoint created
4. **Prisma Client** - Generated and ready

---

## 🎯 Integration Tasks

### 1. Transaction Caching Integration ⚠️ HIGH PRIORITY

**File:** `src/lib/scoring/metrics/baseTenure.ts`

**Current State:** Has TODO to implement RPC calls

**Action Required:**
- Check `getTransactionCache()` before making RPC calls
- If cache exists and not expired, use cached data
- After fetching from RPC, call `setTransactionCache()` to persist
- Reduces RPC calls significantly

**Example Integration:**
```typescript
import { getTransactionCache, setTransactionCache } from '@/lib/db/queries';
import type { Address } from 'viem';

export async function calculateBaseTenure(input: ScoreInput): Promise<MetricScore> {
  const address = input.address as Address;
  
  // Check cache first
  const cached = await getTransactionCache(address);
  if (cached && cached.expiresAt > new Date()) {
    // Use cached data
    const daysSinceFirst = Math.floor(
      (Date.now() / 1000 - cached.firstTxTimestamp) / 86400
    );
    // ... calculate score
  }
  
  // If no cache, fetch from RPC
  const firstTxTimestamp = await fetchFirstTransaction(address);
  
  // Cache the result
  await setTransactionCache(address, {
    firstTxTimestamp,
    transactionCount: txCount,
    ttlMinutes: 60
  });
  
  // ... calculate score
}
```

---

### 2. DeFi Metrics Collection 🔄 MEDIUM PRIORITY

**Current State:** No DeFi metrics collection exists

**Action Required:**
- Create new metric calculator: `src/lib/scoring/metrics/defi.ts`
- Collect protocol interactions from transaction data
- Calculate unique protocols, vintage contracts, categories
- Call `upsertDefiMetrics()` after collection

**New File Needed:**
- `src/lib/scoring/metrics/defi.ts` - DeFi metrics calculator

**Integration Point:**
- Add to `src/lib/scoring/calculator.ts` metric promises array

---

### 3. Economic Vector Persistence 📊 MEDIUM PRIORITY

**Current State:** Economic endpoint exists but doesn't calculate/persist

**Action Required:**
- After reputation calculation completes, calculate economic vector
- Extract pillar scores from metrics
- Call `upsertEconomicVector()` to persist
- Update economic endpoint to trigger calculation if missing

**Integration Point:**
- `src/lib/scoring/calculator.ts` - After `calculateReputation()` completes

---

### 4. API Endpoint Updates 🌐 LOW PRIORITY

**Current State:** Economic endpoint returns cached data only

**Action Required:**
- Update main reputation endpoint to check cache
- Return cached data when available
- Trigger recalculation if cache expired

**Files:**
- `src/app/api/reputation/[address]/route.ts` (if exists)
- Or create new endpoint

---

## 📋 Implementation Order

### Phase 1: Transaction Caching (Immediate)
1. ✅ Integrate `getTransactionCache()` into `baseTenure.ts`
2. ✅ Add RPC fallback logic
3. ✅ Call `setTransactionCache()` after fetch
4. ✅ Test cache hit/miss scenarios

### Phase 2: DeFi Metrics (Next)
1. ✅ Create `defi.ts` metric calculator
2. ✅ Integrate into `calculator.ts`
3. ✅ Persist with `upsertDefiMetrics()`
4. ✅ Test DeFi metric collection

### Phase 3: Economic Vector (After DeFi)
1. ✅ Calculate economic vector from metrics
2. ✅ Persist with `upsertEconomicVector()`
3. ✅ Update economic endpoint
4. ✅ Test end-to-end flow

### Phase 4: Testing & Optimization
1. ✅ Add unit tests for cache integration
2. ✅ Add integration tests
3. ✅ Performance testing
4. ✅ Monitor cache hit rates

---

## 🔧 Technical Details

### Transaction Cache TTL
- Default: 60 minutes
- Configurable per address
- Automatic expiration handling

### DeFi Metrics Collection
- Analyze transaction `to` addresses
- Match against protocol registry
- Calculate vintage contracts (>1 year old)
- Categorize protocols

### Economic Vector Calculation
- Extract from existing metrics
- Calculate three pillars:
  - Capital Pillar (from volume, gas, liquidity)
  - Diversity Pillar (from protocols, categories)
  - Identity Pillar (from social, attestations)

---

## 📝 Files to Modify

### Existing Files:
- `src/lib/scoring/metrics/baseTenure.ts` - Add caching
- `src/lib/scoring/calculator.ts` - Add DeFi metric, persist economic vector
- `src/app/api/reputation/[address]/economic/route.ts` - Trigger calculation if missing

### New Files:
- `src/lib/scoring/metrics/defi.ts` - DeFi metrics calculator
- `tests/lib/scoring/metrics/baseTenure.test.ts` - Cache tests
- `tests/lib/scoring/metrics/defi.test.ts` - DeFi tests

---

## 🎯 Success Criteria

- [ ] Transaction cache reduces RPC calls by 80%+
- [ ] DeFi metrics persist correctly
- [ ] Economic vector calculated and stored
- [ ] API endpoints return cached data when available
- [ ] All tests pass
- [ ] Performance improved

---

## 🚀 Ready to Start?

Begin with **Phase 1: Transaction Caching** - it provides immediate value by reducing RPC costs and improving response times.
