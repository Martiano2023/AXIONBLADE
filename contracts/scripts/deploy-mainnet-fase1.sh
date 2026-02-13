#!/bin/bash
# AXIONBLADE v3.2.3 — Mainnet Deployment (FASE 1: Core MVP)
# Usage: ./scripts/deploy-mainnet-fase1.sh
#
# Prerequisites:
#   - Solana CLI installed and configured
#   - Programs built via `anchor build --no-idl`
#   - Wallet funded with >= 5 SOL (4.43 SOL + margem)
#   - BACKUP your upgrade authority keypair before deploying!
#
# FASE 1 deploys: core, proof, apollo (MVP funcional)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "╔═══════════════════════════════════════╗"
echo "║  AXIONBLADE v3.2.3 — Mainnet Fase 1       ║"
echo "║  Proof Before Action                   ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "⚠️  ATENÇÃO: Você está prestes a fazer deploy na MAINNET!"
echo "⚠️  Certifique-se de ter backup das suas chaves privadas."
echo ""

# ──────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────

CLUSTER="mainnet-beta"
RPC_URL="${RPC_URL:-https://api.mainnet-beta.solana.com}"

# Fase 1: Core MVP
PROGRAMS=(
  "noumen_core"
  "noumen_proof"
  "noumen_apollo"
)

# Custos estimados (SOL) com --max-len 1.5x
# Formato: programa:custo
ESTIMATED_COSTS=(
  "noumen_core:1.64"
  "noumen_proof:1.44"
  "noumen_apollo:1.35"
)

# Helper para pegar custo de um programa
get_cost() {
  local prog=$1
  for entry in "${ESTIMATED_COSTS[@]}"; do
    if [[ "$entry" == "$prog:"* ]]; then
      echo "${entry##*:}"
      return
    fi
  done
  echo "0.00"
}

# ──────────────────────────────────────────
# Step 1: Confirmação inicial
# ──────────────────────────────────────────

echo "═══════════════════════════════════════"
echo "  RESUMO DO DEPLOY - FASE 1"
echo "═══════════════════════════════════════"
echo ""
echo "  Programas a serem deployados:"
for prog in "${PROGRAMS[@]}"; do
  cost=$(get_cost "$prog")
  printf "    • %-20s ~%s SOL\n" "$prog" "$cost"
done
echo ""
TOTAL_COST="4.43"
echo "  Custo total estimado: ~${TOTAL_COST} SOL"
echo "  Cluster: $CLUSTER"
echo "  RPC: $RPC_URL"
echo ""

read -p "  Continuar? (digite 'yes' para confirmar): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "  Deploy cancelado."
  exit 0
fi

# ──────────────────────────────────────────
# Step 2: Configure Solana CLI
# ──────────────────────────────────────────

echo ""
echo "Step 1: Configurando Solana CLI para $CLUSTER..."
solana config set --url "$RPC_URL"

WALLET_ADDRESS=$(solana address)
BALANCE=$(solana balance 2>/dev/null | awk '{print $1}')

echo "  Wallet:  $WALLET_ADDRESS"
echo "  Balance: $BALANCE SOL"

# Check minimum balance
MIN_BALANCE=5
if (( $(echo "$BALANCE < $MIN_BALANCE" | bc -l 2>/dev/null || echo "1") )); then
  echo ""
  echo "  ⚠️  WARNING: Balance is below ${MIN_BALANCE} SOL."
  echo "  Custo estimado da Fase 1: ${TOTAL_COST} SOL"
  echo "  Recomendado: >= 5 SOL (com margem)"
  echo ""
  read -p "  Prosseguir mesmo assim? (yes/no): " CONTINUE
  if [ "$CONTINUE" != "yes" ]; then
    echo "  Deploy cancelado."
    exit 0
  fi
fi

# ──────────────────────────────────────────
# Step 3: Verify binaries
# ──────────────────────────────────────────

echo ""
echo "Step 2: Verificando binários..."

for prog in "${PROGRAMS[@]}"; do
  SO_FILE="target/deploy/${prog}.so"
  KP_FILE="target/deploy/${prog}-keypair.json"

  if [ ! -f "$SO_FILE" ]; then
    echo "  ❌ ERROR: $SO_FILE não encontrado"
    echo "  Execute: anchor build --no-idl"
    exit 1
  fi

  if [ ! -f "$KP_FILE" ]; then
    echo "  ❌ ERROR: $KP_FILE não encontrado"
    exit 1
  fi

  SIZE=$(wc -c < "$SO_FILE" | tr -d ' ')
  MAX_LEN=$(echo "$SIZE * 1.5 / 1" | bc)
  ADDR=$(solana-keygen pubkey "$KP_FILE")
  echo "  ✓ $prog: ${SIZE} bytes (max-len: ${MAX_LEN}) -> $ADDR"
done

# ──────────────────────────────────────────
# Step 4: Deploy programs
# ──────────────────────────────────────────

echo ""
echo "Step 3: Deploy dos programas..."
echo "═══════════════════════════════════════"

DEPLOYED_IDS=()

for prog in "${PROGRAMS[@]}"; do
  SO_FILE="target/deploy/${prog}.so"
  KP_FILE="target/deploy/${prog}-keypair.json"
  ADDR=$(solana-keygen pubkey "$KP_FILE")

  SIZE=$(wc -c < "$SO_FILE" | tr -d ' ')
  MAX_LEN=$(echo "$SIZE * 1.5 / 1" | bc)

  echo ""
  echo "───────────────────────────────────────"
  cost=$(get_cost "$prog")
  echo "  Programa: $prog"
  echo "  Program ID: $ADDR"
  echo "  Tamanho: ${SIZE} bytes"
  echo "  Max-len: ${MAX_LEN} bytes (1.5x)"
  echo "  Custo estimado: ~${cost} SOL"
  echo "───────────────────────────────────────"
  echo ""
  read -p "  Deploy este programa agora? (yes/no): " DEPLOY_CONFIRM

  if [ "$DEPLOY_CONFIRM" != "yes" ]; then
    echo "  ⏭️  Pulando $prog..."
    continue
  fi

  # Check if already deployed
  EXISTING=$(solana program show "$ADDR" 2>/dev/null || echo "")

  if echo "$EXISTING" | grep -q "Program Id"; then
    echo "  ⚠️  Programa já existe na mainnet."
    echo ""
    read -p "  Fazer UPGRADE? (yes/no): " UPGRADE_CONFIRM

    if [ "$UPGRADE_CONFIRM" != "yes" ]; then
      echo "  ⏭️  Pulando upgrade de $prog..."
      DEPLOYED_IDS+=("$prog=$ADDR")
      continue
    fi

    echo "  🔄 Upgrading $prog..."
    solana program deploy "$SO_FILE" \
      --program-id "$KP_FILE" \
      --url "$RPC_URL" \
      --max-len "$MAX_LEN" \
      --with-compute-unit-price 1000 \
      2>&1 || { echo "  ❌ Upgrade falhou para $prog"; exit 1; }
  else
    echo "  🚀 Deploying $prog..."
    solana program deploy "$SO_FILE" \
      --program-id "$KP_FILE" \
      --url "$RPC_URL" \
      --max-len "$MAX_LEN" \
      --with-compute-unit-price 1000 \
      2>&1 || { echo "  ❌ Deploy falhou para $prog"; exit 1; }
  fi

  echo "  ✅ $prog deployed com sucesso!"
  DEPLOYED_IDS+=("$prog=$ADDR")

  # Aguardar confirmação na blockchain
  sleep 2
done

# ──────────────────────────────────────────
# Step 5: Summary
# ──────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════"
echo "  🎉 FASE 1 COMPLETA!"
echo "═══════════════════════════════════════"
echo ""
echo "  Programas deployados:"
for entry in "${DEPLOYED_IDS[@]}"; do
  prog="${entry%%=*}"
  addr="${entry##*=}"
  printf "    ✓ %-20s %s\n" "$prog" "$addr"
done

echo ""
echo "  Próximos passos:"
echo ""
echo "    1. Copie os Program IDs acima"
echo ""
echo "    2. Configure .env.production:"
echo "       NEXT_PUBLIC_PROGRAM_CORE=<noumen_core_id>"
echo "       NEXT_PUBLIC_PROGRAM_PROOF=<noumen_proof_id>"
echo "       NEXT_PUBLIC_PROGRAM_APOLLO=<noumen_apollo_id>"
echo ""
echo "    3. Inicialize os PDAs:"
echo "       RPC_URL=\"$RPC_URL\" npx ts-node scripts/init-mainnet-fase1.ts"
echo ""
echo "    4. Quando tiver mais SOL, execute a Fase 2:"
echo "       ./scripts/deploy-mainnet-fase2.sh"
echo ""
echo "  Saldo atual: $(solana balance 2>/dev/null)"
echo ""
