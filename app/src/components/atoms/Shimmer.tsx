"use client";

import { cn } from "@/lib/utils";

interface ShimmerProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
}

export function Shimmer({
  width,
  height,
  className,
  rounded = false,
}: ShimmerProps) {
  const style: React.CSSProperties = {};

  if (width) {
    style.width = typeof width === "number" ? `${width}px` : width;
  }
  if (height) {
    style.height = typeof height === "number" ? `${height}px` : height;
  }

  return (
    <div
      style={style}
      className={cn(
        "shimmer-loading",
        rounded ? "rounded-full" : "rounded-lg",
        !width && "w-full",
        !height && "h-4",
        className
      )}
      aria-hidden="true"
    />
  );
}
