import { useEffect, useRef, useState, MutableRefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SlippagePanelProps {
  pythPrice: number;
  dexPriceRef: MutableRefObject<number>;
  isTriggered: boolean;
}

// ────────────────────────────────────────────────────────
// El panel compara:
//   Pyth Lazer  → precio actual (400ms de latencia)
//   DEX ficticio → precio con 2 segundos de delay
//
// Slippage ahorrado = |dexPrice - pythPrice| por unidad
// En dólares: asumimos una venta de 10,000 ADA
// ────────────────────────────────────────────────────────

const SIMULATED_ADA_AMOUNT = 10_000;
const DEX_REFRESH_INTERVAL = 2000; // ms — delay del DEX

export default function SlippagePanel({
  pythPrice,
  dexPriceRef,
  isTriggered,
}: SlippagePanelProps) {
  const [dexDisplayPrice, setDexDisplayPrice] = useState(pythPrice);
  const [slippageSaved, setSlippageSaved]     = useState(0);
  const [totalSaved, setTotalSaved]           = useState(0);
  const totalSavedRef = useRef(0);

  // El DEX price se actualiza cada 2 segundos (delay simulado)
  useEffect(() => {
    const id = setInterval(() => {
      const dex = dexPriceRef.current || pythPrice;
      setDexDisplayPrice(dex);
      const diff = Math.abs(pythPrice - dex) * SIMULATED_ADA_AMOUNT;
      setSlippageSaved(diff);
      if (isTriggered && diff > 0) {
        totalSavedRef.current += diff * 0.1; // acumula un 10% en cada evento
        setTotalSaved(totalSavedRef.current);
      }
    }, DEX_REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [pythPrice, dexPriceRef, isTriggered]);

  const priceDiff     = dexDisplayPrice - pythPrice;
  const pythIsLower   = pythPrice <= dexDisplayPrice;
  const slippagePct   = dexDisplayPrice > 0
    ? ((Math.abs(priceDiff) / dexDisplayPrice) * 100).toFixed(3)
    : "0.000";

  return (
    <div
      className="glass-card"
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header */}
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>
          Slippage Prevention
        </h2>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 3 }}>
          Pyth Lazer vs. DEX on-chain · {SIMULATED_ADA_AMOUNT.toLocaleString()} ADA
        </p>
      </div>

      <div style={{ height: 1, background: "var(--border-glass)" }} />

      {/* Comparación de precios */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* Pyth Lazer */}
        <div
          style={{
            background: "var(--pyth-orange-dim)",
            border: "1px solid var(--border-orange)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p style={{ fontSize: "0.68rem", color: "var(--pyth-orange)", marginBottom: 3, fontWeight: 600 }}>
              ⚡ Pyth Lazer
            </p>
            <p style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>~400ms latencia</p>
          </div>
          <p
            className="mono"
            style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--pyth-orange)" }}
          >
            ${pythPrice.toFixed(6)}
          </p>
        </div>

        {/* DEX ficticio */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border-glass)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginBottom: 3, fontWeight: 600 }}>
              🔀 DEX On-chain
            </p>
            <p style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>~2000ms latencia</p>
          </div>
          <p
            className="mono"
            style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-secondary)" }}
          >
            ${dexDisplayPrice.toFixed(6)}
          </p>
        </div>
      </div>

      {/* Diferencia */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: "var(--radius-md)",
          padding: "14px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 3 }}>
            Diferencia de precio
          </p>
          <p style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
            {pythIsLower ? "Pyth más preciso ✓" : "Precios igualados"}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p
            className="mono"
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: pythIsLower ? "var(--green-safe)" : "var(--text-secondary)",
            }}
          >
            {pythIsLower ? "-" : "+"}${Math.abs(priceDiff).toFixed(6)}
          </p>
          <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 2 }}>
            {slippagePct}% slippage
          </p>
        </div>
      </div>

      {/* Ahorro en USD */}
      <div
        style={{
          background: isTriggered ? "var(--green-safe-dim)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${isTriggered ? "var(--green-safe-glow)" : "var(--border-glass)"}`,
          borderRadius: "var(--radius-md)",
          padding: "14px 16px",
          transition: "all var(--transition-base)",
        }}
      >
        <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 8 }}>
          💰 Ahorro potencial por Flash Crash ({SIMULATED_ADA_AMOUNT.toLocaleString()} ADA)
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={slippageSaved.toFixed(4)}
            initial={{ opacity: 0.4, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mono"
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: isTriggered ? "var(--green-safe)" : "var(--text-primary)",
            }}
          >
            ${slippageSaved.toFixed(2)}
          </motion.p>
        </AnimatePresence>
        <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 4 }}>
          vs. esperar confirmación del DEX
        </p>
      </div>

      {/* Acumulado de sesión */}
      {totalSaved > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: "var(--green-safe-dim)",
            border: "1px solid var(--green-safe-glow)",
            borderRadius: "var(--radius-md)",
            padding: "10px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: "0.68rem", color: "var(--green-safe)" }}>
            🏦 Total ahorrado esta sesión
          </p>
          <p className="mono" style={{ fontSize: "1rem", fontWeight: 800, color: "var(--green-safe)" }}>
            ${totalSaved.toFixed(2)}
          </p>
        </motion.div>
      )}
    </div>
  );
}
