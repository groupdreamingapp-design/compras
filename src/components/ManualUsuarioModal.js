
"use client";
import React, { useState } from 'react';
import {
    X, BookOpen, LayoutDashboard, ShoppingBag,
    TrendingUp, ShieldCheck, PieChart, Info,
    CheckCircle, ArrowRight, MousePointer2, HelpCircle
} from 'lucide-react';

export default function ManualUsuarioModal({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('operativa');

    if (!isOpen) return null;

    const tabs = [
        { id: 'operativa', name: 'Gestión Operativa', icon: ShoppingBag },
        { id: 'analitica', name: 'Análisis Estratégico', icon: LayoutDashboard },
        { id: 'graficos', name: 'Guía de Gráficos', icon: PieChart },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <BookOpen className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Manual de Usuario</h2>
                            <p className="text-xs text-slate-400">Guía completa de procesos y procedimientos</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-900/50">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center space-x-2 py-4 text-sm font-medium transition-all relative
                                ${activeTab === tab.id ? 'text-blue-400 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.name}</span>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-900/40">

                    {activeTab === 'operativa' && (
                        <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
                            <Section
                                title="1. Ciclo de Compras"
                                icon={ShoppingBag}
                                color="text-indigo-500"
                                description="Gestión desde la necesidad hasta la facturación."
                            >
                                <Step number="1" title="Órdenes de Compra">
                                    Genera pedidos automáticos basados en sugerencias de stock o manuales.
                                    <span className="block mt-1 text-slate-500">Ubicación: Sidebar > Compras > Gestor Compras.</span>
                                </Step>
                                <Step number="2" title="Licitaciones">
                                    Envía solicitudes de precios a múltiples proveedores. Permite comparar costos para bajar el CMV.
                                </Step>
                                <Step number="3" title="Recepción">
                                    Controla que lo entregado coincida con lo pedido. Es vital para evitar mermas financieras.
                                </Step>
                            </Section>

                            <Section
                                title="2. Producción y Recetas"
                                icon={Utensils}
                                color="text-orange-500"
                                description="Estandarización de costos y simulación."
                            >
                                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                                    <h4 className="flex items-center text-sm font-bold text-white mb-2">
                                        <Info className="w-4 h-4 mr-2 text-blue-400" />
                                        Manual de Escandallo
                                    </h4>
                                    <p className="text-sm text-slate-400 leading-relaxed italic">
                                        "Toda receta debe estar detallada por gramos. Un error de 5g en mozzarella en 1000 pizzas mensuales impacta directamente en tu CMV."
                                    </p>
                                </div>
                            </Section>
                        </div>
                    )}

                    {activeTab === 'analitica' && (
                        <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
                            <Section
                                title="Análisis de Inteligencia de Negocio"
                                icon={LayoutDashboard}
                                color="text-blue-500"
                                description="Herramientas situadas en el Header para seguimiento estratégico."
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl">
                                        <h4 className="font-bold text-white mb-2 flex items-center">
                                            <TrendingUp className="w-4 h-4 mr-2 text-cyan-400" />
                                            Dashboard
                                        </h4>
                                        <p className="text-xs text-slate-400">Visión 360 de ahorros, stock crítico y licitaciones activas.</p>
                                    </div>
                                    <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl">
                                        <h4 className="font-bold text-white mb-2 flex items-center">
                                            <PieChart className="w-4 h-4 mr-2 text-pink-400" />
                                            Estrategia
                                        </h4>
                                        <p className="text-xs text-slate-400">Planificación de compras a largo plazo y análisis de varianza de precios.</p>
                                    </div>
                                </div>
                            </Section>
                        </div>
                    )}

                    {activeTab === 'graficos' && (
                        <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
                            <Section
                                title="Guía de Interpretación de Gráficos"
                                icon={TrendingUp}
                                color="text-emerald-500"
                                description="Cómo leer las métricas para tomar mejores decisiones."
                            >
                                <div className="space-y-6">
                                    <div className="flex items-start space-x-4 p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-emerald-400">Gráfico de Varianza de CMV</h4>
                                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                                Compara el costo teórico vs el real. Si la línea real sube mientras la producción se mantiene estable, indica posibles problemas en la recepción o aumentos de precios no detectados.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4 p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <MousePointer2 className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-blue-400">Heatmap de Proveedores</h4>
                                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                                Muestra visualmente quiénes ofrecen los mejores precios por categoría. Las zonas "verdes" son tus compras más eficientes.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Section>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-800/10 flex justify-between items-center text-xs text-slate-500">
                    <div className="flex items-center">
                        <HelpCircle className="w-4 h-4 mr-1 text-slate-600" />
                        ¿Necesitas más ayuda? Contacta a Soporte Técnico.
                    </div>
                    <div className="font-mono">v1.2 - Propuesta Compras</div>
                </div>
            </div>
        </div>
    );
}

function Section({ title, icon: Icon, color, description, children }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            </div>
            <p className="text-sm text-slate-400">{description}</p>
            <div className="pl-4 border-l-2 border-slate-800 space-y-4 mt-4">
                {children}
            </div>
        </div>
    );
}

function Step({ number, title, children }) {
    return (
        <div className="relative pl-8">
            <div className="absolute left-[-29px] top-0 w-6 h-6 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                {number}
            </div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">{title}</h4>
            <div className="text-xs text-slate-400 leading-relaxed">
                {children}
            </div>
        </div>
    );
}
