import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import AppLogo from '@/components/AppLogo.jsx';

const FlipFlopPage = () => {
  const navigate = useNavigate();
  const { type } = useParams();

  const friendly = (t) => {
    if (!t) return 'Flip‑Flop';
    return t.replace('_', ' ').replace(/FLIPFLOP/i, 'Flip‑Flop').replace(/\b\w/g, c => c.toUpperCase());
  };

  // Determine flip-flop type flags
  const t = (type || 'D').toUpperCase();
  const isD = t.includes('D');
  const isSR = t.includes('SR');
  const isJK = t.includes('JK');
  const isT = t.includes('T') && !t.includes('JK');

  // Common state
  const [currentQ, setCurrentQ] = useState(0);
  const [history, setHistory] = useState([]);

  // Type-specific inputs
  const [dInput, setDInput] = useState(0);
  const [sInput, setSInput] = useState(0);
  const [rInput, setRInput] = useState(0);
  const [jInput, setJInput] = useState(0);
  const [kInput, setKInput] = useState(0);
  const [tInput, setTInput] = useState(0);

  const step = history.length;

  const nextPrediction = useMemo(() => {
    if (isD) return String(dInput);
    if (isSR) {
      if (sInput === 1 && rInput === 1) return 'X (Forbidden)';
      if (sInput === 1) return '1';
      if (rInput === 1) return '0';
      return String(currentQ);
    }
    if (isJK) {
      if (jInput === 1 && kInput === 1) return currentQ ? '0' : '1'; // toggle
      if (jInput === 1) return '1';
      if (kInput === 1) return '0';
      return String(currentQ);
    }
    if (isT) {
      return tInput === 1 ? (currentQ ? '0' : '1') : String(currentQ);
    }
    return '-';
  }, [isD, isSR, isJK, isT, dInput, sInput, rInput, jInput, kInput, tInput, currentQ]);

  const clearHistory = () => {
    setHistory([]);
    setCurrentQ(0);
  };

  const downloadPrintable = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    // Build table header & rows depending on type
    let headerCols = '';
    if (isD) headerCols = '<th>D Input</th>';
    if (isSR) headerCols = '<th>S Input</th><th>R Input</th>';
    if (isJK) headerCols = '<th>J Input</th><th>K Input</th>';
    if (isT) headerCols = '<th>T Input</th>';

    const rows = history.map(h => {
      const inputs = isD ? `<td>${h.dInput}</td>` : isSR ? `<td>${h.sInput}</td><td>${h.rInput}</td>` : isJK ? `<td>${h.jInput}</td><td>${h.kInput}</td>` : isT ? `<td>${h.tInput}</td>` : '';
      return `<tr><td>${h.step}</td>${inputs}<td>${h.clk}</td><td>${h.prevQ}</td><td>${h.newQ}</td><td>${h.operation}</td></tr>`;
    }).join('');

    const header = `<tr><th>Step</th>${headerCols}<th>CLK</th><th>Previous Q</th><th>New Q</th><th>Operation</th></tr>`;
    w.document.write(`<!doctype html><html><head><title>Flip-Flop History</title><style>table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px}</style></head><body><h2>${friendly(type)} - Operation History</h2><table><thead>${header}</thead><tbody>${rows}</tbody></table></body></html>`);
    w.document.close();
    w.print();
  };

  const applyClockPulse = () => {
    const prevQ = currentQ;
    let newQ = prevQ;
    let operation = '';

    if (isD) {
      newQ = Number(dInput);
      operation = 'D flip‑flop: Q_next = D';
    } else if (isSR) {
      if (sInput === 1 && rInput === 1) {
        newQ = 'X';
        operation = 'Forbidden/Undefined';
      } else if (sInput === 1) {
        newQ = 1;
        operation = 'Set';
      } else if (rInput === 1) {
        newQ = 0;
        operation = 'Reset';
      } else {
        newQ = prevQ;
        operation = 'Hold/No Change';
      }
    } else if (isJK) {
      if (jInput === 0 && kInput === 0) {
        newQ = prevQ;
        operation = 'Hold/No Change';
      } else if (jInput === 0 && kInput === 1) {
        newQ = 0;
        operation = 'Reset';
      } else if (jInput === 1 && kInput === 0) {
        newQ = 1;
        operation = 'Set';
      } else if (jInput === 1 && kInput === 1) {
        newQ = prevQ ? 0 : 1;
        operation = 'Toggle';
      }
    } else if (isT) {
      if (tInput === 0) {
        newQ = prevQ;
        operation = 'Hold/No Change';
      } else {
        newQ = prevQ ? 0 : 1;
        operation = 'Toggle';
      }
    }

    const entry = {
      step,
      clk: '↑',
      prevQ,
      newQ,
      operation,
      // include inputs for printing
      dInput: isD ? Number(dInput) : undefined,
      sInput: isSR ? Number(sInput) : undefined,
      rInput: isSR ? Number(rInput) : undefined,
      jInput: isJK ? Number(jInput) : undefined,
      kInput: isJK ? Number(kInput) : undefined,
      tInput: isT ? Number(tInput) : undefined,
    };

    setHistory((h) => [...h, entry]);
    // update currentQ only if not forbidden (X)
    if (newQ !== 'X') setCurrentQ(Number(newQ));
  };

  // diagram path map: try new *_ff.jpg naming, fallback to existing names
  const basePath = '/assets/flipflop';
  const typeKey = isSR ? 'SR' : isJK ? 'JK' : isT ? 'T' : 'D';
  // Try multiple candidates in order: _ff.png -> _ff.jpg -> plain .png -> plain .jpg
  const candidate1 = `${basePath}/${typeKey}_ff.png`;
  const candidate2 = `${basePath}/${typeKey}_ff.jpg`;
  const candidate3 = `${basePath}/${typeKey}.png`;
  const candidate4 = `${basePath}/${typeKey}.jpg`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top app bar */}
      <header className="bg-[#123069] text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <AppLogo className="w-8 h-8" />
            <span className="font-semibold">Simulasi Logika</span>
          </div>
          <div />
        </div>
      </header>

      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6 mt-8">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold mt-1">Simulasi {friendly(type)}</h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>Kembali</Button>
            <Button className="bg-black text-white hover:opacity-90" onClick={() => navigate('/')}>Buka Canvas</Button>
          </div>
        </div>

        {/* Truth table */}
        <div className="mb-6 p-4 border rounded">
          <h2 className="font-semibold mb-3">Tabel Kebenaran {isSR ? 'SR' : isJK ? 'JK' : isT ? 'T' : 'D'} Flip‑Flop</h2>
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="text-left text-gray-700">
                {isSR && <><th className="w-1/6">S</th><th className="w-1/6">R</th></>}
                {isJK && <><th className="w-1/6">J</th><th className="w-1/6">K</th></>}
                {isT && <th className="w-1/6">T</th>}
                {isD && <th className="w-1/6">D (Data)</th>}
                <th className="w-1/6">CLK</th>
                <th className="w-1/6">Q (Saat ini)</th>
                <th className="w-1/6">Q+ (Selanjutnya)</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {isD && (
                <>
                    <tr><td>0</td><td>↑</td><td>X</td><td>0</td></tr>
                    <tr><td>1</td><td>↑</td><td>X</td><td>1</td></tr>
                    <tr><td>X</td><td>0</td><td>Q</td><td>Q</td></tr>
                    <tr><td>X</td><td>1</td><td>Q</td><td>Q</td></tr>
                </>
              )}
              {isSR && (
                <>
                  <tr><td>0</td><td>0</td><td>↑</td><td>0</td><td>0</td></tr>
                  <tr><td>0</td><td>0</td><td>↑</td><td>1</td><td>1</td></tr>
                  <tr><td>0</td><td>1</td><td>↑</td><td>0</td><td>0</td></tr>
                  <tr><td>0</td><td>1</td><td>↑</td><td>1</td><td>0</td></tr>
                  <tr><td>1</td><td>0</td><td>↑</td><td>0</td><td>1</td></tr>
                  <tr><td>1</td><td>0</td><td>↑</td><td>1</td><td>1</td></tr>
                  <tr className="bg-red-50"><td>1</td><td>1</td><td>↑</td><td>X</td><td>X</td></tr>
                </>
              )}
              {isJK && (
                <>
                  <tr><td>0</td><td>0</td><td>↑</td><td>0</td><td>0</td></tr>
                  <tr><td>0</td><td>0</td><td>↑</td><td>1</td><td>1</td></tr>
                  <tr><td>0</td><td>1</td><td>↑</td><td>0</td><td>0</td></tr>
                  <tr><td>0</td><td>1</td><td>↑</td><td>1</td><td>0</td></tr>
                  <tr><td>1</td><td>0</td><td>↑</td><td>0</td><td>1</td></tr>
                  <tr><td>1</td><td>0</td><td>↑</td><td>1</td><td>1</td></tr>
                  <tr><td>1</td><td>1</td><td>↑</td><td>0</td><td>1</td></tr>
                  <tr><td>1</td><td>1</td><td>↑</td><td>1</td><td>0</td></tr>
                </>
              )}
              {isT && (
                <>
                  <tr><td>0</td><td>↑</td><td>0</td><td>0</td></tr>
                  <tr><td>0</td><td>↑</td><td>1</td><td>1</td></tr>
                  <tr><td>1</td><td>↑</td><td>0</td><td>1</td></tr>
                  <tr><td>1</td><td>↑</td><td>1</td><td>0</td></tr>
                  <tr><td>X</td><td>0</td><td>0</td><td>0</td></tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Interactive generator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-3">Simulasi Interaktif {isSR ? 'SR' : isJK ? 'JK' : isT ? 'T' : 'D'} Flip‑Flop</h3>

            {/* Inputs area */}
            <div className="mb-3">
              {isD && (
                <>
                  <div className="flex items-center gap-3">
                    <label className="mr-4 flex items-center gap-2">
                      <span>D (Data)</span>
                      <span className={`w-3 h-3 rounded-full ${dInput===1 ? 'bg-green-500' : 'bg-gray-300'}`} aria-hidden="true"></span>
                    </label>
                    <div className="inline-flex items-center gap-3">
                      <button className={`px-3 py-1 rounded ${dInput===0? 'bg-gray-200':'bg-white'} border`} onClick={() => setDInput(0)}>0</button>
                      <button className={`px-3 py-1 rounded ${dInput===1? 'bg-blue-500 text-white':'bg-white'} border`} onClick={() => setDInput(1)}>1</button>
                    </div>
                  </div>
                </>
              )}

              {isSR && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="mr-3 flex items-center gap-2">
                      <span>S (Set)</span>
                      <span className={`w-3 h-3 rounded-full ${sInput===1 ? 'bg-green-500' : 'bg-gray-300'}`} aria-hidden="true"></span>
                    </label>
                    <div className="inline-flex items-center gap-2">
                      <button className={`px-3 py-1 rounded ${sInput===0? 'bg-gray-200':'bg-white'} border`} onClick={() => setSInput(0)}>0</button>
                      <button className={`px-3 py-1 rounded ${sInput===1? 'bg-blue-500 text-white':'bg-white'} border ml-2`} onClick={() => setSInput(1)}>1</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="mr-3 flex items-center gap-2">
                      <span>R (Reset)</span>
                      <span className={`w-3 h-3 rounded-full ${rInput===1 ? 'bg-blue-500' : 'bg-gray-300'}`} aria-hidden="true"></span>
                    </label>
                    <div className="inline-flex items-center gap-2">
                      <button className={`px-3 py-1 rounded ${rInput===0? 'bg-gray-200':'bg-white'} border`} onClick={() => setRInput(0)}>0</button>
                      <button className={`px-3 py-1 rounded ${rInput===1? 'bg-blue-500 text-white':'bg-white'} border ml-2`} onClick={() => setRInput(1)}>1</button>
                    </div>
                  </div>
                </div>
              )}

              {isJK && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="mr-3 flex items-center gap-2">
                      <span>J</span>
                      <span className={`w-3 h-3 rounded-full ${jInput===1 ? 'bg-green-500' : 'bg-gray-300'}`} aria-hidden="true"></span>
                    </label>
                    <div className="inline-flex items-center gap-2">
                      <button className={`px-3 py-1 rounded ${jInput===0? 'bg-gray-200':'bg-white'} border`} onClick={() => setJInput(0)}>0</button>
                      <button className={`px-3 py-1 rounded ${jInput===1? 'bg-blue-500 text-white':'bg-white'} border ml-2`} onClick={() => setJInput(1)}>1</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="mr-3 flex items-center gap-2">
                      <span>K</span>
                      <span className={`w-3 h-3 rounded-full ${kInput===1 ? 'bg-blue-500' : 'bg-gray-300'}`} aria-hidden="true"></span>
                    </label>
                    <div className="inline-flex items-center gap-2">
                      <button className={`px-3 py-1 rounded ${kInput===0? 'bg-gray-200':'bg-white'} border`} onClick={() => setKInput(0)}>0</button>
                      <button className={`px-3 py-1 rounded ${kInput===1? 'bg-blue-500 text-white':'bg-white'} border ml-2`} onClick={() => setKInput(1)}>1</button>
                    </div>
                  </div>
                </div>
              )}

              {isT && (
                <>
                  <div className="flex items-center gap-3">
                    <label className="mr-4 flex items-center gap-2">
                      <span>T</span>
                      <span className={`w-3 h-3 rounded-full ${tInput===1 ? 'bg-green-500' : 'bg-gray-300'}`} aria-hidden="true"></span>
                    </label>
                    <div className="inline-flex items-center gap-3">
                      <button className={`px-3 py-1 rounded ${tInput===0? 'bg-gray-200':'bg-white'} border`} onClick={() => setTInput(0)}>0</button>
                      <button className={`px-3 py-1 rounded ${tInput===1? 'bg-blue-500 text-white':'bg-white'} border`} onClick={() => setTInput(1)}>1</button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600">Output Q Saat Ini</div>
              <div className="mt-2 inline-flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-lg font-bold">{currentQ}</div>
              </div>
            </div>

            <div className="mb-4">
              <Button onClick={applyClockPulse}>Berikan Pulse CLK</Button>
            </div>

            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-600 mb-1">Prediksi Status Selanjutnya</div>
              <div className="text-lg font-semibold">Pada pulse clock berikutnya, Q akan menjadi: <span className="ml-2 text-blue-600">{nextPrediction}</span></div>
              <div className="text-xs text-gray-500 mt-2">{isD ? 'D: Q_next = D' : isSR ? 'SR: 00 Tahan, 01 Reset, 10 Set, 11 Terlarang' : isJK ? 'JK: 00 Tahan, 01 Reset, 10 Set, 11 Toggle' : 'T: 0 Tahan, 1 Toggle'}</div>
            </div>
          </div>

          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-3">Diagram Rangkaian</h3>
            <div className="h-44 flex items-center justify-center text-gray-400 border rounded mb-4">
              <img
                src={candidate1}
                onError={(e) => {
                  const img = e.currentTarget;
                  try {
                    const attempt = Number(img.dataset.attempt || '1');
                    if (attempt === 1) {
                      img.src = candidate2;
                      img.dataset.attempt = '2';
                    } else if (attempt === 2) {
                      img.src = candidate3;
                      img.dataset.attempt = '3';
                    } else if (attempt === 3) {
                      img.src = candidate4;
                      img.dataset.attempt = '4';
                    } else {
                      // give up
                    }
                  } catch (err) {
                    // ignore
                  }
                }}
                alt={`${typeKey} Diagram Flip‑Flop`}
                className="max-h-full object-contain"
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={downloadPrintable}>Unduh PDF</Button>
              <Button size="sm" variant="outline" onClick={clearHistory}>Hapus Riwayat</Button>
            </div>
          </div>
        </div>

        {/* Operation History */}
        <div className="mt-6 p-4 border rounded">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Riwayat Operasi</h3>
            <div className="text-sm text-gray-500">Setiap pulse clock menambah baris yang menampilkan operasi flip‑flop {isSR ? 'SR' : isJK ? 'JK' : isT ? 'T' : 'D'}</div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-700">
                <th className="w-12">Langkah</th>
                {isD && <th>Input D</th>}
                {isSR && <><th>Input S</th><th>Input R</th></>}
                {isJK && <><th>Input J</th><th>Input K</th></>}
                {isT && <th>Input T</th>}
                <th>CLK</th>
                <th>Q Sebelumnya</th>
                <th>Q Baru</th>
                <th>Operasi</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr className="text-gray-500"><td colSpan={9} className="p-4">Belum ada operasi</td></tr>
              ) : (
                history.map((h, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="py-2">{h.step}</td>
                    {isD && <td className="py-2">{h.dInput}</td>}
                    {isSR && <><td className="py-2">{h.sInput}</td><td className="py-2">{h.rInput}</td></>}
                    {isJK && <><td className="py-2">{h.jInput}</td><td className="py-2">{h.kInput}</td></>}
                    {isT && <td className="py-2">{h.tInput}</td>}
                    <td className="py-2">{h.clk}</td>
                    <td className="py-2">{h.prevQ}</td>
                    <td className="py-2">{h.newQ}</td>
                    <td className="py-2">{h.operation}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default FlipFlopPage;
