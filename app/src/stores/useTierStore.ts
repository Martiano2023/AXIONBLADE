import { create } from "zustand";
import { persist } from "zustand/middleware";

type ApolloTier = "free" | "basic" | "pro" | "institutional";
type HermesTier = "free" | "pro" | "protocol";
type HighestTier = "free" | "pro" | "institutional";

interface TierState {
  // APOLLO tier
  apolloTier: ApolloTier;
  setApolloTier: (tier: ApolloTier) => void;

  // HERMES tier
  hermesTier: HermesTier;
  setHermesTier: (tier: HermesTier) => void;

  // Daily usage counters
  freeAssessmentsUsed: number;
  freeReportsUsed: number;
  incrementFreeAssessments: () => void;
  incrementFreeReports: () => void;
  resetDailyCounters: () => void;

  // Computed: highest tier across services
  getHighestTier: () => HighestTier;
}

export const useTierStore = create<TierState>()(
  persist(
    (set, get) => ({
      apolloTier: "free",
      setApolloTier: (tier) => set({ apolloTier: tier }),

      hermesTier: "free",
      setHermesTier: (tier) => set({ hermesTier: tier }),

      freeAssessmentsUsed: 0,
      freeReportsUsed: 0,
      incrementFreeAssessments: () =>
        set((s) => ({ freeAssessmentsUsed: s.freeAssessmentsUsed + 1 })),
      incrementFreeReports: () =>
        set((s) => ({ freeReportsUsed: s.freeReportsUsed + 1 })),
      resetDailyCounters: () =>
        set({ freeAssessmentsUsed: 0, freeReportsUsed: 0 }),

      getHighestTier: (): HighestTier => {
        const { apolloTier, hermesTier } = get();
        if (apolloTier === "institutional" || hermesTier === "protocol") {
          return "institutional";
        }
        if (apolloTier === "pro" || hermesTier === "pro") {
          return "pro";
        }
        return "free";
      },
    }),
    { name: "noumen-tiers" }
  )
);
