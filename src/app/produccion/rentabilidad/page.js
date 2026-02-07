'use client';
import { useState, useEffect } from 'react';
import { getMenuEngineeringData } from '@/actions/analyticsActions';
import { PieChart, TrendingUp, Info } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip as RechartsTooltip, Cell, ReferenceLine, Label } from 'recharts';
import Tooltip from '@/components/ui/Tooltip';

export default function ProfitabilityPage() {
    const [data, setData] = useState({ items: [], averages: {} });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMenuEngineeringData().then(res => {
            setData(res);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-10 text-center text-slate-500">Cargando análisis...</div>;

    const { items, averages } = data;

    // Colors for quadrants
    const getColor = (classification) => {
        switch (classification) {
            case 'STAR': return '#10b981'; // Emerald
            case 'PLOWHORSE': return '#fbbf24'; // Amber
            case 'PUZZLE': return '#3b82f6'; // Blue
            case 'DOG': return '#ef4444'; // Red
            default: return '#94a3b8';
        }
    };

    return (
        <div className="p-8 space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Ingeniería de Menú</h1>
                <p className="text-slate-400">Análisis estratégico de rentabilidad vs popularidad (Matriz BCG).</p>
            </header>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <Tooltip content="Cantidad total de platos vendidos en el período analizado.">
                        <div className="text-xs text-slate-500 uppercase font-bold cursor-help decoration-slate-500 underline decoration-dashed underline-offset-2">Total Ventas (Unidades)</div>
                    </Tooltip>
                    <div className="text-2xl font-bold text-white mt-1">{averages.totalSales}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <Tooltip content="Ganancia promedio por plato (Precio Venta - Costo).">
                        <div className="text-xs text-slate-500 uppercase font-bold cursor-help decoration-slate-500 underline decoration-dashed underline-offset-2">Margen Promedio ($)</div>
                    </Tooltip>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">${averages.margin.toFixed(0)}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <Tooltip content="Ventas promedio por plato. Referencia para determinar alta/baja popularidad.">
                        <div className="text-xs text-slate-500 uppercase font-bold cursor-help decoration-slate-500 underline decoration-dashed underline-offset-2">Benchmark Popularidad</div>
                    </Tooltip>
                    <div className="text-2xl font-bold text-amber-400 mt-1">{averages.popularity.toFixed(1)} u.</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <Tooltip content="Número de ítems del menú incluidos en este análisis.">
                        <div className="text-xs text-slate-500 uppercase font-bold cursor-help decoration-slate-500 underline decoration-dashed underline-offset-2">Platos Evaluados</div>
                    </Tooltip>
                    <div className="text-2xl font-bold text-blue-400 mt-1">{items.length}</div>
                </div>
            </div>

            {/* MATRIX CHART */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-pink-500" />
                        Matriz de Rentabilidad
                    </h3>

                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <XAxis
                                    type="number"
                                    dataKey="sold"
                                    name="Popularidad (Ventas)"
                                    unit=" u."
                                    stroke="#64748b"
                                    domain={[0, 'auto']}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="margin"
                                    name="Margen de Contribución"
                                    unit="$"
                                    stroke="#64748b"
                                    domain={[0, 'auto']}
                                />
                                <ZAxis type="category" dataKey="name" name="Plato" />
                                <RechartsTooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    formatter={(value, name) => [name === 'Popularidad (Ventas)' ? value : `$${value}`, name]}
                                />

                                {/* Reference Lines for Quadrants */}
                                <ReferenceLine x={averages.popularity} stroke="#94a3b8" strokeDasharray="3 3">
                                    <Label value="Pop. Media" position="insideTopRight" fill="#94a3b8" fontSize={10} />
                                </ReferenceLine>
                                <ReferenceLine y={averages.margin} stroke="#94a3b8" strokeDasharray="3 3">
                                    <Label value="Margen Medio" position="insideRight" fill="#94a3b8" fontSize={10} />
                                </ReferenceLine>

                                <Scatter name="Platos" data={items} fill="#8884d8">
                                    {items.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getColor(entry.classification)} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quadrant Labels (Absolute Positioned for visual aid) */}
                    <div className="absolute top-20 right-10 text-xs font-bold text-emerald-500/50 uppercase tracking-widest pointer-events-none">Estrellas</div>
                    <div className="absolute top-20 left-20 text-xs font-bold text-blue-500/50 uppercase tracking-widest pointer-events-none">Rompecabezas</div>
                    <div className="absolute bottom-20 right-10 text-xs font-bold text-amber-500/50 uppercase tracking-widest pointer-events-none">Vacas Lecheras</div>
                    <div className="absolute bottom-20 left-20 text-xs font-bold text-red-500/50 uppercase tracking-widest pointer-events-none">Perros</div>
                </div>

                {/* TABLE LIST */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 overflow-hidden flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-4">Detalle</h3>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="text-xs uppercase font-bold text-slate-500 border-b border-slate-700">
                                <tr>
                                    <th className="pb-2">Plato</th>
                                    <th className="pb-2 text-right">Margen</th>
                                    <th className="pb-2 text-right">Cant.</th>
                                    <th className="pb-2 text-center">Clase</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {items.sort((a, b) => b.sold - a.sold).map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-2 text-white">{item.name}</td>
                                        <td className="py-2 text-right font-mono text-emerald-300">${item.margin.toFixed(0)}</td>
                                        <td className="py-2 text-right font-mono">{item.sold}</td>
                                        <td className="py-2 text-center">
                                            <span
                                                className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-900"
                                                style={{ backgroundColor: getColor(item.classification) }}
                                            >
                                                {item.classification}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500 space-y-1">
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div> Estrella: Alta Popularidad y Margen</div>
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div> Vaca: Alta Popularidad, Bajo Margen</div>
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div> Puzzle: Baja Popularidad, Alto Margen</div>
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div> Perro: Baja Popularidad y Margen</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
