# Database Connection Troubleshooting

## Current Status

**Error:** DNS resolution failing for `db.solxqaovtrjivudxecqi.supabase.co:5432`

**Connection String Configured:**
```
postgresql://postgres:Wyatt505%24%26%40%24%26%40@db.solxqaovtrjivudxecqi.supabase.co:5432/postgres
```

## Possible Issues & Solutions

### 1. Database Not Fully Provisioned

**Symptoms:** DNS resolution fails, connection timeout

**Solution:**
- Wait 5-10 minutes after project creation
- Check Supabase Dashboard for status: https://supabase.com/dashboard/project/solxqaovtrjivudxecqi
- Verify project shows "Active" status

### 2. Network/Firewall Blocking Port 5432

**Symptoms:** Connection timeout, DNS resolution fails

**Solutions:**

**Option A: Use Supabase Connection Pooling (Port 6543)**
```env
DATABASE_URL="postgresql://postgres.solxqaovtrjivudxecqi:Wyatt505%24%26%40%24%26%40@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15"
```

**Option B: Check Windows Firewall**
```powershell
# Allow outbound connections on port 5432
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Outbound -LocalPort 5432 -Protocol TCP -Action Allow
```

**Option C: Test from Different Network**
- Try mobile hotspot
- Try from different location
- Check corporate firewall settings

### 3. Get Fresh Connection String from Supabase

**Steps:**
1. Go to: https://supabase.com/dashboard/project/solxqaovtrjivudxecqi/settings/database
2. Scroll to "Connection string" section
3. Click on "URI" tab
4. Copy the connection string (it should already have password encoded)
5. Replace DATABASE_URL in `.env` file

**Expected Format:**
```
postgresql://postgres.solxqaovtrjivudxecqi:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 4. Verify Credentials

**Check Password:**
- Password: `Wyatt505$&@$&@`
- URL-encoded: `Wyatt505%24%26%40%24%26%40`
- Verify password in Supabase Dashboard → Settings → Database

**If password is wrong:**
1. Reset database password in Supabase Dashboard
2. Update `.env` with new password (URL-encoded)

### 5. Alternative: Use Supabase SQL Editor

If migrations fail, you can run SQL directly:

1. Go to: https://supabase.com/dashboard/project/solxqaovtrjivudxecqi/editor
2. Click "SQL Editor"
3. Create new query
4. Copy SQL from: `prisma/migrations/20250119000000_init/migration.sql`
5. Paste and execute

This will create all tables without needing Prisma connection.

### 6. Test Connection with psql (if installed)

```powershell
# Install psql if needed: choco install postgresql
psql "postgresql://postgres:Wyatt505%24%26%40%24%26%40@db.solxqaovtrjivudxecqi.supabase.co:5432/postgres"
```

## Quick Diagnostic Commands

### Test DNS Resolution
```powershell
Resolve-DnsName db.solxqaovtrjivudxecqi.supabase.co
```

### Test Port Connection
```powershell
Test-NetConnection -ComputerName "db.solxqaovtrjivudxecqi.supabase.co" -Port 5432
Test-NetConnection -ComputerName "aws-0-us-east-1.pooler.supabase.com" -Port 6543
```

### Verify Environment Variable
```powershell
Get-Content .env | Select-String "DATABASE_URL"
```

### Try Connection with Different Format
```powershell
# With connection pooling
$pooled = "postgresql://postgres.solxqaovtrjivudxecqi:Wyatt505%24%26%40%24%26%40@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# Update .env and try again
```

## Recommended Next Steps

1. **Verify Supabase Project Status**
   - Check dashboard: https://supabase.com/dashboard/project/solxqaovtrjivudxecqi
   - Ensure project is "Active"

2. **Get Fresh Connection String**
   - Dashboard → Settings → Database → Connection string
   - Use "URI" format
   - Copy exact string provided

3. **Try Connection Pooling**
   - Port 6543 often works when 5432 is blocked
   - Better for serverless/production use

4. **Use SQL Editor as Workaround**
   - Run migrations manually if connection fails
   - Still allows database setup

5. **Contact Support if Persists**
   - Supabase support: https://supabase.com/support
   - Check Supabase status page for outages

## Current Configuration

- **Project Reference:** `solxqaovtrjivudxecqi`
- **Database Host:** `db.solxqaovtrjivudxecqi.supabase.co`
- **Pooled Host:** `aws-0-us-east-1.pooler.supabase.com`
- **Password:** `Wyatt505$&@$&@` (encoded: `Wyatt505%24%26%40%24%26%40`)
