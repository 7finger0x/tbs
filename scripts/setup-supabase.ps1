# Supabase Connection Setup Script
# This script helps configure the DATABASE_URL for Supabase
# Password should be provided via parameter or environment variable
# For security, do not hardcode passwords in scripts

param(
    [string]$Password = $null
)

$projectRef = "solxqaovtrjivudxecqi"

# Try to get password from parameter or env var
if (-not $Password) {
    $Password = $env:SUPABASE_PASSWORD
}

if (-not $Password) {
    Write-Host "ERROR: Password not provided" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage options:" -ForegroundColor Yellow
    Write-Host "  1. As parameter: powershell scripts/setup-supabase.ps1 -Password 'your-password'" -ForegroundColor Cyan
    Write-Host "  2. Via env var: `$env:SUPABASE_PASSWORD = 'your-password'; powershell scripts/setup-supabase.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Note: Use single quotes around password if it contains special characters:" -ForegroundColor Yellow
    Write-Host "  `$env:SUPABASE_PASSWORD = 'Wyatt505`$&@827`$&@'" -ForegroundColor Cyan
    exit 1
}
$encodedPassword = [System.Uri]::EscapeDataString($Password)

# Direct connection (for migrations)
$directConnection = "postgresql://postgres:$encodedPassword@db.$projectRef.supabase.co:5432/postgres"

# Connection pooling (for application use - better performance)
$pooledConnection = "postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15"

Write-Host "=========================================="
Write-Host "Supabase Connection Configuration"
Write-Host "=========================================="
Write-Host ""
Write-Host "Project Reference: $projectRef"
Write-Host "Project URL: https://$projectRef.supabase.co"
Write-Host ""
Write-Host "Direct Connection (for migrations):"
Write-Host $directConnection
Write-Host ""
Write-Host "Pooled Connection (for application):"
Write-Host $pooledConnection
Write-Host ""

# Check if .env.local exists
$envFile = ".env.local"
if (Test-Path $envFile) {
    Write-Host "Found existing .env.local file"
    $backup = "$envFile.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $envFile $backup
    Write-Host "Backed up to: $backup"
    
    # Update DATABASE_URL
    $content = Get-Content $envFile -Raw
    if ($content -match 'DATABASE_URL\s*=') {
        $content = $content -replace 'DATABASE_URL\s*=.*', "DATABASE_URL=`"$directConnection`""
        Write-Host "Updated DATABASE_URL in .env.local"
    } else {
        $content += "`nDATABASE_URL=`"$directConnection`"`n"
        Write-Host "Added DATABASE_URL to .env.local"
    }
    Set-Content $envFile $content
} else {
    Write-Host "Creating .env.local file..."
    $envContent = @"
# Database Connection
DATABASE_URL="$directConnection"

# Network Configuration
NEXT_PUBLIC_BASE_RPC_URL="https://mainnet.base.org"
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
NEXT_PUBLIC_CHAIN_ID="8453"
NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS="0x0000000000000000000000000000000000000000"

# Supabase Public Keys (optional - for client-side features)
NEXT_PUBLIC_SUPABASE_URL="https://solxqaovtrjivudxecqi.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="sb_publishable_mfpFH6bDL8ivNIP59N5qWA_gioDGH8g"

# API Keys (add as needed)
# NEYNAR_API_KEY=""
# ZORA_API_KEY=""
# NEXT_PUBLIC_ONCHAINKIT_API_KEY=""
# GITCOIN_PASSPORT_API_KEY=""

# EAS Schema UIDs
# ONCHAIN_SUMMER_SCHEMA_UID=""
# HACKATHON_SCHEMA_UID=""
# COINBASE_ATTESTATION_SCHEMA_UID=""

# CORS Configuration
ALLOWED_ORIGINS="*"
"@
    Set-Content $envFile $envContent
    Write-Host "Created .env.local file"
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Next Steps:"
Write-Host "=========================================="
Write-Host "1. Verify connection:"
Write-Host "   npx prisma db pull"
Write-Host ""
Write-Host "2. Generate Prisma Client:"
Write-Host "   npm run db:generate"
Write-Host ""
Write-Host "3. Run migrations:"
Write-Host "   npx prisma migrate deploy"
Write-Host ""
Write-Host "4. (Optional) Open Prisma Studio:"
Write-Host "   npm run db:studio"
Write-Host ""
