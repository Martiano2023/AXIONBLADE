import { useQuery } from "@tanstack/react-query";

export interface ActivityEvent {
  id: string;
  timestamp: number;
  type: string;
  agentId?: string;
  description: string;
  txSignature?: string;
}

const now = Math.floor(Date.now() / 1000);

const MOCK_EVENTS: ActivityEvent[] = [
  { id: "1", timestamp: now - 120, type: "Decision", agentId: "APOLLO", description: "Risk assessment published for Orca SOL/USDC pool", txSignature: "5vGr...kL2m" },
  { id: "2", timestamp: now - 340, type: "Payment", agentId: "Treasury", description: "Service payment processed: 0.5 SOL (CCS band 1)", txSignature: "3xPq...wN8j" },
  { id: "3", timestamp: now - 600, type: "Execution", agentId: "AEON", description: "Policy proposal #7 executed: update daily spend cap", txSignature: "7kMn...pR4s" },
  { id: "4", timestamp: now - 1200, type: "Assessment", agentId: "APOLLO", description: "Pool taxonomy updated: Raydium SOL/USDT reclassified", txSignature: "9dFh...tY6w" },
  { id: "5", timestamp: now - 1800, type: "Report", agentId: "HERMES", description: "Intelligence report: Yield Trap detected on pool 0x3f...", txSignature: "2bLp...mK1x" },
  { id: "6", timestamp: now - 2400, type: "Incident", agentId: "Auditor", description: "Security incident registered: Oracle manipulation suspected", txSignature: "8rQz...nH5v" },
  { id: "7", timestamp: now - 3600, type: "Decision", agentId: "APOLLO", description: "Batch proof submitted: 47 decisions, Merkle root verified", txSignature: "4wSt...jE9a" },
  { id: "8", timestamp: now - 4200, type: "Payment", agentId: "Treasury", description: "Creator CCS withdrawal: 1.2 SOL", txSignature: "6nVx...cF3b" },
  { id: "9", timestamp: now - 5400, type: "Assessment", agentId: "APOLLO", description: "Risk level upgraded to HIGH for Meteora SOL/mSOL pool", txSignature: "1pDy...gA7d" },
  { id: "10", timestamp: now - 7200, type: "Execution", agentId: "AEON", description: "Agent #3 created: Collector type, Limited permission", txSignature: "5qRw...iB2e" },
  { id: "11", timestamp: now - 8100, type: "Report", agentId: "HERMES", description: "Protocol health snapshot: Orca ecosystem score 78/100" },
  { id: "12", timestamp: now - 9000, type: "Decision", agentId: "APOLLO", description: "Effective APR calculated: 12.3% vs 45.6% headline for pool", txSignature: "3mKz...oC4f" },
  { id: "13", timestamp: now - 10800, type: "Payment", agentId: "Treasury", description: "Donation swept: 5 SOL transferred to treasury vault", txSignature: "7jNx...sD6g" },
  { id: "14", timestamp: now - 14400, type: "Incident", agentId: "Auditor", description: "Truth label recorded: HTL Correct for signal #234" },
  { id: "15", timestamp: now - 18000, type: "Assessment", agentId: "APOLLO", description: "MLI score updated: Orca USDC/USDT pool liquidity improved" },
  { id: "16", timestamp: now - 21600, type: "Execution", agentId: "AEON", description: "Circuit breaker mode changed: Normal → Cautious", txSignature: "2hLw...rE8h" },
  { id: "17", timestamp: now - 25200, type: "Report", agentId: "HERMES", description: "Pool comparison report: SOL/USDC across 3 protocols" },
  { id: "18", timestamp: now - 28800, type: "Decision", agentId: "APOLLO", description: "Risk decomposition vector published for 12 monitored pools" },
  { id: "19", timestamp: now - 32400, type: "Payment", agentId: "Treasury", description: "Budget allocation: Agent #2 allocated 3 SOL daily cap", txSignature: "9eGv...uF1i" },
  { id: "20", timestamp: now - 36000, type: "Execution", agentId: "AEON", description: "Heartbeat recorded: system operational, 2 agents active", txSignature: "4dHu...wG5j" },
];

export function useActivityFeed() {
  return useQuery({
    queryKey: ["activityFeed"],
    queryFn: async (): Promise<ActivityEvent[]> => {
      await new Promise((r) => setTimeout(r, 800));
      return MOCK_EVENTS;
    },
  });
}
