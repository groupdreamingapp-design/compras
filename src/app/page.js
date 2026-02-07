import React from 'react';
// Import services - ensure we await them since they are now async
// Import services
import { getGapMetrics } from '../services/watcher';
import { getKPIs } from '../services/kpi';
import KPICard from '../components/Dashboard/KPICard';
import GapTrafficLight from '../components/Dashboard/GapTrafficLight';
import { DollarSign, TrendingUp, AlertTriangle, Zap, CheckCircle, Package } from 'lucide-react';

export default async function Home() {
    // 1. Fetch Data (Server Side)
    const startDate = '2023-10-01';
    const endDate = '2023-10-31';

    const [gaps, kpis] = await Promise.all([
        getGapMetrics(startDate, endDate),
        getKPIs(startDate, endDate)
    ]);

    // Slice top 5 for the Traffic Light
    const topGaps = gaps.slice(0, 5);

    return (
        <div className="space-y-8">
            {/* 1. Top Row KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KPICard
                    title="Inflación Interna"
                    value={kpis.inflation}
                    trend="down"
                    trendValue="Tendencia al alza"
                    trendLabel="vs mes anterior"
                    color="red"
                    icon={TrendingUp}
                    tooltip="Variación promedio de precios de insumos comprados respecto al mes anterior."
                />
                <KPICard
                    title="Ahorro Generado"
                    value={kpis.savings}
                    trend="up"
                    trendValue="Vs Market: +5%"
                    trendLabel="better"
                    color="green"
                    icon={DollarSign}
                    tooltip="Diferencia entre el precio de mercado y el precio real pagado en las compras del período."
                />
                <KPICard
                    title="Cumplimiento Prov."
                    value={kpis.compliance + "/5.0"}
                    trend="up"
                    trendValue="Estable"
                    trendLabel="rating promedio"
                    color="indigo"
                    icon={CheckCircle}
                    tooltip="Calificación promedio de proveedores basada en tiempos de entrega y calidad."
                />
                <KPICard
                    title="Días Inventario"
                    value={kpis.days}
                    trend="down"
                    trendValue="Optimo"
                    trendLabel="rotación"
                    color="blue"
                    icon={Package}
                    tooltip="Días promedio que el stock permanece almacenado antes de ser utilizado."
                />
            </div>

            {/* 2. Main Widgets Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                {/* Left: Traffic Light */}
                <GapTrafficLight items={topGaps} />

                {/* Right: Price Evolution (Placeholder/Static for demo) */}
                <div className="glass-card p-6 rounded-2xl relative">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-white">Evolución de Precios</h3>
                        <select className="bg-slate-800 border-none text-xs rounded text-slate-400 p-1">
                            <option>Lomo Vetado</option>
                            <option>Salmón</option>
                        </select>
                    </div>
                    {/* Simple CSS Chart Graphic */}
                    <div className="absolute inset-0 flex items-center justify-center pt-10">
                        {/* Decorative curve */}
                        <svg viewBox="0 0 500 150" className="w-full h-48 text-pink-500 fill-none stroke-current stroke-2" style={{ filter: 'drop-shadow(0 0 10px rgba(233,30,99,0.5))' }}>
                            <path d="M0,150 C100,100 200,150 250,50 S400,100 500,0" />
                        </svg>
                        {/* Second curve */}
                        <svg viewBox="0 0 500 150" className="w-full h-48 text-cyan-500 fill-none stroke-current stroke-2 absolute" style={{ filter: 'drop-shadow(0 0 10px rgba(0,188,212,0.5))' }}>
                            <path d="M0,150 C150,150 250,100 350,80 S450,50 500,20" />
                        </svg>
                    </div>
                    <div className="absolute bottom-6 left-6 right-6 flex justify-between text-xs text-slate-500">
                        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                    </div>
                </div>
            </div>

            {/* 3. Action Area */}
            <div className="flex justify-center pt-4">
                <button className="group relative px-8 py-4 bg-slate-800 rounded-full overflow-hidden shadow-2xl transition-transform hover:scale-105 active:scale-95">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-[1px] bg-slate-900 rounded-full" />
                    <div className="relative flex items-center space-x-3">
                        <Zap className="text-pink-500 group-hover:text-white transition-colors animate-pulse" />
                        <span className="text-lg font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent group-hover:text-white transition-all">
                            Acción Rápida: Reclamar Diferencias
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
}
