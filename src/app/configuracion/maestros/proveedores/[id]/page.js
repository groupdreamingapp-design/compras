'use client';
import { useState, useEffect, use } from 'react';
import { getProveedorById } from '@/actions/masterDataActions';
import { getVendorPerformance } from '@/actions/reportingActions';
import { ArrowLeft, Star, Clock, Truck, TrendingUp, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function SupplierDetailPage({ params }) {
    const { id } = use(params);
    const [provider, setProvider] = useState(null);
    const [scorecard, setScorecard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getProveedorById(id),
            getVendorPerformance(id)
        ]).then(([provData, scoreData]) => {
            setProvider(provData);
            setScorecard(scoreData);
            setLoading(false);
        });
    }, [id]);

    if (loading) return <div className="p-10 text-slate-500">Cargando ficha...</div>;
    if (!provider) return <div className="p-10 text-red-500">Proveedor no encontrado</div>;

    const { scores, stats, trend } = scorecard || { scores: {}, stats: {}, trend: [] };

    // Score Color Logic
    const getScoreColor = (score) => {
        if (score >= 90) return 'text-emerald-400';
        if (score >= 70) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <a href="/configuracion/maestros" className="flex items-center text-slate-400 hover:text-white mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Volver a Maestros
                </a>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">{provider.Nombre_Fantasia}</h1>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                            <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{provider.Codigo}</span>
                            <span>{provider.Razon_Social}</span>
                            <span>{provider.Categoria_Principal}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-xs uppercase font-bold text-slate-500 mb-1">Score Global</div>
                        <div className={`text-4xl font-bold ${getScoreColor(scores.global)}`}>
                            {scores.global}/100
                        </div>
                    </div>
                </div>
            </div>

            {/* SCORECARD WIDGETS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* QUALITY */}
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Star className="w-24 h-24 text-purple-500" />
                    </div>
                    <div className="flex items-center mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-lg mr-4">
                            <Star className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <div className="text-xs uppercase font-bold text-slate-500">Calidad (Rechazos)</div>
                            <div className="text-2xl font-bold text-white">{scores.quality}%</div>
                        </div>
                    </div>
                    <div className="text-sm text-slate-400">
                        {stats.rejectedParams === 0
                            ? "Sin rechazos en recepciones."
                            : <span className="text-red-400 flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> {stats.rejectedParams} entregas con incidentes.</span>
                        }
                    </div>
                </div>

                {/* TIMELINESS */}
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="w-24 h-24 text-blue-500" />
                    </div>
                    <div className="flex items-center mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg mr-4">
                            <Clock className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <div className="text-xs uppercase font-bold text-slate-500">Puntualidad</div>
                            <div className="text-2xl font-bold text-white">{scores.timeliness}%</div>
                        </div>
                    </div>
                    <div className="text-sm text-slate-400">
                        Basado en fecha prometida vs real de {stats.totalOrders} entregas.
                    </div>
                </div>

                {/* FULFILLMENT */}
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Truck className="w-24 h-24 text-emerald-500" />
                    </div>
                    <div className="flex items-center mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-lg mr-4">
                            <Truck className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-xs uppercase font-bold text-slate-500">Nivel de Servicio</div>
                            <div className="text-2xl font-bold text-white">{scores.fulfillment}%</div>
                        </div>
                    </div>
                    <div className="text-sm text-slate-400">
                        Entregas completas sin faltantes (Estimado).
                    </div>
                </div>
            </div>

            {/* CHARTS & DETAILS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CHART */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-xl h-[350px]">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-slate-400" />
                        Evolución del Score
                    </h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={trend}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" stroke="#475569" />
                            <YAxis stroke="#475569" domain={[0, 100]} />
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* INFO CARD */}
                <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                    <h3 className="font-bold text-white mb-4">Datos Operativos</h3>
                    <ul className="space-y-4 text-sm">
                        <li className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Lead Time Promedio</span>
                            <span className="text-white font-mono">{provider.Lead_Time} días</span>
                        </li>
                        <li className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Días de Entrega</span>
                            <span className="text-white">{provider.Dias_Entrega}</span>
                        </li>
                        <li className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Pedido Mínimo</span>
                            <span className="text-white font-mono">${provider.Pedido_Minimo?.toLocaleString()}</span>
                        </li>
                        <li className="flex justify-between border-b border-slate-700 pb-2">
                            <span className="text-slate-400">Condición Pago</span>
                            <span className="text-yellow-400">{provider.Condicion_Pago}</span>
                        </li>
                    </ul>
                    <div className="mt-8">
                        <h4 className="font-bold text-white mb-2">Contacto</h4>
                        <div className="text-sm text-slate-400">
                            <p>{provider.Nombre_Vendedor}</p>
                            <p className="text-sky-400">{provider.Email_Pedidos}</p>
                            <p>{provider.Telefono_Pedidos}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
