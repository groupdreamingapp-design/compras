import React from 'react';

export default function GapTrafficLight({ items }) {
    return (
        <div className="glass-card p-6 rounded-2xl h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Semáforo de Desvíos</h3>
                <span className="text-xs text-slate-400">Top 5 Críticos</span>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-12 text-xs text-slate-500 pb-2 border-b border-slate-700/50">
                    <div className="col-span-5">Producto</div>
                    <div className="col-span-5">Gap %</div>
                    <div className="col-span-2 text-right">Estado</div>
                </div>

                {items.map((item, idx) => {
                    // Color logic based on Gap
                    const isCritical = item.Gap_Percentage > 10;
                    const isWarning = item.Gap_Percentage > 5 && item.Gap_Percentage <= 10;

                    const barColor = isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500';
                    const glowingClass = isCritical ? 'shadow-[0_0_10px_rgba(239,68,68,0.5)]' : '';

                    return (
                        <div key={idx} className="group relative">
                            <div className="grid grid-cols-12 items-center py-2">
                                <div className="col-span-5 text-sm font-medium text-slate-200">{item.Insumo}</div>
                                <div className="col-span-5 flex items-center pr-4">
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${barColor} ${glowingClass} transition-all duration-500`}
                                            style={{ width: `${Math.min(item.Gap_Percentage, 100)}%` }}
                                        />
                                    </div>
                                    <span className="ml-2 text-xs text-slate-400 w-8">{item.Gap_Percentage}%</span>
                                </div>
                                <div className="col-span-2 text-right">
                                    {isCritical ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                                            CRÍTICO
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                            OK
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
