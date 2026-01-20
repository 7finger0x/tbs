# Authentication Error Troubleshooting

## Error: "Authentication failed against database server"

If you see this error:
```
Authentication failed against database server at `aws-0-us-west-2.pooler.supabase.com`, 
the provided database credentials for `postgres` are not valid.
```

## Common Causes

### 1. Incorrect Password

The password in your connection string might be incorrect or not properly URL-encoded.

**Check:**
```powershell
Get-Content .env.local | Select-String "DATABASE_URL"
```

**Fix:**
```powershell
$env:SUPABASE_PASSWORD = 'your-actual-password'
powershell scripts/setup-supabase.ps1
```

### 2. Password Encoding Issues

Special characters in passwords must be URL-encoded:
- `$` → `%24`
- `&` → `%26`
- `@` → `%40`

The setup script automatically handles this encoding.

### 3. Wrong Username Format

For connection pooling, the username should be `postgres.solxqaovtrjivudxecqi`, not just `postgres`.

**Correct format:**
```
postgresql://postgres.solxqaovtrjivudxecqi:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Incorrect format:**
```
postgresql://postgres:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 4. Database Password Changed

If you reset the database password in Supabase, you need to update your connection strings.

**Steps:**
1. Go to: https://supabase.com/dashboard/project/solxqaovtrjivudxecqi/settings/database
2. Click "Reset database password"
3. Copy the new password
4. Run: `$env:SUPABASE_PASSWORD = 'new-password'; powershell scripts/setup-supabase.ps1`

### 5. Connection String from Supabase Dashboard

Get the exact connection string from Supabase:

1. Go to: https://supabase.com/dashboard/project/solxqaovtrjivudxecqi/settings/database
2. Scroll to "Connection string"
3. Select "URI" format
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual password
6. Update `.env.local`

## Verification Steps

1. **Check connection string format:**
   ```powershell
   powershell scripts/quick-connection-check.ps1
   ```

2. **Verify password is correct:**
   - Check Supabase Dashboard → Settings → Database
   - Verify the password matches what's in `.env.local`

3. **Test connection manually:**
   ```powershell
   # Get connection string
   $dbUrl = (Get-Content .env.local | Select-String 'DATABASE_URL="([^"]+)"').Matches[0].Groups[1].Value
   $env:DATABASE_URL = $dbUrl
   
   # Test with Prisma
   npx prisma db execute --stdin <<< "SELECT 1;"
   ```

## Quick Fix

If authentication fails, try resetting and reconfiguring:

```powershell
# 1. Get fresh password from Supabase Dashboard
# 2. Set environment variable (use single quotes!)
$env:SUPABASE_PASSWORD = 'your-password'

# 3. Run setup script
powershell scripts/setup-supabase.ps1

# 4. Verify
powershell scripts/quick-connection-check.ps1
```

## Application Behavior

The application is configured to handle authentication errors gracefully:
- Database queries return `null` on authentication failures
- Reputation calculation continues without database persistence
- Errors are logged but don't crash the application

This allows the app to function even when database credentials are incorrect, though data won't be persisted.
