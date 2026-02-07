'use client';
import { useState, useEffect } from 'react';
import { getTopInflationIngredients, getSupplierDependence, getCMVImpact } from '@/actions/auditActions';
import { getABCAnalysis } from '@/actions/strategyActions';
import { AlertTriangle, TrendingUp, Users, DollarSign, Package, AlertCircle } from 'lucide-react';
import KPICard from '@/components/Dashboard/KPICard';
import Tooltip from '@/components/ui/Tooltip';

export default function AuditPage() {
    const [inflationItems, setInflationItems] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [cmvImpact, setCmvImpact] = useState([]);
    const [abcSummary, setAbcSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getTopInflationIngredients(),
            getSupplierDependence(),
            getCMVImpact(),
            getABCAnalysis()
        ]).then(([inf, sup, cmv, abc]) => {
            setInflationItems(inf);
            setSuppliers(sup);
            setCmvImpact(cmv);
            setAbcSummary(abc.summary);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-10 text-slate-500">Cargando auditoría de compras...</div>;

    const topInflation = inflationItems[0]?.ChangePercent || 0;
    const totalSpend = suppliers.reduce((sum, s) => sum + s.TotalSpend, 0);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">Auditoría de Insumos y Proveedores</h1>
                <p className="text-slate-400">Control de precios, impacto en CMV y desempeño de proveedores.</p>
            </header>

            {/* KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                    title="Inflación Máxima"
                    value={topInflation > 0 ? `+${topInflation.toFixed(1)}%` : '0%'}
                    trend={topInflation > 5 ? 'down' : 'up'}
                    trendValue={inflationItems[0]?.Nombre || '-'}
                    trendLabel="mayor aumento"
                    color="red"
                    icon={TrendingUp}
                    tooltip="El insumo con mayor variación de precio en el último período."
                />
                <KPICard
                    title="Proveedores Activos"
                    value={suppliers.length}
                    trend="flat"
                    trendValue="Total"
                    trendLabel="en cartera"
                    color="blue"
                    icon={Users}
                    tooltip="Cantidad de proveedores con facturación registrada."
                />
                <KPICard
                    title="Gasto Total"
                    value={`$${(totalSpend / 1000000).toFixed(1)}M`}
                    trend="up"
                    trendValue="Acumulado"
                    trendLabel="compras"
                    color="green"
                    icon={DollarSign}
                    tooltip="Monto total de compras procesadas y auditadas."
                />
                <KPICard
                    title="Ítems Críticos"
                    value={abcSummary?.a || 0}
                    trend="flat"
                    trendValue="Clase A"
                    trendLabel="80% del gasto"
                    color="amber"
                    icon={AlertCircle}
                    tooltip="Número de insumos que representan el 80% de tu costo total."
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* INFLATION WATCHLIST */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                        Watchlist: Variaciones de Precio
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="text-xs uppercase font-bold text-slate-500 border-b border-slate-700">
                                <tr>
                                    <th className="pb-2">Insumo</th>
                                    <th className="pb-2 text-right">Precio Ant.</th>
                                    <th className="pb-2 text-right">Precio Act.</th>
                                    <th className="pb-2 text-right">Variación</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {inflationItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30">
                                        <td className="py-3 text-white font-medium">{item.Nombre}</td>
                                        <td className="py-3 text-right font-mono">${item.prevPrice?.toFixed(2)}</td>
                                        <td className="py-3 text-right font-mono">${item.lastPrice?.toFixed(2)}</td>
                                        <td className="py-3 text-right font-bold text-red-400">
                                            +{item.ChangePercent.toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                                {inflationItems.length === 0 && (
                                    <tr><td colSpan="4" className="py-4 text-center text-slate-600">No se detectaron aumentos recientes.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CMV IMPACT */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <Package className="w-5 h-5 mr-2 text-emerald-500" />
                        Impacto en Costo de Mercadería (Top 10)
                    </h3>
                    <div className="space-y-4">
                        {cmvImpact.map((item, idx) => (
                            <div key={idx} className="relative">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-white font-medium">{item.Nombre}</span>
                                    <span className="text-emerald-400 font-mono text-xs">{item.percentage}% del costo</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-emerald-500 to-green-400 h-2 rounded-full"
                                        style={{ width: `${item.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SUPPLIER NEGOTIATION MATRIX */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-500" />
                    Matriz de Negociación con Proveedores
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="text-xs uppercase font-bold text-slate-500 border-b border-slate-700">
                            <tr>
                                <th className="pb-2">Proveedor</th>
                                <th className="pb-2 text-center">Dependencia (% Gasto)</th>
                                <th className="pb-2 text-right">Volumen Compras</th>
                                <th className="pb-2 text-center w-32">Acción Sugerida</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {suppliers.map((sup, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/30">
                                    <td className="py-3 text-white font-medium">{sup.Nombre}</td>
                                    <td className="py-3 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${sup.percentage > 20 ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                            {sup.percentage}%
                                        </span>
                                    </td>
                                    <td className="py-3 text-right font-mono text-slate-300">
                                        ${sup.TotalSpend.toLocaleString()}
                                    </td>
                                    <td className="py-3 text-center">
                                        {sup.percentage > 20 ? (
                                            <span className="text-xs text-amber-400 font-bold">Diversificar / Auditar</span>
                                        ) : (
                                            <span className="text-xs text-emerald-400 font-bold">Consolidar</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
