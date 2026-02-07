
"use client";
import React, { useState } from 'react';
import { X, Send, Users, Package, DollarSign, Calendar } from 'lucide-react';

export default function NuevaLicitacionModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            <Send className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Nueva Solicitud de Precios</h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Producto Insumo */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 flex items-center">
                            <Package className="w-4 h-4 mr-2 text-blue-400" />
                            Seleccionar Insumo
                        </label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none cursor-pointer">
                            <option>Elija un producto...</option>
                            <option>Harina 0000 x 25kg</option>
                            <option>Aceite de Girasol 10L</option>
                            <option>Queso Mozzarella x 5kg</option>
                            <option>Levadura Fresca x 500g</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 flex items-center">
                                <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                                Cantidad Estimada
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: 100 unidades"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                                Fecha Límite
                            </label>
                            <input
                                type="date"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Seleccion de Proveedores */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 flex items-center">
                            <Users className="w-4 h-4 mr-2 text-indigo-400" />
                            Invitar Proveedores
                        </label>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            {['Distribuidora Norte', 'Frutihortícola Central', 'Lácteos del Sur', 'Molinos de la Plata'].map((prov) => (
                                <label key={prov} className="flex items-center p-3 bg-slate-800/50 border border-slate-700 rounded-xl cursor-pointer hover:border-blue-500/50 transition-all group">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-700 text-blue-500 focus:ring-blue-500/50 bg-slate-900" />
                                    <span className="ml-3 text-sm text-slate-300 group-hover:text-white">{prov}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-800/20 border-t border-slate-800 flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-400 font-medium hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center">
                        <Send className="w-4 h-4 mr-2" />
                        Lanzar Licitación
                    </button>
                </div>
            </div>
        </div>
    );
}
