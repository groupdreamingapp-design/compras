'use client';
import { useState, useEffect } from 'react';
import { getPendingReceptions, getReceptionDetailsForInvoice, createInvoice } from '@/actions/invoiceActions';
import { ArrowLeft, Save, FileText, DollarSign, Calculator, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function NewInvoicePage() {
    const [step, setStep] = useState(1); // 1: Select Receipt, 2: Load Invoice
    const [receptions, setReceptions] = useState([]);
    const [selectedRec, setSelectedRec] = useState(null); // { header, items }
    const [loading, setLoading] = useState(true);

    // Invoice Form
    const [form, setForm] = useState({
        tipo: 'A',
        puntoVenta: 1,
        numero: '',
        cae: '',
        fechaEmision: new Date().toISOString().split('T')[0],
        fechaVencimiento: '',

        // Amounts
        neto: 0,
        iva21: 0,
        iva105: 0,
        iva27: 0,
        percepciones: 0
    });

    // Calculated derived total
    const totalFactura = (parseFloat(form.neto) || 0) +
        (parseFloat(form.iva21) || 0) +
        (parseFloat(form.iva105) || 0) +
        (parseFloat(form.iva27) || 0) +
        (parseFloat(form.percepciones) || 0);

    const [expectedTotal, setExpectedTotal] = useState(0);

    useEffect(() => {
        getPendingReceptions().then(res => {
            setReceptions(res);
            setLoading(false);
        });
    }, []);

    const handleSelectReception = async (recId) => {
        setLoading(true);
        const details = await getReceptionDetailsForInvoice(recId);
        setSelectedRec(details);

        // Calculate Expected
        const expected = details.items.reduce((acc, i) => acc + i.Subtotal_Esperado, 0);
        setExpectedTotal(expected);

        // Pre-fill Neto with Expected? Maybe useful.
        setForm(prev => ({ ...prev, neto: expected }));

        setStep(2);
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!form.numero) return alert('Ingrese Número de Factura');

        const payload = {
            providerId: selectedRec.header.ID_Proveedor,
            receptionId: selectedRec.header.ID,
            ...form,
            total: totalFactura,
            items: selectedRec.items.map(i => ({
                insumoId: i.ID_Insumo,
                qty: i.Cantidad_Recibida,
                price: i.Precio
            }))
        };

        const res = await createInvoice(payload);
        if (res.success) {
            alert('Factura Registrada Exitosamente');
            window.location.href = '/compras/facturas'; // Needs listing page, or back to dashboard
        }
    };

    const handleAmountChange = (field, val) => {
        setForm({ ...form, [field]: parseFloat(val) || 0 });
    };

    if (loading) return <div className="p-8 text-white">Cargando...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto pb-20">
            <div className="flex items-center mb-8">
                <Link href="/dashboard" className="mr-4 p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <FileText className="text-blue-400" /> Carga de Factura Fiscal
                </h1>
            </div>

            {step === 1 && (
                <div className="glass-card p-6 rounded-xl">
                    <h2 className="text-xl text-white mb-4">Seleccione Recepción Pendiente de Facturar</h2>
                    {receptions.length === 0 ? (
                        <p className="text-slate-400">No hay recepciones pendientes.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {receptions.map(r => (
                                <div key={r.ID} onClick={() => handleSelectReception(r.ID)}
                                    className="p-4 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:border-blue-500 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-blue-400 font-bold">Remito: {r.Numero_Remito}</span>
                                        <span className="text-slate-500 text-xs">{r.Fecha_Real_Recepcion}</span>
                                    </div>
                                    <h3 className="text-white font-medium">{r.Proveedor}</h3>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {step === 2 && selectedRec && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Invoice Data */}
                    <div className="space-y-6">
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" /> Datos del Comprobante
                            </h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="label-dark">Tipo</label>
                                    <select className="input-dark w-full" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                                        <option value="A">Factura A</option>
                                        <option value="B">Factura B</option>
                                        <option value="C">Factura C</option>
                                        <option value="M">Factura M</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label-dark">Fecha Emisión</label>
                                    <input type="date" className="input-dark w-full" value={form.fechaEmision} onChange={e => setForm({ ...form, fechaEmision: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="label-dark">Pto. Venta</label>
                                    <input type="number" className="input-dark w-full" value={form.puntoVenta} onChange={e => setForm({ ...form, puntoVenta: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="label-dark">Número</label>
                                    <input type="number" className="input-dark w-full" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="12345678" />
                                </div>
                            </div>
                            <div>
                                <label className="label-dark">CAE (Opcional)</label>
                                <input className="input-dark w-full" value={form.cae} onChange={e => setForm({ ...form, cae: e.target.value })} />
                            </div>
                        </div>

                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-400" /> Importes (Según Factura)
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="flex justify-between text-slate-400 text-sm mb-1">
                                        <span>Neto Gravado</span>
                                        <span className="text-xs text-slate-500">Sugerido: ${expectedTotal.toLocaleString()}</span>
                                    </label>
                                    <input
                                        type="number" className="input-dark w-full text-right font-mono"
                                        value={form.neto} onChange={e => handleAmountChange('neto', e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label-dark">IVA 21%</label>
                                        <input type="number" className="input-dark w-full text-right font-mono" value={form.iva21} onChange={e => handleAmountChange('iva21', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="label-dark">IVA 10.5%</label>
                                        <input type="number" className="input-dark w-full text-right font-mono" value={form.iva105} onChange={e => handleAmountChange('iva105', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="label-dark">IVA 27%</label>
                                        <input type="number" className="input-dark w-full text-right font-mono" value={form.iva27} onChange={e => handleAmountChange('iva27', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="label-dark">Percepciones IIBB</label>
                                        <input type="number" className="input-dark w-full text-right font-mono" value={form.percepciones} onChange={e => handleAmountChange('percepciones', e.target.value)} />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-700 flex justify-between items-end">
                                    <span className="text-white font-bold">Total Factura</span>
                                    <span className="text-3xl font-bold text-green-400">${totalFactura.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setStep(1)} className="px-6 py-3 text-slate-400 hover:text-white">Atrás</button>
                            <button onClick={handleSubmit} className="btn-primary w-full py-3 flex justify-center items-center gap-2">
                                <CheckCircle className="w-5 h-5" /> Confirmar Carga
                            </button>
                        </div>
                    </div>

                    {/* Right: Validation Panel */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-purple-400" /> Validación Automática
                        </h3>

                        <div className="mb-6 bg-slate-900 p-4 rounded-lg">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-400">Proveedor</span>
                                <span className="text-white font-medium">{selectedRec.header.Proveedor}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-400">CUIT</span>
                                <span className="text-white font-medium">{selectedRec.header.CUIT}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Condición IVA</span>
                                <span className="text-white font-medium">{selectedRec.header.Condicion_IVA}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-slate-300 text-sm font-bold border-b border-slate-700 pb-2">Comparativa de Costos</h4>

                            {selectedRec.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm p-2 hover:bg-slate-700/30 rounded">
                                    <div className="flex flex-col">
                                        <span className="text-white">{item.Insumo}</span>
                                        <span className="text-xs text-slate-500">{item.Cantidad_Recibida}u x ${item.Precio}</span>
                                    </div>
                                    <span className="text-slate-300 font-mono">${item.Subtotal_Esperado.toLocaleString()}</span>
                                </div>
                            ))}

                            <div className="border-t border-slate-600 pt-3 mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-300">Total Esperado (Neto)</span>
                                    <span className="text-white font-bold font-mono">${expectedTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-300">Total Cargado (Neto)</span>
                                    <span className={`font-bold font-mono ${Math.abs(form.neto - expectedTotal) > 100 ? 'text-yellow-400' : 'text-green-400'}`}>
                                        ${form.neto.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-900 p-2 rounded">
                                    <span className="text-slate-400 text-xs uppercase">Diferencia</span>
                                    {Math.abs(form.neto - expectedTotal) > 0 && (
                                        <span className={`font-bold ${form.neto - expectedTotal > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {form.neto - expectedTotal > 0 ? '+' : ''}${(form.neto - expectedTotal).toLocaleString()}
                                        </span>
                                    )}
                                    {Math.abs(form.neto - expectedTotal) === 0 && <span className="text-slate-500">-</span>}
                                </div>

                                {Math.abs(form.neto - expectedTotal) > 1000 && (
                                    <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                        <p className="text-xs text-red-300">
                                            Existe una diferencia significativa entre el costo pactado y el facturado. Se requerirá aprobación de Gerencia para procesar el pago.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
