# The Base Standard

A production-grade reputation system quantifying on-chain activity on Base L2 blockchain.

## Tech Stack

- **Framework**: Next.js 15.1.6 (App Router)
- **Language**: TypeScript 5.6.3 (Strict Mode)
- **UI**: React 19.0.0, Tailwind CSS 3.4.17
- **Web3**: OnchainKit 0.37.5, wagmi 2.19.5, viem 2.44.4
- **Backend/DB**: Prisma 6.2.1
- **Dev DB**: SQLite
- **Prod DB**: Supabase (PostgreSQL) via Connection Pooling
- **State**: TanStack Query (Server state), Zustand (Client state)
- **Testing**: Vitest 3.2.4

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory. Copy `.env.example` as a template (if available) or use the configuration below:

#### Required Variables

```env
# Database connection string (Prisma)
# Development: SQLite file database
DATABASE_URL="file:./dev.db"

# Production: PostgreSQL connection string (Supabase)
# Connection pooling (recommended for application):
# DATABASE_URL="postgresql://postgres.solxqaovtrjivudxecqi:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
# 
# Direct connection (for migrations):
# DIRECT_URL="postgresql://postgres.solxqaovtrjivudxecqi:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
# 
# Note: URL-encode special characters in password ($ → %24, & → %26, @ → %40)
# For this project's Supabase instance:
# Project: solxqaovtrjivudxecqi
# Run: powershell scripts/setup-supabase.ps1 (automatically configures both connection strings)
```

#### Optional Variables

```env
# Network Configuration (defaults provided)
NEXT_PUBLIC_BASE_RPC_URL="https://mainnet.base.org"
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
NEXT_PUBLIC_CHAIN_ID="8453"
NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS="0x0000000000000000000000000000000000000000"

# API Keys (required for specific features)
NEYNAR_API_KEY=""              # Required for Farcaster metric
ZORA_API_KEY=""                # Required for Zora Mints & Creator metrics
NEXT_PUBLIC_ONCHAINKIT_API_KEY=""  # Optional: Enhanced OnchainKit features
GITCOIN_PASSPORT_API_KEY=""    # Optional: Gitcoin Passport integration

# Supabase Public Keys (optional - for client-side features like Auth, Storage)
NEXT_PUBLIC_SUPABASE_URL=""    # Supabase project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=""  # Supabase anon/public key

# EAS Schema UIDs (required for attestation-based metrics)
ONCHAIN_SUMMER_SCHEMA_UID=""   # Required for Onchain Summer metric
HACKATHON_SCHEMA_UID=""        # Required for Hackathon metric
COINBASE_ATTESTATION_SCHEMA_UID=""  # Optional: Coinbase verification

# CORS Configuration
ALLOWED_ORIGINS="*"            # Comma-separated list of allowed origins
```

**Note:** Environment variables are validated on server startup (not during build). Missing required variables will cause the server to fail with clear error messages at runtime. Optional variables will show warnings but won't prevent startup. For Vercel deployment, see [Vercel Deployment Guide](docs/VERCEL_DEPLOYMENT.md).

### Database Setup

**First-time Setup:**
1. Configure Supabase connection:
   ```powershell
   # Option 1: Pass password as parameter (use single quotes for special characters)
   powershell scripts/setup-supabase.ps1 -Password 'your-password'
   
   # Option 2: Use environment variable (use single quotes for special characters)
   $env:SUPABASE_PASSWORD = 'your-password'
   powershell scripts/setup-supabase.ps1
   ```
   
   Or manually update `.env` with connection string from Supabase Dashboard:
   - Go to: https://supabase.com/dashboard/project/solxqaovtrjivudxecqi/settings/database
   - Copy "Connection string" → "URI" format
   - Paste into `.env` as `DATABASE_URL="..."`

2. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```

3. Run migrations:
   ```bash
   # For production (applies existing migrations)
   npx prisma migrate deploy
   
   # For development (creates migration history)
   npx prisma migrate dev
   ```

4. (Optional) Open Prisma Studio:
   ```bash
   npm run db:studio
   ```

**Troubleshooting:** If connection fails, see [Connection Troubleshooting Guide](docs/CONNECTION_TROUBLESHOOTING.md)

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages/layouts
├── components/       # React components
│   ├── ui/          # Reusable primitives (buttons, cards)
│   └── business/    # Domain-specific components (ReputationCard)
├── lib/             # Shared utilities
│   ├── db/         # Prisma client & database logic
│   ├── hooks/      # Custom React/Wagmi hooks
│   ├── scoring/    # Reputation calculation logic
│   └── utils.ts    # Helper functions
├── server/          # Server Actions & API logic
└── types/           # Global TypeScript types
```

## Features

- **Wallet Connection**: Connect Base wallets via OnchainKit
- **Reputation Calculation**: Multi-metric scoring system
- **Tier System**: TOURIST → RESIDENT → BUILDER → BASED → LEGEND
- **Metric Breakdown**: View individual metric scores
- **Graceful Degradation**: App functions even if indexer/RPC fails

## Reputation Metrics

1. **Base Tenure** (15% weight) - Time on Base network
2. **Zora Mints** (12% weight) - Zora NFT minting activity
3. **Timeliness** (8% weight) - Early transaction patterns
4. **Farcaster** (15% weight) - Farcaster protocol engagement
5. **Builder** (20% weight) - Contract deployment activity
6. **Creator** (10% weight) - NFT creation activity
7. **Onchain Summer** (8% weight) - Onchain Summer participation
8. **Hackathon** (7% weight) - Hackathon participation
9. **Early Adopter** (5% weight) - Early Base ecosystem adoption

## License

Private
