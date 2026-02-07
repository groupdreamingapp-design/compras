'use client';
import { useState, useEffect } from 'react';
import { getFinanceMetrics, getUnpaidInvoices } from '@/services/finance';
import { DollarSign, Calendar, TrendingDown, TrendingUp, AlertCircle, FileText } from 'lucide-react';

export default function FinanceDashboard() {
    const [metrics, setMetrics] = useState({ totalDebt: 0, overdueDebt: 0, dueSoonDebt: 0 });
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getFinanceMetrics(), getUnpaidInvoices()]).then(([m, i]) => {
            setMetrics(m);
            setInvoices(i);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-8 text-white">Cargando Finanzas...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <DollarSign className="text-emerald-400" /> Panel Financiero
                </h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm border border-slate-700">Explorar</button>
                    <button className="px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg text-sm border border-emerald-500/50">Reportar Pagos</button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Debt */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={64} /></div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Cuentas a Pagar (Total)</h3>
                    <div className="text-3xl font-bold text-white">${metrics.totalDebt?.toLocaleString()}</div>
                    <div className="mt-2 text-sm text-slate-500">Saldo pendiente global</div>
                </div>

                {/* Overdue */}
                <div className="bg-slate-800 p-6 rounded-xl border border-red-900/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500"><AlertCircle size={64} /></div>
                    <h3 className="text-red-300 text-sm font-medium mb-1">Vencido (Exigible)</h3>
                    <div className="text-3xl font-bold text-red-400">${metrics.overdueDebt?.toLocaleString()}</div>
                    <div className="mt-2 text-xs bg-red-900/30 text-red-200 px-2 py-1 rounded w-fit flex items-center gap-1">
                        <AlertCircle size={12} /> Gestión Prioritaria
                    </div>
                </div>

                {/* Due Soon */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500"><Calendar size={64} /></div>
                    <h3 className="text-amber-300 text-sm font-medium mb-1">Vence en 7 Días</h3>
                    <div className="text-3xl font-bold text-amber-400">${metrics.dueSoonDebt?.toLocaleString()}</div>
                    <div className="mt-2 text-sm text-slate-500">Proyección Cashflow</div>
                </div>
            </div>

            {/* Invoices List */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-400" /> Facturas Pendientes de Pago
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900/50 text-slate-400">
                            <tr>
                                <th className="p-4">Vencimiento</th>
                                <th className="p-4">Proveedor</th>
                                <th className="p-4">Comprobante</th>
                                <th className="p-4">Emisión</th>
                                <th className="p-4 text-right">Importe</th>
                                <th className="p-4 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {invoices.map((inv) => (
                                <tr key={inv.ID} className="hover:bg-slate-700/50 transition">
                                    <td className="p-4 font-mono text-white">
                                        {inv.Fecha_Vencimiento_Pago || <span className="text-slate-600">-</span>}
                                    </td>
                                    <td className="p-4 font-medium text-slate-200">{inv.Proveedor}</td>
                                    <td className="p-4 text-slate-400">#{inv.Numero_Comprobante}</td>
                                    <td className="p-4 text-slate-500">{inv.Fecha_Emision}</td>
                                    <td className="p-4 text-right font-bold text-emerald-400">
                                        ${inv.Total_Facturado?.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300">Pendiente</span>
                                    </td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">
                                        No hay facturas pendientes de pago.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
