#!/bin/bash
# NOUMEN v3.2.3 — Devnet Deployment Script
# Usage: ./scripts/deploy-devnet.sh
#
# Prerequisites:
#   - Solana CLI installed and configured
#   - Anchor CLI installed
#   - Programs built via `anchor build --no-idl`
#   - Wallet funded with devnet SOL (>= 10 SOL recommended)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "╔═══════════════════════════════════════╗"
echo "║  NOUMEN v3.2.3 — Devnet Deployment    ║"
echo "║  Proof Before Action                   ║"
echo "╚═══════════════════════════════════════╝"

# ──────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────

CLUSTER="devnet"
RPC_URL="https://api.devnet.solana.com"

PROGRAMS=(
  "noumen_core"
  "noumen_proof"
  "noumen_treasury"
  "noumen_apollo"
  "noumen_hermes"
  "noumen_auditor"
  "noumen_service"
)

# ──────────────────────────────────────────
# Step 1: Configure Solana CLI
# ──────────────────────────────────────────

echo ""
echo "Step 1: Configuring Solana CLI for $CLUSTER..."
solana config set --url "$RPC_URL"

WALLET_ADDRESS=$(solana address)
BALANCE=$(solana balance 2>/dev/null | awk '{print $1}')

echo "  Wallet:  $WALLET_ADDRESS"
echo "  Balance: $BALANCE SOL"

# Check minimum balance
MIN_BALANCE=5
if (( $(echo "$BALANCE < $MIN_BALANCE" | bc -l 2>/dev/null || echo "1") )); then
  echo ""
  echo "  WARNING: Balance is below ${MIN_BALANCE} SOL."
  echo "  Attempting airdrop..."
  solana airdrop 2 2>/dev/null || echo "  Airdrop failed (rate limited). Fund manually:"
  echo "    https://faucet.solana.com/"
  echo "    Or: solana airdrop 2"
  echo ""
  read -p "  Press Enter once wallet is funded, or Ctrl+C to abort..."
  BALANCE=$(solana balance 2>/dev/null | awk '{print $1}')
  echo "  Updated balance: $BALANCE SOL"
fi

# ──────────────────────────────────────────
# Step 2: Build programs
# ──────────────────────────────────────────

echo ""
echo "Step 2: Building all programs..."
anchor build --no-idl
echo "  Build complete."

# ──────────────────────────────────────────
# Step 3: Verify binaries and keypairs
# ──────────────────────────────────────────

echo ""
echo "Step 3: Verifying build artifacts..."

for prog in "${PROGRAMS[@]}"; do
  SO_FILE="target/deploy/${prog}.so"
  KP_FILE="target/deploy/${prog}-keypair.json"

  if [ ! -f "$SO_FILE" ]; then
    echo "  ERROR: $SO_FILE not found"
    exit 1
  fi

  if [ ! -f "$KP_FILE" ]; then
    echo "  ERROR: $KP_FILE not found"
    exit 1
  fi

  SIZE=$(wc -c < "$SO_FILE" | tr -d ' ')
  ADDR=$(solana-keygen pubkey "$KP_FILE")
  echo "  $prog: ${SIZE} bytes -> $ADDR"
done

# ──────────────────────────────────────────
# Step 4: Deploy programs
# ──────────────────────────────────────────

echo ""
echo "Step 4: Deploying programs to $CLUSTER..."
echo "═══════════════════════════════════════"

for prog in "${PROGRAMS[@]}"; do
  SO_FILE="target/deploy/${prog}.so"
  KP_FILE="target/deploy/${prog}-keypair.json"
  ADDR=$(solana-keygen pubkey "$KP_FILE")

  echo ""
  echo "  Deploying $prog..."
  echo "  Program ID: $ADDR"

  # Check if already deployed
  EXISTING=$(solana program show "$ADDR" 2>/dev/null || echo "")
  if echo "$EXISTING" | grep -q "Program Id"; then
    echo "  Already deployed. Upgrading..."
    solana program deploy "$SO_FILE" \
      --program-id "$KP_FILE" \
      --url "$RPC_URL" \
      --with-compute-unit-price 1000 \
      2>&1 || { echo "  Upgrade failed for $prog"; exit 1; }
  else
    solana program deploy "$SO_FILE" \
      --program-id "$KP_FILE" \
      --url "$RPC_URL" \
      --with-compute-unit-price 1000 \
      2>&1 || { echo "  Deploy failed for $prog"; exit 1; }
  fi

  echo "  $prog deployed successfully."
done

# ──────────────────────────────────────────
# Step 5: Initialize program accounts
# ──────────────────────────────────────────

echo ""
echo "Step 5: Initializing program accounts..."
RPC_URL="$RPC_URL" npx ts-node scripts/init-devnet.ts

# ──────────────────────────────────────────
# Step 6: Update frontend env
# ──────────────────────────────────────────

echo ""
echo "Step 6: Updating frontend configuration..."
APP_ENV="../app/.env.local"

cat > "$APP_ENV" <<EOF
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_CLUSTER=devnet
EOF

echo "  Updated $APP_ENV"

# ──────────────────────────────────────────
# Summary
# ──────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════"
echo "  Deployment Complete!"
echo "═══════════════════════════════════════"
echo ""
echo "  Programs deployed to: $CLUSTER"
echo "  RPC: $RPC_URL"
echo ""

for prog in "${PROGRAMS[@]}"; do
  KP_FILE="target/deploy/${prog}-keypair.json"
  ADDR=$(solana-keygen pubkey "$KP_FILE")
  printf "  %-20s %s\n" "$prog" "$ADDR"
done

echo ""
echo "  Next steps:"
echo "    1. cd ../app && npm run dev"
echo "    2. Connect wallet (Phantom/Solflare) to devnet"
echo "    3. Visit http://localhost:3000"
echo ""
