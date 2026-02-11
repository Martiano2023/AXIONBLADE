import { useQuery } from "@tanstack/react-query";

interface RevenueDataPoint {
  date: string;
  amount: number;
}

const MOCK_REVENUE: RevenueDataPoint[] = [
  { date: "Mon", amount: 2400000000 },
  { date: "Tue", amount: 1398000000 },
  { date: "Wed", amount: 3800000000 },
  { date: "Thu", amount: 3908000000 },
  { date: "Fri", amount: 4800000000 },
  { date: "Sat", amount: 3800000000 },
  { date: "Sun", amount: 4300000000 },
];

const MOCK_PROOFS: RevenueDataPoint[] = [
  { date: "Mon", amount: 145 },
  { date: "Tue", amount: 232 },
  { date: "Wed", amount: 187 },
  { date: "Thu", amount: 290 },
  { date: "Fri", amount: 310 },
  { date: "Sat", amount: 178 },
  { date: "Sun", amount: 245 },
];

const MOCK_AGENTS: RevenueDataPoint[] = [
  { date: "Mon", amount: 24 },
  { date: "Tue", amount: 18 },
  { date: "Wed", amount: 32 },
  { date: "Thu", amount: 28 },
  { date: "Fri", amount: 45 },
  { date: "Sat", amount: 22 },
  { date: "Sun", amount: 36 },
];

export function useRevenueChart() {
  return useQuery({
    queryKey: ["revenueChart"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 1000));
      return MOCK_REVENUE;
    },
  });
}

export function useProofVolumeChart() {
  return useQuery({
    queryKey: ["proofVolume"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 1000));
      return MOCK_PROOFS;
    },
  });
}

export function useAgentActivityChart() {
  return useQuery({
    queryKey: ["agentActivity"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 1000));
      return MOCK_AGENTS;
    },
  });
}
