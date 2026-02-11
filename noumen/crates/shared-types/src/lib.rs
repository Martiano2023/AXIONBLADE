use anchor_lang::prelude::*;

// ──────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum AgentType {
    Collector,
    Evaluator,
    Executor,
    Auditor,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum AgentStatus {
    Pending,
    Active,
    Paused,
    Killed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum ExecutionPermission {
    Never,
    Limited,
    Full,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum ServiceLevel {
    Declared,
    Simulated,
    Active,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum EvidenceFamily {
    PriceVolume,
    LiquidityComposition,
    BehaviorPattern,
    IncentiveEconomic,
    ProtocolGovernance,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum CircuitBreakerMode {
    Normal,
    Cautious,
    Restricted,
    Halted,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum DecisionClass {
    Info,
    LimitedReliability,
    RiskWarning,
    DangerSignal,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum ReportType {
    EffectiveAPR,
    RiskDecomposition,
    YieldTrapIntelligence,
    PoolComparison,
    ProtocolHealth,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum IncidentType {
    Exploit,
    RugPull,
    LiquidityDrain,
    OracleManipulation,
    IncentiveCollapse,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum IncidentStatus {
    Unconfirmed,
    Confirmed,
    Dismissed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum TruthLabelResult {
    Correct,
    Incorrect,
    Inconclusive,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum DisclosureMode {
    Pseudonymous,
    Disclosed,
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

pub const HARD_AGENT_CAP: u16 = 100;
pub const RESERVE_RATIO_BPS: u16 = 2500;
pub const DAILY_SPEND_CAP_BPS: u16 = 300;
pub const AGENT_BUDGET_CAP_BPS: u16 = 1500;
pub const EVALUATOR_BUDGET_CAP_BPS: u16 = 2500;
pub const CCS_CAP_TOTAL_BPS: u16 = 1500;
pub const CCS_FLOOR_BASE_SPLIT_BPS: u16 = 400;
pub const CCS_CAP_STIPEND_BPS: u16 = 500;
pub const APOLLO_MAX_WEIGHT_BPS: u16 = 4000;
pub const MIN_EVIDENCE_FAMILIES: u8 = 2;
pub const PRICE_MARGIN_MULTIPLIER_BPS: u16 = 12000;
pub const EVIDENCE_FAMILY_COUNT: u8 = 5;
pub const LAMPORTS_PER_SOL: u64 = 1_000_000_000;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/// Counts the number of set bits in an evidence families bitmap.
/// Used to enforce A0-17: execution-class decisions require >= 2 evidence families.
pub fn count_set_bits(bitmap: u8) -> u8 {
    bitmap.count_ones() as u8
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_count_set_bits() {
        assert_eq!(count_set_bits(0b00000), 0);
        assert_eq!(count_set_bits(0b00001), 1);
        assert_eq!(count_set_bits(0b00011), 2);
        assert_eq!(count_set_bits(0b00111), 3);
        assert_eq!(count_set_bits(0b01111), 4);
        assert_eq!(count_set_bits(0b11111), 5);
        assert_eq!(count_set_bits(0b10101), 3);
    }

    #[test]
    fn test_enum_serialization_roundtrip() {
        let agent = AgentType::Evaluator;
        let mut buf = Vec::new();
        agent.serialize(&mut buf).unwrap();
        let deserialized = AgentType::deserialize(&mut &buf[..]).unwrap();
        assert_eq!(agent, deserialized);
    }
}
