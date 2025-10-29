import React from 'react';
import { useCircuitStore } from '../store/circuitStore';
import ConnectionPin from './ConnectionPin';

const gateImages = {
  AND: '/assets/gates/AND.jpg',
  OR: '/assets/gates/OR.jpg',
  NOT: '/assets/gates/NOT.jpg',
  NAND: '/assets/gates/NAND.jpg',
  NOR: '/assets/gates/NOR.jpg',
  XOR: '/assets/gates/XOR.jpg',
  XNOR: '/assets/gates/XNOR.jpg',
};

const flipflopImages = {
  SR_FLIPFLOP: '/assets/flipflop/SR.jpg',
  D_FLIPFLOP: '/assets/flipflop/D.jpg',
  JK_FLIPFLOP: '/assets/flipflop/JK.jpg',
  T_FLIPFLOP: '/assets/flipflop/T.jpg',
};

const LogicComponent = ({ component }) => {
  const { inputValues, outputValues, setInputValue, calculateOutputs, mode, connections } = useCircuitStore();

  const handleInputClick = () => {
    if (component.type === 'INPUT' && mode === 'simulate') {
      const currentValue = inputValues[component.id] || false;
      setInputValue(component.id, !currentValue);
      setTimeout(() => calculateOutputs(), 0);
    }
  };

  const getComponentStyle = () => {
    const baseStyle = "border-2 rounded-lg p-2 flex items-center justify-center font-bold text-sm transition-all duration-200 relative";
    
    switch (component.type) {
      case 'INPUT':
        const inputValue = inputValues[component.id] || false;
        return `${baseStyle} w-20 h-12 cursor-pointer ${
          mode === 'simulate' 
            ? (inputValue 
                ? 'bg-green-100 border-green-500 text-green-800 shadow-green-200' 
                : 'bg-gray-100 border-gray-400 text-gray-600')
            : 'bg-blue-50 border-blue-300 text-blue-600'
        } ${mode === 'simulate' ? 'hover:scale-105' : ''}`;
        
      case 'OUTPUT':
        const outputValue = outputValues[component.id] || false;
        return `${baseStyle} w-20 h-12 ${
          mode === 'simulate'
            ? (outputValue 
                ? 'bg-red-100 border-red-500 text-red-800 shadow-red-200' 
                : 'bg-gray-100 border-gray-400 text-gray-600')
            : 'bg-pink-50 border-pink-300 text-pink-600'
        }`;

      case 'OUTPUT_LED_ICON':
        const ledValue = outputValues[component.id] || false;
        return `${baseStyle} w-20 h-16 ${
          mode === 'simulate'
            ? (ledValue 
                ? 'bg-yellow-50 border-yellow-400 shadow-yellow-100' 
                : 'bg-gray-100 border-gray-400')
            : 'bg-yellow-50 border-yellow-300 text-yellow-600'
        }`;
        
      default:
        return `${baseStyle} w-24 h-16 ${
          mode === 'simulate'
            ? 'bg-blue-50 border-blue-400 text-blue-800 hover:bg-blue-100'
            : 'bg-indigo-50 border-indigo-300 text-indigo-600'
        }`;
    }
  };

  const getDisplayValue = () => {
    if (component.type === 'INPUT') {
      return inputValues[component.id] ? '1' : '0';
    } else if (component.type === 'OUTPUT') {
      return outputValues[component.id] ? '1' : '0';
    } else if (component.type === 'OUTPUT_LED_ICON') {
      // Output LED dengan gambar lampu (L1/L2) ekstensi .jpg
      const outVal = outputValues[component.id];
      const ledOn = outVal === 1 || outVal === true || outVal === '1' || outVal === 'true';
      return (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <img
            src={ledOn ? '/assets/L2.jpg' : '/assets/L1.jpg'}
            alt={ledOn ? 'Lampu Nyala' : 'Lampu Mati'}
            className="w-12 h-12 object-contain mx-auto"
            draggable="false"
            onError={e => { e.target.onerror = null; e.target.src = ledOn ? '/L2.jpg' : '/L1.jpg'; }}
          />
        </div>
      );
    } else if (gateImages[component.type]) {
      return (
        <img
          src={gateImages[component.type]}
          alt={component.type}
          className="w-12 h-12 object-contain mx-auto"
        />
      );
    } else if (flipflopImages[component.type]) {
      // Perbesar gambar khusus SR Flip-Flop
      const isSR = component.type === 'SR_FLIPFLOP';
      return (
        <img
          src={flipflopImages[component.type]}
          alt={component.type}
          className={isSR ? "w-24 h-24 object-contain mx-auto" : "w-16 h-16 object-contain mx-auto"}
        />
      );
    } else {
      return component.type;
    }
  };

  const getPinPosition = (type, index = 0) => {
    // Penyesuaian posisi pin agar tepat di lingkaran hitam pada gambar
    if (flipflopImages[component.type]) {
      // Flip-Flop: mapping pin sesuai gambar
      if (type === 'input') {
        switch (component.type) {
          case 'SR_FLIPFLOP':
            // 2 input: atas, bawah (centered, spaced)
            return { x: 0, y: [15, 45][index] };
          case 'JK_FLIPFLOP':
            return { x: 0, y: [11, 30, 49][index] };
          case 'D_FLIPFLOP':
          case 'T_FLIPFLOP':
            return { x: 0, y: [15, 45][index] };
          default:
            return { x: 0, y: 32 };
        }
      } else {
        // output SR Flip-Flop: kanan, center, berjarak
        switch (component.type) {
          case 'SR_FLIPFLOP':
            return { x: 92, y: [15, 45][index] };
          case 'JK_FLIPFLOP':
            return { x: 92, y: [11, 49][index] };
          case 'D_FLIPFLOP':
          case 'T_FLIPFLOP':
            return { x: 92, y: [15, 45][index] };
          default:
            return { x: 92, y: index === 0 ? 24 : 56 };
        }
      }
    }
    // Penyesuaian posisi pin agar tepat di lingkaran hitam pada gambar
    if (type === 'output') {
      switch (component.type) {
        case 'INPUT':
          return { x: 80, y: 24 };
        case 'OUTPUT':
          return { x: 80, y: 24 };
        case 'NOT':
          return { x: 92, y: 32 };
        // Untuk gerbang 2-input (AND, OR, NAND, NOR, XOR, XNOR)
        default:
          return { x: 92, y: 32 };
      }
    } else {
      // Input pin
      switch (component.type) {
        case 'OUTPUT':
          return { x: 0, y: 24 };
        case 'NOT':
          return { x: 0, y: 32 };
        // Untuk gerbang 2-input (AND, OR, NAND, NOR, XOR, XNOR)
        default:
          if (component.inputs === 2) {
            // Titik input atas dan bawah, sesuaikan dengan gambar
            return { x: 0, y: index === 0 ? 16 : 48 };
          } else if (component.inputs === 1) {
            return { x: 0, y: 32 };
          } else if (flipflopImages[component.type]) {
            // Flip-Flop: input S/R/CLK, D/CLK, JK/CLK, T/CLK, output Q/Q̅
            if (type === 'input') {
              // 3 input: S, R, CLK (atau D, CLK, dsb)
              const y = [16, 32, 48][index] || 32;
              return { x: 0, y };
            } 
          } else {
            // fallback
            return { x: 0, y: 32 };
          }
      }
    }
  };

  const isConnected = (type, index = 0) => {
    if (type === 'output') {
      return connections.some(conn => conn.from === component.id && conn.fromPin === index);
    } else {
      return connections.some(conn => conn.to === component.id && conn.toPin === index);
    }
  };

  const renderPins = () => {
    const pins = [];
    if (flipflopImages[component.type]) {
      // Penyesuaian jumlah input SR agar hanya 2
      let inputCount = component.inputs;
      if (component.type === 'SR_FLIPFLOP') inputCount = 2;
      // Input pins
      for (let i = 0; i < inputCount; i++) {
        const position = getPinPosition('input', i);
        pins.push(
          <ConnectionPin
            key={`input-${i}`}
            componentId={component.id}
            pinType="input"
            pinIndex={i}
            position={position}
            isConnected={isConnected('input', i)}
          />
        );
      }
      // Output pins (2)
      for (let i = 0; i < component.outputs; i++) {
        const position = getPinPosition('output', i);
        pins.push(
          <ConnectionPin
            key={`output-${i}`}
            componentId={component.id}
            pinType="output"
            pinIndex={i}
            position={position}
            isConnected={isConnected('output', i)}
          />
        );
      }
      return pins;
    }
    // Input pins
    if (component.inputs > 0) {
      for (let i = 0; i < component.inputs; i++) {
        const position = getPinPosition('input', i);
        pins.push(
          <ConnectionPin
            key={`input-${i}`}
            componentId={component.id}
            pinType="input"
            pinIndex={i}
            position={position}
            isConnected={isConnected('input', i)}
          />
        );
      }
    }
    // Output pins
    if (component.outputs > 0) {
      const position = getPinPosition('output', 0);
      pins.push(
        <ConnectionPin
          key="output-0"
          componentId={component.id}
          pinType="output"
          pinIndex={0}
          position={position}
          isConnected={isConnected('output', 0)}
        />
      );
    }
    return pins;
  };

  return (
    <div 
      className={getComponentStyle()}
      onClick={handleInputClick}
    >
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
        {getDisplayValue()}
      </div>
      {/* Connection pins */}
      {mode === 'edit' && renderPins()}
      {/* Label tipe gerbang/flipflop di bawah komponen */}
      {(['AND','OR','NOT','NAND','NOR','XOR','XNOR','SR_FLIPFLOP','D_FLIPFLOP','JK_FLIPFLOP','T_FLIPFLOP'].includes(component.type)) && (
        <div className="absolute left-1/2 -bottom-5 -translate-x-1/2 text-xs font-bold text-blue-700 select-none pointer-events-none">
          {component.type.replace('_FLIPFLOP','')}
        </div>
      )}
    </div>
  );
};

export default LogicComponent;

