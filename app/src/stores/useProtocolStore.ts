import { create } from "zustand";

interface ProtocolState {
  treasuryBalance: number;
  activeAgents: number;
  totalDecisions: number;
  activeServices: number;
  setTreasuryBalance: (v: number) => void;
  setActiveAgents: (v: number) => void;
  setTotalDecisions: (v: number) => void;
  setActiveServices: (v: number) => void;
}

export const useProtocolStore = create<ProtocolState>((set) => ({
  treasuryBalance: 0,
  activeAgents: 4,
  totalDecisions: 0,
  activeServices: 4,
  setTreasuryBalance: (v) => set({ treasuryBalance: v }),
  setActiveAgents: (v) => set({ activeAgents: v }),
  setTotalDecisions: (v) => set({ totalDecisions: v }),
  setActiveServices: (v) => set({ activeServices: v }),
}));
