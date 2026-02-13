"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, ScrollText } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

/* ------------------------------------------------------------------ */
/*  Comparison data                                                    */
/* ------------------------------------------------------------------ */

interface ComparisonRow {
  feature: string;
  axionblade: string;
  gauntlet: string;
  chaosLabs: string;
  defiLlama: string;
}

const comparisonData: ComparisonRow[] = [
  {
    feature: "On-chain proof",
    axionblade: "yes",
    gauntlet: "no",
    chaosLabs: "no",
    defiLlama: "no",
  },
  {
    feature: "Real-time scoring",
    axionblade: "yes",
    gauntlet: "Batch",
    chaosLabs: "Batch",
    defiLlama: "Partial",
  },
  {
    feature: "Pay-per-use",
    axionblade: "0.01 SOL",
    gauntlet: "$50k+/yr",
    chaosLabs: "$100k+",
    defiLlama: "Free but no scoring",
  },
  {
    feature: "Solana native",
    axionblade: "yes",
    gauntlet: "Partial",
    chaosLabs: "Partial",
    defiLlama: "Multi-chain",
  },
  {
    feature: "Verifiable AI",
    axionblade: "yes",
    gauntlet: "no",
    chaosLabs: "no",
    defiLlama: "no",
  },
  {
    feature: "Democratic access",
    axionblade: "yes",
    gauntlet: "no",
    chaosLabs: "no",
    defiLlama: "yes",
  },
  {
    feature: "Open treasury",
    axionblade: "yes",
    gauntlet: "no",
    chaosLabs: "no",
    defiLlama: "Partial",
  },
  {
    feature: "Axiom-governed",
    axionblade: "yes",
    gauntlet: "no",
    chaosLabs: "no",
    defiLlama: "no",
  },
];

/* ------------------------------------------------------------------ */
/*  Cell renderer                                                      */
/* ------------------------------------------------------------------ */

function CellValue({ value }: { value: string }) {
  if (value === "yes") {
    return <span className="text-emerald-400 font-semibold">&#10003;</span>;
  }
  if (value === "no") {
    return <span className="text-rose-400/60">&#10005;</span>;
  }
  return <span className="text-gray-400 text-xs">{value}</span>;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function WhyAxionbladePage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #0a0a1a 0%, #0f0520 40%, #0a0a1a 100%)",
      }}
    >
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="max-w-4xl"
        >
          <motion.h1
            variants={fadeInUp}
            transition={{ duration: 0.7 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #a855f7, #22d3ee, #34d399)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Why AXIONBLADE?
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            The first on-chain verifiable risk intelligence protocol on Solana
          </motion.p>
        </motion.div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                    Feature
                  </th>
                  <th className="text-center text-xs font-bold uppercase tracking-wider px-4 py-4">
                    <span
                      style={{
                        background:
                          "linear-gradient(135deg, #a855f7, #22d3ee)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      AXIONBLADE
                    </span>
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-4">
                    Gauntlet
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-4">
                    Chaos Labs
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-4">
                    DefiLlama
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={
                      i < comparisonData.length - 1
                        ? "border-b border-white/[0.04]"
                        : ""
                    }
                  >
                    <td className="px-6 py-3.5 text-sm font-medium text-gray-300">
                      {row.feature}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <CellValue value={row.axionblade} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <CellValue value={row.gauntlet} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <CellValue value={row.chaosLabs} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <CellValue value={row.defiLlama} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* Quote Block */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 md:p-10">
            {/* Accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
              style={{
                background:
                  "linear-gradient(90deg, #a855f7, #22d3ee, #34d399)",
              }}
            />
            <blockquote className="text-lg md:text-xl text-gray-300 leading-relaxed italic">
              &ldquo;Gauntlet and Chaos Labs serve protocols with $100k+ budgets.
              AXIONBLADE serves everyone &mdash; from individual LPs to DAOs &mdash;
              starting at 0.01 SOL.&rdquo;
            </blockquote>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/dashboard">
            <button
              className="group relative px-8 py-4 rounded-xl font-semibold text-lg text-white bg-gradient-to-r from-purple-600 to-cyan-600 transition-all duration-300 hover:scale-[1.03] cursor-pointer"
              style={{
                boxShadow:
                  "0 0 20px rgba(168,85,247,0.3), 0 0 60px rgba(34,211,238,0.1)",
              }}
            >
              <span className="flex items-center gap-2">
                <Shield size={20} />
                Launch App
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </button>
          </Link>
          <Link href="/axioms">
            <button className="px-8 py-4 rounded-xl font-semibold text-lg text-white border border-white/20 hover:bg-white/[0.05] hover:border-white/40 transition-all duration-300 cursor-pointer">
              <span className="flex items-center gap-2">
                <ScrollText size={20} />
                Read the Axioms
              </span>
            </button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
