# Connection Pooling Configuration Update

## Updated Connection Strings

The project now uses Supabase connection pooling as recommended by Supabase:

### Application Connection (DATABASE_URL)
```
postgresql://postgres.solxqaovtrjivudxecqi:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```
- **Port:** 6543 (pooled connection)
- **Use:** Application runtime
- **Benefits:** Better performance, connection pooling, handles high traffic

### Migration Connection (DIRECT_URL)
```
postgresql://postgres.solxqaovtrjivudxecqi:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```
- **Port:** 5432 (direct connection)
- **Use:** Prisma migrations
- **Required:** Prisma requires `DIRECT_URL` when using connection pooling

## Key Changes

1. **Region:** Changed from `us-east-1` to `us-west-2`
2. **Username Format:** Uses `postgres.solxqaovtrjivudxecqi` instead of just `postgres`
3. **Dual Connection Strings:** Both `DATABASE_URL` and `DIRECT_URL` are now configured

## Setup

Run the setup script to configure both connection strings automatically:

```powershell
$env:SUPABASE_PASSWORD = 'your-password'
powershell scripts/setup-supabase.ps1
```

Or manually add both to `.env.local`:

```env
# Connection pooling (for application)
DATABASE_URL="postgresql://postgres.solxqaovtrjivudxecqi:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (for migrations)
DIRECT_URL="postgresql://postgres.solxqaovtrjivudxecqi:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
```

## Prisma Schema Update

The Prisma schema now includes `directUrl`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Important:** Prisma requires `DIRECT_URL` to be set when `directUrl` is in the schema. The setup script automatically sets both.

## Benefits

- ✅ Better performance with connection pooling
- ✅ Handles high traffic better
- ✅ Migrations use direct connection (more reliable)
- ✅ Application uses pooled connection (better resource usage)

## Verification

After setting up, verify both connections are configured:

```powershell
powershell scripts/quick-connection-check.ps1
```

Or manually check `.env.local`:
```powershell
Get-Content .env.local | Select-String "DATABASE_URL|DIRECT_URL"
```

Both should be present with the correct format.
