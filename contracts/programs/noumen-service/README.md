# noumen-service

**Program ID:** `9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY`
**Network:** Devnet / Localnet
**Anchor version:** 0.30.1
**Crate name:** `noumen_service` (on-chain identifier — do not rename)

---

## Purpose

`noumen-service` is the service registry for AXIONBLADE. It maintains a catalog of all HERMES intelligence services offered to users, their pricing, lifecycle state, and rolling usage metrics.

The program enforces:
- A0-8: Service price must be >= cost * 120% (cost + 20% minimum margin)
- A0-26: Every service must carry `requires_not_advice_flag` and `requires_uncertainty_flags` (both set to true at registration)
- Sequential service lifecycle: Declared → Simulated → Active (only ±1 transitions allowed)

The service registry is a metadata layer: it describes what services exist and their pricing. Actual payment processing happens in `noumen-treasury`, which reads service prices off-chain or via argument to `process_service_payment`.

---

## Service Lifecycle

```
Declared (0) <---> Simulated (1) <---> Active (2)

Valid transitions:
  0 -> 1  (Declared to Simulated: start testing)
  1 -> 0  (Simulated to Declared: abort testing)
  1 -> 2  (Simulated to Active: go live)
  2 -> 1  (Active to Simulated: revert to testing)

Invalid:
  0 -> 2  (skip Simulated: REJECTED)
  2 -> 0  (skip Simulated: REJECTED)
```

This prevents services from going directly to production without a simulation phase.

---

## ASCII Architecture

```
  [super_authority]
         |
         | initialize_service_config() => ServiceConfig PDA [b"service_config"]

  [aeon_authority]
         |
         | register_service()       => ServiceEntry PDA [b"service", service_id]
         |                             Validates A0-8 margin, sets A0-26 flags
         |
         | update_service_price()   => ServiceEntry PDA (price + cost, revalidates A0-8)
         |
         | update_service_level()   => ServiceEntry PDA (lifecycle transition, ±1 only)

  [keeper_authority]
         |
         | update_service_metrics() => ServiceEntry PDA (7-day rolling metrics)
```

---

## Price Margin Enforcement (A0-8)

```
min_price = cost_lamports * PRICE_MARGIN_MULTIPLIER_BPS / 10_000
          = cost_lamports * 12000 / 10_000
          = cost_lamports * 1.20

require!(price_lamports >= min_price)
```

The constant `PRICE_MARGIN_MULTIPLIER_BPS = 12000` is defined in `shared-types`. This represents a 120% multiplier (cost + 20% minimum margin). The check is applied at both `register_service` and `update_service_price`.

---

## Accounts

### ServiceConfig

**PDA seeds:** `[b"service_config"]`
**Space:** 108 bytes

| Field | Type | Description |
|-------|------|-------------|
| `aeon_authority` | `Pubkey` | Only key that can register services and update prices/levels. |
| `keeper_authority` | `Pubkey` | Only key that can update service metrics. |
| `service_count` | `u16` | Total services registered. |
| `is_initialized` | `bool` | Anti-re-init guard. |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 32]` | Reserved. |

### ServiceEntry

**PDA seeds:** `[b"service", service_id.to_le_bytes()]`
**Space:** 123 bytes (8 discriminator + 115 fields)

| Field | Type | Description |
|-------|------|-------------|
| `service_id` | `u16` | Unique service identifier. PDA seed. |
| `owning_agent_id` | `u16` | Agent (HERMES) responsible for this service. |
| `service_tier` | `u8` | 0=Entry, 1=Premium, 2=B2B |
| `level` | `u8` | Lifecycle level: 0=Declared, 1=Simulated, 2=Active |
| `price_lamports` | `u64` | Current service price in lamports. |
| `cost_lamports` | `u64` | Current estimated cost basis in lamports. |
| `min_price_lamports` | `u64` | Computed minimum price (cost * 120%). Stored for off-chain visibility. |
| `request_count_7d` | `u16` | Requests in the last 7 days (keeper-maintained rolling metric). |
| `revenue_7d_lamports` | `u64` | Revenue in the last 7 days (keeper-maintained). |
| `subsidy_start` | `i64` | Timestamp when subsidy period began (0 if no subsidy active). |
| `created_at` | `i64` | Registration timestamp. |
| `updated_at` | `i64` | Last mutation timestamp. |
| `requires_not_advice_flag` | `bool` | Always true. Mandates disclosure that output is not financial advice (A0-26). |
| `requires_uncertainty_flags` | `bool` | Always true. Mandates uncertainty disclosure in outputs (A0-26). |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 48]` | Reserved. |

---

## Instructions

### `initialize_service_config`

**Signer:** `super_authority` (payer)
**One-time:** Yes (`is_initialized` guard + `init` constraint)

**Parameters:** `aeon_authority: Pubkey`, `keeper_authority: Pubkey`

**Emits:** `ServiceConfigInitialized { deployer, aeon_authority, keeper_authority }`

---

### `register_service`

**Signer:** `aeon_authority` (payer)
**Access control:** `has_one = aeon_authority`

Creates a `ServiceEntry` PDA with `level = 0` (Declared). Validates:
- `service_tier <= 2`
- `price_lamports >= cost_lamports * 12000 / 10000` (A0-8)

Sets `requires_not_advice_flag = true` and `requires_uncertainty_flags = true` unconditionally (A0-26).

**Parameters:** `service_id: u16`, `owning_agent_id: u16`, `service_tier: u8`, `price_lamports: u64`, `cost_lamports: u64`

**Emits:** `ServiceRegistered { service_id, owning_agent_id, service_tier, price_lamports, cost_lamports, min_price_lamports }`

---

### `update_service_price`

**Signer:** `aeon_authority`
**Access control:** `has_one = aeon_authority`

Updates `price_lamports`, `cost_lamports`, and recomputes `min_price_lamports`. Revalidates A0-8 margin.

**Parameters:** `_service_id: u16` (routing only), `new_price: u64`, `new_cost: u64`

**Emits:** `ServicePriceUpdated`

---

### `update_service_level`

**Signer:** `aeon_authority`
**Access control:** `has_one = aeon_authority`

Transitions the service lifecycle level. Only ±1 steps allowed. Valid transitions: 0↔1, 1↔2.

**Parameters:** `_service_id: u16` (routing only), `new_level: u8`

**Emits:** `ServiceLevelChanged { service_id, old_level, new_level }`

---

### `update_service_metrics`

**Signer:** `keeper_authority`
**Access control:** `has_one = keeper_authority`

Sets `request_count_7d` and `revenue_7d_lamports` to the provided values. These are rolling 7-day metrics maintained externally by the keeper; the program simply stores the latest values.

**Parameters:** `_service_id: u16` (routing only), `request_count_7d: u16`, `revenue_7d_lamports: u64`

**Emits:** `ServiceMetricsUpdated`

---

## Service Tier Table

| Value | Name | Use Case |
|-------|------|----------|
| 0 | Entry | Single-use or low-volume access |
| 1 | Premium | Subscription or high-value individual |
| 2 | B2B | Agent-to-Agent or institutional volume |

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | `Unauthorized` | Signer does not match required authority |
| 6001 | `AlreadyInitialized` | ServiceConfig already initialized |
| 6002 | `PriceBelowMinMargin` | `price_lamports < cost_lamports * 120%` (A0-8) |
| 6003 | `InvalidLevelTransition` | Non-adjacent level transition (e.g., 0 → 2) |
| 6004 | `ServiceNotFound` | Referenced service PDA does not exist |
| 6005 | `MathOverflow` | Checked arithmetic returned `None` |
| 6006 | `InvalidTier` | `service_tier > 2` |

---

## Security Considerations

1. **Margin enforcement at two points:** The 20% minimum margin (A0-8) is validated at both `register_service` and `update_service_price`. There is no instruction path to lower a price below cost without going through the explicit arithmetic check.

2. **Disclosure flags are immutable:** `requires_not_advice_flag` and `requires_uncertainty_flags` are set to `true` at registration and there is no instruction to set them to `false`. This ensures A0-26 compliance is structural, not optional.

3. **Level transition guard:** Skipping the Simulated phase (0→2 or 2→0) is explicitly rejected with `InvalidLevelTransition`. This prevents production deployment of untested services.

4. **Metrics are keeper-controlled:** `request_count_7d` and `revenue_7d_lamports` are set by the keeper without validation. The keeper is trusted to provide accurate rolling metrics. These fields are for observability and off-chain subsidy logic (A0 axiom on 90-day subsidy window), not for payment enforcement.

5. **`subsidy_start` is not automatically managed:** The field is initialized to 0 and there is no instruction to set or read it within the program. Subsidy tracking and enforcement are expected to happen off-chain.

---

## Integration Examples

### Register a new service

```typescript
const serviceId = 1;
const [serviceEntryPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("service"), Buffer.from(new Uint16Array([serviceId]).buffer)],
  SERVICE_PROGRAM_ID
);

const costLamports = new anchor.BN(8_000_000);   // 0.008 SOL
const priceLamports = new anchor.BN(10_000_000); // 0.010 SOL (125% of cost, > 120% floor)

await serviceProgram.methods
  .registerService(
    serviceId,
    3,              // owning_agent_id (HERMES)
    0,              // service_tier: Entry
    priceLamports,
    costLamports
  )
  .accounts({
    serviceConfig: serviceConfigPda,
    serviceEntry: serviceEntryPda,
    aeonAuthority: aeonKeypair.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([aeonKeypair])
  .rpc();
```

### Transition service to Active

```typescript
// First: Declared -> Simulated
await serviceProgram.methods.updateServiceLevel(serviceId, 1)
  .accounts({ ... }).signers([aeonKeypair]).rpc();

// After simulation period: Simulated -> Active
await serviceProgram.methods.updateServiceLevel(serviceId, 2)
  .accounts({ ... }).signers([aeonKeypair]).rpc();
```

### Fetch all active services

```typescript
const allServices = await serviceProgram.account.serviceEntry.all();
const activeServices = allServices.filter(s => s.account.level === 2);
console.log(`Active services: ${activeServices.length}`);
```

---

## Known Limitations

1. `service_count` in `ServiceConfig` only increments and never decrements. There is no deregister or archive instruction. Stale or discontinued services accumulate indefinitely.

2. The service registry does not track subsidy consumption. The 90-day subsidy window per service (axiom constraint) must be enforced off-chain.

3. `request_count_7d` and `revenue_7d_lamports` are directly overwritten by the keeper; there is no on-chain accumulation or validation. The keeper is trusted to provide correct rolling 7-day values.
