// ---------------------------------------------------------------------------
// AXIONBLADE AgentSettingsModal Component — Agent Permission Configuration
// ---------------------------------------------------------------------------
// Modal for configuring per-agent permissions on-chain:
// - AEON: IL thresholds, health factor thresholds, auto-actions
// - APOLLO: Analysis frequency, auto-analysis toggle
// - HERMES: Max TX amount, protocol allowlist, slippage, daily limits
//
// Updates AgentPermissionConfig PDA on save
// ---------------------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

interface AgentSettingsModalProps {
  agent: 'AEON' | 'APOLLO' | 'HERMES';
  permissions: any;
  onSave: (settings: any) => Promise<void>;
  onClose: () => void;
}

export function AgentSettingsModal({
  agent,
  permissions,
  onSave,
  onClose,
}: AgentSettingsModalProps) {
  const [settings, setSettings] = useState(permissions || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (permissions) {
      setSettings(permissions);
    }
  }, [permissions]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await onSave(settings);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  Configure {agent} Permissions
                </h2>
                <p className="text-sm text-gray-400">
                  {agent === 'AEON' && 'Set monitoring thresholds and auto-defensive actions'}
                  {agent === 'APOLLO' && 'Configure risk analysis automation'}
                  {agent === 'HERMES' && 'Set execution limits and protocol allowlist'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Settings Content */}
            <div className="space-y-6">
              {agent === 'AEON' && <AeonSettings settings={settings} setSettings={setSettings} />}
              {agent === 'APOLLO' && <ApolloSettings settings={settings} setSettings={setSettings} />}
              {agent === 'HERMES' && <HermesSettings settings={settings} setSettings={setSettings} />}
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-300">{error}</div>
              </motion.div>
            )}

            {/* Footer */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-6 border-t border-gray-800">
              <Button variant="ghost" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Saving On-Chain...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save On-Chain
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// AEON Settings
// ---------------------------------------------------------------------------

function AeonSettings({ settings, setSettings }: any) {
  return (
    <div className="space-y-4">
      {/* Auto-Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Automatic Actions
        </h3>

        <ToggleField
          label="Auto-revoke dangerous approvals"
          description="Automatically revoke unlimited token approvals to suspicious contracts"
          checked={settings.aeon_auto_revoke_approvals || false}
          onChange={(checked) => setSettings({ ...settings, aeon_auto_revoke_approvals: checked })}
        />

        <ToggleField
          label="Auto-exit pools with high IL"
          description="Automatically remove liquidity when impermanent loss exceeds threshold"
          checked={settings.aeon_auto_exit_pools || false}
          onChange={(checked) => setSettings({ ...settings, aeon_auto_exit_pools: checked })}
        />

        <ToggleField
          label="Auto-unstake when health factor is low"
          description="Automatically unstake from lending protocols to avoid liquidation"
          checked={settings.aeon_auto_unstake || false}
          onChange={(checked) => setSettings({ ...settings, aeon_auto_unstake: checked })}
        />
      </div>

      {/* Thresholds */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Risk Thresholds
        </h3>

        <SliderField
          label="Impermanent Loss Threshold (%)"
          description="Trigger alert or auto-exit when IL exceeds this percentage"
          min={1}
          max={50}
          step={1}
          value={(settings.aeon_il_threshold_bps || 1000) / 100}
          onChange={(value) => setSettings({ ...settings, aeon_il_threshold_bps: value * 100 })}
          suffix="%"
        />

        <SliderField
          label="Health Factor Threshold"
          description="Trigger alert or auto-unstake when health factor drops below this value"
          min={1.0}
          max={2.0}
          step={0.05}
          value={(settings.aeon_health_factor_threshold_bps || 12000) / 10000}
          onChange={(value) => setSettings({ ...settings, aeon_health_factor_threshold_bps: value * 10000 })}
          suffix=""
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// APOLLO Settings
// ---------------------------------------------------------------------------

function ApolloSettings({ settings, setSettings }: any) {
  return (
    <div className="space-y-4">
      <ToggleField
        label="Enable auto-analysis"
        description="Automatically run risk assessments on your positions at regular intervals"
        checked={settings.apollo_auto_analysis_enabled || false}
        onChange={(checked) => setSettings({ ...settings, apollo_auto_analysis_enabled: checked })}
      />

      {settings.apollo_auto_analysis_enabled && (
        <SliderField
          label="Analysis Frequency (hours)"
          description="How often APOLLO should analyze your positions"
          min={1}
          max={24}
          step={1}
          value={settings.apollo_analysis_frequency_hours || 6}
          onChange={(value) => setSettings({ ...settings, apollo_analysis_frequency_hours: value })}
          suffix="h"
        />
      )}

      <InfoBox>
        APOLLO analyzes positions using 5 evidence families: Price/Volume, Liquidity, Behavior,
        Incentive, and Protocol. Analysis is deterministic and generates on-chain proofs.
      </InfoBox>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HERMES Settings
// ---------------------------------------------------------------------------

function HermesSettings({ settings, setSettings }: any) {
  const protocols = ['Jupiter', 'Raydium', 'Orca', 'Marinade', 'Jito', 'Kamino', 'Drift'];
  const selectedProtocols = decodeProtocolBitmap(settings.hermes_allowed_protocols_bitmap || 0);

  const toggleProtocol = (protocol: string) => {
    const newSelected = selectedProtocols.includes(protocol)
      ? selectedProtocols.filter(p => p !== protocol)
      : [...selectedProtocols, protocol];

    setSettings({
      ...settings,
      hermes_allowed_protocols_bitmap: encodeProtocolBitmap(newSelected),
    });
  };

  return (
    <div className="space-y-4">
      {/* Transaction Limits */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Transaction Limits
        </h3>

        <InputField
          label="Maximum Transaction Amount (SOL)"
          description="Maximum amount HERMES can execute in a single transaction"
          type="number"
          min="0.001"
          max="1000"
          step="0.1"
          value={(settings.hermes_max_tx_amount_lamports || 0) / LAMPORTS_PER_SOL}
          onChange={(value) =>
            setSettings({ ...settings, hermes_max_tx_amount_lamports: value * LAMPORTS_PER_SOL })
          }
          suffix="SOL"
        />

        <InputField
          label="Daily Transaction Limit"
          description="Maximum number of transactions HERMES can execute per day"
          type="number"
          min="1"
          max="100"
          step="1"
          value={settings.hermes_daily_tx_limit || 10}
          onChange={(value) => setSettings({ ...settings, hermes_daily_tx_limit: value })}
          suffix="txs/day"
        />

        <SliderField
          label="Maximum Slippage (%)"
          description="Maximum allowed slippage for swaps and liquidity operations"
          min={0.1}
          max={5.0}
          step={0.1}
          value={(settings.hermes_max_slippage_bps || 100) / 100}
          onChange={(value) => setSettings({ ...settings, hermes_max_slippage_bps: value * 100 })}
          suffix="%"
        />
      </div>

      {/* Protocol Allowlist */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Allowed Protocols
        </h3>
        <p className="text-sm text-gray-400">
          Select which protocols HERMES can interact with
        </p>

        <div className="grid grid-cols-2 gap-2">
          {protocols.map((protocol) => (
            <button
              key={protocol}
              onClick={() => toggleProtocol(protocol)}
              className={`px-4 py-2 rounded-lg border transition-all ${
                selectedProtocols.includes(protocol)
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                  : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {protocol}
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Features
        </h3>

        <ToggleField
          label="Enable DCA (Dollar-Cost Averaging)"
          description="Allow HERMES to execute recurring purchases at set intervals"
          checked={settings.hermes_dca_enabled || false}
          onChange={(checked) => setSettings({ ...settings, hermes_dca_enabled: checked })}
        />

        <ToggleField
          label="Enable Auto-Rebalancing"
          description="Allow HERMES to automatically rebalance your LP positions"
          checked={settings.hermes_rebalance_enabled || false}
          onChange={(checked) => setSettings({ ...settings, hermes_rebalance_enabled: checked })}
        />
      </div>

      <InfoBox variant="warning">
        <strong>A0-31 through A0-35:</strong> HERMES requires explicit permission for each action,
        validates ≥2 evidence families, references recent APOLLO assessments, and can be paused by
        AEON or revoked by you instantly.
      </InfoBox>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable Form Components
// ---------------------------------------------------------------------------

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-gray-900/50 border border-gray-800">
      <div className="flex-1">
        <div className="font-medium mb-1">{label}</div>
        <div className="text-sm text-gray-400">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-green-500' : 'bg-gray-700'
        }`}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 bg-white rounded-full"
          animate={{ left: checked ? '28px' : '4px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

function SliderField({
  label,
  description,
  min,
  max,
  step,
  value,
  onChange,
  suffix,
}: {
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  suffix: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">{label}</div>
        <div className="text-sm font-mono font-semibold text-cyan-400">
          {value.toFixed(step < 1 ? 2 : 0)}
          {suffix}
        </div>
      </div>
      <div className="text-sm text-gray-400 mb-3">{description}</div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
    </div>
  );
}

function InputField({
  label,
  description,
  type,
  min,
  max,
  step,
  value,
  onChange,
  suffix,
}: {
  label: string;
  description: string;
  type: string;
  min?: string;
  max?: string;
  step?: string;
  value: number;
  onChange: (value: number) => void;
  suffix: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
      <div className="font-medium mb-1">{label}</div>
      <div className="text-sm text-gray-400 mb-3">{description}</div>
      <div className="flex items-center gap-2">
        <input
          type={type}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <span className="text-sm text-gray-400 font-medium">{suffix}</span>
      </div>
    </div>
  );
}

function InfoBox({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warning' }) {
  const colors = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  };

  return (
    <div className={`p-3 rounded-lg border flex items-start gap-2 ${colors[variant]}`}>
      <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="text-sm">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Protocol Bitmap Encoding/Decoding
// ---------------------------------------------------------------------------

function decodeProtocolBitmap(bitmap: number): string[] {
  const protocols = ['Jupiter', 'Raydium', 'Orca', 'Marinade', 'Jito', 'Kamino', 'Drift'];
  const selected: string[] = [];

  for (let i = 0; i < protocols.length; i++) {
    if ((bitmap & (1 << i)) !== 0) {
      selected.push(protocols[i]);
    }
  }

  return selected;
}

function encodeProtocolBitmap(protocols: string[]): number {
  const protocolMap = {
    Jupiter: 0,
    Raydium: 1,
    Orca: 2,
    Marinade: 3,
    Jito: 4,
    Kamino: 5,
    Drift: 6,
  };

  let bitmap = 0;
  for (const protocol of protocols) {
    const index = protocolMap[protocol as keyof typeof protocolMap];
    if (index !== undefined) {
      bitmap |= 1 << index;
    }
  }

  return bitmap;
}
