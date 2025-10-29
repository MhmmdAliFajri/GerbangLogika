import React, { useEffect } from "react";
import { Button } from "@/components/ui/button.jsx";
import { useCircuitStore } from "./store/circuitStore";
import DraggableComponent from "./components/DraggableComponent";
import LogicComponent from "./components/LogicComponent";
import Wire from "./components/Wire";
import TruthTable from "./components/TruthTable";
import AppLogo from "./components/AppLogo";
import LampuIcon from "./components/LampuIcon";
import "./App.css";

function App() {
  const {
    components,
    connections,
    mode,
    setMode,
    addComponent,
    reset,
    inputValues,
    setInputValue,
    calculateOutputs,
    connectionMode,
    tempConnection,
    setConnectionMode,
    setTempConnection,
    removeConnection,
  } = useCircuitStore();

  // Handle mouse move for temporary connection
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (connectionMode && tempConnection) {
        const canvasRect = document
          .querySelector(".canvas-area")
          .getBoundingClientRect();
        setTempConnection({
          ...tempConnection,
          toPos: {
            x: e.clientX - canvasRect.left,
            y: e.clientY - canvasRect.top,
          },
        });
      }
    };

    const handleTouchMove = (e) => {
      if (connectionMode && tempConnection && e.touches.length === 1) {
        const touch = e.touches[0];
        const canvasRect = document
          .querySelector(".canvas-area")
          .getBoundingClientRect();
        setTempConnection({
          ...tempConnection,
          toPos: {
            x: touch.clientX - canvasRect.left,
            y: touch.clientY - canvasRect.top,
          },
        });
        e.preventDefault(); // Prevent scrolling while connecting wires
      }
    };

    const handleMouseUp = () => {
      if (connectionMode) {
        setConnectionMode(false);
        setTempConnection(null);
      }
    };

    const handleTouchEnd = () => {
      if (connectionMode) {
        setConnectionMode(false);
        setTempConnection(null);
      }
    };

    if (connectionMode) {
      // Mouse events
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // Touch events
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
      document.addEventListener("touchcancel", handleTouchEnd);
    }

    return () => {
      // Clean up mouse events
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      // Clean up touch events
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [connectionMode, tempConnection, setConnectionMode, setTempConnection]);

  // Fungsi untuk menambah gerbang logika
  const addGate = (type) => {
    const newComponent = {
      type,
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      inputs: type === "NOT" ? 1 : 2,
      outputs: 1,
    };
    addComponent(newComponent);
  };

  // Fungsi untuk menambah input/output
  const addInputOutput = (type) => {
    const newComponent = {
      type,
      position: {
        x: type === "INPUT" ? 50 : 400,
        y: 100 + Math.random() * 200,
      },
      inputs: type === "INPUT" ? 0 : 1,
      outputs: type === "INPUT" ? 1 : 0,
    };
    addComponent(newComponent);
  };

  // Fungsi untuk toggle input value
  const toggleInput = (id, currentValue) => {
    setInputValue(id, !currentValue);
    // Recalculate outputs setelah input berubah
    setTimeout(() => calculateOutputs(), 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div
        className="header-gradient shadow-lg p-4"
        style={{ background: "#1B296D" }}
      >
        <div className="flex md:p-0 p-2 md:flex-row flex-col justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center overflow-hidden">
              <AppLogo size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Simulasi Rangkaian Logika
            </h1>
          </div>
          <div className="flex mt-4 md:mt-0 md:flex-row flex-col md:w-auto w-full gap-3">
            <Button
              onClick={() => setMode("edit")}
              className={`transition-all duration-200 font-semibold px-6 py-2 rounded-lg border-2 flex items-center gap-2 text-base shadow-md
                ${
                  mode === "edit"
                    ? "bg-white border-purple-500 text-purple-700 shadow-purple-200"
                    : "bg-white/80 border-purple-300 text-purple-400 hover:bg-white"
                }
              `}
            >
              <span className="text-lg">🔧</span> Edit Mode
            </Button>
            <Button
              onClick={() => {
                setMode("simulate");
                calculateOutputs();
              }}
              className={`transition-all duration-200 font-semibold px-6 py-2 rounded-lg border-2 flex items-center gap-2 text-base shadow-md
                ${
                  mode === "simulate"
                    ? "bg-purple-500 border-purple-700 text-black shadow-purple-200"
                    : "bg-purple-200 border-purple-300 text-black hover:bg-purple-300"
                }
              `}
            >
              <span className="text-lg">⚡</span> Simulate Mode
            </Button>
            <Button
              variant="destructive"
              onClick={reset}
              className="bg-red-500 hover:bg-red-600 text-white border-0"
            >
              🗑️ Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar - Toolbox */}
        <div className="w-full lg:w-80 bg-white/95 backdrop-blur-sm shadow-xl p-6 min-h-screen overflow-y-auto border-r border-gray-200">
          <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
            <span className="mr-2">🧩</span>
            Komponen
          </h2>

          {/* Input/Output */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
              <span className="mr-2">🔌</span>
              Input/Output
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {/* Input Switch */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => addInputOutput("INPUT")}
                disabled={mode === "simulate"}
                className="gate-button justify-start h-12 text-left bg-green-50 border-green-200 hover:bg-green-100 text-green-800 flex items-center gap-3 shadow-none rounded-xl"
              >
                <span className="inline-block w-5 h-5 rounded-full bg-green-600 border-2 border-green-700 mr-2"></span>
                Input Switch
              </Button>
              {/* Output Angka */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => addInputOutput("OUTPUT")}
                disabled={mode === "simulate"}
                className="gate-button justify-start h-12 text-left bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800 flex items-center gap-3 shadow-none rounded-xl"
              >
                <span className="inline-block w-5 h-5 rounded-full bg-blue-600 border-2 border-blue-700 mr-2"></span>
                Output Angka
              </Button>
              {/* Output Lampu */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => addInputOutput("OUTPUT_LED_ICON")}
                disabled={mode === "simulate"}
                className="gate-button justify-start h-12 text-left bg-red-50 border-red-200 hover:bg-red-100 text-red-800 flex items-center gap-3 shadow-none rounded-xl"
              >
                <span className="inline-block w-5 h-5 mr-2">
                  <img
                    src="/assets/L2.jpg"
                    alt="Lampu Nyala"
                    className="w-5 h-5 object-contain"
                  />
                </span>
                Output Lampu
              </Button>
            </div>
          </div>

          {/* Logic Gates */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
              <span className="mr-2">⚙️</span>
              Gerbang Logika
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: "AND", color: "blue", image: "/assets/gates/AND.jpg" },
                { type: "OR", color: "purple", image: "/assets/gates/OR.jpg" },
                {
                  type: "NOT",
                  color: "orange",
                  image: "/assets/gates/NOT.jpg",
                },
                {
                  type: "NAND",
                  color: "teal",
                  image: "/assets/gates/NAND.jpg",
                },
                { type: "NOR", color: "pink", image: "/assets/gates/NOR.jpg" },
                {
                  type: "XOR",
                  color: "indigo",
                  image: "/assets/gates/XOR.jpg",
                },
                {
                  type: "XNOR",
                  color: "emerald",
                  image: "/assets/gates/XNOR.jpg",
                },
              ].map(({ type, color, image }) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  onClick={() => addGate(type)}
                  disabled={mode === "simulate"}
                  className={`gate-button h-12 bg-gradient-to-r from-${color}-50 to-${color}-100 border-${color}-200 hover:from-${color}-100 hover:to-${color}-200 text-${color}-800 font-semibold`}
                >
                  <img
                    src={image}
                    alt={type}
                    className="w-6 h-6 object-contain mr-2"
                  />
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Input Controls (hanya tampil di simulate mode) */}
          {mode === "simulate" && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
                <span className="mr-2">🎛️</span>
                Input Controls
              </h3>
              <div className="space-y-3">
                {components
                  .filter((c) => c.type === "INPUT")
                  .map((input) => (
                    <div
                      key={input.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {input.id}
                      </span>
                      <Button
                        size="sm"
                        variant={inputValues[input.id] ? "default" : "outline"}
                        onClick={() =>
                          toggleInput(input.id, inputValues[input.id])
                        }
                        className={`transition-all duration-200 ${
                          inputValues[input.id]
                            ? "bg-green-500 hover:bg-green-600 glow"
                            : ""
                        }`}
                      >
                        {inputValues[input.id] ? "1" : "0"}
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Truth Table */}
          <div className="mb-8">
            <TruthTable />
          </div>

          {/* Instructions */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
              <span className="mr-2">💡</span>
              Instruksi:
            </h4>
            <ul className="text-xs text-blue-700 space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Drag komponen untuk memindahkan
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Klik kanan untuk menghapus
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Tekan Delete untuk menghapus yang dipilih
              </li>
              {mode === "edit" && (
                <>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Drag dari output pin ke input pin untuk koneksi
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Klik kanan pada wire untuk menghapus koneksi
                  </li>
                </>
              )}
              {mode === "simulate" && (
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Klik input untuk toggle nilai
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen canvas-area">
          <div className="absolute inset-0 overflow-hidden">
            {/* Enhanced Grid background */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.3) 1px, transparent 0),
                  linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px, 20px 20px, 20px 20px",
              }}
            />

            {/* SVG for wires */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 1 }}
            >
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Render existing connections */}
              {connections.map((connection) => (
                <Wire
                  key={connection.id}
                  connection={connection}
                  onDelete={removeConnection}
                />
              ))}

              {/* Render temporary connection */}
              {tempConnection && (
                <path
                  d={`M ${tempConnection.fromPos.x} ${tempConnection.fromPos.y} L ${tempConnection.toPos.x} ${tempConnection.toPos.y}`}
                  stroke="#6b7280"
                  strokeWidth="3"
                  strokeDasharray="8,4"
                  fill="none"
                  filter="url(#glow)"
                  className="animate-pulse"
                />
              )}
            </svg>

            {/* Render components */}
            {components.map((component) => (
              <DraggableComponent key={component.id} component={component}>
                <LogicComponent component={component} />
              </DraggableComponent>
            ))}

            {/* Enhanced instructions overlay when no components */}
            {components.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 float">
                  <div className="text-6xl mb-4">🚀</div>
                  <h3 className="text-2xl font-semibold mb-3 text-gray-700">
                    Canvas Kosong
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Tambahkan komponen dari sidebar untuk memulai
                  </p>
                  <div className="text-sm text-gray-500">
                    Mulai dengan menambahkan Input Switch dan Output LED
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
