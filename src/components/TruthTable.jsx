import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { useCircuitStore } from '../store/circuitStore';

// Helper: 0 -> A, 25 -> Z, 26 -> AA, etc.
const indexToLetters = (i) => {
  let res = '';
  let num = i;
  while (num >= 0) {
    res = String.fromCharCode(65 + (num % 26)) + res;
    num = Math.floor(num / 26) - 1;
  }
  return res;
};

const TruthTable = () => {
  // Deteksi mobile (≤768px) dengan event resize agar responsif
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [showTable, setShowTable] = useState(false);
  const [truthTable, setTruthTable] = useState([]);
  const { components, generateTruthTable } = useCircuitStore();

  const inputComponents = components.filter(c => c.type === 'INPUT');
  // Hanya output tipe OUTPUT yang masuk tabel kebenaran
  const outputComponents = components.filter(c => c.type === 'OUTPUT');

  // Compute readable labels: prefer explicit component.label, fallback to letters
  const inputLabels = inputComponents.map((input, idx) => input.label || indexToLetters(idx));
  const outputLabels = outputComponents.map((output, idx) => output.label || indexToLetters(idx));

  const handleGenerateTable = () => {
    if (inputComponents.length === 0) {
      alert('Tambahkan minimal satu input untuk generate tabel kebenaran');
      return;
    }
    if (outputComponents.length === 0) {
      alert('Tambahkan minimal satu output untuk generate tabel kebenaran');
      return;
    }
    let table;
    try {
      table = generateTruthTable();
    } catch (err) {
      alert('Gagal generate tabel kebenaran. Coba cek rangkaian Anda.');
      return;
    }
    if (!table || !Array.isArray(table) || table.length === 0) {
      alert('Tabel kebenaran tidak dapat dihasilkan. Pastikan rangkaian valid.');
      return;
    }
    setTruthTable(table);
    setShowTable(true);
  };

  const exportToCSV = () => {
    if (truthTable.length === 0) return;

    const headers = [
      ...inputLabels.map(l => `Input_${l}`),
      ...outputLabels.map(l => `Output_${l}`)
    ];

    const csvContent = [
      headers.join(','),
      ...truthTable.map(row => {
        const values = [
          ...inputComponents.map(input => row[input.id] ? '1' : '0'),
          ...outputComponents.map(output => row[output.id] ? '1' : '0')
        ];
        return values.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'truth_table.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!showTable) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Tabel Kebenaran</h3>
        <p className="text-gray-600 mb-4">
          Generate tabel kebenaran untuk rangkaian yang telah dibuat.
        </p>
        <Button onClick={handleGenerateTable} className="w-full">
          Generate Tabel Kebenaran
        </Button>
      </div>
    );
  }

  // Mobile: sheet-style modal overlay, sidebar tetap tampil
  // Mobile: tampilkan tabel langsung di card sidebar
  if (isMobile) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Tabel Kebenaran</h3>
        <p className="text-gray-600 mb-4">
          Generate tabel kebenaran untuk rangkaian yang telah dibuat.
        </p>
        {!showTable && (
          <Button onClick={handleGenerateTable} className="w-full mb-2">
            Generate Tabel Kebenaran
          </Button>
        )}
        {showTable && (
          <>
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={exportToCSV} style={{ fontSize: 12, padding: '2px 8px' }}>
                  Export CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowTable(false)} style={{ fontSize: 12, padding: '2px 8px' }}>
                  Tutup
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-60">
              <table className="w-full border-collapse border border-gray-300 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    {inputComponents.map((input, idx) => (
                      <th key={input.id} className="border border-gray-300 px-1 py-1 font-medium">
                        Input {inputLabels[idx]}
                      </th>
                    ))}
                    {outputComponents.map((output, idx) => (
                      <th key={output.id} className="border border-gray-300 px-1 py-1 font-medium">
                        Output {outputLabels[idx]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {truthTable.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {inputComponents.map(input => (
                        <td key={input.id} className="border border-gray-300 px-1 py-1 text-center">
                          {row[input.id] ? '1' : '0'}
                        </td>
                      ))}
                      {outputComponents.map(output => (
                        <td key={output.id} className="border border-gray-300 px-1 py-1 text-center">
                          {row[output.id] ? '1' : '0'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2 text-xs text-gray-600">
                <p>Total kombinasi: {truthTable.length}</p>
                <p>Input: {inputComponents.length}, Output: {outputComponents.length}</p>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Desktop: card biasa
  return (
    <div className="p-2 bg-white rounded-lg shadow-md max-h-60 overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold">Tabel Kebenaran</h3>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={exportToCSV} style={{ fontSize: 12, padding: '2px 8px' }}>
            Export CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowTable(false)} style={{ fontSize: 12, padding: '2px 8px' }}>
            Tutup
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr className="bg-gray-100">
              {inputComponents.map((input, idx) => (
                <th key={input.id} className="border border-gray-300 px-1 py-1 font-medium">
                  Input {inputLabels[idx]}
                </th>
              ))}
              {outputComponents.map((output, idx) => (
                <th key={output.id} className="border border-gray-300 px-1 py-1 font-medium">
                  Output {outputLabels[idx]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {truthTable.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {inputComponents.map(input => (
                  <td key={input.id} className="border border-gray-300 px-1 py-1 text-center">
                    {row[input.id] ? '1' : '0'}
                  </td>
                ))}
                {outputComponents.map(output => (
                  <td key={output.id} className="border border-gray-300 px-1 py-1 text-center">
                    {row[output.id] ? '1' : '0'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-xs text-gray-600">
        <p>Total kombinasi: {truthTable.length}</p>
        <p>Input: {inputComponents.length}, Output: {outputComponents.length}</p>
      </div>
    </div>
  );
};

export default TruthTable;

