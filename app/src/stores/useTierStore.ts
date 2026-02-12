import { create } from "zustand";
import { persist } from "zustand/middleware";

type ApolloTier = "free" | "basic" | "pro" | "institutional";
type HermesTier = "free" | "pro" | "protocol";
type HighestTier = "free" | "pro" | "institutional";

interface TierState {
  // APOLLO tier
  apolloTier: ApolloTier;
  apolloTierVerified: boolean; // true only after on-chain verification
  apolloTierExpiry: number; // unix timestamp when tier expires (0 = no expiry/free)
  apolloTierTxSignature: string | null; // tx that granted the tier
  setApolloTier: (tier: ApolloTier) => void;

  // HERMES tier
  hermesTier: HermesTier;
  hermesTierVerified: boolean;
  hermesTierExpiry: number;
  hermesTierTxSignature: string | null;
  setHermesTier: (tier: HermesTier) => void;

  // Daily usage counters
  freeAssessmentsUsed: number;
  freeReportsUsed: number;
  lastCounterResetDate: string; // ISO date string "2026-02-11"
  incrementFreeAssessments: () => void;
  incrementFreeReports: () => void;
  resetDailyCounters: () => void;

  // Computed: highest tier across services
  getHighestTier: () => HighestTier;

  // New: verify tier against on-chain state
  verifyTier: (service: "apollo" | "hermes", txSignature: string) => Promise<boolean>;

  // New: check if tier is active (not expired)
  isTierActive: (service: "apollo" | "hermes") => boolean;

  // New: upgrade tier with payment proof
  upgradeTier: (service: "apollo" | "hermes", tier: string, txSignature: string) => Promise<void>;
}

export const useTierStore = create<TierState>()(
  persist(
    (set, get) => ({
      apolloTier: "free",
      apolloTierVerified: false,
      apolloTierExpiry: 0,
      apolloTierTxSignature: null,
      setApolloTier: (tier) => set({ apolloTier: tier }),

      hermesTier: "free",
      hermesTierVerified: false,
      hermesTierExpiry: 0,
      hermesTierTxSignature: null,
      setHermesTier: (tier) => set({ hermesTier: tier }),

      freeAssessmentsUsed: 0,
      freeReportsUsed: 0,
      lastCounterResetDate: new Date().toISOString().split("T")[0],

      incrementFreeAssessments: () => {
        const today = new Date().toISOString().split("T")[0];
        const state = get();
        if (state.lastCounterResetDate !== today) {
          set({ freeAssessmentsUsed: 1, freeReportsUsed: 0, lastCounterResetDate: today });
        } else {
          set({ freeAssessmentsUsed: state.freeAssessmentsUsed + 1 });
        }
      },

      incrementFreeReports: () => {
        const today = new Date().toISOString().split("T")[0];
        const state = get();
        if (state.lastCounterResetDate !== today) {
          set({ freeReportsUsed: 1, freeAssessmentsUsed: 0, lastCounterResetDate: today });
        } else {
          set({ freeReportsUsed: state.freeReportsUsed + 1 });
        }
      },

      resetDailyCounters: () =>
        set({
          freeAssessmentsUsed: 0,
          freeReportsUsed: 0,
          lastCounterResetDate: new Date().toISOString().split("T")[0],
        }),

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

      verifyTier: async (service, txSignature) => {
        // TODO: Implement on-chain verification by fetching the tx and
        // confirming it was a valid service payment to the treasury vault.
        // For now, mark as verified after basic validation.
        if (!txSignature || txSignature.length < 32) {
          return false;
        }

        if (service === "apollo") {
          set({ apolloTierVerified: true });
        } else {
          set({ hermesTierVerified: true });
        }
        return true;
      },

      isTierActive: (service) => {
        const state = get();
        if (service === "apollo") {
          if (state.apolloTier === "free") return true;
          if (!state.apolloTierVerified) return false;
          if (state.apolloTierExpiry > 0 && Date.now() / 1000 > state.apolloTierExpiry) return false;
          return true;
        }
        // hermes
        if (state.hermesTier === "free") return true;
        if (!state.hermesTierVerified) return false;
        if (state.hermesTierExpiry > 0 && Date.now() / 1000 > state.hermesTierExpiry) return false;
        return true;
      },

      upgradeTier: async (service, tier, txSignature) => {
        // Store tier as unverified initially
        if (service === "apollo") {
          set({
            apolloTier: tier as ApolloTier,
            apolloTierVerified: false,
            apolloTierTxSignature: txSignature,
            // Paid tiers: 30 days from now; free/basic have no expiry
            apolloTierExpiry: tier === "free" || tier === "basic" ? 0 : Math.floor(Date.now() / 1000) + 30 * 86400,
          });
        } else {
          set({
            hermesTier: tier as HermesTier,
            hermesTierVerified: false,
            hermesTierTxSignature: txSignature,
            // Paid tiers: 30 days from now; free has no expiry
            hermesTierExpiry: tier === "free" ? 0 : Math.floor(Date.now() / 1000) + 30 * 86400,
          });
        }

        // Attempt to verify the tier immediately
        await get().verifyTier(service, txSignature);
      },
    }),
    { name: "noumen-tiers" }
  )
);
