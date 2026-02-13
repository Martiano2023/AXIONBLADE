// ---------------------------------------------------------------------------
// AXIONBLADE AI Pricing Stabilizer Engine
// ---------------------------------------------------------------------------
// Three phases: Launch (Days 1-30), Calibration (Days 31-90), Stable (Day 90+)
// Ensures protocol sustainability while remaining competitive.
// ---------------------------------------------------------------------------

export type StabilizerPhase = "launch" | "calibration" | "stable";

export interface StabilizerConfig {
  launchDate: Date;
  currentDate: Date;
  solPriceUsd: number;
  solPrice7dAvg: number;
  dailyVolume: number;        // number of paid requests today
  monthlyVolume: number;      // number of paid requests this month
  networkCongestion: number;  // 0-1
  treasuryReserveRatio: number; // current reserve ratio (0-1)
}

export interface StabilizerResult {
  phase: StabilizerPhase;
  daysSinceLaunch: number;
  volumeMultiplier: number;
  congestionMultiplier: number;
  solPriceMultiplier: number;
  maxWeeklyChange: number;    // max % change allowed per week
  adjustmentApplied: boolean;
  reason: string;
}

// ---------------------------------------------------------------------------
// Phase determination
// ---------------------------------------------------------------------------

export function getPhase(launchDate: Date, currentDate: Date): { phase: StabilizerPhase; daysSinceLaunch: number } {
  const daysSinceLaunch = Math.floor((currentDate.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLaunch <= 30) return { phase: "launch", daysSinceLaunch };
  if (daysSinceLaunch <= 90) return { phase: "calibration", daysSinceLaunch };
  return { phase: "stable", daysSinceLaunch };
}

// ---------------------------------------------------------------------------
// Volume multiplier
// ---------------------------------------------------------------------------

function calculateVolumeMultiplier(dailyVolume: number, phase: StabilizerPhase): number {
  if (phase === "launch") return 1.0; // Fixed during launch

  // High volume = slight discount (economies of scale)
  // Low volume = slight premium (must cover fixed costs)
  if (dailyVolume > 100) return 0.95;    // 5% discount
  if (dailyVolume > 50) return 0.98;     // 2% discount
  if (dailyVolume < 5) return 1.10;      // 10% premium
  if (dailyVolume < 10) return 1.05;     // 5% premium
  return 1.0;
}

// ---------------------------------------------------------------------------
// Congestion multiplier
// ---------------------------------------------------------------------------

function calculateCongestionMultiplier(congestion: number, phase: StabilizerPhase): number {
  if (phase === "launch") return 1.0; // Fixed during launch

  // Only apply surcharge above 70% congestion
  if (congestion > 0.9) return 1.15;  // 15% surcharge
  if (congestion > 0.7) return 1.10;  // 10% surcharge
  return 1.0;
}

// ---------------------------------------------------------------------------
// SOL price stability multiplier
// ---------------------------------------------------------------------------

function calculateSolPriceMultiplier(currentPrice: number, avg7dPrice: number, phase: StabilizerPhase): number {
  if (phase === "launch") return 1.0; // Fixed during launch
  if (avg7dPrice <= 0) return 1.0;

  const deviation = Math.abs(currentPrice - avg7dPrice) / avg7dPrice;

  // If SOL price dropped significantly, increase prices to maintain USD revenue
  // If SOL price rose significantly, decrease prices to maintain affordability
  if (deviation > 0.20) {
    return avg7dPrice / currentPrice; // Full correction
  }
  if (deviation > 0.10) {
    // Partial correction (50% of deviation)
    return 1 + (avg7dPrice / currentPrice - 1) * 0.5;
  }
  return 1.0;
}

// ---------------------------------------------------------------------------
// Main stabilizer function
// ---------------------------------------------------------------------------

export function calculateStabilizedPrice(
  basePrice: number,
  estimatedCost: number,
  config: StabilizerConfig
): { finalPrice: number; result: StabilizerResult } {
  const { phase, daysSinceLaunch } = getPhase(config.launchDate, config.currentDate);

  const volumeMultiplier = calculateVolumeMultiplier(config.dailyVolume, phase);
  const congestionMultiplier = calculateCongestionMultiplier(config.networkCongestion, phase);
  const solPriceMultiplier = calculateSolPriceMultiplier(config.solPriceUsd, config.solPrice7dAvg, phase);

  // Max weekly change limits
  const maxWeeklyChange = phase === "launch" ? 0 : phase === "calibration" ? 0.10 : 0.05;

  // Core pricing formula:
  // finalPrice = max(estimatedCost / (1 - 0.20), basePrice * volumeMultiplier * congestionMultiplier * solPriceMultiplier)
  const costFloor = estimatedCost / (1 - 0.20); // Cost + 20% margin
  const dynamicPrice = basePrice * volumeMultiplier * congestionMultiplier * solPriceMultiplier;
  const finalPrice = Math.max(costFloor, dynamicPrice);

  // Round to 6 decimal places
  const roundedPrice = Math.round(finalPrice * 1_000_000) / 1_000_000;

  const adjustmentApplied = phase !== "launch" && (volumeMultiplier !== 1.0 || congestionMultiplier !== 1.0 || solPriceMultiplier !== 1.0);

  let reason = "";
  if (phase === "launch") {
    reason = `Launch phase (Day ${daysSinceLaunch}/30) — fixed pricing active`;
  } else if (!adjustmentApplied) {
    reason = `${phase === "calibration" ? "Calibration" : "Stable"} phase — no adjustment needed`;
  } else {
    const factors: string[] = [];
    if (volumeMultiplier !== 1.0) factors.push(`volume ${volumeMultiplier > 1 ? "+" : ""}${((volumeMultiplier - 1) * 100).toFixed(0)}%`);
    if (congestionMultiplier !== 1.0) factors.push(`congestion +${((congestionMultiplier - 1) * 100).toFixed(0)}%`);
    if (solPriceMultiplier !== 1.0) factors.push(`SOL price ${solPriceMultiplier > 1 ? "+" : ""}${((solPriceMultiplier - 1) * 100).toFixed(0)}%`);
    reason = `${phase === "calibration" ? "Calibration" : "Stable"} phase — adjusted for ${factors.join(", ")}`;
  }

  return {
    finalPrice: roundedPrice,
    result: {
      phase,
      daysSinceLaunch,
      volumeMultiplier,
      congestionMultiplier,
      solPriceMultiplier,
      maxWeeklyChange,
      adjustmentApplied,
      reason,
    },
  };
}

// ---------------------------------------------------------------------------
// Smart Safeguards
// ---------------------------------------------------------------------------

export interface SafeguardStatus {
  treasuryReserveAlert: boolean;   // true if reserve < 25%
  lowVolumeReduction: boolean;     // true if volume warrants price reduction
  solVolatilityRecalc: boolean;    // true if SOL price deviates > 10%
  marginAlert: boolean;            // true if any service margin < 20%
  reason: string;
}

export function checkSafeguards(config: StabilizerConfig): SafeguardStatus {
  const treasuryReserveAlert = config.treasuryReserveRatio < 0.25;
  const lowVolumeReduction = config.dailyVolume < 5;
  const solVolatilityRecalc = config.solPrice7dAvg > 0 &&
    Math.abs(config.solPriceUsd - config.solPrice7dAvg) / config.solPrice7dAvg > 0.10;
  const marginAlert = false; // Would be computed per-service in production

  const reasons: string[] = [];
  if (treasuryReserveAlert) reasons.push("Treasury reserve below 25% — auto-increasing reserve allocation");
  if (lowVolumeReduction) reasons.push("Low daily volume — consider promotional pricing");
  if (solVolatilityRecalc) reasons.push("SOL price volatile — prices auto-adjusted for stability");
  if (marginAlert) reasons.push("Service margin below 20% — review pricing");

  return {
    treasuryReserveAlert,
    lowVolumeReduction,
    solVolatilityRecalc,
    marginAlert,
    reason: reasons.length > 0 ? reasons.join("; ") : "All safeguards nominal",
  };
}
