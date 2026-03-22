import { motion, AnimatePresence } from "framer-motion";

interface SafetyIndicatorProps {
  isStopLossTriggered: boolean;
  currentPrice: number;
  threshold: number;
}

export default function SafetyIndicator({
  isStopLossTriggered,
  currentPrice,
  threshold,
}: SafetyIndicatorProps) {
  const margin = ((currentPrice - threshold) / threshold) * 100;
  const isTriggered = isStopLossTriggered;

  return (
    <div
      className="glass-card"
      style={{
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        border: isTriggered
          ? "1px solid var(--red-danger-glow)"
          : "1px solid var(--green-safe-glow)",
        transition: "border var(--transition-base)",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Estado de Seguridad
      </p>

      {/* Orbe pulsante */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Anillo exterior pulsante */}
        <motion.div
          key={isTriggered ? "triggered" : "safe"}
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: isTriggered
              ? "radial-gradient(circle, var(--red-danger-glow), transparent 70%)"
              : "radial-gradient(circle, var(--green-safe-glow), transparent 70%)",
          }}
        />
        {/* Orbe central */}
        <motion.div
          key={isTriggered ? "orb-red" : "orb-green"}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, type: "spring" }}
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: isTriggered
              ? "radial-gradient(circle at 35% 35%, #ff6b6b, var(--red-danger))"
              : "radial-gradient(circle at 35% 35%, #4ade80, var(--green-safe))",
            boxShadow: isTriggered
              ? "0 0 30px var(--red-danger-glow), inset 0 1px 0 rgba(255,255,255,0.2)"
              : "0 0 30px var(--green-safe-glow), inset 0 1px 0 rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.8rem",
          }}
        >
          {isTriggered ? "⚠️" : "✅"}
        </motion.div>
      </div>

      {/* Texto de estado principal */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isTriggered ? "triggered-text" : "safe-text"}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0,  opacity: 1 }}
          exit={{   y: -12, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <p
            style={{
              fontSize: "1.3rem",
              fontWeight: 800,
              color: isTriggered ? "var(--red-danger)" : "var(--green-safe)",
              letterSpacing: "-0.01em",
            }}
          >
            {isTriggered ? "STOP-LOSS DISPARADO" : "Protegido"}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 6 }}>
            {isTriggered
              ? "Ejecutando protección de fondos..."
              : "Fondos asegurados por PythGuard"}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Margen de seguridad */}
      <div
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 10,
          padding: "12px 16px",
        }}
      >
        <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 6 }}>
          Margen sobre umbral
        </p>

        {/* Barra de progreso */}
        <div
          style={{
            width: "100%",
            height: 6,
            borderRadius: 3,
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          <motion.div
            animate={{ width: `${Math.max(0, Math.min(100, margin * 10 + 50))}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: "100%",
              borderRadius: 3,
              background: isTriggered
                ? "var(--red-danger)"
                : `linear-gradient(to right, var(--pyth-orange), var(--green-safe))`,
            }}
          />
        </div>

        <p
          className="mono"
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: isTriggered ? "var(--red-danger)" : "var(--green-safe)",
          }}
        >
          {margin >= 0 ? "+" : ""}{margin.toFixed(2)}%
        </p>
      </div>

      {/* Tags de info */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <span className="badge" style={{
          background: "rgba(255,255,255,0.04)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-glass)",
          fontSize: "0.65rem",
        }}>
          📄 pyth_guard.ak
        </span>
        <span className="badge" style={{
          background: "rgba(255,255,255,0.04)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-glass)",
          fontSize: "0.65rem",
        }}>
          🔑 PreProd
        </span>
      </div>
    </div>
  );
}
