#!/bin/bash
# ---------------------------------------------------------------------------
# Deploy axionblade-token-vault program to devnet/mainnet
# ---------------------------------------------------------------------------
# Usage:
#   ./deploy-token-vault.sh devnet
#   ./deploy-token-vault.sh mainnet
# ---------------------------------------------------------------------------

set -e

NETWORK=${1:-devnet}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CONTRACTS_DIR="$ROOT_DIR/contracts"

echo "🚀 Deploying axionblade-token-vault to $NETWORK..."
echo ""

# Set Solana cluster
if [ "$NETWORK" = "mainnet" ]; then
    solana config set --url https://api.mainnet-beta.solana.com
    PROGRAM_KEYPAIR="$CONTRACTS_DIR/keys/token-vault-mainnet.json"
else
    solana config set --url https://api.devnet.solana.com
    PROGRAM_KEYPAIR="$CONTRACTS_DIR/keys/token-vault-devnet.json"
fi

# Check deployer balance
DEPLOYER=$(solana address)
BALANCE=$(solana balance "$DEPLOYER" | awk '{print $1}')
echo "📍 Deployer: $DEPLOYER"
echo "💰 Balance: $BALANCE SOL"
echo ""

if (( $(echo "$BALANCE < 2.0" | bc -l) )); then
    echo "❌ Insufficient balance for deployment (need ~2 SOL)"
    echo "💡 Run: solana airdrop 2 (devnet only)"
    exit 1
fi

# Build program
echo "🔨 Building token vault program..."
cd "$CONTRACTS_DIR"
anchor build -p axionblade-token-vault

# Generate program keypair if not exists
if [ ! -f "$PROGRAM_KEYPAIR" ]; then
    echo "🔑 Generating program keypair..."
    solana-keygen new --no-passphrase -o "$PROGRAM_KEYPAIR"
fi

PROGRAM_ID=$(solana address -k "$PROGRAM_KEYPAIR")
echo "📝 Program ID: $PROGRAM_ID"
echo ""

# Deploy
echo "🚢 Deploying program..."
solana program deploy \
    --program-id "$PROGRAM_KEYPAIR" \
    --upgrade-authority "$DEPLOYER" \
    "$CONTRACTS_DIR/target/deploy/axionblade_token_vault.so"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Update TOKEN_VAULT_PROGRAM_ID in scripts/kronos-crank.ts"
echo "   2. Update TOKEN_VAULT_PROGRAM_ID in app/src/hooks/useTokenLaunch.ts"
echo "   3. Run: ./scripts/init-token-vault.ts --network $NETWORK"
echo ""
echo "Program ID: $PROGRAM_ID"
