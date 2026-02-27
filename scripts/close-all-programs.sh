#!/bin/bash
# ---------------------------------------------------------------------------
# Close All AXIONBLADE Programs and Recover SOL
# ---------------------------------------------------------------------------

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔴 AXIONBLADE - Close All Programs"
echo "=================================="
echo ""
echo -e "${RED}⚠️  WARNING: This will close all programs and recover SOL${NC}"
echo -e "${RED}⚠️  Programs will be DELETED from the blockchain${NC}"
echo ""

# Check network
NETWORK=${1:-mainnet-beta}
echo "Network: $NETWORK"
echo ""

# Program IDs
PROGRAMS=(
  "9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE"  # noumen_core
  "3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV"  # noumen_proof
  "EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu"  # noumen_treasury
  "92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee"  # noumen_apollo
  "Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj"  # noumen_hermes
  "CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe"  # noumen_auditor
  "9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY"  # noumen_service
)

PROGRAM_NAMES=(
  "noumen_core"
  "noumen_proof"
  "noumen_treasury"
  "noumen_apollo"
  "noumen_hermes"
  "noumen_auditor"
  "noumen_service"
)

# Get initial balance
INITIAL_BALANCE=$(solana balance --url $NETWORK | awk '{print $1}')
echo -e "${YELLOW}Initial balance: $INITIAL_BALANCE SOL${NC}"
echo ""

# Confirmation
read -p "Type 'CLOSE' to confirm: " CONFIRM
if [ "$CONFIRM" != "CLOSE" ]; then
  echo "Aborted."
  exit 1
fi

echo ""
echo "Closing programs..."
echo ""

RECOVERED_SOL=0

# Close each program
for i in "${!PROGRAMS[@]}"; do
  PROGRAM_ID="${PROGRAMS[$i]}"
  PROGRAM_NAME="${PROGRAM_NAMES[$i]}"

  echo -e "${YELLOW}[$((i+1))/7] Closing $PROGRAM_NAME...${NC}"

  # Check if program exists
  if solana program show "$PROGRAM_ID" --url $NETWORK &> /dev/null; then
    # Get program balance before closing
    PROGRAM_BALANCE=$(solana program show "$PROGRAM_ID" --url $NETWORK | grep "Balance:" | awk '{print $2}')

    # Close program
    if solana program close "$PROGRAM_ID" --url $NETWORK; then
      echo -e "${GREEN}✓ Closed $PROGRAM_NAME (recovered ~$PROGRAM_BALANCE SOL)${NC}"
      RECOVERED_SOL=$(echo "$RECOVERED_SOL + $PROGRAM_BALANCE" | bc)
    else
      echo -e "${RED}✗ Failed to close $PROGRAM_NAME${NC}"
    fi
  else
    echo -e "${YELLOW}⊘ $PROGRAM_NAME not found (may not be deployed)${NC}"
  fi

  echo ""
done

# Get final balance
FINAL_BALANCE=$(solana balance --url $NETWORK | awk '{print $1}')

echo ""
echo "=================================="
echo -e "${GREEN}✓ Programs closed successfully!${NC}"
echo ""
echo "Initial balance:  $INITIAL_BALANCE SOL"
echo "Final balance:    $FINAL_BALANCE SOL"
echo "Recovered:        ~$RECOVERED_SOL SOL"
echo ""
echo -e "${YELLOW}Note: Small differences due to transaction fees${NC}"
