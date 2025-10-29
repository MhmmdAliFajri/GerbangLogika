import { create } from 'zustand';

// Helper to convert 0->A, 25->Z, 26->AA, etc.
const indexToLetters = (i) => {
  let res = '';
  let num = i;
  while (num >= 0) {
    res = String.fromCharCode(65 + (num % 26)) + res;
    num = Math.floor(num / 26) - 1;
  }
  return res;
};

// Generate sequential unique id for a component type (e.g. INPUT_1, INPUT_2)
const generateId = (type, components) => {
  const base = `${type}_${components.filter(c => c.type === type).length + 1}`;
  let id = base;
  let suffix = 1;
  while (components.some(c => c.id === id)) {
    id = `${base}_${suffix++}`;
  }
  return id;
};

// Store untuk mengelola state rangkaian logika
export const useCircuitStore = create((set, get) => ({
  // State untuk menyimpan semua komponen dalam rangkaian
  components: [],
  
  // State untuk menyimpan koneksi antar komponen
  connections: [],
  
  // State untuk mode aplikasi (edit, simulate)
  mode: 'edit',
  
  // State untuk komponen yang sedang dipilih
  selectedComponent: null,
  
  // State untuk input values
  inputValues: {},
  
  // State untuk output values
  outputValues: {},
  
  // State untuk connection mode
  connectionMode: false,
  
  // State untuk temporary connection saat sedang membuat koneksi
  tempConnection: null,
  
  // State untuk offset canvas (panning)
  canvasOffset: { x: 0, y: 0 },
  
  // State untuk zoom level (untuk layar kecil)
  zoom: 1,

  // Action untuk set zoom
  setZoom: (zoom) => set({ zoom }),
  // Action untuk reset zoom
  resetZoom: () => set({ zoom: 1 }),
  
  // Action untuk menambah komponen baru
  addComponent: (component) => set((state) => {
    // compute a stable, human-friendly label for INPUT/OUTPUT when not provided
    let label = component.label;
    if (!label && (component.type === 'INPUT' || component.type === 'OUTPUT')) {
      const sameTypeCount = state.components.filter(c => c.type === component.type).length;
      label = indexToLetters(sameTypeCount);
    }
    // Generate sequential id based on existing components of the same type
    const id = component.id || generateId(component.type, state.components);
    return {
      components: [...state.components, {
        ...component,
        id,
        ...(label ? { label } : {})
      }]
    };
  }),
  
  // Action untuk menghapus komponen
  removeComponent: (id) => set((state) => ({
    components: state.components.filter(comp => comp.id !== id),
    connections: state.connections.filter(conn => 
      conn.from !== id && conn.to !== id
    )
  })),
  
  // Action untuk memperbarui posisi komponen
  updateComponentPosition: (id, position) => set((state) => {
    const updatedComponents = state.components.map(comp =>
      comp.id === id ? { ...comp, position } : comp
    );
    
    // Update connection positions
    const updatedConnections = state.connections.map(conn => {
      const newConn = { ...conn };
      
      if (conn.from === id) {
        const component = updatedComponents.find(c => c.id === id);
        newConn.fromPos = getPinPosition(component, 'output', conn.fromPin);
      }
      
      if (conn.to === id) {
        const component = updatedComponents.find(c => c.id === id);
        newConn.toPos = getPinPosition(component, 'input', conn.toPin);
      }
      
      return newConn;
    });
    
    return {
      components: updatedComponents,
      connections: updatedConnections
    };
  }),
  
  // Action untuk menambah koneksi
  addConnection: (connection) => set((state) => {
    // Cek apakah koneksi sudah ada (hindari duplikat)
    const exists = state.connections.some(conn =>
      conn.from === connection.from &&
      conn.fromPin === connection.fromPin &&
      conn.to === connection.to &&
      conn.toPin === connection.toPin
    );
    if (exists) return { connections: state.connections };
    // Tambahkan id unik jika belum ada
    const connectionWithId = {
      id: connection.id || `${connection.from}_${connection.fromPin}_${connection.to}_${connection.toPin}_${Date.now()}`,
      ...connection
    };
    return {
      connections: [...state.connections, connectionWithId]
    };
  }),

  // Action untuk menghapus koneksi
  removeConnection: (connectionId) => set((state) => ({
    connections: state.connections.filter(conn => conn.id !== connectionId)
  })),
  
  // Action untuk mengubah mode
  setMode: (mode) => set({ mode }),
  
  // Action untuk memilih komponen
  selectComponent: (id) => set({ selectedComponent: id }),
  
  // Action untuk mengubah nilai input
  setInputValue: (id, value) => set((state) => ({
    inputValues: { ...state.inputValues, [id]: value }
  })),
  
  // Action untuk connection mode
  setConnectionMode: (mode) => set({ connectionMode: mode }),
  
  // Action untuk temp connection
  setTempConnection: (connection) => set({ tempConnection: connection }),
  
  // Action untuk menghitung dan memperbarui output
  calculateOutputs: () => {
    const state = get();
    const newOutputValues = {};

    // Fungsi untuk menghitung output berdasarkan type gerbang
    const calculateGateOutput = (gate, inputs) => {
      switch (gate.type) {
        case 'AND':
          return inputs.length > 0 ? inputs.every(input => input === true) : false;
        case 'OR':
          return inputs.length > 0 ? inputs.some(input => input === true) : false;
        case 'NOT':
          return inputs.length > 0 ? !inputs[0] : true;
        case 'NAND':
          return inputs.length > 0 ? !inputs.every(input => input === true) : true;
        case 'NOR':
          return inputs.length > 0 ? !inputs.some(input => input === true) : true;
        case 'XOR':
          return inputs.length === 2 ? inputs[0] !== inputs[1] : false;
        case 'XNOR':
          return inputs.length === 2 ? inputs[0] === inputs[1] : true;
        default:
          return false;
      }
    };

    // Fungsi rekursif untuk menghitung nilai komponen
    const calculateComponentValue = (componentId, visited = new Set()) => {
      if (visited.has(componentId)) return false; // Hindari infinite loop
      visited.add(componentId);

      const component = state.components.find(c => c.id === componentId);
      if (!component) return false;

      // Jika komponen adalah input, ambil nilai dari inputValues
      if (component.type === 'INPUT') {
        return state.inputValues[componentId] || false;
      }

      // Jika komponen adalah OUTPUT atau OUTPUT_LED_ICON, ambil nilai dari komponen yang terhubung ke input-nya
      if (component.type === 'OUTPUT' || component.type === 'OUTPUT_LED_ICON') {
        // Cari koneksi ke pin input 0
        const inputConn = state.connections.find(conn => conn.to === componentId && conn.toPin === 0);
        if (inputConn) {
          return calculateComponentValue(inputConn.from, new Set(visited));
        } else {
          return false;
        }
      }

      // Cari semua koneksi yang menuju ke komponen ini, diurutkan berdasarkan pin index
      const inputConnections = state.connections
        .filter(conn => conn.to === componentId)
        .sort((a, b) => a.toPin - b.toPin);

      // Buat array input values berdasarkan pin index
      const inputValues = [];
      for (let i = 0; i < component.inputs; i++) {
        const connection = inputConnections.find(conn => conn.toPin === i);
        if (connection) {
          inputValues[i] = calculateComponentValue(connection.from, new Set(visited));
        } else {
          inputValues[i] = false; // Default value untuk pin yang tidak terhubung
        }
      }

      // Hitung output berdasarkan type gerbang
      return calculateGateOutput(component, inputValues);
    };

    // Hitung nilai untuk semua komponen non-input
    state.components.forEach(component => {
      if (component.type !== 'INPUT') {
        newOutputValues[component.id] = calculateComponentValue(component.id);
      }
    });

    set({ outputValues: newOutputValues });
  },
  
  // Action untuk reset semua
  reset: () => set({
    components: [],
    connections: [],
    selectedComponent: null,
    inputValues: {},
    outputValues: {},
    connectionMode: false,
    tempConnection: null
  }),
  
  // Action untuk generate truth table
  generateTruthTable: () => {
    const state = get();
    const inputComponents = state.components.filter(c => c.type === 'INPUT');
    const outputComponents = state.components.filter(c => c.type === 'OUTPUT');
    if (inputComponents.length === 0) return [];

    const numInputs = inputComponents.length;
    const numRows = Math.pow(2, numInputs);
    const truthTable = [];

    // Pure function untuk menghitung output dari kombinasi input tertentu
    const calculateGateOutput = (gate, inputs) => {
      switch (gate.type) {
        case 'AND': return inputs.length > 0 ? inputs.every(input => input === true) : false;
        case 'OR': return inputs.length > 0 ? inputs.some(input => input === true) : false;
        case 'NOT': return inputs.length > 0 ? !inputs[0] : true;
        case 'NAND': return inputs.length > 0 ? !inputs.every(input => input === true) : true;
        case 'NOR': return inputs.length > 0 ? !inputs.some(input => input === true) : true;
        case 'XOR': return inputs.length === 2 ? inputs[0] !== inputs[1] : false;
        case 'XNOR': return inputs.length === 2 ? inputs[0] === inputs[1] : true;
        default: return false;
      }
    };

    // Pure recursive function untuk menghitung nilai komponen
    const calculateComponentValue = (componentId, inputValues, visited = new Set()) => {
      if (visited.has(componentId)) return false;
      visited.add(componentId);
      const component = state.components.find(c => c.id === componentId);
      if (!component) return false;
      if (component.type === 'INPUT') {
        return inputValues[componentId] || false;
      }
      if (component.type === 'OUTPUT' || component.type === 'OUTPUT_LED_ICON') {
        const inputConn = state.connections.find(conn => conn.to === componentId && conn.toPin === 0);
        if (inputConn) {
          return calculateComponentValue(inputConn.from, inputValues, new Set(visited));
        } else {
          return false;
        }
      }
      const inputConnections = state.connections.filter(conn => conn.to === componentId).sort((a, b) => a.toPin - b.toPin);
      const gateInputs = [];
      for (let i = 0; i < component.inputs; i++) {
        const connection = inputConnections.find(conn => conn.toPin === i);
        if (connection) {
          gateInputs[i] = calculateComponentValue(connection.from, inputValues, new Set(visited));
        } else {
          gateInputs[i] = false;
        }
      }
      return calculateGateOutput(component, gateInputs);
    };

    for (let i = 0; i < numRows; i++) {
      const row = {};
      // Set nilai input berdasarkan binary representation dari i
      inputComponents.forEach((input, index) => {
        const bitValue = (i >> (numInputs - 1 - index)) & 1;
        row[input.id] = bitValue === 1;
      });
      // Hitung output secara pure function
      outputComponents.forEach(output => {
        row[output.id] = calculateComponentValue(output.id, row);
      });
      truthTable.push(row);
    }
    return truthTable;
  },

  // Action untuk menyimpan rangkaian ke file JSON
  saveCircuit: () => {
    const state = get();
    const data = {
      components: state.components,
      connections: state.connections,
      inputValues: state.inputValues,
      outputValues: state.outputValues,
      mode: state.mode
    };
    const json = JSON.stringify(data, null, 2);

    // Download hanya dengan Data URL (base64), tanpa Blob
    try {
      const base64 = btoa(unescape(encodeURIComponent(json)));
      const a = document.createElement('a');
      a.href = 'data:application/json;base64,' + base64;
      a.download = 'circuit.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      alert('Fitur download tidak didukung di browser ini. Silakan gunakan browser desktop atau aplikasi dengan fitur ekspor.');
    }
  },
  
  // Action untuk memuat rangkaian dari file JSON
  loadCircuit: (json) => {
    let data;
    try {
      data = typeof json === 'string' ? JSON.parse(json) : json;
    } catch (e) {
      alert('File tidak valid!');
      return;
    }
    // Validasi minimal struktur
    if (!data.components || !data.connections) {
      alert('File tidak valid!');
      return;
    }
    // Ensure loaded components have labels for INPUT/OUTPUT when missing
    const normalizedComponents = (data.components || []).map((c, idx, arr) => {
      if ((c.type === 'INPUT' || c.type === 'OUTPUT') && !c.label) {
        // count previous same-type components to produce stable label
        const sameTypeCount = arr.slice(0, idx).filter(x => x.type === c.type).length;
        return { ...c, label: indexToLetters(sameTypeCount) };
      }
      return c;
    });

    set({
      components: normalizedComponents,
      connections: data.connections,
      inputValues: data.inputValues || {},
      outputValues: data.outputValues || {},
      mode: data.mode || 'edit'
    });
  },

  // Action untuk mengubah offset canvas
  setCanvasOffset: (offset) => set({ canvasOffset: offset }),
  
  // Action untuk set zoom
  setZoom: (zoom) => set({ zoom }),
}));

// Helper function untuk menghitung posisi pin
const getPinPosition = (component, type, index) => {
  const baseX = component.position.x;
  const baseY = component.position.y;

  // Mapping posisi pin flip-flop agar konsisten dengan tampilan visual
  if (
    component.type === 'SR_FLIPFLOP' ||
    component.type === 'D_FLIPFLOP' ||
    component.type === 'JK_FLIPFLOP' ||
    component.type === 'T_FLIPFLOP'
  ) {
    // Input pin
    if (type === 'input') {
      switch (component.type) {
        case 'SR_FLIPFLOP':
          return { x: baseX, y: baseY + [15, 45][index] };
        case 'JK_FLIPFLOP':
          return { x: baseX, y: baseY + [11, 30, 49][index] };
        case 'D_FLIPFLOP':
        case 'T_FLIPFLOP':
          return { x: baseX, y: baseY + [15, 45][index] };
        default:
          return { x: baseX, y: baseY + 32 };
      }
    } else {
      // Output pin
      switch (component.type) {
        case 'SR_FLIPFLOP':
          return { x: baseX + 92, y: baseY + [15, 45][index] };
        case 'JK_FLIPFLOP':
          return { x: baseX + 92, y: baseY + [11, 49][index] };
        case 'D_FLIPFLOP':
        case 'T_FLIPFLOP':
          return { x: baseX + 92, y: baseY + [15, 45][index] };
        default:
          return { x: baseX + 92, y: baseY + (index === 0 ? 24 : 56) };
      }
    }
  }
  if (type === 'output') {
    return {
      x: baseX + (component.type === 'INPUT' ? 80 : 96), // Right side
      y: baseY + (component.type === 'INPUT' ? 24 : 32)  // Center
    };
  } else {
    // Input pin
    if (component.inputs === 1) {
      return {
        x: baseX,
        y: baseY + (component.type === 'OUTPUT' ? 24 : 32)
      };
    } else {
      return {
        x: baseX,
        y: baseY + 20 + (index * 24)
      };
    }
  }
};

