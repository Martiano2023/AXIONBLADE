use anchor_lang::prelude::*;
use shared_types::*;

declare_id!("9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE");

#[program]
pub mod noumen_core {
    use super::*;

    /// Initialize the AEON sovereign governance system.
    /// Only callable once by the super_authority.
    pub fn initialize_aeon(
        ctx: Context<InitializeAeon>,
        args: InitializeAeonArgs,
    ) -> Result<()> {
        let config = &mut ctx.accounts.aeon_config;
        require!(!config.is_initialized, CoreError::AlreadyInitialized);
        require!(
            args.operational_agent_cap <= HARD_AGENT_CAP as u32,
            CoreError::AgentCapExceedsHardLimit
        );

        // M-CORE-1: All three authority keys must be distinct from each other
        let super_key = ctx.accounts.super_authority.key();
        require!(
            super_key != args.aeon_authority,
            CoreError::AuthoritiesMustBeDistinct
        );
        require!(
            super_key != args.keeper_authority,
            CoreError::AuthoritiesMustBeDistinct
        );
        require!(
            args.aeon_authority != args.keeper_authority,
            CoreError::AuthoritiesMustBeDistinct
        );

        let clock = Clock::get()?;

        config.super_authority = super_key;
        config.pending_super_authority = Pubkey::default();
        config.aeon_authority = args.aeon_authority;
        config.keeper_authority = args.keeper_authority;
        config.treasury_program = args.treasury_program;
        config.proof_program = args.proof_program;
        config.active_agent_count = 0;
        config.circuit_breaker_mode = CircuitBreakerMode::Normal as u8;
        config.is_initialized = true;
        config.operational_agent_cap = args.operational_agent_cap;
        config.last_heartbeat = clock.unix_timestamp;
        config.heartbeat_interval = args.heartbeat_interval;
        config.created_at = clock.unix_timestamp;
        config.updated_at = clock.unix_timestamp;
        config.bump = ctx.bumps.aeon_config;

        emit!(AeonInitialized {
            super_authority: config.super_authority,
            aeon_authority: config.aeon_authority,
            keeper_authority: config.keeper_authority,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Update system actors (authority keys). Only super_authority can call.
    /// C-CORE-1: super_authority changes use two-step transfer (pending + accept).
    pub fn update_system_actors(
        ctx: Context<UpdateSystemActors>,
        args: UpdateSystemActorsArgs,
    ) -> Result<()> {
        let config = &mut ctx.accounts.aeon_config;
        let clock = Clock::get()?;

        let old_aeon = config.aeon_authority;
        let old_keeper = config.keeper_authority;

        if let Some(new_aeon) = args.new_aeon_authority {
            config.aeon_authority = new_aeon;
        }
        if let Some(new_keeper) = args.new_keeper_authority {
            config.keeper_authority = new_keeper;
        }
        // C-CORE-1: Two-step transfer — store as pending, do NOT apply immediately
        if let Some(new_super) = args.new_super_authority {
            config.pending_super_authority = new_super;
        }

        config.updated_at = clock.unix_timestamp;

        emit!(SystemActorsUpdated {
            old_aeon,
            new_aeon: config.aeon_authority,
            old_keeper,
            new_keeper: config.keeper_authority,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Accept a pending super_authority transfer. Must be signed by the pending authority.
    /// C-CORE-1: Completes the two-step super_authority transfer.
    pub fn accept_super_authority(
        ctx: Context<AcceptSuperAuthority>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.aeon_config;
        let clock = Clock::get()?;

        require!(
            config.pending_super_authority != Pubkey::default(),
            CoreError::NoPendingSuperAuthority
        );
        require!(
            ctx.accounts.new_super_authority.key() == config.pending_super_authority,
            CoreError::Unauthorized
        );

        let old_super = config.super_authority;
        config.super_authority = config.pending_super_authority;
        config.pending_super_authority = Pubkey::default();
        config.updated_at = clock.unix_timestamp;

        emit!(SuperAuthorityTransferred {
            old_super_authority: old_super,
            new_super_authority: config.super_authority,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Create a new agent. Only aeon_authority can create agents (A0-1).
    /// Evaluators must have Never execution permission (A0-14).
    /// Respects hard cap of 100 agents (A0-9).
    pub fn create_agent(
        ctx: Context<CreateAgent>,
        args: CreateAgentArgs,
    ) -> Result<()> {
        let config = &mut ctx.accounts.aeon_config;
        let clock = Clock::get()?;

        // A0-9: hard cap
        require!(
            (config.active_agent_count as u32) < config.operational_agent_cap,
            CoreError::AgentCapReached
        );
        require!(
            config.active_agent_count < HARD_AGENT_CAP,
            CoreError::AgentCapReached
        );

        // A0-14: evaluators cannot have execution permission
        if args.agent_type == AgentType::Evaluator as u8 {
            require!(
                args.execution_permission == ExecutionPermission::Never as u8,
                CoreError::EvaluatorCannotExecute
            );
        }

        // TTL must be in the future
        require!(args.ttl > clock.unix_timestamp, CoreError::InvalidTTL);

        let manifest = &mut ctx.accounts.agent_manifest;
        manifest.agent_id = args.agent_id;
        manifest.authority = args.authority;
        manifest.agent_type = args.agent_type;
        manifest.status = AgentStatus::Active as u8;
        manifest.execution_permission = args.execution_permission;
        manifest.level = 0;
        manifest.budget_lamports = args.budget_lamports;
        manifest.budget_spent_lamports = 0;
        manifest.budget_daily_cap_lamports = args.budget_daily_cap_lamports;
        manifest.birth_bond_lamports = 0;
        manifest.ttl = args.ttl;
        manifest.creation_proof = args.creation_proof;
        manifest.created_at = clock.unix_timestamp;
        manifest.updated_at = clock.unix_timestamp;
        manifest.last_active = clock.unix_timestamp;
        manifest.daily_spend_reset_at = clock.unix_timestamp;
        manifest.bump = ctx.bumps.agent_manifest;

        config.active_agent_count = config
            .active_agent_count
            .checked_add(1)
            .ok_or(CoreError::MathOverflow)?;
        config.updated_at = clock.unix_timestamp;

        emit!(AgentCreated {
            agent_id: args.agent_id,
            agent_type: args.agent_type,
            authority: args.authority,
            budget_lamports: args.budget_lamports,
            ttl: args.ttl,
            creation_proof: args.creation_proof,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Update agent parameters. Only aeon_authority can call.
    pub fn update_agent(
        ctx: Context<UpdateAgent>,
        args: UpdateAgentArgs,
    ) -> Result<()> {
        let manifest = &mut ctx.accounts.agent_manifest;
        let clock = Clock::get()?;

        // Cannot update killed agents
        require!(
            manifest.status != AgentStatus::Killed as u8,
            CoreError::AgentAlreadyKilled
        );

        if let Some(new_authority) = args.new_authority {
            manifest.authority = new_authority;
        }
        if let Some(new_daily_cap) = args.new_budget_daily_cap {
            manifest.budget_daily_cap_lamports = new_daily_cap;
        }
        if let Some(new_ttl) = args.new_ttl {
            require!(new_ttl > clock.unix_timestamp, CoreError::InvalidTTL);
            manifest.ttl = new_ttl;
        }

        manifest.updated_at = clock.unix_timestamp;
        Ok(())
    }

    /// Pause an active agent. Only aeon_authority can call.
    pub fn pause_agent(ctx: Context<PauseAgent>) -> Result<()> {
        let manifest = &mut ctx.accounts.agent_manifest;
        let clock = Clock::get()?;

        require!(
            manifest.status == AgentStatus::Active as u8,
            CoreError::AgentNotActive
        );

        let old_status = manifest.status;
        manifest.status = AgentStatus::Paused as u8;
        manifest.updated_at = clock.unix_timestamp;

        emit!(AgentStatusChanged {
            agent_id: manifest.agent_id,
            old_status,
            new_status: manifest.status,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Kill an agent. Irreversible. Decrements active count.
    pub fn kill_agent(
        ctx: Context<KillAgent>,
        args: KillAgentArgs,
    ) -> Result<()> {
        let config = &mut ctx.accounts.aeon_config;
        let manifest = &mut ctx.accounts.agent_manifest;
        let clock = Clock::get()?;

        require!(
            manifest.status == AgentStatus::Active as u8
                || manifest.status == AgentStatus::Paused as u8,
            CoreError::AgentAlreadyKilled
        );

        let old_status = manifest.status;
        manifest.status = AgentStatus::Killed as u8;
        manifest.updated_at = clock.unix_timestamp;
        // Store the kill proof in creation_proof field (reuse for auditability)
        manifest.creation_proof = args.kill_proof;

        config.active_agent_count = config
            .active_agent_count
            .checked_sub(1)
            .ok_or(CoreError::MathOverflow)?;
        config.updated_at = clock.unix_timestamp;

        emit!(AgentStatusChanged {
            agent_id: manifest.agent_id,
            old_status,
            new_status: manifest.status,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Propose a policy change with mandatory delay.
    /// Layer 1 (Constitutional): >= 72h delay.
    /// Layer 2 (Operational): >= 24h delay.
    /// Layer 0 (Immutable) proposals are rejected.
    pub fn propose_policy_change(
        ctx: Context<ProposePolicyChange>,
        args: ProposePolicyChangeArgs,
    ) -> Result<()> {
        let clock = Clock::get()?;

        // Layer 0 cannot be changed
        require!(
            args.policy_layer != 0,
            CoreError::ImmutableLayerCannotChange
        );

        // Validate delay based on layer
        if args.policy_layer == 1 {
            // Layer 1: 72h to 30d
            require!(
                args.delay_seconds >= LAYER1_MIN_DELAY,
                CoreError::InvalidDelay
            );
            require!(
                args.delay_seconds <= LAYER1_MAX_DELAY,
                CoreError::InvalidDelay
            );
        } else if args.policy_layer == 2 {
            // Layer 2: >= 24h
            require!(
                args.delay_seconds >= LAYER2_MIN_DELAY,
                CoreError::InvalidDelay
            );
        } else {
            return Err(CoreError::InvalidPolicyLayer.into());
        }

        let proposal = &mut ctx.accounts.policy_proposal;
        proposal.proposal_id = args.proposal_id;
        proposal.proposer = ctx.accounts.aeon_authority.key();
        proposal.policy_layer = args.policy_layer;
        proposal.status = 0; // Pending
        proposal.change_hash = args.change_hash;
        proposal.proposed_at = clock.unix_timestamp;
        proposal.delay_until = clock
            .unix_timestamp
            .checked_add(args.delay_seconds)
            .ok_or(CoreError::MathOverflow)?;
        proposal.cooldown_until = 0;
        proposal.executed_at = 0;
        // Expires 7 days after delay
        proposal.expires_at = proposal
            .delay_until
            .checked_add(604800)
            .ok_or(CoreError::MathOverflow)?;
        proposal.bump = ctx.bumps.policy_proposal;

        emit!(PolicyProposed {
            proposal_id: args.proposal_id,
            policy_layer: args.policy_layer,
            change_hash: args.change_hash,
            delay_until: proposal.delay_until,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Execute a previously proposed policy change after delay has elapsed.
    pub fn execute_policy_change(
        ctx: Context<ExecutePolicyChange>,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.policy_proposal;
        let clock = Clock::get()?;

        require!(proposal.status == 0, CoreError::ProposalNotPending);
        require!(
            clock.unix_timestamp >= proposal.delay_until,
            CoreError::DelayNotElapsed
        );
        require!(
            clock.unix_timestamp < proposal.expires_at,
            CoreError::ProposalExpired
        );

        proposal.status = 1; // Executed
        proposal.executed_at = clock.unix_timestamp;

        emit!(PolicyExecuted {
            proposal_id: proposal.proposal_id,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Trigger circuit breaker mode escalation.
    /// Can only escalate or maintain, not de-escalate.
    /// Both aeon_authority and keeper_authority can trigger.
    pub fn trigger_circuit_breaker(
        ctx: Context<TriggerCircuitBreaker>,
        args: TriggerCircuitBreakerArgs,
    ) -> Result<()> {
        let config = &mut ctx.accounts.aeon_config;
        let clock = Clock::get()?;

        require!(args.new_mode <= 3, CoreError::InvalidModeTransition);
        require!(
            args.new_mode >= config.circuit_breaker_mode,
            CoreError::InvalidModeTransition
        );

        let old_mode = config.circuit_breaker_mode;
        config.circuit_breaker_mode = args.new_mode;
        config.updated_at = clock.unix_timestamp;

        emit!(CircuitBreakerTriggered {
            old_mode,
            new_mode: args.new_mode,
            trigger_reason_hash: args.trigger_reason_hash,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// H-CORE-1: Reset the circuit breaker to Normal mode.
    /// Only super_authority can reset. This allows recovery from any escalated state.
    pub fn reset_circuit_breaker(
        ctx: Context<ResetCircuitBreaker>,
        reason_hash: [u8; 32],
    ) -> Result<()> {
        let config = &mut ctx.accounts.aeon_config;
        let clock = Clock::get()?;

        let old_mode = config.circuit_breaker_mode;
        config.circuit_breaker_mode = CircuitBreakerMode::Normal as u8;
        config.updated_at = clock.unix_timestamp;

        emit!(CircuitBreakerReset {
            old_mode,
            reason_hash,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Record a heartbeat from the keeper to prove liveness.
    pub fn record_heartbeat(ctx: Context<RecordHeartbeat>) -> Result<()> {
        let config = &mut ctx.accounts.aeon_config;
        let clock = Clock::get()?;

        config.last_heartbeat = clock.unix_timestamp;
        config.updated_at = clock.unix_timestamp;

        emit!(HeartbeatRecorded {
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Register a user for agent subscription services.
    /// Creates AgentPermissionConfig PDA with default permissions (all disabled).
    /// A0-31: User must explicitly enable HERMES execution per-action.
    pub fn register_agent_subscription(
        ctx: Context<RegisterAgentSubscription>,
        args: RegisterAgentSubscriptionArgs,
    ) -> Result<()> {
        let clock = Clock::get()?;

        let config = &mut ctx.accounts.agent_permission_config;
        config.user_wallet = ctx.accounts.user.key();
        config.agent_id = args.agent_id;

        // AEON permissions (default: monitoring enabled, auto-actions disabled)
        config.aeon_monitoring_enabled = true;
        config.aeon_auto_revoke_approvals = false;
        config.aeon_auto_exit_pools = false;
        config.aeon_auto_unstake = false;
        config.aeon_il_threshold_bps = 1000; // 10% default
        config.aeon_health_factor_threshold_bps = 12000; // 1.2 default

        // APOLLO permissions (default: auto-analysis disabled)
        config.apollo_auto_analysis_enabled = false;
        config.apollo_analysis_frequency_hours = 24;

        // HERMES permissions (default: all execution disabled - A0-31)
        config.hermes_enabled = false;
        config.hermes_max_tx_amount_lamports = 0;
        config.hermes_allowed_protocols_bitmap = 0;
        config.hermes_max_slippage_bps = 100; // 1% default when enabled
        config.hermes_dca_enabled = false;
        config.hermes_rebalance_enabled = false;
        config.hermes_daily_tx_limit = 5;
        config.hermes_tx_count_today = 0;
        config.hermes_last_tx_date = clock.unix_timestamp;

        config.created_at = clock.unix_timestamp;
        config.updated_at = clock.unix_timestamp;
        config.bump = ctx.bumps.agent_permission_config;
        config._reserved = [0u8; 64];

        emit!(AgentSubscriptionRegistered {
            user_wallet: config.user_wallet,
            agent_id: args.agent_id,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Update agent permissions. User can modify any permission fields.
    /// A0-33: User can update permissions at any time; changes take effect immediately.
    pub fn update_agent_permissions(
        ctx: Context<UpdateAgentPermissions>,
        args: UpdateAgentPermissionsArgs,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let config = &mut ctx.accounts.agent_permission_config;

        // AEON permissions
        if let Some(val) = args.aeon_monitoring_enabled {
            config.aeon_monitoring_enabled = val;
        }
        if let Some(val) = args.aeon_auto_revoke_approvals {
            config.aeon_auto_revoke_approvals = val;
        }
        if let Some(val) = args.aeon_auto_exit_pools {
            config.aeon_auto_exit_pools = val;
        }
        if let Some(val) = args.aeon_auto_unstake {
            config.aeon_auto_unstake = val;
        }
        if let Some(val) = args.aeon_il_threshold_bps {
            config.aeon_il_threshold_bps = val;
        }
        if let Some(val) = args.aeon_health_factor_threshold_bps {
            config.aeon_health_factor_threshold_bps = val;
        }

        // APOLLO permissions
        if let Some(val) = args.apollo_auto_analysis_enabled {
            config.apollo_auto_analysis_enabled = val;
        }
        if let Some(val) = args.apollo_analysis_frequency_hours {
            config.apollo_analysis_frequency_hours = val;
        }

        // HERMES permissions
        if let Some(val) = args.hermes_enabled {
            config.hermes_enabled = val;
        }
        if let Some(val) = args.hermes_max_tx_amount_lamports {
            config.hermes_max_tx_amount_lamports = val;
        }
        if let Some(val) = args.hermes_allowed_protocols_bitmap {
            config.hermes_allowed_protocols_bitmap = val;
        }
        if let Some(val) = args.hermes_max_slippage_bps {
            config.hermes_max_slippage_bps = val;
        }
        if let Some(val) = args.hermes_dca_enabled {
            config.hermes_dca_enabled = val;
        }
        if let Some(val) = args.hermes_rebalance_enabled {
            config.hermes_rebalance_enabled = val;
        }
        if let Some(val) = args.hermes_daily_tx_limit {
            config.hermes_daily_tx_limit = val;
        }

        config.updated_at = clock.unix_timestamp;

        emit!(AgentPermissionsUpdated {
            user_wallet: config.user_wallet,
            agent_id: config.agent_id,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Revoke all agent permissions instantly (A0-33).
    /// Sets hermes_enabled = false and resets all auto-action flags.
    pub fn revoke_agent_permissions(
        ctx: Context<RevokeAgentPermissions>,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let config = &mut ctx.accounts.agent_permission_config;

        // Disable all autonomous actions
        config.aeon_auto_revoke_approvals = false;
        config.aeon_auto_exit_pools = false;
        config.aeon_auto_unstake = false;
        config.hermes_enabled = false;
        config.hermes_dca_enabled = false;
        config.hermes_rebalance_enabled = false;

        config.updated_at = clock.unix_timestamp;

        emit!(AgentPermissionsRevoked {
            user_wallet: config.user_wallet,
            agent_id: config.agent_id,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// AEON can pause HERMES for a specific user (A0-34).
    /// Emergency safety mechanism if anomaly detected.
    pub fn aeon_pause_hermes(
        ctx: Context<AeonPauseHermes>,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let config = &mut ctx.accounts.agent_permission_config;

        config.hermes_enabled = false;
        config.updated_at = clock.unix_timestamp;

        emit!(HermesPausedByAeon {
            user_wallet: config.user_wallet,
            agent_id: config.agent_id,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

// ──────────────────────────────────────────────
// Account Structures
// ──────────────────────────────────────────────

#[account]
pub struct AeonConfig {
    pub super_authority: Pubkey,
    pub pending_super_authority: Pubkey,
    pub aeon_authority: Pubkey,
    pub keeper_authority: Pubkey,
    pub treasury_program: Pubkey,
    pub proof_program: Pubkey,
    pub active_agent_count: u16,
    pub circuit_breaker_mode: u8,
    pub is_initialized: bool,
    pub operational_agent_cap: u32,
    pub last_heartbeat: i64,
    pub heartbeat_interval: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
    pub _reserved: [u8; 96],
}

#[account]
pub struct AgentManifest {
    pub agent_id: u16,
    pub authority: Pubkey,
    pub agent_type: u8,
    pub status: u8,
    pub execution_permission: u8,
    pub level: u16,
    pub budget_lamports: u64,
    pub budget_spent_lamports: u64,
    pub budget_daily_cap_lamports: u64,
    pub birth_bond_lamports: u64,
    pub ttl: i64,
    pub creation_proof: [u8; 32],
    pub created_at: i64,
    pub updated_at: i64,
    pub last_active: i64,
    pub daily_spend_reset_at: i64,
    pub bump: u8,
    pub _reserved: [u8; 64],
}

#[account]
pub struct PolicyProposal {
    pub proposal_id: u32,
    pub proposer: Pubkey,
    pub policy_layer: u8,
    pub status: u8,
    pub change_hash: [u8; 32],
    pub delay_until: i64,
    pub cooldown_until: i64,
    pub proposed_at: i64,
    pub executed_at: i64,
    pub expires_at: i64,
    pub bump: u8,
    pub _reserved: [u8; 64],
}

/// AgentPermissionConfig: User's permission settings for AI agents.
/// A0-31: HERMES execution requires explicit per-action user authorization.
/// A0-33: User can revoke permissions instantly; revocation effective immediately.
#[account]
pub struct AgentPermissionConfig {
    pub user_wallet: Pubkey,
    pub agent_id: u16,

    // AEON Guardian permissions
    pub aeon_monitoring_enabled: bool,
    pub aeon_auto_revoke_approvals: bool,
    pub aeon_auto_exit_pools: bool,
    pub aeon_auto_unstake: bool,
    pub aeon_il_threshold_bps: u16,          // basis points (e.g., 1000 = 10%)
    pub aeon_health_factor_threshold_bps: u16, // basis points (e.g., 12000 = 1.2)

    // APOLLO Analyst permissions
    pub apollo_auto_analysis_enabled: bool,
    pub apollo_analysis_frequency_hours: u8,

    // HERMES Executor permissions
    pub hermes_enabled: bool,
    pub hermes_max_tx_amount_lamports: u64,
    pub hermes_allowed_protocols_bitmap: u32, // bit flags for protocols
    pub hermes_max_slippage_bps: u16,
    pub hermes_dca_enabled: bool,
    pub hermes_rebalance_enabled: bool,
    pub hermes_daily_tx_limit: u8,
    pub hermes_tx_count_today: u8,
    pub hermes_last_tx_date: i64,

    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
    pub _reserved: [u8; 64],
}

// ──────────────────────────────────────────────
// Instruction Arg Structs
// ──────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeAeonArgs {
    pub keeper_authority: Pubkey,
    pub aeon_authority: Pubkey,
    pub treasury_program: Pubkey,
    pub proof_program: Pubkey,
    pub heartbeat_interval: i64,
    pub operational_agent_cap: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateSystemActorsArgs {
    pub new_aeon_authority: Option<Pubkey>,
    pub new_keeper_authority: Option<Pubkey>,
    pub new_super_authority: Option<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateAgentArgs {
    pub agent_id: u16,
    pub authority: Pubkey,
    pub agent_type: u8,
    pub execution_permission: u8,
    pub budget_lamports: u64,
    pub budget_daily_cap_lamports: u64,
    pub ttl: i64,
    pub creation_proof: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateAgentArgs {
    pub new_authority: Option<Pubkey>,
    pub new_budget_daily_cap: Option<u64>,
    pub new_ttl: Option<i64>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct KillAgentArgs {
    pub agent_id: u16,
    pub kill_proof: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ProposePolicyChangeArgs {
    pub proposal_id: u32,
    pub policy_layer: u8,
    pub change_hash: [u8; 32],
    pub delay_seconds: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ExecutePolicyChangeArgs {
    pub proposal_id: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct TriggerCircuitBreakerArgs {
    pub new_mode: u8,
    pub trigger_reason_hash: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RegisterAgentSubscriptionArgs {
    pub agent_id: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateAgentPermissionsArgs {
    // AEON permissions (all optional)
    pub aeon_monitoring_enabled: Option<bool>,
    pub aeon_auto_revoke_approvals: Option<bool>,
    pub aeon_auto_exit_pools: Option<bool>,
    pub aeon_auto_unstake: Option<bool>,
    pub aeon_il_threshold_bps: Option<u16>,
    pub aeon_health_factor_threshold_bps: Option<u16>,

    // APOLLO permissions
    pub apollo_auto_analysis_enabled: Option<bool>,
    pub apollo_analysis_frequency_hours: Option<u8>,

    // HERMES permissions
    pub hermes_enabled: Option<bool>,
    pub hermes_max_tx_amount_lamports: Option<u64>,
    pub hermes_allowed_protocols_bitmap: Option<u32>,
    pub hermes_max_slippage_bps: Option<u16>,
    pub hermes_dca_enabled: Option<bool>,
    pub hermes_rebalance_enabled: Option<bool>,
    pub hermes_daily_tx_limit: Option<u8>,
}

// ──────────────────────────────────────────────
// Account Contexts
// ──────────────────────────────────────────────

const AEON_CONFIG_SIZE: usize = 8 + 32 + 32 + 32 + 32 + 32 + 32 + 2 + 1 + 1 + 4 + 8 + 8 + 8 + 8 + 1 + 96;
const AGENT_MANIFEST_SIZE: usize = 8 + 2 + 32 + 1 + 1 + 1 + 2 + 8 + 8 + 8 + 8 + 8 + 32 + 8 + 8 + 8 + 8 + 1 + 64;
const POLICY_PROPOSAL_SIZE: usize = 8 + 4 + 32 + 1 + 1 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 64;
const AGENT_PERMISSION_CONFIG_SIZE: usize = 8 + 32 + 2 + 1 + 1 + 1 + 1 + 2 + 2 + 1 + 1 + 1 + 8 + 4 + 2 + 1 + 1 + 1 + 1 + 8 + 8 + 8 + 1 + 64;

#[derive(Accounts)]
pub struct InitializeAeon<'info> {
    #[account(
        init,
        payer = super_authority,
        space = AEON_CONFIG_SIZE,
        seeds = [b"aeon_config"],
        bump
    )]
    pub aeon_config: Account<'info, AeonConfig>,
    #[account(mut)]
    pub super_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateSystemActors<'info> {
    #[account(
        mut,
        seeds = [b"aeon_config"],
        bump = aeon_config.bump,
        has_one = super_authority @ CoreError::Unauthorized
    )]
    pub aeon_config: Account<'info, AeonConfig>,
    pub super_authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(args: CreateAgentArgs)]
pub struct CreateAgent<'info> {
    #[account(
        mut,
        seeds = [b"aeon_config"],
        bump = aeon_config.bump,
        has_one = aeon_authority @ CoreError::Unauthorized
    )]
    pub aeon_config: Account<'info, AeonConfig>,
    #[account(
        init,
        payer = aeon_authority,
        space = AGENT_MANIFEST_SIZE,
        seeds = [b"agent", args.agent_id.to_le_bytes().as_ref()],
        bump
    )]
    pub agent_manifest: Account<'info, AgentManifest>,
    #[account(mut)]
    pub aeon_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAgent<'info> {
    #[account(
        seeds = [b"aeon_config"],
        bump = aeon_config.bump,
        has_one = aeon_authority @ CoreError::Unauthorized
    )]
    pub aeon_config: Account<'info, AeonConfig>,
    #[account(
        mut,
        seeds = [b"agent", agent_manifest.agent_id.to_le_bytes().as_ref()],
        bump = agent_manifest.bump,
    )]
    pub agent_manifest: Account<'info, AgentManifest>,
    pub aeon_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct PauseAgent<'info> {
    #[account(
        seeds = [b"aeon_config"],
        bump = aeon_config.bump,
        has_one = aeon_authority @ CoreError::Unauthorized
    )]
    pub aeon_config: Account<'info, AeonConfig>,
    #[account(
        mut,
        seeds = [b"agent", agent_manifest.agent_id.to_le_bytes().as_ref()],
        bump = agent_manifest.bump,
    )]
    pub agent_manifest: Account<'info, AgentManifest>,
    pub aeon_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct KillAgent<'info> {
    #[account(
        mut,
        seeds = [b"aeon_config"],
        bump = aeon_config.bump,
        has_one = aeon_authority @ CoreError::Unauthorized
    )]
    pub aeon_config: Account<'info, AeonConfig>,
    #[account(
        mut,
        seeds = [b"agent", agent_manifest.agent_id.to_le_bytes().as_ref()],
        bump = agent_manifest.bump,
    )]
    pub agent_manifest: Account<'info, AgentManifest>,
    pub aeon_authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(args: ProposePolicyChangeArgs)]
pub struct ProposePolicyChange<'info> {
    #[account(
        seeds = [b"aeon_config"],
        bump = aeon_config.bump,
        has_one = aeon_authority @ CoreError::Unauthorized
    )]
    pub aeon_config: Account<'info, AeonConfig>,
    #[account(
        init,
        payer = aeon_authority,
        space = POLICY_PROPOSAL_SIZE,
        seeds = [b"proposal", args.proposal_id.to_le_bytes().as_ref()],
        bump
    )]
    pub policy_proposal: Account<'info, PolicyProposal>,
    #[account(mut)]
    pub aeon_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecutePolicyChange<'info> {
    #[account(
        seeds = [b"aeon_config"],
        bump = aeon_config.bump,
        has_one = aeon_authority @ CoreError::Unauthorized
    )]
    pub aeon_config: Account<'info, AeonConfig>,
    #[account(
        mut,
        seeds = [b"proposal", policy_proposal.proposal_id.to_le_bytes().as_ref()],
        bump = policy_proposal.bump,
    )]
    pub policy_proposal: Account<'info, PolicyProposal>,
    pub aeon_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AcceptSuperAuthority<'info> {
    #[account(
        mut,
        seeds = [b"aeon_config"],
        bump = aeon_config.bump,
    )]
    pub aeon_config: Account<'info, AeonConfig>,
    /// The pending super_authority who must sign to accept the transfer.
    pub new_super_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TriggerCircuitBreaker<'info> {
    #[account(
        mut,
        seeds = [b"aeon_config"],
        bump = aeon_config.bump,
    )]
    pub aeon_config: Account<'info, AeonConfig>,
    /// The authority triggering the circuit breaker.
    /// Must be either aeon_authority or keeper_authority.
    #[account(
        constraint = (
            authority.key() == aeon_config.aeon_authority ||
            authority.key() == aeon_config.keeper_authority
        ) @ CoreError::Unauthorized
    )]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResetCircuitBreaker<'info> {
    #[account(
        mut,
        seeds = [b"aeon_config"],
        bump = aeon_config.bump,
        has_one = super_authority @ CoreError::Unauthorized,
    )]
    pub aeon_config: Account<'info, AeonConfig>,
    pub super_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RecordHeartbeat<'info> {
    #[account(
        mut,
        seeds = [b"aeon_config"],
        bump = aeon_config.bump,
        has_one = keeper_authority @ CoreError::Unauthorized
    )]
    pub aeon_config: Account<'info, AeonConfig>,
    pub keeper_authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(args: RegisterAgentSubscriptionArgs)]
pub struct RegisterAgentSubscription<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = AGENT_PERMISSION_CONFIG_SIZE,
        seeds = [b"agent_permission", user.key().as_ref(), args.agent_id.to_le_bytes().as_ref()],
        bump
    )]
    pub agent_permission_config: Account<'info, AgentPermissionConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAgentPermissions<'info> {
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"agent_permission", user.key().as_ref(), agent_permission_config.agent_id.to_le_bytes().as_ref()],
        bump = agent_permission_config.bump,
        constraint = agent_permission_config.user_wallet == user.key() @ CoreError::Unauthorized
    )]
    pub agent_permission_config: Account<'info, AgentPermissionConfig>,
}

#[derive(Accounts)]
pub struct RevokeAgentPermissions<'info> {
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"agent_permission", user.key().as_ref(), agent_permission_config.agent_id.to_le_bytes().as_ref()],
        bump = agent_permission_config.bump,
        constraint = agent_permission_config.user_wallet == user.key() @ CoreError::Unauthorized
    )]
    pub agent_permission_config: Account<'info, AgentPermissionConfig>,
}

#[derive(Accounts)]
pub struct AeonPauseHermes<'info> {
    #[account(
        seeds = [b"aeon_config"],
        bump = aeon_config.bump,
        has_one = aeon_authority @ CoreError::Unauthorized
    )]
    pub aeon_config: Account<'info, AeonConfig>,
    pub aeon_authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"agent_permission", agent_permission_config.user_wallet.as_ref(), agent_permission_config.agent_id.to_le_bytes().as_ref()],
        bump = agent_permission_config.bump,
    )]
    pub agent_permission_config: Account<'info, AgentPermissionConfig>,
}

// ──────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────

#[event]
pub struct AeonInitialized {
    pub super_authority: Pubkey,
    pub aeon_authority: Pubkey,
    pub keeper_authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct AgentCreated {
    pub agent_id: u16,
    pub agent_type: u8,
    pub authority: Pubkey,
    pub budget_lamports: u64,
    pub ttl: i64,
    pub creation_proof: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct AgentStatusChanged {
    pub agent_id: u16,
    pub old_status: u8,
    pub new_status: u8,
    pub timestamp: i64,
}

#[event]
pub struct PolicyProposed {
    pub proposal_id: u32,
    pub policy_layer: u8,
    pub change_hash: [u8; 32],
    pub delay_until: i64,
    pub timestamp: i64,
}

#[event]
pub struct PolicyExecuted {
    pub proposal_id: u32,
    pub timestamp: i64,
}

#[event]
pub struct CircuitBreakerTriggered {
    pub old_mode: u8,
    pub new_mode: u8,
    pub trigger_reason_hash: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct HeartbeatRecorded {
    pub timestamp: i64,
}

#[event]
pub struct SystemActorsUpdated {
    pub old_aeon: Pubkey,
    pub new_aeon: Pubkey,
    pub old_keeper: Pubkey,
    pub new_keeper: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct SuperAuthorityTransferred {
    pub old_super_authority: Pubkey,
    pub new_super_authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CircuitBreakerReset {
    pub old_mode: u8,
    pub reason_hash: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct AgentSubscriptionRegistered {
    pub user_wallet: Pubkey,
    pub agent_id: u16,
    pub timestamp: i64,
}

#[event]
pub struct AgentPermissionsUpdated {
    pub user_wallet: Pubkey,
    pub agent_id: u16,
    pub timestamp: i64,
}

#[event]
pub struct AgentPermissionsRevoked {
    pub user_wallet: Pubkey,
    pub agent_id: u16,
    pub timestamp: i64,
}

#[event]
pub struct HermesPausedByAeon {
    pub user_wallet: Pubkey,
    pub agent_id: u16,
    pub timestamp: i64,
}

// ──────────────────────────────────────────────
// Errors
// ──────────────────────────────────────────────

#[error_code]
pub enum CoreError {
    #[msg("System already initialized")]
    AlreadyInitialized,
    #[msg("Operational agent cap exceeds hard limit of 100")]
    AgentCapExceedsHardLimit,
    #[msg("Agent cap reached")]
    AgentCapReached,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Evaluator agents cannot have execution permission (A0-14)")]
    EvaluatorCannotExecute,
    #[msg("Invalid TTL: must be in the future")]
    InvalidTTL,
    #[msg("Agent is not active")]
    AgentNotActive,
    #[msg("Agent is already killed")]
    AgentAlreadyKilled,
    #[msg("Layer 0 (immutable) parameters cannot be changed")]
    ImmutableLayerCannotChange,
    #[msg("Invalid delay for policy layer")]
    InvalidDelay,
    #[msg("Invalid policy layer")]
    InvalidPolicyLayer,
    #[msg("Proposal is not in pending status")]
    ProposalNotPending,
    #[msg("Delay period has not elapsed")]
    DelayNotElapsed,
    #[msg("Proposal has expired")]
    ProposalExpired,
    #[msg("Invalid circuit breaker mode transition")]
    InvalidModeTransition,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Super authority, AEON authority, and keeper authority must all be distinct")]
    AuthoritiesMustBeDistinct,
    #[msg("No pending super authority transfer to accept")]
    NoPendingSuperAuthority,
}

// Constants for delay enforcement
pub const LAYER1_MIN_DELAY: i64 = 259200;  // 72 hours
pub const LAYER1_MAX_DELAY: i64 = 2592000; // 30 days
pub const LAYER2_MIN_DELAY: i64 = 86400;   // 24 hours
