import React, { useState } from "react";
import { useCircuitStore } from "../store/circuitStore";

const Wire = ({ connection, onDelete, zoom = 1 }) => {
  const { from, fromPos, toPos } = connection;
  const { outputValues, inputValues, components, mode } = useCircuitStore();
  const [isSelected, setIsSelected] = useState(false);

  // Calculate control points for curved wire
  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Create a smooth curve
  const controlPoint1X = fromPos.x + Math.min(distance * 0.5, 100);
  const controlPoint1Y = fromPos.y;
  const controlPoint2X = toPos.x - Math.min(distance * 0.5, 100);
  const controlPoint2Y = toPos.y;

  const pathData = `M ${fromPos.x} ${fromPos.y} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toPos.x} ${toPos.y}`;

  // Get signal value
  const getSignalValue = () => {
    const fromComponent = components.find((c) => c.id === from);
    if (!fromComponent) return false;

    if (fromComponent.type === "INPUT") {
      return inputValues[from] || false;
    } else {
      return outputValues[from] || false;
    }
  };

  const signalValue = getSignalValue();
  const wireColor = signalValue ? "#22c55e" : "#6b7280"; // Green for 1, gray for 0
  // Dynamic wire width for visibility at low zoom
  const baseWidth = isSelected ? 6 : signalValue ? 3 : 2;
  // At zoom < 1, increase width so it stays visible
  const wireWidth = Math.max(baseWidth, baseWidth / zoom);

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (window.confirm("Hapus koneksi ini?")) {
      onDelete(connection.id);
    }
  };

  // For mobile devices - long press to delete
  const [longPressTimer, setLongPressTimer] = useState(null);

  const startLongPress = () => {
    if (mode !== "edit") return;

    const timer = setTimeout(() => {
      if (window.confirm("Hapus koneksi ini?")) {
        onDelete(connection.id);
      }
    }, 800); // 800ms for long press

    setLongPressTimer(timer);
    setIsSelected(true);
  };

  const cancelLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      setTimeout(() => setIsSelected(false), 300);
    }
  };

  return (
    <g>
      {/* Invisible thick line for easier clicking/touching */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        style={{ cursor: mode === "edit" ? "pointer" : "default" }}
        onContextMenu={handleContextMenu}
        onTouchStart={mode === "edit" ? startLongPress : undefined}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        onTouchCancel={cancelLongPress}
        onMouseDown={() => mode === "edit" && setIsSelected(true)}
        onMouseUp={() =>
          mode === "edit" && setTimeout(() => setIsSelected(false), 300)
        }
      />

      {/* Visible wire with signal color */}
      <path
        d={pathData}
        stroke={wireColor}
        strokeWidth={wireWidth}
        fill="none"
        className="transition-all duration-200"
        style={{ pointerEvents: "none" }}
        filter={isSelected ? "url(#glow)" : "none"}
      />

      {/* Signal value indicator - make larger for mobile */}
      {distance > 60 && (
        <text
          x={(fromPos.x + toPos.x) / 2}
          y={(fromPos.y + toPos.y) / 2 - 10}
          textAnchor="middle"
          className="text-sm font-bold pointer-events-none select-none"
          fill={signalValue ? "#22c55e" : "#6b7280"}
          style={{
            textShadow: "0 0 3px rgba(255,255,255,0.8)",
            fontSize: "14px",
          }}
        >
          {signalValue ? "1" : "0"}
        </text>
      )}

      {/* Scissors icon for cutting wire (edit mode only, at the top of the wire) */}
      {mode === "edit" && (
        <g
          style={{ cursor: "pointer" }}
          onClick={() => onDelete(connection.id)}
          tabIndex={0}
        >
          <rect
            x={fromPos.x - 12}
            y={fromPos.y - 36}
            width="24"
            height="24"
            fill="#fff"
            fillOpacity="0.8"
            rx="6"
          />
          <svg
            x={fromPos.x - 10}
            y={fromPos.y - 34}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="6" cy="6" r="2.5" stroke="#ef4444" strokeWidth="1.5" fill="#fff" />
            <circle cx="14" cy="14" r="2.5" stroke="#ef4444" strokeWidth="1.5" fill="#fff" />
            <line x1="7.5" y1="7.5" x2="12.5" y2="12.5" stroke="#ef4444" strokeWidth="1.5" />
            <line x1="12.5" y1="7.5" x2="7.5" y2="12.5" stroke="#ef4444" strokeWidth="1.5" />
          </svg>
        </g>
      )}

      {/* Connection points */}
      <circle
        cx={fromPos.x}
        cy={fromPos.y}
        r="4"
        fill="#ef4444"
        className="pointer-events-none"
      />
      <circle
        cx={toPos.x}
        cy={toPos.y}
        r="4"
        fill="#3b82f6"
        className="pointer-events-none"
      />
    </g>
  );
};

export default Wire;
