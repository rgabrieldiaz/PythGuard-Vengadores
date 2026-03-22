import { useState, useEffect, useRef, useCallback } from "react";
import PriceChart from "./components/PriceChart";
import SafetyIndicator from "./components/SafetyIndicator";
import SlippagePanel from "./components/SlippagePanel";

// ============================================================
// TIPOS
// ============================================================

export interface PriceDataPoint {
  time: string;
  price: number;
  timestamp: number;
}

export interface AppState {
  currentPrice: number;
  stopLossThreshold: number;
  isStopLossTriggered: boolean;
  priceHistory: PriceDataPoint[];
  lastUpdateMs: number;
  updateCount: number;
}

// ============================================================
// CONSTANTES
// ============================================================

const STOP_LOSS_THRESHOLD = 0.35; // ADA/USD
const UPDATE_INTERVAL_MS = 400;   // Pyth Lazer: 400ms
const HISTORY_WINDOW = 60;        // últimos 60 puntos
const DEX_DELAY_MS = 2000;        // latencia simulada del DEX

// ============================================================
// MOCK DE PRECIO ADA/USD (simula Pyth Lazer feed)
// Base price + variación random para el demo.
// En producción: reemplazar por WebSocket real de Pyth Lazer.
// ============================================================

function generateMockPrice(prev: number, threshold: number): number {
  const t = Date.now() / 10000;
  // Oscilación sinusoidal alrededor de 0.38 con micro-variaciones
  const sine  = Math.sin(t * 0.7) * 0.045;
  const noise = (Math.random() - 0.5) * 0.004;
  // Ocasionalmente simular un flash crash que baje del threshold
  const flashCrash = Math.random() < 0.015 ? -(threshold * 0.12) : 0;
  const next = Math.max(0.28, Math.min(0.48, prev + sine * 0.03 + noise + flashCrash));
  return parseFloat(next.toFixed(6));
}

// ============================================================
// APP COMPONENT
// ============================================================

export default function App() {
  const [state, setState] = useState<AppState>({
    currentPrice: 0.3820,
    stopLossThreshold: STOP_LOSS_THRESHOLD,
    isStopLossTriggered: false,
    priceHistory: [],
    lastUpdateMs: Date.now(),
    updateCount: 0,
  });

  const dexPriceRef = useRef<number>(0.3820);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    setState((prev) => {
      const newPrice = generateMockPrice(prev.currentPrice, prev.stopLossThreshold);
      const now     = Date.now();
      const point: PriceDataPoint = {
        time: new Date(now).toLocaleTimeString("es-AR", { hour12: false }),
        price: newPrice,
        timestamp: now,
      };

      const newHistory = [...prev.priceHistory, point].slice(-HISTORY_WINDOW);
      const triggered  = newPrice <= prev.stopLossThreshold;

      return {
        ...prev,
        currentPrice: newPrice,
        isStopLossTriggered: triggered,
        priceHistory: newHistory,
        lastUpdateMs: now,
        updateCount: prev.updateCount + 1,
      };
    });

    // DEX price lags by DEX_DELAY_MS (simula fetch lento)
    setTimeout(() => {
      setState((curr) => {
        dexPriceRef.current = curr.currentPrice;
        return curr; // no trigger re-render aquí, SlippagePanel lee del ref
      });
    }, DEX_DELAY_MS);
  }, []);

  useEffect(() => {
    // Arrancar con historial inicial
    const initial: PriceDataPoint[] = Array.from({ length: 30 }, (_, i) => {
      const t = Date.now() - (30 - i) * UPDATE_INTERVAL_MS;
      return {
        time: new Date(t).toLocaleTimeString("es-AR", { hour12: false }),
        price: 0.382 + (Math.random() - 0.5) * 0.03,
        timestamp: t,
      };
    });
    setState((s) => ({ ...s, priceHistory: initial }));

    intervalRef.current = setInterval(tick, UPDATE_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tick]);

  const statusColor  = state.isStopLossTriggered ? "var(--red-danger)"  : "var(--green-safe)";
  const accentBorder = state.isStopLossTriggered ? "1px solid var(--red-danger-glow)" : "1px solid var(--border-glass)";

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      {/* ── Header ── */}
      <header
        className="glass-card"
        style={{
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: accentBorder,
          transition: "border var(--transition-base)",
        }}
      >
        {/* Logo + Título */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--pyth-orange), #f59e0b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              boxShadow: "0 0 20px var(--pyth-orange-glow)",
            }}
          >
            🛡️
          </div>
          <div>
            <h1
              className="glow-orange"
              style={{ fontSize: "1.4rem", color: "var(--pyth-orange)" }}
            >
              PythGuard
            </h1>
            <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 1 }}>
              Stop-Loss de Alta Precisión · Pyth Lazer × Cardano PreProd
            </p>
          </div>
        </div>

        {/* Status chip + latencia */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4 }}>
              Latencia del feed
            </p>
            <p
              className="mono"
              style={{ fontSize: "0.95rem", color: "var(--green-safe)", fontWeight: 700 }}
            >
              ~400ms
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4 }}>
              Updates
            </p>
            <p
              className="mono"
              style={{
                fontSize: "0.95rem",
                color: "var(--text-primary)",
                fontWeight: 700,
                animation: "number-tick 0.2s ease",
              }}
            >
              {state.updateCount.toLocaleString()}
            </p>
          </div>
          <div
            className="badge"
            style={{
              background: "var(--pyth-orange-dim)",
              color: "var(--pyth-orange)",
              border: "1px solid var(--pyth-orange-glow)",
            }}
          >
            ⚡ Pyth Lazer Live
          </div>
        </div>
      </header>

      {/* ── Precio actual + Safety Indicator ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: "20px",
        }}
      >
        {/* Precio grande */}
        <div
          className="glass-card"
          style={{ padding: "28px 32px" }}
        >
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            ADA / USD — Precio en tiempo real
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span
              className="mono"
              style={{
                fontSize: "3.5rem",
                fontWeight: 800,
                color: statusColor,
                transition: "color var(--transition-base)",
                animation: "number-tick 0.2s ease",
                lineHeight: 1,
              }}
            >
              ${state.currentPrice.toFixed(6)}
            </span>
            <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>USD</span>
          </div>

          <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
            <div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4 }}>Umbral Stop-Loss</p>
              <p className="mono" style={{ fontSize: "1.05rem", color: "var(--pyth-orange)", fontWeight: 700 }}>
                ${state.stopLossThreshold.toFixed(6)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4 }}>Diferencia</p>
              <p className="mono" style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: (state.currentPrice - state.stopLossThreshold) >= 0 ? "var(--green-safe)" : "var(--red-danger)",
              }}>
                {(state.currentPrice - state.stopLossThreshold) >= 0 ? "+" : ""}
                ${(state.currentPrice - state.stopLossThreshold).toFixed(6)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4 }}>Red</p>
              <p className="mono" style={{ fontSize: "1.05rem", color: "var(--text-primary)", fontWeight: 600 }}>
                PreProd
              </p>
            </div>
          </div>
        </div>

        {/* Safety Indicator */}
        <SafetyIndicator
          isStopLossTriggered={state.isStopLossTriggered}
          currentPrice={state.currentPrice}
          threshold={state.stopLossThreshold}
        />
      </div>

      {/* ── Price Chart + Slippage ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: "20px",
        }}
      >
        {/* Chart */}
        <PriceChart
          data={state.priceHistory}
          threshold={state.stopLossThreshold}
          isTriggered={state.isStopLossTriggered}
        />

        {/* Slippage */}
        <SlippagePanel
          pythPrice={state.currentPrice}
          dexPriceRef={dexPriceRef}
          isTriggered={state.isStopLossTriggered}
        />
      </div>

      {/* ── Footer ── */}
      <footer style={{ textAlign: "center", padding: "8px 0" }}>
        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
          PythGuard · Hackathon Pythathon 2026 · Pyth Network × Cardano PreProd
          <span style={{ margin: "0 8px", opacity: 0.4 }}>·</span>
          Policy ID:{" "}
          <span className="mono" style={{ color: "var(--text-secondary)", fontSize: "0.68rem" }}>
            d799d287...800a21e6
          </span>
        </p>
      </footer>
    </div>
  );
}
