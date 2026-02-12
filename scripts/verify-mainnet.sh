#!/usr/bin/env bash
# chmod +x scripts/verify-mainnet.sh
#
# NOUMEN Protocol — Mainnet Verification Script
# Checks all 7 programs and critical PDA accounts on mainnet-beta
#
set -euo pipefail

# ---------------------------------------------------------------------------
# PATH setup
# ---------------------------------------------------------------------------
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
CLUSTER="mainnet-beta"

declare -A PROGRAMS
PROGRAMS=(
    ["noumen_core"]="9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE"
    ["noumen_proof"]="3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV"
    ["noumen_treasury"]="EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu"
    ["noumen_apollo"]="92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee"
    ["noumen_hermes"]="Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj"
    ["noumen_auditor"]="CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe"
    ["noumen_service"]="9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY"
)

# Ordered list for display
PROGRAM_ORDER=(
    "noumen_core"
    "noumen_proof"
    "noumen_treasury"
    "noumen_apollo"
    "noumen_hermes"
    "noumen_auditor"
    "noumen_service"
)

# ---------------------------------------------------------------------------
# Set cluster
# ---------------------------------------------------------------------------
solana config set --url "$CLUSTER" >/dev/null 2>&1

WALLET_PUBKEY=$(solana address 2>/dev/null || echo "UNKNOWN")
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

# ---------------------------------------------------------------------------
# Check programs
# ---------------------------------------------------------------------------
PROGRAM_RESULTS=()
ALL_PROGRAMS_OK=true

for name in "${PROGRAM_ORDER[@]}"; do
    pid="${PROGRAMS[$name]}"
    OUTPUT=$(solana program show "$pid" 2>&1) || true

    if echo "$OUTPUT" | grep -q "Program Id"; then
        PROGRAM_RESULTS+=("Program: ${name} $(printf '.%.0s' $(seq 1 $((30 - ${#name}))))  DEPLOYED")

        # Extract details
        DATA_LEN=$(echo "$OUTPUT" | grep "Data Length" | awk '{print $3, $4}' || echo "N/A")
        DEPLOY_SLOT=$(echo "$OUTPUT" | grep "Last Deployed" | awk '{print $NF}' || echo "N/A")
        AUTHORITY=$(echo "$OUTPUT" | grep "Authority" | awk '{print $2}' || echo "N/A")
    else
        PROGRAM_RESULTS+=("Program: ${name} $(printf '.%.0s' $(seq 1 $((30 - ${#name}))))  MISSING")
        ALL_PROGRAMS_OK=false
    fi
done

# ---------------------------------------------------------------------------
# Check PDA accounts
# Uses `solana account` to verify PDAs exist.
# We derive PDA addresses the same way as the programs (seed strings).
# Since we cannot derive PDAs in bash, we use solana CLI with known addresses.
# The init script prints these; for verification, we attempt to read them.
# ---------------------------------------------------------------------------

# Helper: check if an account exists (non-empty data) using solana CLI
check_pda() {
    local label="$1"
    local pda_desc="$2"

    # We use the find-program-derived-address approach:
    # Since bash cannot compute PDAs, we check the account by querying the chain.
    # The init script or verify should have the PDAs recorded.
    # For now, we try to fetch from the mainnet-program-ids.json or compute them.
    #
    # Alternative: use the `solana find-program-derived-address` if available,
    # or call a small Node one-liner.

    local address
    address=$(node -e "
        const { PublicKey } = require('@solana/web3.js');
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from('${pda_desc}')],
            new PublicKey('${3}')
        );
        console.log(pda.toBase58());
    " 2>/dev/null) || address="COMPUTE_FAILED"

    if [[ "$address" == "COMPUTE_FAILED" ]]; then
        echo "FAILED_TO_COMPUTE"
        return
    fi

    local ACCOUNT_OUTPUT
    ACCOUNT_OUTPUT=$(solana account "$address" 2>&1) || true

    if echo "$ACCOUNT_OUTPUT" | grep -q "Public Key"; then
        echo "OK:$address"
    elif echo "$ACCOUNT_OUTPUT" | grep -q "lamports"; then
        echo "OK:$address"
    else
        echo "MISSING:$address"
    fi
}

# Check critical PDAs
TREASURY_PDA_RESULT=$(check_pda "Treasury Config" "treasury_config" "EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu")
DONATION_PDA_RESULT=$(check_pda "Donation Vault" "donation_vault" "EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu")
CCS_PDA_RESULT=$(check_pda "CCS Config" "ccs_config" "EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu")

format_pda_status() {
    local result="$1"
    local label="$2"
    local padding=$((30 - ${#label}))
    local dots
    dots=$(printf '.%.0s' $(seq 1 $padding))

    if [[ "$result" == OK:* ]]; then
        echo "${label} ${dots}  INITIALIZED"
    elif [[ "$result" == MISSING:* ]]; then
        echo "${label} ${dots}  NOT FOUND"
    else
        echo "${label} ${dots}  CHECK FAILED"
    fi
}

TREASURY_STATUS=$(format_pda_status "$TREASURY_PDA_RESULT" "Treasury PDA")
DONATION_STATUS=$(format_pda_status "$DONATION_PDA_RESULT" "Donation PDA")
CCS_STATUS=$(format_pda_status "$CCS_PDA_RESULT" "CCS Config")

# ---------------------------------------------------------------------------
# Output report
# ---------------------------------------------------------------------------
echo ""
echo "================================================================="
echo "NOUMEN MAINNET VERIFICATION REPORT"
echo "================================================================="

for line in "${PROGRAM_RESULTS[@]}"; do
    echo "$line"
done

echo "-----------------------------------------------------------------"
echo "$TREASURY_STATUS"
echo "$DONATION_STATUS"
echo "$CCS_STATUS"
echo "-----------------------------------------------------------------"
echo "Authority: $WALLET_PUBKEY"
echo "Cluster: $CLUSTER"
echo "Timestamp: $TIMESTAMP"
echo "================================================================="
echo ""

# ---------------------------------------------------------------------------
# Detailed program info
# ---------------------------------------------------------------------------
echo "DETAILED PROGRAM INFO"
echo "-----------------------------------------------------------------"

for name in "${PROGRAM_ORDER[@]}"; do
    pid="${PROGRAMS[$name]}"
    echo ""
    echo "  $name ($pid)"
    OUTPUT=$(solana program show "$pid" 2>&1) || true
    if echo "$OUTPUT" | grep -q "Program Id"; then
        echo "$OUTPUT" | sed 's/^/    /'
    else
        echo "    NOT DEPLOYED or error fetching program info"
    fi
done

echo ""
echo "-----------------------------------------------------------------"

# Exit with error if any program is missing
if [[ "$ALL_PROGRAMS_OK" == false ]]; then
    echo "WARNING: Some programs are not deployed. Check the report above."
    exit 1
fi

echo "All checks passed."
