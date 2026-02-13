import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  compactView: boolean;
  showTxLinks: boolean;
  refreshInterval: number;
  animations: boolean;
  circuitBreakerAlerts: boolean;
  axiomViolationAlerts: boolean;
  largeTransactionAlerts: boolean;
  newIntelligenceReports: boolean;
  toggleCompactView: () => void;
  toggleShowTxLinks: () => void;
  setRefreshInterval: (v: number) => void;
  toggleAnimations: () => void;
  toggleCircuitBreakerAlerts: () => void;
  toggleAxiomViolationAlerts: () => void;
  toggleLargeTransactionAlerts: () => void;
  toggleNewIntelligenceReports: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      compactView: false,
      showTxLinks: true,
      refreshInterval: 10000,
      animations: true,
      circuitBreakerAlerts: true,
      axiomViolationAlerts: true,
      largeTransactionAlerts: true,
      newIntelligenceReports: false,
      toggleCompactView: () => set((s) => ({ compactView: !s.compactView })),
      toggleShowTxLinks: () => set((s) => ({ showTxLinks: !s.showTxLinks })),
      setRefreshInterval: (v) => set({ refreshInterval: v }),
      toggleAnimations: () => set((s) => ({ animations: !s.animations })),
      toggleCircuitBreakerAlerts: () =>
        set((s) => ({ circuitBreakerAlerts: !s.circuitBreakerAlerts })),
      toggleAxiomViolationAlerts: () =>
        set((s) => ({ axiomViolationAlerts: !s.axiomViolationAlerts })),
      toggleLargeTransactionAlerts: () =>
        set((s) => ({ largeTransactionAlerts: !s.largeTransactionAlerts })),
      toggleNewIntelligenceReports: () =>
        set((s) => ({ newIntelligenceReports: !s.newIntelligenceReports })),
    }),
    { name: "axionblade-settings" }
  )
);
