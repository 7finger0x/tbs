# Supabase Connection Status Guide

## Quick Connection Test

To test if your Supabase connection is working:

```powershell
# If you have the password:
$env:SUPABASE_PASSWORD = 'your-password'
powershell scripts/test-supabase-connection.ps1

# Or if DATABASE_URL is already in .env.local:
powershell scripts/test-supabase-connection.ps1
```

## Verify Connection in Application

1. **Start the development server:**
   ```powershell
   npm run dev
   ```

2. **Check the console** for any database connection errors

3. **Test an API endpoint:**
   - Open: http://localhost:3000/api/reputation/[any-address]
   - If it returns data or a proper error (not connection error), the connection is working

## Common Issues

### "Not Connected" in UI

If Supabase shows as "not connected" in your UI:

1. **Check if DATABASE_URL is set:**
   ```powershell
   Get-Content .env.local | Select-String "DATABASE_URL"
   ```

2. **Verify connection string format:**
   ```
   postgresql://postgres:PASSWORD@db.solxqaovtrjivudxecqi.supabase.co:5432/postgres
   ```
   - Replace `PASSWORD` with your actual password (URL-encoded)
   - Special characters: `$` → `%24`, `&` → `%26`, `@` → `%40`

3. **Run connection test:**
   ```powershell
   powershell scripts/test-supabase-connection.ps1
   ```

4. **Check Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/solxqaovtrjivudxecqi
   - Verify project is "Active"
   - Check Settings → Database for connection info

### Connection String Issues

If your connection string format is wrong:

1. **Update using setup script:**
   ```powershell
   $env:SUPABASE_PASSWORD = 'your-password'
   powershell scripts/setup-supabase.ps1
   ```

2. **Or manually edit `.env.local`:**
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_ENCODED_PASSWORD@db.solxqaovtrjivudxecqi.supabase.co:5432/postgres"
   ```

### Network/Firewall Issues

If connection test fails:

1. **Try connection pooling (port 6543) instead:**
   ```env
   DATABASE_URL="postgresql://postgres.solxqaovtrjivudxecqi:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15"
   ```

2. **Check firewall settings:**
   - Windows Firewall
   - Corporate/network firewall
   - Try from different network

3. **Test network connectivity:**
   ```powershell
   Test-NetConnection -ComputerName "db.solxqaovtrjivudxecqi.supabase.co" -Port 5432
   ```

## Connection String Formats

### Direct Connection (Port 5432)
```
postgresql://postgres:PASSWORD@db.solxqaovtrjivudxecqi.supabase.co:5432/postgres
```

### Pooled Connection (Port 6543)
```
postgresql://postgres.solxqaovtrjivudxecqi:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15
```

**Note:** Use direct connection for migrations, pooled connection for application runtime.

## Verification Steps

1. ✅ `.env.local` exists and contains `DATABASE_URL`
2. ✅ Connection string format is correct
3. ✅ Password is URL-encoded (if contains special characters)
4. ✅ Prisma Client is generated (`npm run db:generate`)
5. ✅ Connection test passes (`powershell scripts/test-supabase-connection.ps1`)
6. ✅ Application starts without database errors (`npm run dev`)

## Still Not Working?

1. **Get fresh connection string from Supabase:**
   - Dashboard → Project → Settings → Database
   - Copy "Connection string" → "URI" format
   - Replace `[YOUR-PASSWORD]` with actual password

2. **Reset database password** (if unsure):
   - Dashboard → Settings → Database → Reset database password
   - Update `.env.local` with new password

3. **Check Supabase project status:**
   - Ensure project is "Active" (not paused)
   - Wait 5-10 minutes if project just became active

4. **Check application logs:**
   - Look for Prisma connection errors
   - Check browser console for API errors
   - Review server logs in terminal

## Quick Fix

If you just need to quickly update the connection:

```powershell
cd c:\sfo\tbs
$env:SUPABASE_PASSWORD = 'your-password'
powershell scripts/setup-supabase.ps1
powershell scripts/test-supabase-connection.ps1
```
