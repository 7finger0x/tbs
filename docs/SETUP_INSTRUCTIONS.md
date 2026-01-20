# Setup Instructions

## Database Configuration

### Option 1: Using the Setup Script (Recommended)

The easiest way to configure your database connection is using the setup script:

**With password as parameter:**
```powershell
powershell scripts/setup-supabase.ps1 -Password 'Wyatt505$&@827$&@'
```

**With environment variable:**
```powershell
$env:SUPABASE_PASSWORD = 'Wyatt505$&@827$&@'
powershell scripts/setup-supabase.ps1
```

**Important:** Always use single quotes (`'`) around the password when it contains special characters like `$`, `&`, or `@`. Single quotes prevent PowerShell from interpreting these as special operators.

### Option 2: Manual Configuration

1. Edit `.env.local` file
2. Add or update the `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.solxqaovtrjivudxecqi.supabase.co:5432/postgres"
   ```
3. Replace `[PASSWORD]` with your actual password (URL-encoded):
   - `$` → `%24`
   - `&` → `%26`
   - `@` → `%40`

## After Configuration

1. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

2. **Verify connection (optional):**
   ```bash
   npx prisma db pull
   ```
   Note: May fail due to network/firewall restrictions, but app will work at runtime.

3. **Run migrations (if needed):**
   ```bash
   npx prisma migrate deploy
   ```

4. **Start development:**
   ```bash
   npm run dev
   ```

## Security Notes

- Never commit `.env` or `.env.local` files to git
- Use environment variables for passwords in production
- The setup script uses parameter or environment variable instead of hardcoding
