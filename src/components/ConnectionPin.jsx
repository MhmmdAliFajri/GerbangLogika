import React, { useState } from "react";
import { useCircuitStore } from "../store/circuitStore";

const ConnectionPin = ({
  componentId,
  pinType, // 'input' or 'output'
  pinIndex = 0,
  position,
  isConnected = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const {
    addConnection,
    connections,
    components,
    mode,
    connectionMode,
    setConnectionMode,
    tempConnection,
    setTempConnection,
  } = useCircuitStore();

  const handleMouseDown = (e) => {
    if (mode !== "edit") return;

    e.stopPropagation();

    if (pinType === "output") {
      // Start creating a connection from output pin
      const component = components.find((c) => c.id === componentId);
      const pinPosition = getPinPosition(component, pinType, pinIndex);

      setConnectionMode(true);
      setTempConnection({
        from: componentId,
        fromPin: pinIndex,
        fromPos: pinPosition,
        toPos: { x: e.clientX, y: e.clientY },
      });
    }
  };

  const handleTouchStart = (e) => {
    if (mode !== "edit") return;

    e.stopPropagation();

    if (pinType === "output") {
      // Start creating a connection from output pin
      const component = components.find((c) => c.id === componentId);
      const pinPosition = getPinPosition(component, pinType, pinIndex);
      const touch = e.touches[0];

      setConnectionMode(true);
      setTempConnection({
        from: componentId,
        fromPin: pinIndex,
        fromPos: pinPosition,
        toPos: { x: touch.clientX, y: touch.clientY },
      });
    }

    // Prevent default to avoid scrolling behavior while connecting
    e.preventDefault();
  };

  const handleMouseUp = (e) => {
    if (mode !== "edit" || !connectionMode || !tempConnection) return;

    e.stopPropagation();

    if (pinType === "input" && tempConnection.from !== componentId) {
      // Complete the connection to input pin
      const component = components.find((c) => c.id === componentId);
      const pinPosition = getPinPosition(component, pinType, pinIndex);

      // Check if this input is already connected
      const existingConnection = connections.find(
        (conn) => conn.to === componentId && conn.toPin === pinIndex
      );

      if (!existingConnection) {
        const newConnection = {
          id: `conn_${Date.now()}`,
          from: tempConnection.from,
          to: componentId,
          fromPin: tempConnection.fromPin,
          toPin: pinIndex,
          fromPos: tempConnection.fromPos,
          toPos: pinPosition,
        };

        addConnection(newConnection);
      }

      setConnectionMode(false);
      setTempConnection(null);
    }
  };

  const handleTouchEnd = (e) => {
    if (mode !== "edit" || !connectionMode || !tempConnection) return;

    e.stopPropagation();

    if (pinType === "input" && tempConnection.from !== componentId) {
      // Complete the connection to input pin
      const component = components.find((c) => c.id === componentId);
      const pinPosition = getPinPosition(component, pinType, pinIndex);

      // Check if this input is already connected
      const existingConnection = connections.find(
        (conn) => conn.to === componentId && conn.toPin === pinIndex
      );

      if (!existingConnection) {
        const newConnection = {
          id: `conn_${Date.now()}`,
          from: tempConnection.from,
          to: componentId,
          fromPin: tempConnection.fromPin,
          toPin: pinIndex,
          fromPos: tempConnection.fromPos,
          toPos: pinPosition,
        };

        addConnection(newConnection);
      }

      setConnectionMode(false);
      setTempConnection(null);
    }

    // Prevent default to avoid unwanted interactions
    e.preventDefault();
  };

  const getPinPosition = (component, type, index) => {
    const baseX = component.position.x;
    const baseY = component.position.y;

    // Mapping posisi pin flip-flop agar konsisten dengan visual
    if (
      component.type === "SR_FLIPFLOP" ||
      component.type === "D_FLIPFLOP" ||
      component.type === "JK_FLIPFLOP" ||
      component.type === "T_FLIPFLOP"
    ) {
      if (type === "input") {
        switch (component.type) {
          case "SR_FLIPFLOP":
            return { x: baseX, y: baseY + [15, 45][index] };
          case "JK_FLIPFLOP":
            return { x: baseX, y: baseY + [11, 30, 49][index] };
          case "D_FLIPFLOP":
          case "T_FLIPFLOP":
            return { x: baseX, y: baseY + [15, 45][index] };
          default:
            return { x: baseX, y: baseY + 32 };
        }
      } else {
        // output
        switch (component.type) {
          case "SR_FLIPFLOP":
            return { x: baseX + 92, y: baseY + [15, 45][index] };
          case "JK_FLIPFLOP":
            return { x: baseX + 92, y: baseY + [11, 49][index] };
          case "D_FLIPFLOP":
          case "T_FLIPFLOP":
            return { x: baseX + 92, y: baseY + [15, 45][index] };
          default:
            return { x: baseX + 92, y: baseY + (index === 0 ? 24 : 56) };
        }
      }
    }

    if (type === "output") {
      return {
        x: baseX + (component.type === "INPUT" ? 80 : 96), // Right side
        y: baseY + (component.type === "INPUT" ? 24 : 32), // Center
      };
    } else {
      // Input pin
      if (component.inputs === 1) {
        return {
          x: baseX,
          y: baseY + (component.type === "OUTPUT" ? 24 : 32),
        };
      } else {
        return {
          x: baseX,
          y: baseY + 20 + index * 24,
        };
      }
    }
  };

  const pinColor = pinType === "output" ? "#ef4444" : "#3b82f6";
  const hoverColor = pinType === "output" ? "#dc2626" : "#2563eb";

  return (
    <div
      className={`absolute w-5 h-5 rounded-full border-2 border-white shadow-sm cursor-pointer transition-all duration-200 ${
        isHovered ? "scale-125" : ""
      } ${isConnected ? "ring-2 ring-yellow-400" : ""}`}
      style={{
        backgroundColor: isHovered ? hoverColor : pinColor,
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
        zIndex: 10,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Gunting untuk memutus sambungan jika sudah terhubung */}
      {isConnected && mode === "edit" && (
        <div
          style={{
            position: "absolute",
            top: -28,
            left: "50%",
            transform: "translateX(-50%)",
            cursor: "pointer",
            zIndex: 20,
            background: "#fff",
            borderRadius: 6,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            padding: 2,
          }}
          title="Putus sambungan"
          onClick={(e) => {
            e.stopPropagation();
            // Cari koneksi yang terkait dengan pin ini
            const conn =
              pinType === "output"
                ? connections.find(
                    (c) => c.from === componentId && c.fromPin === pinIndex
                  )
                : connections.find(
                    (c) => c.to === componentId && c.toPin === pinIndex
                  );
            if (conn) {
              if (window.confirm("Putus sambungan pin ini?")) {
                // Hapus koneksi
                useCircuitStore.getState().removeConnection(conn.id);
              }
            }
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="6"
              cy="6"
              r="2.5"
              stroke="#ef4444"
              strokeWidth="1.5"
              fill="#fff"
            />
            <circle
              cx="14"
              cy="14"
              r="2.5"
              stroke="#ef4444"
              strokeWidth="1.5"
              fill="#fff"
            />
            <line
              x1="7.5"
              y1="7.5"
              x2="12.5"
              y2="12.5"
              stroke="#ef4444"
              strokeWidth="1.5"
            />
            <line
              x1="12.5"
              y1="7.5"
              x2="7.5"
              y2="12.5"
              stroke="#ef4444"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ConnectionPin;

