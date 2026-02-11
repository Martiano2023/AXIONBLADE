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
  Wallet,
  ScrollText,
  Activity,
  Bell,
  Settings,
  ShieldCheck,
  Plug,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useTierStore } from "@/stores/useTierStore";
import { UpgradeModal } from "@/components/organisms/UpgradeModal";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "AEON", href: "/aeon", icon: Crown },
  { label: "APOLLO", href: "/apollo", icon: Shield },
  { label: "HERMES", href: "/hermes", icon: Zap },
  { label: "Treasury", href: "/treasury", icon: Wallet },
  { label: "Axioms", href: "/axioms", icon: ScrollText },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Alerts", href: "/alerts", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Security", href: "/security", icon: ShieldCheck },
  { label: "Integrations", href: "/integrations", icon: Plug },
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
            <span className="text-2xl font-black tracking-tighter text-white">
              N
            </span>
          ) : (
            <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
              NOUMEN
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
              highestTier === "pro" && "bg-blue-400",
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
              <span className="inline-flex items-center self-start rounded-full px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-medium">
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
                className="self-start text-xs text-blue-400 hover:text-blue-300 transition-colors"
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
        <ul className="flex flex-col gap-1" role="list">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed && !isMobile ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                    collapsed && !isMobile ? "justify-center px-0" : "",
                    active
                      ? "bg-[#111827] border border-[#1F2937] text-white"
                      : "text-gray-500 hover:bg-[#111827] hover:text-gray-300 border border-transparent"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {/* Active accent bar */}
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-blue-500"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span
                    className={cn(
                      "shrink-0 transition-colors duration-200",
                      active ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300"
                    )}
                  >
                    <Icon size={20} />
                  </span>
                  {(!collapsed || isMobile) && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] px-4 py-4">
        {collapsed && !isMobile ? (
          <p className="text-[10px] text-gray-600 text-center">v3.2</p>
        ) : (
          <p className="text-xs text-gray-600">v3.2.3</p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-xl bg-[#0B0F1A] border border-[#1F2937] p-2.5 text-gray-400 hover:text-white transition-colors lg:hidden"
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
            className="fixed inset-y-0 left-0 z-50 w-[256px] bg-[#0B0F1A] border-r border-[#1F2937] lg:hidden"
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
          "bg-[#0B0F1A] border-r border-[#1F2937]",
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
