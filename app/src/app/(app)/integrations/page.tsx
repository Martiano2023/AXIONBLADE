"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Mail } from "lucide-react";

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
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-white">Integrate AXIONBLADE</h1>
        <p className="text-sm text-gray-400">
          Embed verified risk intelligence into your protocol
        </p>
      </motion.div>

      {/* Section 1: Widget Embed */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 hover:border-[#243049] transition-colors duration-200"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Risk Score Widget
        </h2>

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
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 hover:border-[#243049] transition-colors duration-200"
      >
        <h2 className="text-lg font-semibold text-white mb-4">REST API</h2>

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
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 hover:border-[#243049] transition-colors duration-200"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Why Protocols Integrate
        </h2>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00D4FF] shrink-0" />
            <p className="text-sm text-gray-300">
              Users demand verified risk data before depositing
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00D4FF] shrink-0" />
            <p className="text-sm text-gray-300">
              Risk transparency reduces support load and community FUD
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00D4FF] shrink-0" />
            <p className="text-sm text-gray-300">
              AXIONBLADE-verified pools projected to show higher TVL retention
            </p>
          </div>
        </div>
      </motion.div>

      {/* Section 4: Integration Status */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 hover:border-[#243049] transition-colors duration-200"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Integration Status
        </h2>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
          <p className="text-sm text-gray-300">
            Pilots in progress with Solana ecosystem protocols
          </p>
        </div>

        <a
          href="mailto:integrations@axionblade.app"
          className="inline-flex items-center gap-2 rounded-lg bg-[#00D4FF] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#00B8D9] transition-colors duration-200"
        >
          <Mail size={14} />
          Request Integration
        </a>
      </motion.div>
    </div>
  );
}
