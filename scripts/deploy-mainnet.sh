#!/usr/bin/env bash
# chmod +x scripts/deploy-mainnet.sh
#
# NOUMEN Protocol — Mainnet Deployment Script
# Deploys all 7 Anchor programs to Solana mainnet-beta
# Usage: ./scripts/deploy-mainnet.sh [--dry-run]
#
set -euo pipefail

# ---------------------------------------------------------------------------
# PATH setup for Solana & Anchor CLIs
# ---------------------------------------------------------------------------
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
CLUSTER="mainnet-beta"
WORKSPACE_DIR="$(cd "$(dirname "$0")/.." && pwd)/noumen"
SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"
ANCHOR_TOML="$WORKSPACE_DIR/Anchor.toml"
TARGET_DIR="$WORKSPACE_DIR/target"
DEPLOY_DIR="$TARGET_DIR/deploy"
OUTPUT_JSON="$SCRIPTS_DIR/mainnet-program-ids.json"

MIN_BALANCE_SOL=20
WARN_BALANCE_SOL=30

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
    echo "============================================"
    echo "  DRY RUN MODE — nothing will be deployed"
    echo "============================================"
    echo ""
fi

# Programs in deployment order (noumen_core first — it is a dependency)
PROGRAMS=(
    "noumen_core:9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE"
    "noumen_proof:3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV"
    "noumen_treasury:EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu"
    "noumen_apollo:92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee"
    "noumen_hermes:Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj"
    "noumen_auditor:CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe"
    "noumen_service:9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY"
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log_info()  { echo "[INFO]  $*"; }
log_warn()  { echo "[WARN]  $*"; }
log_error() { echo "[ERROR] $*" >&2; }
log_ok()    { echo "[OK]    $*"; }

fail() {
    log_error "$@"
    exit 1
}

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
log_info "Running pre-flight checks..."

# 1. Solana CLI
if ! command -v solana &>/dev/null; then
    fail "solana CLI not found. Install it: https://docs.solana.com/cli/install-solana-cli-tools"
fi
log_ok "solana CLI found: $(solana --version)"

# 2. Anchor CLI
if ! command -v anchor &>/dev/null; then
    fail "anchor CLI not found. Install it: https://www.anchor-lang.com/docs/installation"
fi
log_ok "anchor CLI found: $(anchor --version)"

# 3. Set cluster
log_info "Setting cluster to $CLUSTER..."
if [[ "$DRY_RUN" == false ]]; then
    solana config set --url "$CLUSTER" >/dev/null 2>&1
fi
log_ok "Cluster target: $CLUSTER"

# 4. Check wallet
WALLET_PUBKEY=$(solana address 2>/dev/null) || fail "No wallet configured. Run: solana-keygen new"
log_ok "Wallet: $WALLET_PUBKEY"

# 5. Check balance
BALANCE_SOL=$(solana balance --lamports 2>/dev/null | awk '{print $1}')
BALANCE_SOL_DISPLAY=$(echo "scale=4; $BALANCE_SOL / 1000000000" | bc 2>/dev/null || echo "unknown")
log_info "Wallet balance: $BALANCE_SOL_DISPLAY SOL"

BALANCE_SOL_INT=$(echo "$BALANCE_SOL_DISPLAY" | cut -d'.' -f1)
if [[ "$BALANCE_SOL_INT" -lt "$MIN_BALANCE_SOL" ]]; then
    fail "Insufficient balance: $BALANCE_SOL_DISPLAY SOL. Need >= $MIN_BALANCE_SOL SOL for deployment."
fi
if [[ "$BALANCE_SOL_INT" -lt "$WARN_BALANCE_SOL" ]]; then
    log_warn "Balance is below recommended $WARN_BALANCE_SOL SOL. Deployment may partially fail."
fi
log_ok "Balance check passed."

# 6. Verify workspace
if [[ ! -f "$ANCHOR_TOML" ]]; then
    fail "Anchor.toml not found at $ANCHOR_TOML. Run this script from the NOUMEM root."
fi
log_ok "Anchor workspace found at $WORKSPACE_DIR"

# 7. Verify build artifacts
for entry in "${PROGRAMS[@]}"; do
    name="${entry%%:*}"
    so_file="$DEPLOY_DIR/${name}.so"
    if [[ ! -f "$so_file" ]]; then
        fail "Program binary not found: $so_file. Run 'anchor build' first."
    fi
done
log_ok "All 7 program binaries found in $DEPLOY_DIR"

echo ""
echo "==========================================================="
echo "  NOUMEN MAINNET DEPLOYMENT"
echo "==========================================================="
echo "  Cluster:    $CLUSTER"
echo "  Wallet:     $WALLET_PUBKEY"
echo "  Balance:    $BALANCE_SOL_DISPLAY SOL"
echo "  Programs:   7"
echo "  Workspace:  $WORKSPACE_DIR"
echo "==========================================================="
echo ""

# ---------------------------------------------------------------------------
# Confirmation prompt (skip in dry-run)
# ---------------------------------------------------------------------------
if [[ "$DRY_RUN" == false ]]; then
    read -rp "This will deploy to MAINNET. Continue? [y/N] " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        log_info "Deployment cancelled."
        exit 0
    fi
    echo ""
fi

# ---------------------------------------------------------------------------
# Deploy each program
# ---------------------------------------------------------------------------
DEPLOYED_IDS=()
DEPLOY_COUNT=0

for entry in "${PROGRAMS[@]}"; do
    name="${entry%%:*}"
    expected_id="${entry##*:}"

    echo "-----------------------------------------------------------"
    log_info "Deploying $name..."
    log_info "  Expected program ID: $expected_id"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "  [DRY RUN] Would run: anchor deploy --program-name $name --provider.cluster $CLUSTER"
        log_info "  [DRY RUN] Would verify: solana program show $expected_id"
        DEPLOYED_IDS+=("\"$name\": \"$expected_id\"")
        DEPLOY_COUNT=$((DEPLOY_COUNT + 1))
        continue
    fi

    # Deploy using anchor
    cd "$WORKSPACE_DIR"
    if ! anchor deploy --program-name "$name" --provider.cluster "$CLUSTER" 2>&1; then
        log_error "DEPLOYMENT FAILED for $name"
        log_error "Stopping deployment. $DEPLOY_COUNT of 7 programs deployed successfully."
        log_error "Fix the issue and re-run. Already-deployed programs are live."
        exit 1
    fi

    # Verify deployment
    log_info "  Verifying $name..."
    SHOW_OUTPUT=$(solana program show "$expected_id" 2>&1) || true
    if echo "$SHOW_OUTPUT" | grep -q "Error"; then
        log_error "Verification FAILED for $name (program ID: $expected_id)"
        log_error "solana program show output:"
        echo "$SHOW_OUTPUT"
        log_error "Stopping deployment."
        exit 1
    fi

    log_ok "$name deployed and verified."
    echo "$SHOW_OUTPUT" | head -5
    echo ""

    DEPLOYED_IDS+=("\"$name\": \"$expected_id\"")
    DEPLOY_COUNT=$((DEPLOY_COUNT + 1))
done

echo "-----------------------------------------------------------"
log_ok "All $DEPLOY_COUNT programs deployed successfully."
echo ""

# ---------------------------------------------------------------------------
# Save program IDs to JSON
# ---------------------------------------------------------------------------
log_info "Saving program IDs to $OUTPUT_JSON..."

cat > "$OUTPUT_JSON" << JSONEOF
{
  "cluster": "$CLUSTER",
  "deployer": "$WALLET_PUBKEY",
  "deployed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "programs": {
    "noumen_core": "9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE",
    "noumen_proof": "3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV",
    "noumen_treasury": "EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu",
    "noumen_apollo": "92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee",
    "noumen_hermes": "Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj",
    "noumen_auditor": "CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe",
    "noumen_service": "9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY"
  }
}
JSONEOF

log_ok "Program IDs saved to $OUTPUT_JSON"

# ---------------------------------------------------------------------------
# Update Anchor.toml with [programs.mainnet] section
# ---------------------------------------------------------------------------
log_info "Updating Anchor.toml with [programs.mainnet] section..."

if grep -q "\[programs\.mainnet\]" "$ANCHOR_TOML"; then
    log_warn "[programs.mainnet] section already exists in Anchor.toml. Skipping update."
else
    cat >> "$ANCHOR_TOML" << TOMLEOF

[programs.mainnet]
noumen_core = "9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE"
noumen_proof = "3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV"
noumen_treasury = "EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu"
noumen_apollo = "92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee"
noumen_hermes = "Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj"
noumen_auditor = "CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe"
noumen_service = "9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY"
TOMLEOF
    log_ok "Anchor.toml updated with [programs.mainnet]."
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "==========================================================="
echo "  DEPLOYMENT COMPLETE"
echo "==========================================================="
echo "  Programs deployed:  $DEPLOY_COUNT / 7"
echo "  Cluster:            $CLUSTER"
echo "  Wallet:             $WALLET_PUBKEY"
echo "  Program IDs:        $OUTPUT_JSON"
echo "  Anchor.toml:        Updated"
echo ""
echo "  Next steps:"
echo "    1. Run: npx ts-node scripts/init-mainnet.ts"
echo "    2. Run: ./scripts/verify-mainnet.sh"
echo "    3. Update app/.env.production with program IDs"
echo "==========================================================="
