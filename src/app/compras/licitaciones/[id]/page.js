
"use client";
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ChevronLeft, Send, Users, Package, Clock,
    CheckCircle2, MessageSquare, ExternalLink,
    MoreVertical, AlertCircle, FileText
} from 'lucide-react';

export default function LicitacionDetallePage() {
    const router = useRouter();
    const { id } = useParams();

    // Mock data for the specific tender
    const [licitacion, setLicitacion] = useState({
        id: id || 'LIC-2026-001',
        status: 'abierta',
        fechaCreacion: '2026-02-07 10:30',
        fechaLimite: '2026-02-12',
        productos: [
            { id: 101, nombre: 'Harina 0000 x 25kg', cantidad: '20 bolsas', especificaciones: 'Marca preferida: Chacabuco o similar.' },
            { id: 102, nombre: 'Levadura Fresca x 500g', cantidad: '50 unidades', especificaciones: 'Entrega en frío obligatoria.' },
        ],
        proveedores: [
            { id: 1, nombre: 'Distribuidora Norte', status: 'ofrecido', precioTotal: '$12,500', fechaOferta: 'Hace 2 horas', comentario: 'Disponibilidad inmediata.' },
            { id: 2, nombre: 'Molinos de la Plata', status: 'visto', precioTotal: '-', fechaOferta: '-', comentario: '' },
            { id: 3, nombre: 'Lácteos del Sur', status: 'pendiente', precioTotal: '-', fechaOferta: '-', comentario: '' },
        ]
    });

    return (
        <div className="space-y-8 pb-12">
            {/* Header / Breadcrumbs */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-slate-400 hover:text-white transition-colors group"
                >
                    <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Volver a Licitaciones
                </button>
                <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors flex items-center">
                        <MoreVertical className="w-4 h-4 mr-2" />
                        Acciones
                    </button>
                    <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all">
                        Cerrar Licitación
                    </button>
                </div>
            </div>

            {/* Main Info Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Header Details */}
                    <div className="glass-card p-8 rounded-3xl border border-slate-800 bg-slate-900/40">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="flex items-center space-x-3 mb-2">
                                    <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                        {licitacion.id}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider
                                        ${licitacion.status === 'abierta' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-500/10 text-slate-400'}`}>
                                        <Clock className="w-3 h-3 mr-1" />
                                        {licitacion.status}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-bold text-white">Detalle de Solicitud</h2>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Creada el</div>
                                <div className="text-sm text-slate-300">{licitacion.fechaCreacion}</div>
                            </div>
                        </div>

                        {/* Products List */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                <Package className="w-4 h-4 mr-2 text-blue-500" />
                                Insumos Solicitados ({licitacion.productos.length})
                            </h3>
                            <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/50">
                                {licitacion.productos.map((prod) => (
                                    <div key={prod.id} className="p-4 hover:bg-slate-800/20 transition-colors">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="text-sm font-bold text-white">{prod.nombre}</div>
                                            <div className="text-xs font-mono text-blue-400">{prod.cantidad}</div>
                                        </div>
                                        <div className="text-xs text-slate-500 italic">{prod.especificaciones}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Offers Comparison */}
                    <div className="glass-card p-8 rounded-3xl border border-slate-800 bg-slate-900/40">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center mb-6">
                            <FileText className="w-4 h-4 mr-2 text-emerald-500" />
                            Comparativa de Ofertas
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                                    <tr>
                                        <th className="pb-4 font-semibold">Proveedor</th>
                                        <th className="pb-4 font-semibold">Estado</th>
                                        <th className="pb-4 font-semibold">Oferta Total</th>
                                        <th className="pb-4 font-semibold"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {licitacion.proveedores.map((prov) => (
                                        <tr key={prov.id} className="group">
                                            <td className="py-4 font-medium text-white">{prov.nombre}</td>
                                            <td className="py-4">
                                                <span className={`text-xs px-2 py-1 rounded-full border
                                                    ${prov.status === 'ofrecido' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                        prov.status === 'visto' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            'bg-slate-800 text-slate-500 border-slate-700'}`}>
                                                    {prov.status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-sm font-bold text-slate-300">{prov.precioTotal}</td>
                                            <td className="py-4 text-right">
                                                <button className="p-2 text-slate-500 hover:text-white transition-colors">
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats / Actions */}
                <div className="space-y-6">
                    <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-blue-600/5">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Resumen de Seguimiento</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                <span className="text-xs text-slate-500">Días para el cierre</span>
                                <span className="text-sm font-bold text-white">5 días</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                <span className="text-xs text-slate-500">Invitaciones enviadas</span>
                                <span className="text-sm font-bold text-white">3</span>
                            </div>
                            <div className="flex justify-between items-center bg-green-500/5 p-3 rounded-xl border border-green-500/10">
                                <span className="text-xs text-green-500/70">Ofertas recibidas</span>
                                <span className="text-sm font-bold text-green-400">1</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-amber-600/5">
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4">Nota Importante</h4>
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Una vez cerrada la licitación, los proveedores no podrán modificar sus ofertas y podrás adjudicar la orden al ganador.
                            </p>
                        </div>
                    </div>

                    <button className="w-full flex items-center justify-center py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all border border-slate-700">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Chatear con Proveedores
                    </button>
                </div>
            </div>
        </div>
    );
}
