"use client";

import { WalletProvider } from "@/providers/WalletProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { RealtimeProvider } from "@/providers/RealtimeProvider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <WalletProvider>
        <RealtimeProvider>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#0c0c14",
                border: "1px solid #1e293b",
                color: "#e2e8f0",
              },
            }}
          />
        </RealtimeProvider>
      </WalletProvider>
    </QueryProvider>
  );
}
