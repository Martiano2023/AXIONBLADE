#!/bin/bash
# AXIONBLADE v3.2.3 — Mainnet Deployment (FASE 2: Economia Completa)
# Usage: ./scripts/deploy-mainnet-fase2.sh
#
# Prerequisites:
#   - Fase 1 já deployada (core, proof, apollo)
#   - Wallet funded com >= 6 SOL (5.73 SOL + margem)
#   - BACKUP your upgrade authority keypair!
#
# FASE 2 deploys: treasury, service, auditor, hermes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "╔═══════════════════════════════════════╗"
echo "║  AXIONBLADE v3.2.3 — Mainnet Fase 2       ║"
echo "║  Economia & Serviços Completos        ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "⚠️  ATENÇÃO: Deploy na MAINNET (Fase 2)"
echo ""

# ──────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────

CLUSTER="mainnet-beta"
RPC_URL="${RPC_URL:-https://api.mainnet-beta.solana.com}"

# Fase 2: Economia
PROGRAMS=(
  "noumen_treasury"
  "noumen_service"
  "noumen_auditor"
  "noumen_hermes"
)

# Custos estimados (SOL) com --max-len 1.5x
# Formato: programa:custo
ESTIMATED_COSTS=(
  "noumen_treasury:1.82"
  "noumen_service:1.26"
  "noumen_auditor:1.41"
  "noumen_hermes:1.24"
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
echo "  RESUMO DO DEPLOY - FASE 2"
echo "═══════════════════════════════════════"
echo ""
echo "  Programas a serem deployados:"
for prog in "${PROGRAMS[@]}"; do
  cost=$(get_cost "$prog")
  printf "    • %-20s ~%s SOL\n" "$prog" "$cost"
done
echo ""
TOTAL_COST="5.73"
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
MIN_BALANCE=6
if (( $(echo "$BALANCE < $MIN_BALANCE" | bc -l 2>/dev/null || echo "1") )); then
  echo ""
  echo "  ⚠️  WARNING: Balance is below ${MIN_BALANCE} SOL."
  echo "  Custo estimado da Fase 2: ${TOTAL_COST} SOL"
  echo "  Recomendado: >= 6 SOL (com margem)"
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
echo "  🎉 FASE 2 COMPLETA!"
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
echo "    1. Atualize .env.production com os IDs acima:"
echo "       NEXT_PUBLIC_PROGRAM_TREASURY=<treasury_id>"
echo "       NEXT_PUBLIC_PROGRAM_SERVICE=<service_id>"
echo "       NEXT_PUBLIC_PROGRAM_AUDITOR=<auditor_id>"
echo "       NEXT_PUBLIC_PROGRAM_HERMES=<hermes_id>"
echo ""
echo "    2. Inicialize os PDAs da Fase 2:"
echo "       RPC_URL=\"$RPC_URL\" npx ts-node scripts/init-mainnet-fase2.ts"
echo ""
echo "    3. Rebuild do frontend:"
echo "       cd ../app && npm run build"
echo ""
echo "    4. Deploy do frontend atualizado"
echo ""
echo "  Saldo atual: $(solana balance 2>/dev/null)"
echo ""
echo "  🚀 AXIONBLADE v3.2.3 totalmente deployado na mainnet!"
echo ""
