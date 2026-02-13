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

  // Volume discount tracking (v3.3.0)
  volumeDiscountTier: 0 | 1 | 2 | 3; // 0=none, 1=10%, 2=20%, 3=30%
  monthlyScans: number;
  monthlyResetDate: string; // ISO date string when monthly counter resets
  lifetimeScans: number;
  totalSpentLamports: number;
  fetchVolumeDiscount: (walletPubkey: string) => Promise<void>;
  applyVolumeDiscount: (basePrice: number) => number;
  getDiscountPercentage: () => number;
  getNextTierInfo: () => { threshold: number | null; scansRemaining: number | null; nextDiscount: number | null };
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

      // Volume discount state (v3.3.0)
      volumeDiscountTier: 0,
      monthlyScans: 0,
      monthlyResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      lifetimeScans: 0,
      totalSpentLamports: 0,

      fetchVolumeDiscount: async (walletPubkey: string) => {
        try {
          // In production, fetch VolumeDiscountTracker PDA from on-chain
          // For now, simulate with local fetch
          // const [pda] = PublicKey.findProgramAddressSync(
          //   [Buffer.from('volume_tracker'), new PublicKey(walletPubkey).toBuffer()],
          //   TREASURY_PROGRAM_ID
          // );
          // const account = await connection.getAccountInfo(pda);
          // if (!account) return;
          // const decoded = decodeVolumeTracker(account.data);

          // Simulated fetch (would be replaced with actual on-chain fetch)
          const response = await fetch(`/api/volume-discount?wallet=${walletPubkey}`);
          if (!response.ok) {
            // No tracker found, user hasn't made any purchases yet
            set({
              volumeDiscountTier: 0,
              monthlyScans: 0,
              lifetimeScans: 0,
              totalSpentLamports: 0,
            });
            return;
          }

          const data = await response.json();
          set({
            volumeDiscountTier: data.current_discount_tier as 0 | 1 | 2 | 3,
            monthlyScans: data.monthly_scan_count,
            lifetimeScans: data.lifetime_scans,
            totalSpentLamports: data.total_spent_lamports,
            monthlyResetDate: new Date(data.monthly_reset_at * 1000).toISOString().split("T")[0],
          });
        } catch (error) {
          console.error("Failed to fetch volume discount:", error);
        }
      },

      applyVolumeDiscount: (basePrice: number): number => {
        const { volumeDiscountTier } = get();
        const discounts = [0, 0.10, 0.20, 0.30]; // 0%, 10%, 20%, 30%
        return basePrice * (1 - discounts[volumeDiscountTier]);
      },

      getDiscountPercentage: (): number => {
        const { volumeDiscountTier } = get();
        const discounts = [0, 10, 20, 30]; // percentages
        return discounts[volumeDiscountTier];
      },

      getNextTierInfo: () => {
        const { volumeDiscountTier, monthlyScans } = get();
        const thresholds = [10, 50, 100]; // Tier 1, 2, 3 thresholds
        const discounts = [10, 20, 30]; // Next tier discount percentages

        if (volumeDiscountTier === 3) {
          // Already at max tier
          return { threshold: null, scansRemaining: null, nextDiscount: null };
        }

        const nextThreshold = thresholds[volumeDiscountTier];
        const scansRemaining = nextThreshold - monthlyScans;
        const nextDiscount = discounts[volumeDiscountTier];

        return { threshold: nextThreshold, scansRemaining, nextDiscount };
      },
    }),
    { name: "axionblade-tiers" }
  )
);
