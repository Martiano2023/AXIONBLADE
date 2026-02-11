"use client";

import { toast } from "sonner";

const SOLSCAN_BASE = "https://solscan.io/tx";

export function showTxToast(signature: string, message: string) {
  toast.success(message, {
    description: "Transaction confirmed",
    duration: 5000,
    action: {
      label: "View on Solscan",
      onClick: () => {
        window.open(`${SOLSCAN_BASE}/${signature}`, "_blank", "noopener");
      },
    },
  });
}
