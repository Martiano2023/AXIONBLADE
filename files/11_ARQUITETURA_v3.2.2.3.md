# NOUMEN v3.2.2.3 — Patch de Fechamento

> Correlation Fields, Ramp-up Suavizado, Contagem Corrigida

---

## Delta v3.2.2.2 → v3.2.2.3

| # | Mudança |
|---|---|
| D22 | Campos correlação anti-masquerade no donation receipt |
| D23 | Ramp-up suavizado (25/50/100) |
| D24 | Contagem axiomas corrigida |

---

## Donation Receipt com Correlação

```json
{
  "receipt_id": "<hash>",
  "amount_lamports": "<int>",
  "timestamp_utc": "<ISO8601>",
  "source_wallet_hash": "<SHA-256>",
  "disclosure": "PSEUDONYMOUS | DISCLOSED",
  "receipt_status": "VALID_DONATION | UNRECOGNIZED_FORMAT",
  "counts_as_donation": true,
  "correlation": {
    "window_hours": 24,
    "correlated_service_payments_count": "<int>",
    "correlated_flag": "<true | false>"
  },
  "receipt_hash": "<SHA-256>"
}
```

---

## Ramp-up Suavizado

| Condição | Dias 1–7 | Dias 8–30 | Dia 31+ |
|---|---|---|---|
| Wallet existente (≥14d), sem circularidade | 25% | 50% | 100% |
| Wallet nova (<14d) OU circular | 0% | 50% | 100% |

---

## Contagem Final de Axiomas

| Range | Status | Qty |
|---|---|---|
| A0-1 | Ativo | 1 |
| A0-2 | DEPRECATED | 0 |
| A0-3 a A0-28 | Ativos | 26 |
| **Total enumerados** | | **28** |
| **Total ativos** | | **27** |
| **Total deprecated** | | **1** |
