# Supabase Public Keys Configuration

## Overview

This project uses **Prisma** for database access (direct PostgreSQL connection), but Supabase public keys are configured for optional client-side features.

## Configured Keys

```env
NEXT_PUBLIC_SUPABASE_URL=https://solxqaovtrjivudxecqi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_mfpFH6bDL8ivNIP59N5qWA_gioDGH8g
```

## Current Usage

**Status:** ✅ Configured, but not actively used  
**Reason:** Project uses Prisma for database access via `DATABASE_URL`

## When You'd Need These Keys

These keys are required if you want to add Supabase client-side features:

### 1. Supabase Auth
For authentication using Supabase Auth (instead of wallet-only auth):
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
)
```

### 2. Supabase Storage
For file storage (NFT metadata, images, etc.):
```typescript
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload('path/file.jpg', file)
```

### 3. Real-time Subscriptions
For real-time updates to reputation scores:
```typescript
const channel = supabase
  .channel('reputation-updates')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'Reputation' },
    (payload) => {
      // Handle update
    }
  )
  .subscribe()
```

### 4. Row Level Security (RLS)
For client-side security policies:
- Would need to enable RLS in Supabase dashboard
- Create policies that use these keys for validation

## Security Notes

- ✅ **Public keys are safe for client-side use**
- ✅ Already prefixed with `NEXT_PUBLIC_` for Next.js
- ✅ Exposed in browser (intended behavior)
- ⚠️ Never commit secret keys (use `NEXT_PUBLIC_SUPABASE_SECRET_KEY` server-side only if needed)

## Current Architecture

**Database Access:**
- ✅ Uses Prisma Client (server-side)
- ✅ Direct PostgreSQL connection via `DATABASE_URL`
- ✅ All queries go through Prisma

**Optional Future Enhancements:**
- Could add Supabase Auth for non-wallet users
- Could add Storage for media files
- Could add real-time subscriptions for live updates

## Summary

**Status:** Configured and ready, but not required for current functionality  
**Purpose:** Future-proofing for optional Supabase client-side features  
**Action Required:** None - keys are optional and don't affect current Prisma-based database access
