"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Particle Grid — Canvas neural-network background                   */
/* ------------------------------------------------------------------ */

function ParticleGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let w = 0;
    let h = 0;
    const particles: { x: number; y: number; vx: number; vy: number }[] = [];
    const COUNT = 50;
    const CONNECT_DIST = 140;
    const MAX_OPACITY = 0.12;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const init = () => {
      resize();
      particles.length = 0;
      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * MAX_OPACITY;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Dots
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${MAX_OPACITY})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener("resize", () => { resize(); });
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Counter — counts up from 0 on scroll into view            */
/* ------------------------------------------------------------------ */

function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 2,
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = eased * value;
      if (decimals > 0) {
        setDisplay(current.toFixed(decimals));
      } else {
        setDisplay(Math.round(current).toLocaleString());
      }
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value, duration, decimals]);

  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Risk Ticker — horizontal scrolling live risk updates               */
/* ------------------------------------------------------------------ */

const TICKER_ITEMS = [
  { pool: "RAY-USDC", score: 78, level: "Low", change: "+2.1%", direction: "up" as const },
  { pool: "BONK-SOL", score: 45, level: "High", change: "-8.3%", direction: "down" as const },
  { pool: "mSOL-SOL", score: 91, level: "Low", change: "0.0%", direction: "flat" as const },
  { pool: "JTO-SOL", score: 67, level: "Med", change: "-1.2%", direction: "down" as const },
  { pool: "JUP-USDC", score: 82, level: "Low", change: "+1.8%", direction: "up" as const },
  { pool: "ORCA-SOL", score: 73, level: "Med", change: "+0.5%", direction: "up" as const },
  { pool: "DRIFT-USDC", score: 56, level: "Med", change: "-3.7%", direction: "down" as const },
  { pool: "MNDE-SOL", score: 88, level: "Low", change: "+0.2%", direction: "up" as const },
];

function RiskTicker() {
  const levelColor = (level: string) => {
    if (level === "Low") return "text-emerald-400";
    if (level === "High") return "text-rose-400";
    return "text-amber-400";
  };

  const changeColor = (dir: string) => {
    if (dir === "up") return "text-emerald-400";
    if (dir === "down") return "text-rose-400";
    return "text-gray-500";
  };

  const arrow = (dir: string) => {
    if (dir === "up") return "\u2191";
    if (dir === "down") return "\u2193";
    return "\u2192";
  };

  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="w-full overflow-hidden border-y border-[#1F2937] bg-[#111827]/60">
      <div className="flex animate-ticker whitespace-nowrap">
        {items.map((item, i) => (
          <div key={i} className="inline-flex items-center gap-2 px-6 py-3 text-sm shrink-0">
            <span className="text-white font-medium">{item.pool}:</span>
            <span className="text-white font-bold tabular-nums">{item.score}</span>
            <span className={`text-xs font-medium ${levelColor(item.level)}`}>
              ({item.level})
            </span>
            <span className={`text-xs tabular-nums ${changeColor(item.direction)}`}>
              {arrow(item.direction)}{item.change}
            </span>
            <span className="text-[#374151] mx-2">|</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sparkline SVG — mini chart behind metric numbers                   */
/* ------------------------------------------------------------------ */

function Sparkline({ data, color = "#3B82F6" }: { data: number[]; color?: string }) {
  const w = 80;
  const h = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="opacity-20">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Checkmark — pops in when scrolled into view               */
/* ------------------------------------------------------------------ */

function AnimatedCheck({ delay = 0 }: { delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });

  return (
    <span ref={ref}>
      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 15, delay }}
        className="inline-block text-emerald-500 font-bold"
      >
        &#10003;
      </motion.span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Animation variant                                                   */
/* ------------------------------------------------------------------ */

const fade = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/* ------------------------------------------------------------------ */
/*  Sparkline data seeds                                                */
/* ------------------------------------------------------------------ */

const sparklines = {
  proofs: [12, 18, 15, 28, 32, 25, 40, 38, 52, 47, 55, 60],
  pilots: [0, 0, 1, 1, 2, 2, 3, 3, 3, 4, 4, 5],
  accuracy: [88, 89, 89.5, 90, 90.2, 90.5, 91, 91, 91.2, 91.2, 91.3, 91.2],
  axioms: [29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29],
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const roadmapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: roadmapRef,
    offset: ["start end", "end center"],
  });
  const timelineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="min-h-screen bg-[#0B0F1A] font-sans text-white">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden">
        <ParticleGrid />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          className="max-w-3xl relative z-10"
        >
          <motion.h1
            variants={fade}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            className="text-5xl md:text-6xl font-bold text-white tracking-tight"
          >
            Risk Infrastructure for Solana
          </motion.h1>

          <motion.p
            variants={fade}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Verifiable risk assessment with on-chain proof. Every decision
            logged. Every outcome auditable.
          </motion.p>

          <motion.div
            variants={fade}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/apollo">
              <button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 cursor-pointer">
                Start Assessment
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/integrations">
              <button className="border border-[#374151] text-gray-300 hover:border-[#3B82F6] px-6 py-3 rounded-lg font-medium transition-colors duration-200 cursor-pointer">
                Request Integration
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ============================================================ */}
      {/*  LIVE RISK TICKER                                            */}
      {/* ============================================================ */}
      <RiskTicker />

      {/* ============================================================ */}
      {/*  TWO-PATH SECTION                                            */}
      {/* ============================================================ */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <motion.div
            variants={fade}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
            className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 hover:border-[#374151] transition-colors duration-200"
          >
            <h3 className="text-xl font-bold text-white mb-3">
              For Protocols
            </h3>
            <p className="text-gray-400 mb-6">
              Embed verified risk scores in your UI. API + Widget included.
            </p>
            <Link href="/integrations">
              <span className="text-[#3B82F6] hover:text-[#2563EB] text-sm font-medium inline-flex items-center gap-1 transition-colors duration-200">
                Request Integration <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </motion.div>

          <motion.div
            variants={fade}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
            className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 hover:border-[#374151] transition-colors duration-200"
          >
            <h3 className="text-xl font-bold text-white mb-3">
              For LPs &amp; Traders
            </h3>
            <p className="text-gray-400 mb-6">
              Assess any pool before you deposit. Starting at 0.05 SOL.
            </p>
            <Link href="/apollo">
              <span className="text-[#3B82F6] hover:text-[#2563EB] text-sm font-medium inline-flex items-center gap-1 transition-colors duration-200">
                Start Assessment <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ============================================================ */}
      {/*  METRICS ROW                                                 */}
      {/* ============================================================ */}
      <section className="px-6 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          {[
            { label: "Proofs Minted", value: 1247, sparkline: sparklines.proofs, color: "#3B82F6" },
            { label: "Protocol Pilots", value: 5, sparkline: sparklines.pilots, color: "#3B82F6" },
            { label: "Model Accuracy", value: 91.2, suffix: "%", sparkline: sparklines.accuracy, color: "#10B981", decimals: 1 },
            { label: "Axioms Enforced", value: 29, sparkline: sparklines.axioms, color: "#10B981" },
          ].map((metric) => (
            <motion.div
              key={metric.label}
              variants={fade}
              transition={{ duration: 0.4 }}
              whileHover={{ y: -2, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
              className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 text-center relative overflow-hidden hover:border-[#374151] transition-colors duration-200"
            >
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                <Sparkline data={metric.sparkline} color={metric.color} />
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                {metric.label}
              </p>
              <p className="text-3xl font-bold text-white relative z-10">
                <AnimatedCounter
                  value={metric.value}
                  suffix={metric.suffix || ""}
                  duration={2}
                  decimals={metric.decimals || 0}
                />
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ============================================================ */}
      {/*  HOW IT WORKS                                                */}
      {/* ============================================================ */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fade}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-white text-center mb-16"
          >
            How NOUMEN Protects Capital
          </motion.h2>

          <div className="relative">
            {/* Connecting line — draws itself */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-px">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                className="h-px bg-gradient-to-r from-transparent via-[#3B82F6]/30 to-transparent origin-left"
              />
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ visible: { transition: { staggerChildren: 0.25 } } }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {[
                {
                  num: "01",
                  title: "Submit",
                  desc: "Submit any Solana pool address for risk evaluation",
                },
                {
                  num: "02",
                  title: "Prove",
                  desc: "APOLLO analyzes 5 evidence families and mints an on-chain proof",
                },
                {
                  num: "03",
                  title: "Verify",
                  desc: "Results are immutable, auditable, and transparent",
                },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  variants={fade}
                  transition={{ duration: 0.5 }}
                  className="text-center md:text-left"
                >
                  {/* Step circle with pulse ring */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#111827] border border-[#1F2937] mb-4 relative">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ repeat: Infinity, duration: 3, delay: i * 0.6, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full border border-[#3B82F6]/20"
                    />
                    <span className="text-lg font-bold text-[#3B82F6]">{step.num}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  COMPARISON TABLE                                            */}
      {/* ============================================================ */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fade}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-white text-center mb-12"
          >
            Built Different
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fade}
            transition={{ duration: 0.5 }}
            className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1F2937]">
                  <th className="text-left text-gray-400 font-medium px-6 py-4" />
                  <th className="text-left text-white font-semibold px-6 py-4">
                    NOUMEN
                  </th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">
                    Traditional Audits
                  </th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">
                    Risk Dashboards
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Real-time", noumen: true, audits: null, dashboards: "Partial" },
                  { feature: "On-chain proof", noumen: true, audits: null, dashboards: null },
                  { feature: "Per-assessment", noumen: "0.05 SOL", audits: "$50,000+", dashboards: "Free (no scoring)" },
                  { feature: "Verifiable AI", noumen: true, audits: null, dashboards: null },
                  { feature: "API available", noumen: true, audits: null, dashboards: "Some" },
                ].map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`${i % 2 === 0 ? "bg-[#111827]" : "bg-[#0B0F1A]"} hover:bg-[#1F2937]/50 transition-colors duration-150`}
                  >
                    <td className="px-6 py-4 text-gray-300 font-medium">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4">
                      {row.noumen === true ? (
                        <AnimatedCheck delay={i * 0.1} />
                      ) : (
                        <span className="text-white">{row.noumen}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {row.audits === null ? (
                        <span className="text-gray-600">&mdash;</span>
                      ) : (
                        <span className="text-gray-400">{row.audits}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {row.dashboards === null ? (
                        <span className="text-gray-600">&mdash;</span>
                      ) : (
                        <span className="text-gray-400">{row.dashboards}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  ROADMAP                                                     */}
      {/* ============================================================ */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fade}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-white text-center mb-12"
          >
            Roadmap
          </motion.h2>

          <div ref={roadmapRef} className="relative pl-8">
            {/* Background track */}
            <div className="absolute left-[11px] top-0 bottom-0 w-px bg-[#1F2937]" />
            {/* Animated fill — draws as user scrolls */}
            <motion.div
              className="absolute left-[11px] top-0 w-px bg-gradient-to-b from-[#3B82F6] to-[#10B981]"
              style={{ height: timelineHeight }}
            />

            <div className="space-y-8">
              {[
                { phase: "Phase 1", title: "Devnet MVP + Risk Engine", badge: "NOW", active: true },
                { phase: "Phase 2", title: "Mainnet Launch + Protocol Integrations", badge: "Q2 2025", active: false },
                { phase: "Phase 3", title: "Agent Marketplace + Cross-chain", badge: "Q4 2025", active: false },
                { phase: "Phase 4", title: "Governance Token", badge: "2026", active: false, note: "(only with proven revenue)" },
              ].map((item, i) => (
                <motion.div
                  key={item.phase}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative pl-6"
                >
                  {/* Dot */}
                  <div
                    className={`absolute left-0 top-1.5 w-[9px] h-[9px] rounded-full border-2 ${
                      item.active
                        ? "bg-[#10B981] border-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                        : "bg-[#0B0F1A] border-[#374151]"
                    }`}
                  />

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                      {item.phase}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        item.active
                          ? "bg-[#10B981]/10 text-[#10B981]"
                          : "bg-[#1F2937] text-gray-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-white font-medium mt-1">
                    {item.title}
                    {item.note && (
                      <span className="text-gray-500 text-sm ml-2">
                        {item.note}
                      </span>
                    )}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                      */}
      {/* ============================================================ */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#3B82F6]/20 to-transparent" />
      <footer className="px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-white font-semibold">
                NOUMEN{" "}
                <span className="text-gray-500 font-normal">
                  &mdash; Proof Before Action
                </span>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Risk Infrastructure for Solana
              </p>
            </div>

            <div className="flex items-center gap-6">
              {[
                { label: "Docs", href: "#" },
                { label: "API", href: "#" },
                { label: "GitHub", href: "#" },
                { label: "Twitter", href: "#" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
