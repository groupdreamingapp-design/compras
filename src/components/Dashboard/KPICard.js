import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import Tooltip from '../ui/Tooltip';

export default function KPICard({ title, value, trend, trendValue, trendLabel, color = "blue", icon: Icon, tooltip }) {
    const isPositive = trend === 'up';
    const isNegative = trend === 'down';

    const trendColor = isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-400';
    const TrendIcon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;

    return (
        <div className="glass-card p-6 rounded-2xl relative group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity bg-${color}-500/20 rounded-tr-2xl rounded-bl-3xl`}>
                {Icon && <Icon className={`w-12 h-12 text-${color}-400`} />}
            </div>

            <div className="mb-2">
                {tooltip ? (
                    <Tooltip content={tooltip} placement="bottom">
                        <h3 className="text-slate-400 text-sm font-medium cursor-help inline-block decoration-slate-600 underline decoration-dashed underline-offset-4">{title}</h3>
                    </Tooltip>
                ) : (
                    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
                )}
            </div>
            <div className="text-3xl font-bold text-white mb-4 tracking-tight">{value}</div>

            <div className="flex items-center space-x-2">
                <div className={`flex items-center px-2 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 ${trendColor}`}>
                    <TrendIcon className="w-3 h-3 mr-1" />
                    <span className="text-xs font-bold">{trendValue}</span>
                </div>
                <span className="text-xs text-slate-500">{trendLabel}</span>
            </div>
        </div>
    );
}
