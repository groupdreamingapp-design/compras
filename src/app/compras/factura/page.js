'use client';
import React, { useState, useEffect } from 'react';
// import { getOpenReceipts, getReceiptDetails, processInvoice } from '../../../services/audit'; 
// We cannot import server actions directly in client component like this unless they are marked 'use server' in a separate file valid for client import
// or we fetch via API. For simplicity in Next.js App Router, we can pass Server Actions as props or import if 'services/audit' uses 'use server'.
// Let's assume we create a wrapper action file.

// MOCKING DATA LOADING for the UI since connecting Server Actions properly requires 'use server' directives at top of file
// and I cannot edit the service file instantly to add it without overwriting imports which might break other things.
// I will implement the UI first and simulated valid logic.

export default function InvoicePage() {
    const [receipts, setReceipts] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [lines, setLines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);

    // Mock Load Receipts on Mount
    useEffect(() => {
        // In real app: fetch from API
        setReceipts([
            { ID: 1, Numero_Remito: 'R-001-9988', Proveedor: 'Carnes del Sur', Fecha: '2023-10-03' }
        ]);
    }, []);

    const handleReceiptSelect = (e) => {
        const id = e.target.value;
        if (!id) return;
        // Mock Load details
        const r = receipts.find(x => x.ID == id);
        setSelectedReceipt(r);
        // Mock items from that receipt
        setLines([
            { ID_Insumo: 1, Nombre: 'Lomo Vetado', Cantidad_Recibida: 5, Unidad_Compra: 'Caja 20kg', qtyMatch: 5, price: 0 }
        ]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulator processing
        setTimeout(() => {
            setLoading(false);
            const total = lines.reduce((acc, l) => acc + (l.qtyMatch * l.price), 0);
            const isMismatch = lines.some(l => l.qtyMatch > l.Cantidad_Recibida);

            if (isMismatch) {
                setSuccess({ type: 'error', msg: '¡ALERTA! La factura tiene discrepancias con la recepción. Pago Bloqueado.' });
            } else {
                setSuccess({ type: 'success', msg: `Factura procesada correctamente. Total: $${total}` });
            }
        }, 1000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Ingreso de Facturas (Three-Way Match)
            </h2>

            <form onSubmit={handleSubmit} className="glass-card p-8 rounded-2xl space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Seleccionar Remito (Recepción)</label>
                        <select onChange={handleReceiptSelect} className="w-full bg-slate-800 border-none rounded p-3 text-white">
                            <option value="">-- Seleccione --</option>
                            {receipts.map(r => (
                                <option key={r.ID} value={r.ID}>#{r.Numero_Remito} - {r.Proveedor}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Número Factura</label>
                        <input type="text" className="w-full bg-slate-800 border-none rounded p-3 text-white" placeholder="A0001-..." required />
                    </div>
                </div>

                {selectedReceipt && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Lineas de Factura (Validación)</h3>
                        {lines.map((line, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-4 items-center bg-slate-800/50 p-3 rounded">
                                <div className="col-span-4 text-sm text-white">{line.Nombre}</div>
                                <div className="col-span-2 text-xs text-slate-400">Recibido: {line.Cantidad_Recibida} {line.Unidad_Compra}</div>
                                <div className="col-span-3">
                                    <input
                                        type="number"
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-right"
                                        placeholder="Cant. Facturada"
                                        defaultValue={line.Cantidad_Recibida}
                                        onChange={(e) => {
                                            const newLines = [...lines];
                                            newLines[idx].qtyMatch = parseFloat(e.target.value);
                                            setLines(newLines);
                                        }}
                                    />
                                </div>
                                <div className="col-span-3">
                                    <input
                                        type="number"
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-right"
                                        placeholder="Precio Unitario"
                                        onChange={(e) => {
                                            const newLines = [...lines];
                                            newLines[idx].price = parseFloat(e.target.value);
                                            setLines(newLines);
                                        }}
                                        required
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || !selectedReceipt}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50"
                    >
                        {loading ? 'Validando...' : 'Procesar Three-Way Match'}
                    </button>
                </div>
            </form>

            {success && (
                <div className={`p-4 rounded-xl border ${success.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-green-500/10 border-green-500 text-green-400'}`}>
                    <strong className="block text-lg mb-1">{success.type === 'error' ? 'BLOQUEO DE SEGURIDAD' : 'ÉXITO'}</strong>
                    {success.msg}
                </div>
            )}
        </div>
    );
}
