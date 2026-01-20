# Database Password Update

## Updated Password

The Supabase database password has been updated. (Password removed from documentation for security)

## Connection String

The connection string has been automatically updated in `.env.local`:

**Direct Connection (for migrations):**
```
postgresql://postgres:[PASSWORD]@db.solxqaovtrjivudxecqi.supabase.co:5432/postgres
```

**Pooled Connection (for application):**
```
postgresql://postgres.solxqaovtrjivudxecqi:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15
```

**Note:** Replace `[PASSWORD]` with your actual password (URL-encoded). Use the setup script with environment variable instead of hardcoding.

## Password Encoding

Special characters in the password are URL-encoded:
- `$` → `%24`
- `&` → `%26`
- `@` → `%40`

## Files Updated

1. `scripts/setup-supabase.ps1` - Updated password variable
2. `.env.local` - Updated DATABASE_URL with new password (backed up to `.env.local.backup.*`)

## Next Steps

1. **Verify connection:**
   ```bash
   npm run db:generate
   ```

2. **Test the connection:**
   ```bash
   npx prisma db pull
   ```
   (Note: May fail due to network/firewall restrictions, but the app will work at runtime)

3. **Run migrations if needed:**
   ```bash
   npx prisma migrate deploy
   ```

## GitHub Repository

Project repository: https://github.com/7finger0x/tbs
