import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { PriceDataPoint } from "../App";

interface PriceChartProps {
  data: PriceDataPoint[];
  threshold: number;
  isTriggered: boolean;
}

interface TooltipPayload {
  value: number;
  name: string;
}

// Custom Tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(10, 14, 23, 0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: "10px 14px",
        fontFamily: "var(--font-mono)",
        fontSize: "0.8rem",
      }}
    >
      <p style={{ color: "var(--text-secondary)", marginBottom: 6 }}>{label}</p>
      <p style={{ color: "var(--pyth-orange)", fontWeight: 700 }}>
        ${Number(payload[0].value).toFixed(6)} USD
      </p>
    </div>
  );
}

export default function PriceChart({ data, threshold, isTriggered }: PriceChartProps) {
  const lineColor    = isTriggered ? "var(--red-danger)"  : "var(--pyth-orange)";
  const gradientTop  = isTriggered ? "rgba(239,68,68,0.3)" : "rgba(230,130,30,0.25)";
  const gradientBot  = "transparent";

  const prices = data.map((d) => d.price);
  const minY   = Math.min(...prices, threshold) * 0.985;
  const maxY   = Math.max(...prices) * 1.015;

  return (
    <div className="glass-card" style={{ padding: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>
            ADA/USD — Precio en vivo
          </h2>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 3 }}>
            Últimas {data.length} actualizaciones · intervalo 400ms
          </p>
        </div>
        <div className="badge" style={{
          background: "var(--pyth-orange-dim)",
          color: "var(--pyth-orange)",
          border: "1px solid var(--border-orange)",
          fontSize: "0.68rem",
        }}>
          ⚡ Pyth Lazer
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={gradientTop} />
              <stop offset="100%" stopColor={gradientBot} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="time"
            tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            domain={[minY, maxY]}
            tickFormatter={(v: number) => `$${v.toFixed(3)}`}
            tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            width={68}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Línea de threshold */}
          <ReferenceLine
            y={threshold}
            stroke="rgba(239,68,68,0.7)"
            strokeDasharray="5 4"
            label={{
              position: "insideTopRight",
              value: `Stop $${threshold}`,
              fill: "var(--red-danger)",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
            }}
          />

          <Area
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={false}
            animationDuration={200}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
