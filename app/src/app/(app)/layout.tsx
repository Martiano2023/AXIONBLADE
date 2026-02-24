"use client";

import { NavigationSidebar } from "@/components/organisms/NavigationSidebar";
import { TopBar } from "@/components/organisms/TopBar";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#0A0E17]">
      <NavigationSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
          <div className="fixed top-2 right-2 z-30 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 text-[10px] font-medium text-emerald-400">
            Mainnet Alpha
          </div>
          <div className="max-w-7xl mx-auto px-0 sm:px-2 lg:px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
