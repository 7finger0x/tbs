# Network Troubleshooting for Supabase Connection

## Current Status

- ✅ Password updated: `Wyatt827$&@$&@`
- ✅ Connection string format correct
- ❌ Port 5432 not reachable (network test failed)
- ❌ Migration still failing

## Possible Causes

### 1. Firewall Blocking Port 5432

Your network/firewall may be blocking outbound connections to port 5432 (PostgreSQL default port).

**Solutions:**
- Check Windows Firewall settings
- Check corporate/network firewall
- Try from a different network (mobile hotspot, etc.)
- Contact network administrator

### 2. Supabase Database Still Starting

Even if project shows "live", the database might still be initializing.

**Wait:**
- Wait 5-10 minutes after project becomes active
- Check Supabase Dashboard for any status messages
- Try again after waiting

### 3. Connection Pooling Required

Some networks require using connection pooling (port 6543) instead of direct connection (port 5432).

**Try this:**
```powershell
cd C:\sfo\tbs
$password = "Wyatt827$&@$&@"
$encoded = [System.Uri]::EscapeDataString($password)
$pooled = "postgresql://postgres.ughginxfooubmikfxxkk:$encoded@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15"
$env:DATABASE_URL = $pooled
npx prisma migrate dev --name add_economic_vector
```

**Note:** Connection pooling may not work for migrations, but can help test connectivity.

### 4. Use Supabase SQL Editor Instead

If migrations continue to fail, you can run the SQL manually:

1. Go to: https://supabase.com/dashboard/project/ughginxfooubmikfxxkk/editor
2. Click **SQL Editor**
3. Create a new query
4. Copy the SQL from the migration file (after Prisma generates it)
5. Paste and execute in SQL Editor

### 5. Alternative: Use Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db reset --project-ref ughginxfooubmikfxxkk
```

## Quick Test Commands

### Test Network Connectivity
```powershell
Test-NetConnection -ComputerName "db.ughginxfooubmikfxxkk.supabase.co" -Port 5432
Test-NetConnection -ComputerName "aws-0-us-east-1.pooler.supabase.com" -Port 6543
```

### Test Connection String Format
```powershell
cd C:\sfo\tbs
$env:DATABASE_URL = "postgresql://postgres:Wyatt827%24%26%40%24%26%40@db.ughginxfooubmikfxxkk.supabase.co:5432/postgres"
npx prisma db execute --stdin --schema=prisma/schema.prisma
# Then type: SELECT 1;
```

## Next Steps

1. Try connection pooling port (6543)
2. Check firewall settings
3. Try from different network
4. Use Supabase SQL Editor as fallback
5. Wait longer if database just became active
