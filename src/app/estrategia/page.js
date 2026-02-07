'use client';
import { useState, useEffect } from 'react';
import { getInflationData, getABCAnalysis } from '@/actions/strategyActions';
import { TrendingUp, AlertTriangle, Zap, DollarSign, BarChart3, Layers } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, Cell, ReferenceLine } from 'recharts';
import Tooltip from '@/components/ui/Tooltip';

export default function StrategyPage() {
    const [chartData, setChartData] = useState({ items: [], data: [] });
    const [abcData, setAbcData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getInflationData(),
            getABCAnalysis()
        ]).then(([inflationRes, abcRes]) => {
            setChartData(inflationRes);
            setAbcData(abcRes);
            setLoading(false);
        });
    }, []);

    const colors = ['#f472b6', '#38bdf8', '#fbbf24', '#a78bfa', '#34d399']; // Pink, Sky, Amber, Purple, Emerald

    if (loading) return <div className="p-10 text-slate-500">Cargando estrategia...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">Estrategia y Mercado</h1>
                <p className="text-slate-400">Análisis de evolución de precios e inteligencia de compra.</p>
            </header>

            {/* KPI WIDGETS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center text-xs text-slate-500 uppercase font-bold mb-2">
                        <TrendingUp className="w-4 h-4 mr-2 text-pink-500" />
                        <Tooltip content="Porcentaje de aumento promedio en los precios de compra respecto al mes anterior.">
                            <span className="cursor-help decoration-slate-500 underline decoration-dashed underline-offset-2">Inflación Intermensual</span>
                        </Tooltip>
                    </div>
                    <div className="text-2xl font-bold text-white">4.2%</div>
                    <div className="text-xs text-red-400 mt-1">▲ 0.5% vs mes anterior</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center text-xs text-slate-500 uppercase font-bold mb-2">
                        <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                        <Tooltip content="Monto total de las compras analizadas para generar la clasificación ABC.">
                            <span className="cursor-help decoration-slate-500 underline decoration-dashed underline-offset-2">Gasto Total Analizado</span>
                        </Tooltip>
                    </div>
                    <div className="text-2xl font-bold text-white">${abcData?.totalSpend?.toLocaleString()}</div>
                    <div className="text-xs text-slate-400 mt-1">Acumulado histórico</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center text-xs text-slate-500 uppercase font-bold mb-2">
                        <Layers className="w-4 h-4 mr-2 text-emerald-500" />
                        <Tooltip content="Porcentaje de ítems que representan el 80% del gasto total (Principio de Pareto).">
                            <span className="cursor-help decoration-slate-500 underline decoration-dashed underline-offset-2">Concentración (Pareto)</span>
                        </Tooltip>
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">{((abcData?.summary?.a / (abcData?.items?.length || 1)) * 100).toFixed(0)}%</div>
                    <div className="text-xs text-slate-400 mt-1">de ítems generan el 80% del gasto</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center text-xs text-slate-500 uppercase font-bold mb-2">
                        <DollarSign className="w-4 h-4 mr-2 text-blue-500" />
                        <Tooltip content="Ahorro potencial estimado si se negocia un 5% de descuento en los ítems Clase A.">
                            <span className="cursor-help decoration-slate-500 underline decoration-dashed underline-offset-2">Oportunidad Ahorro</span>
                        </Tooltip>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">$1.2M</div>
                    <div className="text-xs text-slate-400 mt-1">Optimizando Categoría A</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LINE CHART: INFLATION */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
                        Evolución de Costos (Top 5)
                    </h3>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                                />
                                <Legend />
                                {chartData.items.map((item, index) => (
                                    <Line
                                        key={item}
                                        type="monotone"
                                        dataKey={item}
                                        stroke={colors[index % colors.length]}
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#1e293b', strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* COMBO CHART: PARETO (ABC) */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-emerald-500" />
                        Análisis ABC (Pareto)
                    </h3>

                    <div className="h-[350px] w-full">
                        {abcData && abcData.items?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={abcData.items.slice(0, 15)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="Nombre" stroke="#94a3b8" interval={0} angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10 }} />
                                    <YAxis yAxisId="left" stroke="#94a3b8" orientation="left" />
                                    <YAxis yAxisId="right" stroke="#10b981" orientation="right" domain={[0, 100]} unit="%" />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                                        formatter={(value, name) => [name === 'cumulativePercentage' ? `${value.toFixed(1)}%` : `$${value}`, name === 'cumulativePercentage' ? 'Acumulado' : 'Gasto']}
                                    />
                                    <Bar yAxisId="left" dataKey="TotalValue" fill="#3b82f6" barSize={20} radius={[4, 4, 0, 0]}>
                                        {abcData.items.slice(0, 15).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.classification === 'A' ? '#e11d48' : entry.classification === 'B' ? '#fbbf24' : '#3b82f6'} />
                                        ))}
                                    </Bar>
                                    <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" stroke="#10b981" strokeWidth={2} dot={false} />
                                    <ReferenceLine yAxisId="right" y={80} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: '80%', fill: '#94a3b8', fontSize: 10 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                Sin datos de compras suficientes.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ABC TABLES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-800/50 p-6 rounded-xl border border-rose-900/30">
                    <h4 className="text-white font-bold mb-4 border-b border-slate-700 pb-2 flex justify-between">
                        <span>Clase A (Críticos)</span>
                        <span className="text-rose-500">{abcData?.summary.a} ítems</span>
                    </h4>
                    <p className="text-xs text-slate-400 mb-4">Representan el 80% de tu inversión. Negociar precio aquí es vital.</p>
                    <ul className="space-y-2 text-sm">
                        {abcData?.items?.filter(i => i.classification === 'A').map(i => (
                            <li key={i.Nombre} className="flex justify-between">
                                <span className="text-white">{i.Nombre}</span>
                                <span className="text-slate-400 font-mono">${i.TotalValue.toLocaleString()}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-xl border border-amber-900/30">
                    <h4 className="text-white font-bold mb-4 border-b border-slate-700 pb-2 flex justify-between">
                        <span>Clase B (Importantes)</span>
                        <span className="text-amber-500">{abcData?.summary.b} ítems</span>
                    </h4>
                    <p className="text-xs text-slate-400 mb-4">El siguiente 15%. Mantener stock es la prioridad.</p>
                    <ul className="space-y-2 text-sm">
                        {abcData?.items?.filter(i => i.classification === 'B').slice(0, 5).map(i => (
                            <li key={i.Nombre} className="flex justify-between">
                                <span className="text-white">{i.Nombre}</span>
                                <span className="text-slate-400 font-mono">${i.TotalValue.toLocaleString()}</span>
                            </li>
                        ))}
                        {abcData?.summary.b > 5 && <li className="text-xs text-slate-500 text-center italic">... y {abcData.summary.b - 5} más</li>}
                    </ul>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-xl border border-blue-900/30">
                    <h4 className="text-white font-bold mb-4 border-b border-slate-700 pb-2 flex justify-between">
                        <span>Clase C (Rutinarios)</span>
                        <span className="text-blue-500">{abcData?.summary.c} ítems</span>
                    </h4>
                    <p className="text-xs text-slate-400 mb-4">El último 5% del valor. Automatizar compra.</p>
                    <ul className="space-y-2 text-sm">
                        {abcData?.items?.filter(i => i.classification === 'C').slice(0, 5).map(i => (
                            <li key={i.Nombre} className="flex justify-between">
                                <span className="text-white">{i.Nombre}</span>
                                <span className="text-slate-400 font-mono">${i.TotalValue.toLocaleString()}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
