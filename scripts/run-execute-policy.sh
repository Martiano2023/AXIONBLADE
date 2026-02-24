#!/bin/bash
# AXIONBLADE — execute_policy_change scheduler
# Agendado para 2026-02-25T22:10 UTC (7 min após delay_until)

export PATH="/Users/marciano/.nvm/versions/node/v24.13.0/bin:/usr/local/bin:/usr/bin:/bin"
export HOME="/Users/marciano"

LOG="/tmp/axionblade-execute-policy-$(date +%Y%m%d-%H%M%S).log"

echo "[$(date -u '+%Y-%m-%dT%H:%M:%S UTC')] Iniciando execute_policy_change..." | tee "$LOG"

cd /Users/marciano/Desktop/AXIONBLADE/contracts || exit 1

npx ts-node scripts/execute-policy-mainnet.ts 2>&1 | tee -a "$LOG"

echo "[$(date -u '+%Y-%m-%dT%H:%M:%S UTC')] Concluido. Log: $LOG" | tee -a "$LOG"
