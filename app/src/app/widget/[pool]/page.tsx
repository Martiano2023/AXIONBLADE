/**
 * Embeddable risk score badge widget.
 * Usage: <iframe src="https://axionblade.app/widget/POOL_ADDRESS" width="300" height="100" />
 *
 * CSS-only, no framer-motion — optimized for fast iframe loading.
 */

interface WidgetPageProps {
  params: Promise<{ pool: string }>;
}

// Mock score lookup — in production this calls the risk engine
function getScoreForPool(pool: string) {
  // Deterministic mock based on pool address hash
  let hash = 0;
  for (let i = 0; i < pool.length; i++) {
    hash = (hash << 5) - hash + pool.charCodeAt(i);
    hash |= 0;
  }
  const score = Math.abs(hash % 100);
  const level =
    score >= 70 ? "Low Risk" : score >= 40 ? "Medium Risk" : "High Risk";
  return { score, level };
}

function getScoreColor(score: number): {
  text: string;
  bg: string;
  border: string;
} {
  if (score >= 70) {
    return {
      text: "#34d399",
      bg: "rgba(52, 211, 153, 0.1)",
      border: "rgba(52, 211, 153, 0.25)",
    };
  }
  if (score >= 40) {
    return {
      text: "#fbbf24",
      bg: "rgba(251, 191, 36, 0.1)",
      border: "rgba(251, 191, 36, 0.25)",
    };
  }
  return {
    text: "#fb7185",
    bg: "rgba(251, 113, 133, 0.1)",
    border: "rgba(251, 113, 133, 0.25)",
  };
}

function truncatePool(pool: string): string {
  if (pool.length <= 12) return pool;
  return pool.slice(0, 6) + "..." + pool.slice(-4);
}

export default async function WidgetPage({ params }: WidgetPageProps) {
  const { pool } = await params;
  const { score, level } = getScoreForPool(pool);
  const colors = getScoreColor(score);

  return (
    <div
      style={{
        maxWidth: 300,
        maxHeight: 100,
        padding: "12px 16px",
        background: "#0a0a1a",
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: "flex",
        alignItems: "center",
        gap: 14,
        overflow: "hidden",
      }}
    >
      {/* Score circle */}
      <div
        style={{
          width: 56,
          height: 56,
          minWidth: 56,
          borderRadius: "50%",
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: colors.text,
            lineHeight: 1,
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontSize: 8,
            color: "rgba(156, 163, 175, 0.8)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            lineHeight: 1,
            marginTop: 2,
          }}
        >
          /100
        </span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            color: "#9ca3af",
            marginBottom: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={pool}
        >
          {truncatePool(pool)}
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: colors.text,
            marginBottom: 6,
          }}
        >
          {level}
        </div>
        <a
          href="https://axionblade.app"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 9,
            color: "#6b7280",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7280"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Powered by AXIONBLADE
        </a>
      </div>
    </div>
  );
}
