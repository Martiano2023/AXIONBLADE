// ---------------------------------------------------------------------------
// AXIONBLADE Protocol Database — Curated Solana DeFi protocol registry
// ---------------------------------------------------------------------------
// Static reference data for the 10 major Solana DeFi protocols tracked by
// APOLLO and HERMES. Data sourced from public registries, audit disclosures,
// and on-chain program metadata.
// ---------------------------------------------------------------------------

export interface ProtocolInfo {
  id: string;
  name: string;
  logo: string;
  website: string;
  audited: boolean;
  auditor: string;
  programAgeDays: number;
  upgradeAuthority: "locked" | "multisig" | "single";
  teamDoxxed: boolean;
  category:
    | "AMM"
    | "CLMM"
    | "Liquid Staking"
    | "Aggregator"
    | "Perpetuals"
    | "Lending";
  exploitHistory: string[];
  tvlRank: number;
  governanceModel: "multisig" | "dao" | "single" | "none";
}

// ---------------------------------------------------------------------------
// Protocol registry
// ---------------------------------------------------------------------------

export const PROTOCOLS: Record<string, ProtocolInfo> = {
  raydium: {
    id: "raydium",
    name: "Raydium",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png",
    website: "https://raydium.io",
    audited: true,
    auditor: "MadShield, Kudelski Security",
    programAgeDays: 1200,
    upgradeAuthority: "multisig",
    teamDoxxed: false,
    category: "AMM",
    exploitHistory: [],
    tvlRank: 1,
    governanceModel: "multisig",
  },

  orca: {
    id: "orca",
    name: "Orca",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png",
    website: "https://orca.so",
    audited: true,
    auditor: "Kudelski Security, Neodyme",
    programAgeDays: 1100,
    upgradeAuthority: "multisig",
    teamDoxxed: true,
    category: "CLMM",
    exploitHistory: [],
    tvlRank: 2,
    governanceModel: "multisig",
  },

  marinade: {
    id: "marinade",
    name: "Marinade Finance",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey/logo.png",
    website: "https://marinade.finance",
    audited: true,
    auditor: "Ackee Blockchain, Neodyme",
    programAgeDays: 1050,
    upgradeAuthority: "multisig",
    teamDoxxed: true,
    category: "Liquid Staking",
    exploitHistory: [],
    tvlRank: 3,
    governanceModel: "dao",
  },

  jupiter: {
    id: "jupiter",
    name: "Jupiter",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN/logo.png",
    website: "https://jup.ag",
    audited: true,
    auditor: "OtterSec, Offside Labs",
    programAgeDays: 950,
    upgradeAuthority: "multisig",
    teamDoxxed: true,
    category: "Aggregator",
    exploitHistory: [],
    tvlRank: 1,
    governanceModel: "dao",
  },

  drift: {
    id: "drift",
    name: "Drift Protocol",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DriFtupJYLTosbwoN8koMbEYSx54aFAVLddWsbksjwg7/logo.png",
    website: "https://drift.trade",
    audited: true,
    auditor: "OtterSec, Trail of Bits",
    programAgeDays: 900,
    upgradeAuthority: "multisig",
    teamDoxxed: true,
    category: "Perpetuals",
    exploitHistory: [],
    tvlRank: 1,
    governanceModel: "dao",
  },

  meteora: {
    id: "meteora",
    name: "Meteora",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/METAewgxyPbgwsseH8T16a39CQ5VyVxZi9zXiDPY18m/logo.png",
    website: "https://meteora.ag",
    audited: true,
    auditor: "OtterSec",
    programAgeDays: 700,
    upgradeAuthority: "multisig",
    teamDoxxed: true,
    category: "CLMM",
    exploitHistory: [],
    tvlRank: 3,
    governanceModel: "multisig",
  },

  lifinity: {
    id: "lifinity",
    name: "Lifinity",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/LFNTYraetVioAPnGJht4yNg2aUZFXR776cMeN9VMjXp/logo.png",
    website: "https://lifinity.io",
    audited: true,
    auditor: "Halborn",
    programAgeDays: 800,
    upgradeAuthority: "multisig",
    teamDoxxed: false,
    category: "AMM",
    exploitHistory: [],
    tvlRank: 6,
    governanceModel: "multisig",
  },

  kamino: {
    id: "kamino",
    name: "Kamino Finance",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS/logo.png",
    website: "https://kamino.finance",
    audited: true,
    auditor: "OtterSec, Offside Labs",
    programAgeDays: 600,
    upgradeAuthority: "multisig",
    teamDoxxed: true,
    category: "Lending",
    exploitHistory: [],
    tvlRank: 2,
    governanceModel: "dao",
  },

  marginfi: {
    id: "marginfi",
    name: "marginfi",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA/logo.png",
    website: "https://marginfi.com",
    audited: true,
    auditor: "OtterSec",
    programAgeDays: 650,
    upgradeAuthority: "multisig",
    teamDoxxed: true,
    category: "Lending",
    exploitHistory: [],
    tvlRank: 3,
    governanceModel: "dao",
  },

  jito: {
    id: "jito",
    name: "Jito",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn/logo.png",
    website: "https://jito.network",
    audited: true,
    auditor: "Neodyme, OtterSec",
    programAgeDays: 750,
    upgradeAuthority: "multisig",
    teamDoxxed: true,
    category: "Liquid Staking",
    exploitHistory: [],
    tvlRank: 1,
    governanceModel: "dao",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getProtocol(id: string): ProtocolInfo | undefined {
  return PROTOCOLS[id.toLowerCase()];
}

export function getAllProtocols(): ProtocolInfo[] {
  return Object.values(PROTOCOLS);
}

export function getProtocolsByCategory(
  category: ProtocolInfo["category"]
): ProtocolInfo[] {
  return getAllProtocols().filter((p) => p.category === category);
}

export function getProtocolIds(): string[] {
  return Object.keys(PROTOCOLS);
}
