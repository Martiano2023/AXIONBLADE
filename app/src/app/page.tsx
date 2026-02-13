"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Search,
  Lock,
  CheckCircle2,
  Shield,
  Plug,
  Target,
  ScrollText,
  Upload,
  Link2,
  Rocket,
  Globe,
  Vote,
  Coins,
  Twitter,
  Github,
  MessageCircle,
} from "lucide-react";

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
    const COUNT = 80;
    const CONNECT_DIST = 150;
    const MAX_OPACITY = 0.25;

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
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
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
            ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${MAX_OPACITY * 0.8})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener("resize", resize);
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
/*  Hero Shield SVG — animated shield with network pattern             */
/* ------------------------------------------------------------------ */

function HeroShield() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <svg
        viewBox="0 0 400 460"
        className="w-[340px] h-[390px] md:w-[440px] md:h-[500px] opacity-[0.08]"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        {/* Shield outline */}
        <motion.path
          d="M200 20 L370 100 L370 260 C370 340 300 420 200 450 C100 420 30 340 30 260 L30 100 Z"
          fill="none"
          stroke="url(#shieldGrad)"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        {/* Network nodes inside shield */}
        {[
          [200, 120], [140, 180], [260, 180], [120, 260], [200, 240],
          [280, 260], [160, 330], [240, 330], [200, 380],
        ].map(([cx, cy], i) => (
          <motion.circle
            key={i}
            cx={cx}
            cy={cy}
            r="6"
            fill="url(#nodeGrad)"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.08, duration: 0.4 }}
          />
        ))}
        {/* Network connections */}
        {[
          [200, 120, 140, 180], [200, 120, 260, 180], [140, 180, 120, 260],
          [140, 180, 200, 240], [260, 180, 200, 240], [260, 180, 280, 260],
          [120, 260, 160, 330], [200, 240, 160, 330], [200, 240, 240, 330],
          [280, 260, 240, 330], [160, 330, 200, 380], [240, 330, 200, 380],
        ].map(([x1, y1, x2, y2], i) => (
          <motion.line
            key={`l${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="url(#shieldGrad)"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1.2 + i * 0.05, duration: 0.5 }}
          />
        ))}
      </svg>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Counter                                                    */
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
      const eased = 1 - Math.pow(1 - progress, 3);
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
/*  Risk Ticker                                                         */
/* ------------------------------------------------------------------ */

const TICKER_ITEMS = [
  { pool: "RAY-USDC", icon: "\uD83D\uDD35", score: 78, level: "Low" as const, change: "+2.1%", direction: "up" as const },
  { pool: "BONK-SOL", icon: "\uD83D\uDFE3", score: 45, level: "High" as const, change: "-8.3%", direction: "down" as const },
  { pool: "mSOL-SOL", icon: "\uD83D\uDFE2", score: 91, level: "Low" as const, change: "0.0%", direction: "flat" as const },
  { pool: "JTO-SOL", icon: "\uD83D\uDFE1", score: 67, level: "Med" as const, change: "-1.2%", direction: "down" as const },
  { pool: "JUP-USDC", icon: "\uD83D\uDFE0", score: 82, level: "Low" as const, change: "+1.8%", direction: "up" as const },
  { pool: "ORCA-SOL", icon: "\u26AB", score: 73, level: "Med" as const, change: "+0.5%", direction: "up" as const },
  { pool: "DRIFT-USDC", icon: "\uD83D\uDD34", score: 56, level: "Med" as const, change: "-3.7%", direction: "down" as const },
  { pool: "MNDE-SOL", icon: "\uD83D\uDFE2", score: 88, level: "Low" as const, change: "+0.2%", direction: "up" as const },
];

const LEVEL_STYLES = {
  Low: { dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-500/8" },
  Med: { dot: "bg-amber-400", text: "text-amber-400", bg: "bg-amber-500/8" },
  High: { dot: "bg-rose-400", text: "text-rose-400", bg: "bg-rose-500/8" },
};

function RiskTicker() {
  const arrow = (dir: string) => {
    if (dir === "up") return "\u2191";
    if (dir === "down") return "\u2193";
    return "\u2192";
  };

  const changeColor = (dir: string) => {
    if (dir === "up") return "text-emerald-400";
    if (dir === "down") return "text-rose-400";
    return "text-gray-500";
  };

  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="w-full overflow-hidden border-y border-[#1A2235] bg-[#0D1117]">
      <div className="flex animate-ticker whitespace-nowrap">
        {items.map((item, i) => {
          const style = LEVEL_STYLES[item.level];
          return (
            <div key={i} className={`inline-flex items-center gap-2.5 px-5 py-3.5 text-[15px] shrink-0 ${style.bg}`}>
              <span className={`w-2 h-2 rounded-full ${style.dot}`} />
              <span className="text-gray-300">{item.icon}</span>
              <span className="text-white font-semibold">{item.pool}</span>
              <span className="text-white font-bold tabular-nums">{item.score}</span>
              <span className={`text-sm font-semibold ${style.text}`}>
                ({item.level})
              </span>
              <span className={`text-sm font-medium tabular-nums ${changeColor(item.direction)}`}>
                {arrow(item.direction)}{item.change}
              </span>
              <span className="text-[#1A2235] mx-1 text-lg">|</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sparkline SVG                                                       */
/* ------------------------------------------------------------------ */

function Sparkline({ data, color = "#00D4FF", width = 100, height = 32 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height * 0.8) - height * 0.1;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="opacity-30">
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Checkmark / X mark                                         */
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
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold"
        style={{ textShadow: "0 0 8px rgba(16, 185, 129, 0.5)" }}
      >
        &#10003;
      </motion.span>
    </span>
  );
}

function AnimatedX({ delay = 0 }: { delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });

  return (
    <span ref={ref}>
      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 15, delay }}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 text-sm"
      >
        &#10007;
      </motion.span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Gradient Section Title                                              */
/* ------------------------------------------------------------------ */

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className={`text-3xl font-bold text-center mb-12 bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent ${className}`}
    >
      {children}
    </motion.h2>
  );
}

/* ------------------------------------------------------------------ */
/*  Section Divider                                                     */
/* ------------------------------------------------------------------ */

function SectionDivider({ color = "from-[#00D4FF]/20 via-purple-500/20 to-cyan-500/20" }: { color?: string }) {
  return (
    <div className="max-w-4xl mx-auto px-6">
      <div className={`h-px bg-gradient-to-r ${color}`} />
    </div>
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
/*  Sparkline data                                                      */
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
    <div className="min-h-screen bg-[#0A0E17] font-sans text-white overflow-x-hidden">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden">
        <ParticleGrid />
        <HeroShield />

        {/* Ambient glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#00D4FF]/[0.06] blur-[120px] pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          className="max-w-3xl relative z-10"
        >
          <motion.div
            variants={fade}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <span className="inline-flex items-center gap-2 bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-full px-4 py-1.5 text-sm text-[#00D4FF] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live on Devnet
            </span>
          </motion.div>

          <motion.h1
            variants={fade}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent"
          >
            Risk Infrastructure
            <br />
            <span className="bg-gradient-to-r from-[#00D4FF] via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              for Solana
            </span>
          </motion.h1>

          <motion.p
            variants={fade}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
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
              <button className="bg-gradient-to-r from-[#00D4FF] to-[#00B8D9] hover:from-[#00D4FF]/90 hover:to-[#00D4FF]/70 text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.4)]">
                Start Assessment
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/integrations">
              <button className="border border-[#243049] text-gray-300 hover:border-[#00D4FF]/50 hover:text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 cursor-pointer">
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
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* For Protocols */}
          <motion.div
            variants={fade}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -6 }}
            className="group relative bg-[#0F1420] border border-[#1A2235] rounded-2xl p-10 hover:border-[#00D4FF]/30 transition-all duration-300 overflow-hidden"
          >
            {/* Abstract decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D4FF]/5 rounded-full blur-2xl -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#00D4FF]/3 rounded-full blur-xl translate-y-6 -translate-x-6" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#00D4FF]/15 border border-[#00D4FF]/20 flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-[#00D4FF]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                For Protocols
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Embed verified risk scores in your UI. Full API access with embeddable widget included. White-label ready.
              </p>
              <Link href="/integrations">
                <span className="text-[#00D4FF] hover:text-[#00D4FF]/80 text-sm font-semibold inline-flex items-center gap-1.5 transition-colors duration-200 group-hover:gap-2.5">
                  Request Integration <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </div>
          </motion.div>

          {/* For LPs & Traders */}
          <motion.div
            variants={fade}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -6 }}
            className="group relative bg-[#0F1420] border border-[#1A2235] rounded-2xl p-10 hover:border-emerald-500/30 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/3 rounded-full blur-xl translate-y-6 -translate-x-6" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                For LPs &amp; Traders
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Assess any pool before you deposit. Real-time risk scoring powered by 5 evidence families. Starting at 0.02 SOL.
              </p>
              <Link href="/apollo">
                <span className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold inline-flex items-center gap-1.5 transition-colors duration-200 group-hover:gap-2.5">
                  Start Assessment <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <SectionDivider />

      {/* ============================================================ */}
      {/*  METRICS ROW                                                 */}
      {/* ============================================================ */}
      <section className="px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
        >
          {[
            { label: "Proofs Minted", value: 1247, sparkline: sparklines.proofs, color: "#00D4FF", borderColor: "border-t-[#00D4FF]", icon: <ShieldCheck className="w-5 h-5 text-[#00D4FF]" />, iconBg: "bg-[#00D4FF]/15" },
            { label: "Protocol Pilots", value: 5, sparkline: sparklines.pilots, color: "#8B5CF6", borderColor: "border-t-purple-500", icon: <Plug className="w-5 h-5 text-purple-400" />, iconBg: "bg-purple-500/15" },
            { label: "Model Accuracy", value: 91.2, suffix: "%", sparkline: sparklines.accuracy, color: "#10B981", decimals: 1, borderColor: "border-t-emerald-500", icon: <Target className="w-5 h-5 text-emerald-400" />, iconBg: "bg-emerald-500/15" },
            { label: "Axioms Enforced", value: 29, sparkline: sparklines.axioms, color: "#F59E0B", borderColor: "border-t-amber-500", icon: <ScrollText className="w-5 h-5 text-amber-400" />, iconBg: "bg-amber-500/15" },
          ].map((metric) => (
            <motion.div
              key={metric.label}
              variants={fade}
              transition={{ duration: 0.4 }}
              whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
              className={`bg-[#0F1420] border border-[#1A2235] border-t-2 ${metric.borderColor} rounded-xl p-6 text-center relative overflow-hidden hover:border-[#243049] transition-all duration-200`}
            >
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <Sparkline data={metric.sparkline} color={metric.color} width={100} height={32} />
              </div>
              <div className={`w-10 h-10 rounded-xl ${metric.iconBg} flex items-center justify-center mx-auto mb-3`}>
                {metric.icon}
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
                {metric.label}
              </p>
              <p className="text-4xl font-extrabold text-white relative z-10">
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

      <SectionDivider color="from-purple-500/20 via-[#00D4FF]/20 to-emerald-500/20" />

      {/* ============================================================ */}
      {/*  HOW IT WORKS                                                */}
      {/* ============================================================ */}
      <section className="px-6 py-24 relative">
        {/* Subtle background panel */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00D4FF]/[0.02] to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <SectionTitle>How AXIONBLADE Protects Capital</SectionTitle>

          <div className="relative">
            {/* Animated connecting gradient line */}
            <div className="hidden md:block absolute top-10 left-[16.67%] right-[16.67%] h-0.5">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                className="h-full bg-gradient-to-r from-[#00D4FF]/40 via-purple-500/40 to-emerald-500/40 origin-left rounded-full"
              />
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ visible: { transition: { staggerChildren: 0.25 } } }}
              className="grid grid-cols-1 md:grid-cols-3 gap-10"
            >
              {[
                {
                  num: "01",
                  title: "Submit",
                  desc: "Enter any Solana pool address. Our engine identifies the protocol, tokens, and risk parameters automatically.",
                  icon: <Upload className="w-7 h-7 text-[#00D4FF]" />,
                  iconBg: "bg-[#00D4FF]/15 border-[#00D4FF]/25",
                  numColor: "text-[#00D4FF]",
                },
                {
                  num: "02",
                  title: "Prove",
                  desc: "APOLLO analyzes 5 evidence families and mints a verifiable on-chain proof. No black boxes.",
                  icon: <Lock className="w-7 h-7 text-purple-400" />,
                  iconBg: "bg-purple-500/15 border-purple-500/25",
                  numColor: "text-purple-400",
                },
                {
                  num: "03",
                  title: "Verify",
                  desc: "Results are immutable, auditable, and transparent. Anyone can verify the proof on-chain.",
                  icon: <CheckCircle2 className="w-7 h-7 text-emerald-400" />,
                  iconBg: "bg-emerald-500/15 border-emerald-500/25",
                  numColor: "text-emerald-400",
                },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  variants={fade}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <div className="relative inline-flex">
                    <div className={`w-20 h-20 rounded-2xl ${step.iconBg} border flex items-center justify-center mb-5`}>
                      {step.icon}
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ repeat: Infinity, duration: 3, delay: i * 0.6, ease: "easeInOut" }}
                      className={`absolute -inset-1 rounded-2xl border ${step.iconBg} opacity-50`}
                    />
                  </div>
                  <p className={`text-sm font-bold ${step.numColor} mb-1`}>STEP {step.num}</p>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <SectionDivider color="from-emerald-500/20 via-cyan-500/20 to-[#00D4FF]/20" />

      {/* ============================================================ */}
      {/*  COMPARISON TABLE                                            */}
      {/* ============================================================ */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <SectionTitle>Built Different</SectionTitle>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="bg-[#0F1420] border border-[#1A2235] rounded-xl overflow-hidden"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1a2332] border-b border-[#1A2235]">
                  <th className="text-left text-gray-500 font-medium px-6 py-5 w-40" />
                  <th className="text-left px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#00D4FF]/20 flex items-center justify-center">
                        <Shield className="w-3.5 h-3.5 text-[#00D4FF]" />
                      </div>
                      <span className="text-white font-bold">AXIONBLADE</span>
                    </div>
                  </th>
                  <th className="text-left px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gray-500/20 flex items-center justify-center">
                        <Search className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <span className="text-gray-400 font-medium">Traditional Audits</span>
                    </div>
                  </th>
                  <th className="text-left px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gray-500/20 flex items-center justify-center">
                        <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <span className="text-gray-400 font-medium">Risk Dashboards</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Real-time", axionblade: true, audits: false, dashboards: "Partial" },
                  { feature: "On-chain proof", axionblade: true, audits: false, dashboards: false },
                  { feature: "Per-assessment", axionblade: "0.02 SOL", audits: "$50,000+", dashboards: "Free (no scoring)" },
                  { feature: "Verifiable AI", axionblade: true, audits: false, dashboards: false },
                  { feature: "API available", axionblade: true, audits: false, dashboards: "Some" },
                ].map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`${i % 2 === 0 ? "bg-[#0F1420]" : "bg-[#0E1420]"} hover:bg-[#1A2235]/40 transition-colors duration-150`}
                  >
                    <td className="px-6 py-4 text-gray-300 font-semibold">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 bg-[#00D4FF]/[0.04]">
                      {row.axionblade === true ? (
                        <AnimatedCheck delay={i * 0.08} />
                      ) : (
                        <span className="text-[#00D4FF] font-semibold">{row.axionblade}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {row.audits === false ? (
                        <AnimatedX delay={i * 0.08 + 0.05} />
                      ) : (
                        <span className="text-gray-400">{row.audits}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {row.dashboards === false ? (
                        <AnimatedX delay={i * 0.08 + 0.1} />
                      ) : (
                        <span className={row.dashboards === "Partial" || row.dashboards === "Some" ? "text-amber-400 font-medium" : "text-gray-400"}>
                          {row.dashboards}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      <SectionDivider color="from-[#00D4FF]/20 via-amber-500/15 to-purple-500/20" />

      {/* ============================================================ */}
      {/*  ROADMAP                                                     */}
      {/* ============================================================ */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <SectionTitle>Roadmap</SectionTitle>

          <div ref={roadmapRef} className="relative pl-10">
            {/* Background track */}
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-[#1A2235]" />
            {/* Animated gradient fill */}
            <motion.div
              className="absolute left-[15px] top-0 w-px bg-gradient-to-b from-emerald-500 via-[#00D4FF] via-purple-500 to-amber-500"
              style={{ height: timelineHeight }}
            />

            <div className="space-y-10">
              {[
                {
                  phase: "Phase 1",
                  title: "Core Infrastructure + Risk Engine",
                  badge: "Q1 2026 — NOW",
                  active: true,
                  dotColor: "bg-emerald-400 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
                  icon: <Rocket className="w-4 h-4 text-emerald-400" />,
                  iconBg: "bg-emerald-500/15",
                  borderClass: "border-emerald-500/20",
                  shadowClass: "shadow-[0_0_20px_rgba(16,185,129,0.08)]",
                  badgeClass: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
                  statusLabel: "Live",
                  items: ["Core infrastructure and APOLLO risk engine", "On-chain proof system", "5 evidence families operational"],
                },
                {
                  phase: "Phase 2",
                  title: "HERMES Intelligence + Subscriptions",
                  badge: "February 2026",
                  active: true,
                  dotColor: "bg-[#00D4FF]/80 border-[#00D4FF]/80 shadow-[0_0_8px_rgba(0,212,255,0.4)]",
                  icon: <Globe className="w-4 h-4 text-[#00D4FF]" />,
                  iconBg: "bg-[#00D4FF]/15",
                  borderClass: "border-[#00D4FF]/20",
                  shadowClass: "shadow-[0_0_20px_rgba(0,212,255,0.08)]",
                  badgeClass: "bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30",
                  statusLabel: "February 2026",
                  items: ["HERMES intelligence layer", "Subscription system", "Public API + widget system"],
                },
                {
                  phase: "Phase 3",
                  title: "A2A Marketplace + Multi-Agent Coordination",
                  badge: "Q2-Q3 2026",
                  active: false,
                  dotColor: "bg-purple-400 border-purple-400",
                  icon: <Link2 className="w-4 h-4 text-purple-400" />,
                  iconBg: "bg-purple-500/15",
                  borderClass: "border-transparent",
                  shadowClass: "",
                  badgeClass: "",
                  items: ["A2A marketplace", "Multi-agent coordination", "Advanced ML models"],
                },
                {
                  phase: "Phase 4",
                  title: "Cross-chain Expansion + Institutional Partnerships",
                  badge: "Q4 2026+",
                  active: false,
                  dotColor: "bg-amber-400 border-amber-400",
                  icon: <Vote className="w-4 h-4 text-amber-400" />,
                  iconBg: "bg-amber-500/15",
                  borderClass: "border-transparent",
                  shadowClass: "",
                  badgeClass: "",
                  items: ["Cross-chain expansion", "Institutional partnerships", "Community-driven axiom proposals"],
                },
              ].map((item, i) => (
                <motion.div
                  key={item.phase}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative"
                >
                  {/* Dot */}
                  <div className={`absolute -left-10 top-1 w-[11px] h-[11px] rounded-full border-2 ${item.dotColor}`} />

                  <div className={`bg-[#0F1420] border ${item.active ? item.borderClass : "border-[#1A2235]"} rounded-xl p-5 ${item.active && item.shadowClass ? item.shadowClass : ""}`}>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <div className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center`}>
                        {item.icon}
                      </div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                        {item.phase}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          item.active && item.badgeClass
                            ? item.badgeClass
                            : "bg-[#1A2235] text-gray-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-white font-semibold text-lg">
                      {item.title}
                      {(item as { note?: string }).note && (
                        <span className="text-gray-500 text-sm font-normal ml-2">{(item as { note?: string }).note}</span>
                      )}
                      {(item as { statusLabel?: string }).statusLabel && (
                        <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                          (item as { statusLabel?: string }).statusLabel === "Live"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30"
                        }`}>
                          {(item as { statusLabel?: string }).statusLabel}
                        </span>
                      )}
                    </p>
                    <ul className="mt-3 space-y-1">
                      {item.items.map((bullet) => (
                        <li key={bullet} className="text-sm text-gray-400 flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-gray-600 mt-2 shrink-0" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SectionDivider color="from-amber-500/20 via-[#00D4FF]/20 to-purple-500/20" />

      {/* ============================================================ */}
      {/*  PRICING                                                     */}
      {/* ============================================================ */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <SectionTitle>Pricing</SectionTitle>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* APOLLO Pricing */}
            <motion.div
              variants={fade}
              transition={{ duration: 0.5 }}
              className="bg-[#0F1420] border border-[#1A2235] rounded-2xl p-8 hover:border-[#00D4FF]/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#00D4FF]/15 border border-[#00D4FF]/20 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-[#00D4FF]" />
                </div>
                <h3 className="text-xl font-bold text-white">APOLLO</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">Launch Price</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">DeFi Risk Assessment Engine</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0E17] border border-[#1A2235]">
                  <div>
                    <p className="text-sm font-semibold text-white">Basic</p>
                    <p className="text-xs text-gray-500">Single pool assessment</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#00D4FF]">0.02 SOL</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Launch Price</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0E17] border border-[#1A2235]">
                  <div>
                    <p className="text-sm font-semibold text-white">Pro</p>
                    <p className="text-xs text-gray-500">Full report + monitoring</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#00D4FF]">0.15 SOL</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Launch Price</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0E17] border border-[#1A2235]">
                  <div>
                    <p className="text-sm font-semibold text-white">Institutional</p>
                    <p className="text-xs text-gray-500">Custom integrations + SLA</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#00D4FF]">from 2 SOL</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Launch Price</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* HERMES Pricing */}
            <motion.div
              variants={fade}
              transition={{ duration: 0.5 }}
              className="bg-[#0F1420] border border-[#1A2235] rounded-2xl p-8 hover:border-cyan-500/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
                  <Search className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white">HERMES</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">Launch Price</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">DeFi Intelligence Layer</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0E17] border border-[#1A2235]">
                  <div>
                    <p className="text-sm font-semibold text-white">Free Preview</p>
                    <p className="text-xs text-gray-500">Basic intelligence reports</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">Free</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0E17] border border-[#1A2235]">
                  <div>
                    <p className="text-sm font-semibold text-white">Pro</p>
                    <p className="text-xs text-gray-500">Full reports + notifications</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-cyan-400">0.5 SOL/mo</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Launch Price</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0E17] border border-[#1A2235]">
                  <div>
                    <p className="text-sm font-semibold text-white">Protocol</p>
                    <p className="text-xs text-gray-500">API access + white-label</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-cyan-400">10 SOL/mo</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Launch Price</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <p className="text-center text-xs text-gray-600 mt-6">
            Launch prices valid for the first 30 days. Prices may adjust after the launch period via the AI Pricing Stabilizer.
          </p>
        </div>
      </section>

      <SectionDivider color="from-emerald-500/20 via-amber-500/20 to-[#00D4FF]/20" />

      {/* ============================================================ */}
      {/*  REVENUE SPLIT                                               */}
      {/* ============================================================ */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <SectionTitle>Transparent Revenue Split</SectionTitle>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="bg-[#0F1420] border border-[#1A2235] rounded-2xl p-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Operations", pct: "40%", desc: "Compute, RPC, storage", color: "text-[#00D4FF]", barColor: "bg-[#00D4FF]" },
                { label: "Treasury", pct: "30%", desc: "Protocol safety net", color: "text-emerald-400", barColor: "bg-emerald-500" },
                { label: "Dev Fund", pct: "15%", desc: "Future development", color: "text-purple-400", barColor: "bg-purple-500" },
                { label: "Creator", pct: "15%", desc: "Protocol founder", color: "text-amber-400", barColor: "bg-amber-500" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className={`text-3xl font-bold ${item.color}`}>{item.pct}</p>
                  <p className="text-sm font-semibold text-white mt-1">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  <div className="mt-3 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.barColor}`} style={{ width: item.pct }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-[10px] text-gray-600 mt-6">
              40% Operations | 30% Treasury | 15% Dev Fund | 15% Creator. Enforced by smart contract.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                      */}
      {/* ============================================================ */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#00D4FF]/30 via-50% to-transparent" />

      <footer className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-2xl font-bold bg-gradient-to-r from-[#00D4FF] to-purple-400 bg-clip-text text-transparent"
            >
              Proof Before Action
            </motion.p>
            <p className="text-sm text-gray-600 mt-2">
              Risk Infrastructure for Solana
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Coins className="w-4 h-4 text-gray-400" />
              <span>Built on</span>
              <span className="text-gray-300 font-semibold">Solana</span>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: <Twitter className="w-4 h-4" />, label: "Twitter", href: "#" },
                { icon: <MessageCircle className="w-4 h-4" />, label: "Discord", href: "#" },
                { icon: <Github className="w-4 h-4" />, label: "GitHub", href: "#" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-[#1A2235] border border-[#243049] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#00D4FF]/50 hover:bg-[#00D4FF]/10 transition-all duration-200"
                  title={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* Nav links */}
            <div className="flex items-center gap-6">
              {[
                { label: "Docs", href: "#" },
                { label: "API", href: "#" },
                { label: "Security", href: "/security" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-gray-500 hover:text-[#00D4FF] transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-gray-700 mt-10">
            &copy; 2026 AXIONBLADE. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
