# Vercel Deployment Guide

## Environment Variables

To deploy to Vercel, you **must** configure the following environment variables in your Vercel project settings:

### Required

1. **DATABASE_URL** - Your Supabase PostgreSQL connection string (pooled connection)
   - Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `DATABASE_URL` with value: `postgresql://postgres.solxqaovtrjivudxecqi:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true`
   - Replace `[PASSWORD]` with your actual password (URL-encoded)
   - Apply to: Production, Preview, Development

2. **DIRECT_URL** - Direct connection for Prisma migrations
   - Add: `DIRECT_URL` with value: `postgresql://postgres.solxqaovtrjivudxecqi:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres`
   - Replace `[PASSWORD]` with your actual password (URL-encoded)
   - Apply to: Production, Preview, Development
   - **Note:** Required when Prisma schema includes `directUrl`

### Optional

The following environment variables are optional but recommended for full functionality:

- `NEYNAR_API_KEY` - For Farcaster metric
- `ZORA_API_KEY` - For Zora Mints & Creator metrics
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY` - Enhanced OnchainKit features
- `GITCOIN_PASSPORT_API_KEY` - Gitcoin Passport integration
- `ONCHAIN_SUMMER_SCHEMA_UID` - For Onchain Summer metric
- `HACKATHON_SCHEMA_UID` - For Hackathon metric
- `COINBASE_ATTESTATION_SCHEMA_UID` - For Coinbase verification

## Build Process

The application is configured to skip environment validation during build time (for Vercel deployments). Environment variables are validated at runtime when the Prisma client is actually used.

**Prisma Client Generation:** The `package.json` includes a `postinstall` script that runs `prisma generate` automatically after `npm install`. This ensures Prisma Client is generated during Vercel builds.

### Build-Time Behavior

- ✅ Build will succeed even if `DATABASE_URL` is not set in Vercel during build
- ✅ Environment validation is skipped during "Collecting page data" phase
- ⚠️ **IMPORTANT:** You must set `DATABASE_URL` in Vercel environment variables before deployment
- ⚠️ Runtime errors will occur if `DATABASE_URL` is missing when the app runs

## Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to: Settings → Environment Variables
3. Add each variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your connection string (from Supabase Dashboard)
   - **Environment**: Select all (Production, Preview, Development)
4. Click "Save"
5. Redeploy your application

## Connection String Formats

### Pooled Connection (DATABASE_URL)
```
postgresql://postgres.solxqaovtrjivudxecqi:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Direct Connection (DIRECT_URL)
```
postgresql://postgres.solxqaovtrjivudxecqi:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

**Password Encoding:**
- Special characters must be URL-encoded:
  - `$` → `%24`
  - `&` → `%26`
  - `@` → `%40`

## Troubleshooting

### Build Succeeds but Runtime Fails

If your build succeeds but you get errors when accessing the app:

1. Verify `DATABASE_URL` is set in Vercel environment variables
2. Check that the connection string is correct (no typos)
3. Ensure the password is URL-encoded
4. Verify Supabase database is accessible (check firewall settings)

### Build Fails with Validation Error

If you see "Environment Variable Validation Failed" during build:

1. This should not happen with the latest code
2. The validation is configured to skip during build
3. If it still fails, check if you're on the latest commit
4. Ensure `VERCEL=1` is set (automatically set by Vercel)

## Quick Setup

1. **Get your connection string:**
   ```powershell
   $env:SUPABASE_PASSWORD = 'your-password'
   powershell scripts/setup-supabase.ps1
   ```
   Copy the "Direct Connection" string from the output.

2. **Add to Vercel:**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Add `DATABASE_URL` with the connection string
   - Apply to all environments

3. **Redeploy:**
   - Vercel will automatically redeploy, or trigger a manual deployment

## Security Notes

- ✅ Environment variables in Vercel are encrypted at rest
- ✅ They are only available to your application at runtime
- ✅ Never commit `.env` files to git
- ✅ Use Vercel's environment variable interface for all secrets
