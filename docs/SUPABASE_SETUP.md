# Supabase Database Setup

## Project Information

- **Project Reference:** `solxqaovtrjivudxecqi`
- **Project URL:** https://solxqaovtrjivudxecqi.supabase.co
- **Database Host:** `db.solxqaovtrjivudxecqi.supabase.co`
- **Port:** `5432` (direct) or `6543` (pooled)
- **Public URL:** `https://solxqaovtrjivudxecqi.supabase.co`
- **Publishable Key:** `sb_publishable_mfpFH6bDL8ivNIP59N5qWA_gioDGH8g`

### Environment Variables Configured

**Database (Prisma):**
```env
DATABASE_URL="postgresql://postgres:Wyatt505%24%26%40%24%26%40@db.solxqaovtrjivudxecqi.supabase.co:5432/postgres"
```

**Public Keys (Optional - for client-side features):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://solxqaovtrjivudxecqi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_mfpFH6bDL8ivNIP59N5qWA_gioDGH8g
```

**Note:** This project uses Prisma for database access, so these public keys are optional. They would be needed if you want to add Supabase features like:
- Supabase Auth (authentication)
- Supabase Storage (file storage)
- Real-time subscriptions
- Row Level Security (RLS) policies

## Quick Setup

### Option 1: Automated Setup (Recommended)

Run the setup script:

```powershell
powershell scripts/setup-supabase.ps1
```

This will:
- Create/update `.env.local` with the correct connection string
- URL-encode the password automatically
- Backup existing `.env.local` if it exists

### Option 2: Manual Setup

1. Create `.env.local` in the project root
2. Add the connection string:

```env
DATABASE_URL="postgresql://postgres:Wyatt505%24%26%40%24%26%40@db.solxqaovtrjivudxecqi.supabase.co:5432/postgres"
```

**Important:** The password is URL-encoded:
- `$` → `%24`
- `&` → `%26`
- `@` → `%40`

So `Wyatt505$&@$&@` becomes `Wyatt505%24%26%40%24%26%40`

## Connection Types

### Direct Connection (Port 5432)
Use for migrations and Prisma Studio:
```
postgresql://postgres:Wyatt505%24%26%40%24%26%40@db.solxqaovtrjivudxecqi.supabase.co:5432/postgres
```

### Pooled Connection (Port 6543)
Use for application runtime (better performance, connection pooling):
```
postgresql://postgres.solxqaovtrjivudxecqi:Wyatt505%24%26%40%24%26%40@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15
```

**Note:** Migrations should use direct connection. Application can use pooled.

## Verification Steps

1. **Test Connection:**
   ```bash
   npx prisma db pull
   ```

2. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

3. **Apply Migrations:**
   ```bash
   # For production
   npx prisma migrate deploy
   
   # For development (creates migration history)
   npx prisma migrate dev
   ```

4. **Verify Schema:**
   ```bash
   npm run db:studio
   ```
   Opens Prisma Studio at http://localhost:5555

## Troubleshooting

### Connection Timeout

If direct connection (port 5432) fails:
1. Check firewall settings
2. Try from different network
3. Use connection pooling (port 6543) for testing

### Password Encoding Issues

If connection fails, verify password encoding:
```powershell
$password = "Wyatt505$&@$&@"
[System.Uri]::EscapeDataString($password)
# Should output: Wyatt505%24%26%40%24%26%40
```

### Migration Errors

If migrations fail:
1. Check database is accessible
2. Verify DATABASE_URL is correct
3. Try running SQL directly in Supabase SQL Editor
4. Check migration file: `prisma/migrations/20250119000000_init/migration.sql`

## Supabase Dashboard

Access your project:
- **Dashboard:** https://supabase.com/dashboard/project/solxqaovtrjivudxecqi
- **SQL Editor:** https://supabase.com/dashboard/project/solxqaovtrjivudxecqi/sql
- **Database Settings:** https://supabase.com/dashboard/project/solxqaovtrjivudxecqi/settings/database

## Security Notes

- Never commit `.env.local` to git (already in `.gitignore`)
- Rotate database password if compromised
- Use connection pooling in production for better security and performance
- Consider using Supabase connection pooling for serverless environments
