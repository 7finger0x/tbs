# Supabase Connection Troubleshooting

## Current Issue

Even though Supabase project shows as "live", connection is failing.

## Solution Steps

### 1. Get Fresh Connection String from Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/ughginxfooubmikfxxkk/settings/database
2. Scroll to **Connection string** section
3. Click on **URI** tab
4. Copy the **direct connection** string (port 5432)
5. It should look like:
   ```
   postgresql://postgres.[YOUR-PASSWORD]@db.ughginxfooubmikfxxkk.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your actual password

### 2. Update .env File

Replace the DATABASE_URL in your `.env` file with the fresh connection string:

```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.ughginxfooubmikfxxkk.supabase.co:5432/postgres"
```

**Important**: If your password contains special characters, make sure they're URL-encoded:
- `$` → `%24`
- `&` → `%26`
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`

### 3. Verify Password

1. Go to: https://supabase.com/dashboard/project/ughginxfooubmikfxxkk/settings/database
2. Check **Database password** section
3. If you're not sure of the password, click **Reset database password**
4. Copy the new password
5. Update `.env` with the new password

### 4. Test Connection

Try the migration again:
```powershell
npx prisma migrate dev --name add_economic_vector
```

### 5. Alternative: Get Connection String Directly

In Supabase Dashboard:
- Settings → Database → Connection string
- Select **URI** format
- Copy the entire string
- Replace `[YOUR-PASSWORD]` with actual password
- Paste into `.env` as `DATABASE_URL="..."`

## Quick Fix Script

If password is: `Wyatt505$&@827$&@`

```powershell
cd C:\sfo\tbs
$password = "Wyatt505$&@827$&@"
$encoded = [System.Uri]::EscapeDataString($password)
$connectionString = "postgresql://postgres:$encoded@db.ughginxfooubmikfxxkk.supabase.co:5432/postgres"
(Get-Content .env) -replace 'DATABASE_URL=".*"', "DATABASE_URL=`"$connectionString`"" | Set-Content .env
Write-Host "Updated DATABASE_URL in .env"
npx prisma migrate dev --name add_economic_vector
```
