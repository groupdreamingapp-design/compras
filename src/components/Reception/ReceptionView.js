'use client';
import { useState, useEffect } from 'react';
import { getOrderDetails, createReception } from '@/actions/receptionActions';
import { ArrowLeft, CheckCircle, Truck, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ReceptionView({ initialOrders }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [orders, setOrders] = useState(initialOrders);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [header, setHeader] = useState({
        remito: '',
        fecha: new Date().toISOString().split('T')[0],
        estadoGlobal: 'Aceptado'
    });
    const [items, setItems] = useState([]);

    const handleSelectOrder = async (orderId) => {
        setLoading(true);
        const details = await getOrderDetails(orderId);
        const gridItems = details.items.map(i => ({
            ...i,
            receivedQty: i.qty,
            rejectedQty: 0,
            reason: '',
            lot: '',
            expiry: '',
            packageStatus: 'Integro'
        }));
        setSelectedOrder(details);
        setItems(gridItems);
        setStep(2);
        setLoading(false);
    };

    const handleItemChange = (idx, field, val) => {
        const newItems = [...items];
        newItems[idx][field] = val;
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!header.remito) return alert('Ingrese Número de Remito');
        setLoading(true);
        const payload = {
            orderId: selectedOrder.header.ID,
            remito: header.remito,
            temperatura: null,
            chofer: '',
            patente: '',
            qc: {
                receptionUserId: 1,
                globalStatus: header.estadoGlobal
            },
            items: items.map(i => ({
                insumoId: i.insumoId,
                receivedQty: parseFloat(i.receivedQty) || 0,
                rejectedQty: parseFloat(i.rejectedQty) || 0,
                reason: i.reason,
                lot: i.lot,
                expiry: i.expiry,
                packageStatus: i.packageStatus
            }))
        };

        const res = await createReception(payload);
        if (res.success) {
            alert(`Recepción #${res.receptionId} registrada correctamente!`);
            router.push('/');
        } else {
            alert('Error al registrar recepción: ' + res.message);
        }
        setLoading(false);
    };

    if (loading) return <div className="p-8 text-white">Procesando...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto pb-20">
            <div className="flex items-center mb-8">
                <Link href="/" className="mr-4 p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Truck className="text-blue-400" /> Recepción de Mercadería
                </h1>
            </div>

            {step === 1 && (
                <div className="glass-card p-6 rounded-xl">
                    <h2 className="text-xl text-white mb-4">Seleccione Orden de Compra (Pendiente)</h2>
                    {orders.length === 0 ? (
                        <p className="text-slate-400">No hay órdenes pendientes de recepción.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {orders.map(o => (
                                <div key={o.ID} onClick={() => handleSelectOrder(o.ID)}
                                    className="p-4 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:border-blue-500 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-blue-400 font-bold">OC #{o.ID}</span>
                                        <span className="text-slate-500 text-xs">{o.Fecha_Emision}</span>
                                    </div>
                                    <h3 className="text-white font-medium">{o.Proveedor}</h3>
                                    <div className="mt-2 text-emerald-400 font-bold text-sm">
                                        ${o.Total_Estimado?.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {step === 2 && selectedOrder && (
                <div className="space-y-6">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Nro. Remito</label>
                            <input
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                placeholder="R-0001-XXXX"
                                value={header.remito}
                                onChange={e => setHeader({ ...header, remito: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Fecha Recepción</label>
                            <input
                                type="date"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                value={header.fecha}
                                onChange={e => setHeader({ ...header, fecha: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Estado Global</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                value={header.estadoGlobal}
                                onChange={e => setHeader({ ...header, estadoGlobal: e.target.value })}
                            >
                                <option value="Aceptado">Aceptado</option>
                                <option value="Condicional">Condicional</option>
                                <option value="Rechazado">Rechazado</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 overflow-x-auto">
                        <h3 className="text-white font-bold mb-4">Control de Calidad y Cantidad</h3>
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-700">
                                    <th className="p-3 w-48">Insumo</th>
                                    <th className="p-3 text-center w-24">Esperado</th>
                                    <th className="p-3 text-center w-24 bg-slate-700/30">Recibido</th>
                                    <th className="p-3 text-center w-32">Vencimiento</th>
                                    <th className="p-3 text-center w-32">Lote</th>
                                    <th className="p-3">Rechazo (Cant / Motivo)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-700/30 transition">
                                        <td className="p-3">
                                            <div className="text-white font-medium">{item.name}</div>
                                            <div className="text-xs text-slate-500">Unit: {item.unit}</div>
                                        </td>
                                        <td className="p-3 text-center font-mono text-slate-300">{item.qty}</td>
                                        <td className="p-3 text-center bg-slate-700/30">
                                            <input
                                                type="number"
                                                className="bg-slate-900 border border-slate-600 rounded w-full p-1 text-center text-white"
                                                value={item.receivedQty}
                                                onChange={e => handleItemChange(idx, 'receivedQty', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="date"
                                                className="bg-slate-900 border border-slate-600 rounded w-full p-1 text-xs text-white"
                                                value={item.expiry} onChange={e => handleItemChange(idx, 'expiry', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="text" placeholder="Lote..."
                                                className="bg-slate-900 border border-slate-600 rounded w-full p-1 text-xs text-white"
                                                value={item.lot} onChange={e => handleItemChange(idx, 'lot', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    className="bg-slate-900 border border-slate-600 rounded w-16 p-1 text-center text-red-300"
                                                    value={item.rejectedQty}
                                                    onChange={e => handleItemChange(idx, 'rejectedQty', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Motivo..."
                                                    className="bg-slate-900 border border-slate-600 rounded flex-1 p-1 text-white"
                                                    value={item.reason}
                                                    onChange={e => handleItemChange(idx, 'reason', e.target.value)}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button onClick={() => setStep(1)} className="px-6 py-3 text-slate-400 hover:text-white">Cancelar</button>
                        <button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg active:scale-95">
                            <CheckCircle className="w-5 h-5" /> Confirmar Recepción
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
