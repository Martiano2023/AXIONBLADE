// ---------------------------------------------------------------------------
// AXIONBLADE Agent Orchestrator — Three-agent coordination system
// ---------------------------------------------------------------------------
// Coordinates AEON (Guardian) → APOLLO (Analyst) → HERMES (Executor)
// with proof-before-action guarantees and permission validation.
//
// Architecture:
// 1. AEON: Detects threats via 24/7 monitoring
// 2. APOLLO: Analyzes risks with >=2 evidence families (A0-32)
// 3. HERMES: Executes defensive actions (with user authorization, A0-31)
//
// All actions require proof logging before execution (A0-6).
// ---------------------------------------------------------------------------

import { PublicKey, Connection, Keypair } from '@solana/web3.js';
import { AeonAgent, Threat } from './agents/aeon-agent';
import { ApolloAgent, AnalysisResult } from './agents/apollo-agent';
import { HermesAgent, Action, ExecutionResult } from './agents/hermes-agent';
import { ProofGenerator } from './proof-generator';

export interface AgentPermissions {
  aeon_monitoring_enabled: boolean;
  aeon_auto_revoke_approvals: boolean;
  aeon_auto_exit_pools: boolean;
  aeon_auto_unstake: boolean;
  aeon_il_threshold_bps: number;
  aeon_health_factor_threshold_bps: number;
  apollo_auto_analysis_enabled: boolean;
  apollo_analysis_frequency_hours: number;
  hermes_enabled: boolean;
  hermes_max_tx_amount_lamports: number;
  hermes_allowed_protocols_bitmap: number;
  hermes_max_slippage_bps: number;
  hermes_dca_enabled: boolean;
  hermes_rebalance_enabled: boolean;
  hermes_daily_tx_limit: number;
  hermes_tx_count_today: number;
  hermes_last_tx_date: number;
}

export interface OrchestratorResult {
  status: 'executed' | 'approval_required' | 'error';
  threats: Threat[];
  analyses: AnalysisResult[];
  results: ExecutionResult[];
  pendingApprovals?: Action[];
  error?: string;
}

export class AgentOrchestrator {
  private aeonAgent: AeonAgent;
  private apolloAgent: ApolloAgent;
  private hermesAgent: HermesAgent;
  private proofGenerator: ProofGenerator;
  private connection: Connection;

  constructor(connection: Connection, hermesKeypair: Keypair) {
    this.connection = connection;
    this.aeonAgent = new AeonAgent(connection);
    this.apolloAgent = new ApolloAgent(connection);
    this.hermesAgent = new HermesAgent(hermesKeypair, connection);
    this.proofGenerator = new ProofGenerator(connection);
  }

  /**
   * Main orchestration flow: Detect threats → Analyze risks → Execute actions
   * Returns immediately with results or pending approvals
   */
  async detectAndRespond(userWallet: PublicKey): Promise<OrchestratorResult> {
    try {
      // Step 1: Fetch user permissions
      const permissions = await this.fetchUserPermissions(userWallet);
      if (!permissions) {
        return {
          status: 'error',
          threats: [],
          analyses: [],
          results: [],
          error: 'User has not registered for agent services',
        };
      }

      // Step 2: AEON monitors wallet → detects threats
      if (!permissions.aeon_monitoring_enabled) {
        return {
          status: 'error',
          threats: [],
          analyses: [],
          results: [],
          error: 'AEON monitoring is disabled',
        };
      }

      const threats = await this.aeonAgent.scanWallet(userWallet, permissions);

      if (threats.length === 0) {
        return {
          status: 'executed',
          threats: [],
          analyses: [],
          results: [],
        };
      }

      // Step 3: APOLLO analyzes each threat
      const analyses = await Promise.all(
        threats.map(threat => this.apolloAgent.analyzeRisk(threat.pool || threat.protocol || 'unknown', threat))
      );

      // Step 4: Generate APOLLO proofs (A0-6: log_decision before action)
      const apolloProofs = await Promise.all(
        analyses.map(analysis =>
          this.proofGenerator.logDecision({
            agentId: 2, // APOLLO
            inputHash: this.hashInput(analysis.input),
            decisionHash: this.hashDecision(analysis.output),
            evidenceFamilies: analysis.evidenceFamilies,
            isExecutionClass: false, // APOLLO never executes
          })
        )
      );

      // Step 5: Determine actions based on threat + analysis + permissions
      const actions = this.determineActions(threats, analyses, permissions);

      // Step 6: Separate auto-approved vs. needs approval
      const autoApproved: Action[] = [];
      const needsApproval: Action[] = [];

      for (const action of actions) {
        if (this.isAuthorized(action, permissions)) {
          autoApproved.push(action);
        } else {
          needsApproval.push(action);
        }
      }

      // Step 7: Execute auto-approved actions via HERMES
      const results: ExecutionResult[] = [];
      for (let i = 0; i < autoApproved.length; i++) {
        const action = autoApproved[i];
        const apolloProof = apolloProofs[i];

        // HERMES executes with proof reference (A0-35: references recent APOLLO assessment)
        const result = await this.hermesAgent.executeAction(action, apolloProof, userWallet);
        results.push(result);
      }

      return {
        status: needsApproval.length > 0 ? 'approval_required' : 'executed',
        threats,
        analyses,
        results,
        pendingApprovals: needsApproval,
      };
    } catch (error) {
      console.error('Agent orchestration error:', error);
      return {
        status: 'error',
        threats: [],
        analyses: [],
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute a specific action after user approval
   */
  async executeApprovedAction(
    userWallet: PublicKey,
    action: Action,
    apolloProof: PublicKey
  ): Promise<ExecutionResult> {
    const permissions = await this.fetchUserPermissions(userWallet);
    if (!permissions) {
      throw new Error('User permissions not found');
    }

    if (!permissions.hermes_enabled) {
      throw new Error('HERMES execution is disabled');
    }

    return await this.hermesAgent.executeAction(action, apolloProof, userWallet);
  }

  /**
   * Fetch AgentPermissionConfig PDA from on-chain
   */
  private async fetchUserPermissions(userWallet: PublicKey): Promise<AgentPermissions | null> {
    try {
      // Derive AgentPermissionConfig PDA
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('agent_permission'), userWallet.toBuffer(), Buffer.from([1, 0])], // agent_id = 1
        new PublicKey('9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE') // noumen_core program ID
      );

      const account = await this.connection.getAccountInfo(pda);
      if (!account) {
        return null;
      }

      // Decode AgentPermissionConfig (simplified - would use Anchor IDL in production)
      const data = account.data;
      return {
        aeon_monitoring_enabled: data[34] === 1,
        aeon_auto_revoke_approvals: data[35] === 1,
        aeon_auto_exit_pools: data[36] === 1,
        aeon_auto_unstake: data[37] === 1,
        aeon_il_threshold_bps: data.readUInt16LE(38),
        aeon_health_factor_threshold_bps: data.readUInt16LE(40),
        apollo_auto_analysis_enabled: data[42] === 1,
        apollo_analysis_frequency_hours: data[43],
        hermes_enabled: data[44] === 1,
        hermes_max_tx_amount_lamports: Number(data.readBigUInt64LE(45)),
        hermes_allowed_protocols_bitmap: data.readUInt32LE(53),
        hermes_max_slippage_bps: data.readUInt16LE(57),
        hermes_dca_enabled: data[59] === 1,
        hermes_rebalance_enabled: data[60] === 1,
        hermes_daily_tx_limit: data[61],
        hermes_tx_count_today: data[62],
        hermes_last_tx_date: Number(data.readBigInt64LE(63)),
      };
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      return null;
    }
  }

  /**
   * Determine which actions to take based on threats, analysis, and permissions
   */
  private determineActions(
    threats: Threat[],
    analyses: AnalysisResult[],
    permissions: AgentPermissions
  ): Action[] {
    const actions: Action[] = [];

    for (let i = 0; i < threats.length; i++) {
      const threat = threats[i];
      const analysis = analyses[i];

      // Only proceed if risk is confirmed by APOLLO (A0-32: requires >=2 evidence families)
      if (analysis.evidenceFamilies < 2) {
        console.warn(`Skipping action for ${threat.type}: insufficient evidence families`);
        continue;
      }

      switch (threat.action) {
        case 'revoke_approval':
          if (permissions.aeon_auto_revoke_approvals) {
            actions.push({
              type: 'revoke_approval',
              protocol: threat.protocol!,
              tokenMint: threat.detail,
              priority: threat.severity === 'Critical' ? 1 : 2,
            });
          }
          break;

        case 'exit_pool':
          if (permissions.aeon_auto_exit_pools) {
            actions.push({
              type: 'remove_liquidity',
              protocol: threat.protocol || 'Raydium', // Default to Raydium for LP pools
              pool: threat.pool!,
              amount: 'all', // Exit entire position
              priority: threat.severity === 'High' ? 1 : 2,
            });
          }
          break;

        case 'unstake':
          if (permissions.aeon_auto_unstake) {
            actions.push({
              type: 'unstake',
              protocol: threat.protocol!,
              amount: 'all', // Unstake entire position
              priority: threat.severity === 'Critical' ? 1 : 3,
            });
          }
          break;
      }
    }

    // Sort by priority (1 = highest)
    return actions.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Check if action is authorized by user permissions (A0-31)
   */
  private isAuthorized(action: Action, permissions: AgentPermissions): boolean {
    // All HERMES actions require hermes_enabled
    if (!permissions.hermes_enabled) {
      return false;
    }

    // Check protocol allowlist
    const protocolMap: Record<string, number> = {
      Jupiter: 1 << 0,
      Raydium: 1 << 1,
      Orca: 1 << 2,
      Marinade: 1 << 3,
      Jito: 1 << 4,
    };

    const protocol = action.protocol || 'Jupiter';
    const protocolBit = protocolMap[protocol] || 0;
    const isProtocolAllowed = (permissions.hermes_allowed_protocols_bitmap & protocolBit) !== 0;

    if (!isProtocolAllowed) {
      return false;
    }

    // Check daily transaction limit
    const today = Math.floor(Date.now() / 1000 / 86400);
    const lastTxDay = Math.floor(permissions.hermes_last_tx_date / 86400);
    const txCountToday = today === lastTxDay ? permissions.hermes_tx_count_today : 0;

    if (txCountToday >= permissions.hermes_daily_tx_limit) {
      return false;
    }

    return true;
  }

  private hashInput(input: any): Buffer {
    // Simple hash for now (would use proper crypto.subtle.digest in production)
    const str = JSON.stringify(input);
    return Buffer.from(str.slice(0, 32).padEnd(32, '0'));
  }

  private hashDecision(output: any): Buffer {
    const str = JSON.stringify(output);
    return Buffer.from(str.slice(0, 32).padEnd(32, '0'));
  }
}
