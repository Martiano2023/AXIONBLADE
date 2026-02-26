"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Mail, Plug, Code2, Globe, ArrowRight, Shield, Zap, Lock } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Copy button                                                        */
/* ------------------------------------------------------------------ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-[#1A2235] transition-colors text-gray-500 hover:text-gray-300"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={14} className="text-[#10B981]" />
      ) : (
        <Copy size={14} />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Code block                                                         */
/* ------------------------------------------------------------------ */

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={code} />
      </div>
      <div className="bg-[#0A0E17] border border-[#1A2235] rounded-lg p-4 overflow-x-auto">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
            {language}
          </span>
        </div>
        <pre className="text-sm font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">
          {code}
        </pre>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Code snippets                                                      */
/* ------------------------------------------------------------------ */

const widgetEmbed = `<iframe src="https://axionblade.app/widget/POOL_ADDRESS"
        width="300" height="80" />`;

const apiExample = `const response = await fetch('https://api.axionblade.app/v1/risk-score', {
  headers: { 'X-API-Key': 'your-key' },
  body: JSON.stringify({ pool: 'POOL_ADDRESS' })
});
// Returns: { score: 78, level: "Medium", confidence: 91, proofHash: "0x..." }`;

/* ------------------------------------------------------------------ */
/*  API endpoints                                                      */
/* ------------------------------------------------------------------ */

const endpoints = [
  {
    method: "GET",
    path: "/v1/risk-score",
    description: "Risk score + level + proof",
  },
  {
    method: "GET",
    path: "/v1/effective-apr",
    description: "Headline vs effective APR",
  },
  {
    method: "GET",
    path: "/v1/yield-trap",
    description: "Yield trap detection",
  },
  {
    method: "GET",
    path: "/v1/proof",
    description: "Proof verification",
  },
];

/* ------------------------------------------------------------------ */
/*  Widget preview (static mock)                                       */
/* ------------------------------------------------------------------ */

function WidgetPreview() {
  return (
    <div className="inline-flex items-center gap-2 bg-[#0A0E17] border border-[#1A2235] rounded-lg px-3 py-2">
      <span className="text-xs font-medium text-gray-400">[AXIONBLADE]</span>
      <span className="text-xs text-white">SOL-USDC</span>
      <span className="text-xs text-gray-400">Risk:</span>
      <span className="text-xs font-semibold text-[#10B981]">87</span>
      <span className="text-[10px] text-gray-500">(Low)</span>
      <span className="text-[10px] text-[#10B981]">&#10003;</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function IntegrationsPage() {
  return (
    <div className="space-y-8 max-w-4xl relative">
      {/* Background gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-60 -right-40 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10"
      >
        <div className="flex items-start gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Plug className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Integrate AXIONBLADE
            </h1>
            <p className="text-gray-400 text-lg">
              Embed verifiable risk intelligence into any protocol or frontend
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Proof-verified outputs — every response includes an on-chain proof hash (A0-32)
            </p>
          </div>
        </div>
      </motion.div>

      {/* Value props */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10"
      >
        {[
          { icon: Shield, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", title: "Proof-Verified", desc: "Every response includes an immutable on-chain proof hash" },
          { icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", title: "Sub-Second Latency", desc: "Cached assessments served in real-time from CDN edge" },
          { icon: Lock, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", title: "A2A Native", desc: "Designed for agent-to-agent consumption with 100% treasury routing" },
        ].map(({ icon: Icon, color, bg, title, desc }) => (
          <div key={title} className={`bg-[#0F1420] border rounded-xl p-4 ${bg.split(" ")[1]}`}>
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <p className={`text-sm font-semibold mb-1 ${color}`}>{title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Section 1: Widget Embed */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 hover:border-[#243049] transition-colors duration-200 relative z-10"
      >
        <div className="flex items-center gap-2 mb-4">
          <Globe size={16} className="text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Risk Score Widget</h2>
          <span className="ml-auto text-[10px] text-gray-600 bg-[#1A2235] border border-white/5 rounded-full px-2 py-0.5">iframe embed</span>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Embed a live risk score badge on your site. Replace{" "}
          <code className="text-gray-300 text-xs font-mono">POOL_ADDRESS</code>{" "}
          with the Solana pool address.
        </p>

        <div className="mb-5">
          <CodeBlock code={widgetEmbed} language="html" />
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">
            Preview
          </p>
          <div className="flex items-center justify-center bg-[#0A0E17] border border-[#1A2235] rounded-lg p-6">
            <WidgetPreview />
          </div>
        </div>
      </motion.div>

      {/* Section 2: API Integration */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 hover:border-[#243049] transition-colors duration-200 relative z-10"
      >
        <div className="flex items-center gap-2 mb-4">
          <Code2 size={16} className="text-purple-400" />
          <h2 className="text-lg font-semibold text-white">REST API</h2>
          <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">v1 · Active</span>
        </div>

        <div className="mb-5">
          <CodeBlock code={apiExample} language="javascript" />
        </div>

        {/* Endpoints table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2235]">
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endpoint
                </th>
                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep) => (
                <tr
                  key={ep.path}
                  className="border-b border-[#1A2235] last:border-b-0"
                >
                  <td className="py-2.5 pr-4">
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <code className="text-sm font-mono text-gray-300">
                      {ep.path}
                    </code>
                  </td>
                  <td className="py-2.5 text-gray-400">{ep.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Section 3: Why Protocols Integrate */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 hover:border-[#243049] transition-colors duration-200 relative z-10"
      >
        <div className="flex items-center gap-2 mb-5">
          <ArrowRight size={16} className="text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Why Protocols Integrate</h2>
        </div>

        <div className="space-y-3">
          {[
            "Users demand verified risk data before depositing — AXIONBLADE provides cryptographic proof of assessment quality",
            "Risk transparency reduces support load and community FUD around pool safety",
            "AXIONBLADE-verified pools display proofs on-chain — users can verify independently without trusting the protocol",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3 py-3 px-4 rounded-xl bg-[#0A0E17] hover:bg-[#1A2235] transition-colors">
              <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-emerald-400">{i + 1}</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Section 4: Integration Status */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl p-6 relative z-10"
      >
        <div className="flex items-center gap-2 mb-5">
          <Mail size={16} className="text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Integration Status</h2>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Pilots in Progress
          </span>
        </div>

        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Pilots in progress with Solana ecosystem protocols. Integration is subject to AEON allowlist approval
          per A0-36 — all external protocol integrations require governance review.
        </p>

        <a
          href="mailto:integrations@axionblade.app"
          className="inline-flex items-center gap-2 rounded-xl bg-[#00D4FF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00B8D9] transition-colors duration-200"
        >
          <Mail size={14} />
          Request Integration
        </a>
      </motion.div>

      {/* Disclaimer */}
      <div className="border-t border-white/[0.04] pt-6 mt-8 relative z-10">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          All integrations subject to AEON allowlist governance (A0-36). A2A marketplace revenue routes 100% to Treasury (A0-33).
          Integration requests are reviewed against all 50 axioms before approval.
          AXIONBLADE does not provide financial advice. Risk assessments are informational only.
        </p>
      </div>
    </div>
  );
}
