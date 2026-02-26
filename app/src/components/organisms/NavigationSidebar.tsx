"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Crown,
  Shield,
  Zap,
  Bot,
  Wallet,
  BarChart3,
  ScrollText,
  Activity,
  Bell,
  Settings,
  Plug,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Cpu,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { useTierStore } from "@/stores/useTierStore";
import { UpgradeModal } from "@/components/organisms/UpgradeModal";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  gated?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
  color?: string;
  icon?: React.ElementType;
}

const navSections: NavSection[] = [
  {
    label: "Agents",
    icon: Bot,
    items: [
      { label: "APOLLO", href: "/apollo", icon: Shield, badge: "Risk" },
      { label: "HERMES", href: "/hermes", icon: Zap, badge: "Intel" },
      { label: "AEON", href: "/aeon", icon: Crown, badge: "Gov" },
      { label: "KRONOS", href: "/agents", icon: Cpu, badge: "Keeper" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Dashboard",  href: "/dashboard",  icon: LayoutDashboard },
      { label: "Analytics",  href: "/analytics",  icon: BarChart3 },
      { label: "Activity",   href: "/activity",   icon: Activity },
      { label: "Economics",  href: "/economics",  icon: TrendingUp },
    ],
  },
  {
    label: "Tools",
    color: "blue",
    items: [
      { label: "Services Hub",        href: "/services",             icon: Plug,          badge: "9 services" },
      { label: "Liquidation Scanner", href: "/liquidation-scanner",  icon: AlertTriangle, badge: "0.006 SOL", gated: true },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Treasury",      href: "/treasury",      icon: Wallet },
      { label: "Axioms",        href: "/axioms",        icon: ScrollText },
      { label: "Price Monitor", href: "/price-monitor", icon: Activity, badge: "4h" },
      { label: "Settings",      href: "/settings",      icon: Settings },
      { label: "Integrations",  href: "/integrations",  icon: Plug },
      { label: "Alerts",        href: "/alerts",        icon: Bell },
    ],
  },
];

const gettingStartedSteps = [
  { number: 1, label: "APOLLO", description: "Assess Risk", href: "/apollo" },
  { number: 2, label: "HERMES", description: "Review Intel", href: "/hermes" },
  { number: 3, label: "Axioms", description: "Verify Compliance", href: "/axioms" },
  { number: 4, label: "Treasury", description: "Check Impact", href: "/treasury" },
];

export function NavigationSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [gettingStartedDismissed, setGettingStartedDismissed] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const getHighestTier = useTierStore((s) => s.getHighestTier);
  const highestTier = getHighestTier();

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  }

  const sidebarContent = (isMobile: boolean) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          {collapsed && !isMobile ? (
            <span className="text-2xl font-black tracking-tighter neon-text-cyan" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              A
            </span>
          ) : (
            <span className="text-xl font-bold tracking-tight neon-text-cyan whitespace-nowrap" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              AXIONBLADE
            </span>
          )}
        </Link>
        {!isMobile && (
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.05] transition-all duration-200"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Tier Badge */}
      <div className={cn("px-4 pb-2", collapsed && !isMobile ? "flex justify-center" : "")}>
        {collapsed && !isMobile ? (
          /* Collapsed: colored dot */
          <span
            className={cn(
              "block w-2 h-2 rounded-full",
              highestTier === "institutional" && "bg-amber-400",
              highestTier === "pro" && "bg-[#00D4FF]/80",
              highestTier === "free" && "bg-gray-500"
            )}
          />
        ) : (
          <div className="flex flex-col gap-1">
            {/* Tier pill */}
            {highestTier === "free" && (
              <span className="inline-flex items-center self-start rounded-full px-2 py-0.5 bg-white/[0.05] text-gray-500 text-[10px] font-medium">
                Free Tier
              </span>
            )}
            {highestTier === "pro" && (
              <span className="inline-flex items-center self-start rounded-full px-2 py-0.5 bg-[#00D4FF]/20 text-[#00D4FF] text-[10px] font-medium">
                Pro
              </span>
            )}
            {highestTier === "institutional" && (
              <span className="inline-flex items-center self-start rounded-full px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-medium">
                Institutional
              </span>
            )}
            {/* Upgrade button — only for free/basic users */}
            {highestTier === "free" && (
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="self-start text-xs text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors"
              >
                Upgrade
              </button>
            )}
          </div>
        )}
      </div>

      {/* Getting Started */}
      {(!collapsed || isMobile) && (
        <AnimatePresence>
          {!gettingStartedDismissed && (
            <motion.div
              initial={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="border-y border-white/[0.04] py-3 my-2 mx-3 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs text-gray-500 uppercase tracking-wider">
                  Getting Started
                </span>
                <button
                  type="button"
                  onClick={() => setGettingStartedDismissed(true)}
                  className="flex items-center justify-center w-4 h-4 rounded text-gray-600 hover:text-gray-400 transition-colors"
                  aria-label="Dismiss getting started"
                >
                  <X size={10} />
                </button>
              </div>
              <ul className="flex flex-col gap-1.5">
                {gettingStartedSteps.map((step) => (
                  <li key={step.href}>
                    <Link
                      href={step.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 group"
                    >
                      <span className="flex items-center justify-center w-[10px] h-[10px] bg-white/10 rounded-full text-[9px] text-gray-500 leading-none shrink-0">
                        {step.number}
                      </span>
                      <span className="text-xs text-gray-500">
                        {step.label}
                      </span>
                      <span className="text-xs text-gray-600">
                        — {step.description}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <div className="flex flex-col gap-5">
          {navSections.map((section, sectionIdx) => (
            <div key={section.label}>
              {/* Section Header */}
              {(!collapsed || isMobile) && (
                <div className="flex items-center gap-2 px-3 mb-2">
                  {section.icon && (
                    <section.icon
                      size={12}
                      className={cn(
                        section.color === "amber" && "text-amber-400",
                        section.color === "blue" && "text-blue-400",
                        section.color === "purple" && "text-purple-400",
                        !section.color && "text-gray-600"
                      )}
                    />
                  )}
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">
                    {section.label}
                  </span>
                </div>
              )}

              {/* Section Items */}
              <ul className="flex flex-col gap-1" role="list">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed && !isMobile ? item.label : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                          collapsed && !isMobile ? "justify-center px-0" : "",
                          active
                            ? "bg-[#0F1420] border border-[#1A2235] text-white"
                            : "text-gray-500 hover:bg-[#0F1420] hover:text-gray-300 border border-transparent"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        {/* Active accent bar */}
                        {active && (
                          <motion.div
                            layoutId="sidebar-active"
                            className={cn(
                              "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full",
                              section.color === "amber" && "bg-amber-400",
                              section.color === "blue" && "bg-blue-400",
                              section.color === "purple" && "bg-purple-400",
                              !section.color && "bg-[#00D4FF]"
                            )}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <span
                          className={cn(
                            "shrink-0 transition-colors duration-200",
                            active
                              ? section.color === "amber"
                                ? "text-amber-400"
                                : section.color === "blue"
                                ? "text-blue-400"
                                : section.color === "purple"
                                ? "text-purple-400"
                                : "text-[#00D4FF]"
                              : "text-gray-500 group-hover:text-gray-300"
                          )}
                        >
                          <Icon size={18} />
                        </span>
                        {(!collapsed || isMobile) && (
                          <span className="truncate flex-1">{item.label}</span>
                        )}
                        {(!collapsed || isMobile) && item.badge && (
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1",
                            item.gated
                              ? "bg-cyan-500/10 text-cyan-600 border border-cyan-500/20"
                              : "bg-white/[0.05] text-gray-500"
                          )}>
                            {item.gated && <Lock size={8} className="shrink-0" />}
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Section Divider */}
              {sectionIdx < navSections.length - 1 && (!collapsed || isMobile) && (
                <div className="h-px bg-white/[0.04] mt-4" />
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] px-4 py-3">
        {collapsed && !isMobile ? (
          <p className="text-[10px] text-gray-600 text-center">v3.4</p>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">AXIONBLADE v3.4.0</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] text-gray-500">Live</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-xl bg-[#0A0E17] border border-[#1A2235] p-2.5 text-gray-400 hover:text-white transition-colors lg:hidden"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-[256px] bg-[#0A0E17] border-r border-[#1A2235] lg:hidden"
            aria-label="Mobile navigation"
          >
            {sidebarContent(true)}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col",
          "bg-[#0A0E17] border-r border-[#1A2235]",
          "transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-[256px]"
        )}
        aria-label="Desktop navigation"
      >
        {sidebarContent(false)}
      </aside>

      {/* Spacer to push main content */}
      <div
        className={cn(
          "hidden lg:block shrink-0 transition-all duration-300",
          collapsed ? "w-[72px]" : "w-[256px]"
        )}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}
