import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { PriceDataPoint } from "../App";

interface TradingChartProps {
  data: PriceDataPoint[];
  threshold: number;
  isTriggered: boolean;
}

const ORACLE_DELAY = 6; // puntos de delay para el oráculo estándar

// Tooltip personalizado — precio chart
const PriceTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const pyth   = payload.find((p: any) => p.dataKey === "price");
  const oracle = payload.find((p: any) => p.dataKey === "oracle");
  return (
    <div style={{ background: "rgb(26,29,46)", border: "1px solid rgb(42,45,69)", borderRadius: "6px", padding: "0.6rem 0.85rem", fontSize: "0.78rem" }}>
      <p style={{ color: "var(--on-surface)", marginBottom: "0.3rem", fontFamily: "var(--font-mono)" }}>{label}</p>
      {pyth   && <p style={{ color: "var(--chart-pyth)",   fontFamily: "var(--font-mono)", fontWeight: 600 }}>Pyth:   ${pyth.value?.toFixed(6)}</p>}
      {oracle && <p style={{ color: "rgba(180,160,255,0.8)", fontFamily: "var(--font-mono)" }}>Oráculo: ${oracle.value?.toFixed(6)}</p>}
    </div>
  );
};

// Tooltip — volumen
const VolumeTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const vol = payload[0];
  return (
    <div style={{ background: "rgb(26,29,46)", border: "1px solid rgb(42,45,69)", borderRadius: "6px", padding: "0.5rem 0.7rem", fontSize: "0.75rem" }}>
      <p style={{ color: "var(--on-surface)", fontFamily: "var(--font-mono)" }}>{label}</p>
      <p style={{ color: vol?.value >= 0 ? "var(--buy)" : "var(--sell)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
        Volumen: {Math.abs(vol?.value ?? 0).toLocaleString()} ADA
      </p>
    </div>
  );
};

export default function TradingChart({ data, threshold, isTriggered }: TradingChartProps) {
  // Datos con oráculo retrasado y volumen simulado
  const chartData = useMemo(() => {
    return data.map((d, i) => {
      const oracleIdx = Math.max(0, i - ORACLE_DELAY);
      const oraclePrice = i >= ORACLE_DELAY ? data[oracleIdx].price : undefined;
      // Volumen: positivo=compra, negativo=venta (simulado con ruido)
      const base = 50000 + Math.random() * 80000;
      const isBuy = d.price > (data[Math.max(0, i - 1)]?.price ?? d.price);
      const volume = isBuy ? base : -base;
      return { ...d, oracle: oraclePrice, volume, isBuy };
    });
  }, [data]);

  const latestPrice = data[data.length - 1]?.price ?? 0;
  const prevPrice   = data[data.length - 2]?.price ?? latestPrice;
  const priceDelta  = latestPrice - prevPrice;
  const pricePct    = prevPrice > 0 ? (priceDelta / prevPrice) * 100 : 0;
  const isUp        = priceDelta >= 0;

  // Rango Y dinámico para no perder el detalle
  const prices  = data.map(d => d.price).filter(Boolean);
  const minP    = prices.length ? Math.min(...prices) * 0.9995 : 0.35;
  const maxP    = prices.length ? Math.max(...prices) * 1.0005 : 0.45;

  const ticks = data.filter((_, i) => i % 10 === 0).map(d => d.time);

  return (
    <div className="chart-panel">
      {/* Cabecera del gráfico */}
      <div className="chart-header">
        <div>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--on-surface)" }}>
            ADA / USD
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.1rem" }}>
            <span className="price-tag" style={{ color: isTriggered ? "var(--sell)" : "var(--on-background)" }}>
              ${latestPrice.toFixed(6)}
            </span>
            <span style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)", fontWeight: 600, color: isUp ? "var(--buy)" : "var(--sell)" }}>
              {isUp ? "▲" : "▼"} {pricePct.toFixed(4)}%
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Leyenda */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div className="chart-legend-item">
            <div className="legend-line" style={{ background: "var(--chart-pyth)" }} />
            <span>Precio Pyth</span>
          </div>
          <div className="chart-legend-item">
            <div className="legend-line" style={{ background: "var(--chart-oracle)", height: "1px", borderTop: "1px dashed rgba(180,160,255,0.5)" }} />
            <span>Oráculo Estándar (retardado)</span>
          </div>
          <div className="chart-legend-item">
            <div className="legend-line" style={{ background: "rgba(255,61,90,0.6)" }} />
            <span>Stop-Loss</span>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", padding: "0.2rem 0.5rem", background: "var(--surface-container)", borderRadius: "4px", color: "var(--on-surface)" }}>
            400ms
          </span>
        </div>
      </div>

      {/* Gráfico de Precios — 65% */}
      <div style={{ flex: "65", minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: "var(--on-surface)", fontSize: 11, fontFamily: "var(--font-mono)" }}
              axisLine={false} tickLine={false}
              ticks={ticks}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minP, maxP]}
              tick={{ fill: "var(--on-surface)", fontSize: 11, fontFamily: "var(--font-mono)" }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `$${v.toFixed(4)}`}
              width={72}
            />
            <Tooltip content={<PriceTooltip />} />
            {/* Stop-loss reference */}
            <ReferenceLine
              y={threshold}
              stroke="rgba(255,61,90,0.5)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{ value: "Stop-Loss", fill: "var(--sell)", fontSize: 10, fontFamily: "var(--font-mono)", position: "insideTopLeft" }}
            />
            {/* Oráculo retardado — tenue */}
            <Line
              dataKey="oracle"
              stroke="rgba(180,160,255,0.4)"
              strokeWidth={1}
              dot={false}
              strokeDasharray="3 3"
              connectNulls
              isAnimationActive={false}
            />
            {/* Precio Pyth — sólido */}
            <Line
              dataKey="price"
              stroke="var(--chart-pyth)"
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Separador */}
      <div style={{ height: "1px", background: "var(--outline)" }} />

      {/* Histograma de Volumen — 35% */}
      <div style={{ flex: "35", minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="time" tick={false} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={v => `${(Math.abs(v) / 1000).toFixed(0)}K`}
              tick={{ fill: "var(--on-surface)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              axisLine={false} tickLine={false}
              width={44}
            />
            <Tooltip content={<VolumeTooltip />} />
            <Bar
              dataKey="volume"
              radius={[1, 1, 0, 0]}
              isAnimationActive={false}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.volume >= 0 ? "rgba(0,210,106,0.65)" : "rgba(255,61,90,0.65)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
