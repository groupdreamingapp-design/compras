
"use client";
import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Search, Filter, MessageSquare, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import NuevaLicitacionModal from '@/components/licitaciones/NuevaLicitacionModal';

export default function LicitacionesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [licitaciones, setLicitaciones] = useState([
        { id: 1, producto: 'Harina 0000 x 25kg', status: 'abierta', fecha: '2026-02-07', ofertas: 3, mejorPrecio: '$12,500' },
        { id: 2, producto: 'Aceite Girasol 10L', status: 'cerrada', fecha: '2026-02-05', ofertas: 5, mejorPrecio: '$8,200', ganador: 'Distribuidora Norte' },
        { id: 3, producto: 'Mozzarella Trozada x 5kg', status: 'pendiente', fecha: '2026-02-07', ofertas: 1, mejorPrecio: '$22,000' },
    ]);

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Licitaciones de Insumos</h2>
                    <p className="text-slate-400 mt-1">Gestión de solicitudes de precios y optimización de CMV.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Nueva Solicitud
                </button>
            </header>

            {/* Modal */}
            <NuevaLicitacionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-12 h-12 text-blue-500" />
                    </div>
                    <div className="text-sm text-slate-400 mb-1">Ahorro Estimado (Mes)</div>
                    <div className="text-2xl font-bold text-white">$145,200</div>
                    <div className="mt-2 text-xs text-green-400 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> +12% vs mes anterior
                    </div>
                </div>
                <div className="glass-card p-6 rounded-2xl">
                    <div className="text-sm text-slate-400 mb-1">Solicitudes Activas</div>
                    <div className="text-2xl font-bold text-white">8</div>
                    <div className="mt-2 text-xs text-blue-400 uppercase tracking-wider font-semibold">Esperando Ofertas</div>
                </div>
                <div className="glass-card p-6 rounded-2xl">
                    <div className="text-sm text-slate-400 mb-1">Proveedores en Red</div>
                    <div className="text-2xl font-bold text-white">24</div>
                    <div className="mt-2 text-xs text-indigo-400 uppercase tracking-wider font-semibold">Activos esta semana</div>
                </div>
            </div>

            {/* Active Tenders Table */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center space-x-4 flex-1 max-w-md">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar licitación o producto..."
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            />
                        </div>
                        <button className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-colors">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800/30 text-slate-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Producto / Insumo</th>
                                <th className="px-6 py-4 font-semibold">Estado</th>
                                <th className="px-6 py-4 font-semibold">Fecha</th>
                                <th className="px-6 py-4 font-semibold">Ofertas</th>
                                <th className="px-6 py-4 font-semibold">Mejor Precio</th>
                                <th className="px-6 py-4 font-semibold"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {licitaciones.map((licitacion) => (
                                <tr key={licitacion.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-white">{licitacion.producto}</div>
                                        {licitacion.ganador && (
                                            <div className="text-xs text-green-400 mt-1 flex items-center">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Ganador: {licitacion.ganador}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider
                                            ${licitacion.status === 'abierta' ? 'bg-blue-500/10 text-blue-400' :
                                                licitacion.status === 'cerrada' ? 'bg-slate-500/10 text-slate-400' :
                                                    'bg-amber-500/10 text-amber-400'}`}>
                                            {licitacion.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {licitacion.fecha}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-sm text-white font-semibold">
                                            <MessageSquare className="w-4 h-4 mr-2 text-slate-500" />
                                            {licitacion.ofertas} recibidas
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-white">{licitacion.mejorPrecio}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-slate-500 hover:text-white transition-colors">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
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
