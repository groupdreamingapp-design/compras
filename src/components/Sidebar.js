"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Search, Settings, PieChart, TrendingUp, ShieldCheck, Utensils, Star, BookOpen, Lightbulb, Users, HelpCircle, Trophy, ChevronDown, ChevronRight } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const operationalCategories = [
    {
        id: 'compras',
        name: 'Compras',
        icon: ShoppingBag,
        items: [
            { name: 'Gestor Compras', href: '/compras/ordenes', icon: ShoppingBag, color: 'text-indigo-500' },
            { name: 'Licitaciones', href: '/compras/licitaciones', icon: TrendingUp, color: 'text-cyan-500' },
            { name: 'Recepción', href: '/compras/recepcion', icon: ShieldCheck, color: 'text-green-500' },
            { name: 'Facturación', href: '/compras/factura', icon: Settings, color: 'text-yellow-500' },
        ]
    },
    {
        id: 'produccion',
        name: 'Producción',
        icon: Utensils,
        items: [
            { name: 'Recetas', href: '/produccion/recetas', icon: Utensils, color: 'text-orange-500' },
            { name: 'Simulador POS', href: '/produccion/ventas', icon: ShoppingBag, color: 'text-sky-400' },
        ]
    },
    {
        id: 'configuracion',
        name: 'Configuración',
        icon: Settings,
        items: [
            { name: 'Maestros', href: '/configuracion/maestros', icon: Settings, color: 'text-slate-400' },
        ]
    }
];

const collaboratorItems = [
    { name: 'Mi Día', href: '/colaborador/mi-dia', icon: LayoutDashboard, color: 'text-emerald-400' },
    { name: 'Mi Carrera', href: '/colaborador/carrera', icon: TrendingUp, color: 'text-blue-400' },
    { name: 'Aprender', href: '/colaborador/aprender', icon: BookOpen, color: 'text-violet-400' },
    { name: 'Mis Ideas', href: '/colaborador/ideas', icon: Lightbulb, color: 'text-amber-400' },
    { name: 'Recompensas', href: '/colaborador/recompensas', icon: Trophy, color: 'text-yellow-400' },
    { name: 'Comunidad', href: '/colaborador/comunidad', icon: Users, color: 'text-pink-400' },
    { name: 'Ayuda', href: '/colaborador/ayuda', icon: HelpCircle, color: 'text-slate-400' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { currentUser } = useUser();
    const [expandedCategories, setExpandedCategories] = React.useState(['compras', 'produccion', 'configuracion']);

    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const isColaborador = currentUser?.Rol === 'Colaborador';

    return (
        <div className="flex h-screen w-64 flex-col bg-slate-900 border-r border-slate-800">
            <div className="flex items-center justify-center h-20 border-b border-slate-800">
                <div className="bg-aurora-primary bg-clip-text text-transparent text-2xl font-bold tracking-tighter">
                    PROPUESTA
                </div>
            </div>

            <div className="flex-1 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                <div className="px-6 mb-4">
                    <span className="text-xs uppercase text-slate-500 font-semibold tracking-wider">
                        {isColaborador ? 'Mi Espacio' : 'Gestión Operativa'}
                    </span>
                </div>

                {isColaborador ? (
                    collaboratorItems.map((item) => (
                        <NavItem key={item.name} item={item} pathname={pathname} />
                    ))
                ) : (
                    operationalCategories.map((category) => (
                        <div key={category.id} className="space-y-1">
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className="w-full flex items-center justify-between px-6 py-2 text-slate-400 hover:text-white transition-colors group"
                            >
                                <div className="flex items-center text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300">
                                    <category.icon className="mr-2 h-4 w-4" />
                                    {category.name}
                                </div>
                                {expandedCategories.includes(category.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>

                            {expandedCategories.includes(category.id) && (
                                <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                                    {category.items.map((item) => (
                                        <NavItem key={item.name} item={item} pathname={pathname} isSubItem />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-slate-800">
                <div className="glass-card p-4 rounded-xl">
                    <div className="text-xs text-slate-400 mb-2">Estado del Sistema</div>
                    <div className="flex items-center text-green-400 text-sm font-bold">
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Operativo
                    </div>
                </div>
            </div>
        </div>
    );
}

function NavItem({ item, pathname, isSubItem = false }) {
    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center py-2.5 text-sm font-medium transition-all duration-200 group relative",
                isSubItem ? "pl-12 pr-6" : "px-6",
                isActive ? "text-white bg-slate-800/50" : "text-slate-400 hover:text-white hover:bg-slate-800/30"
            )}
        >
            {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-gradient-to-b from-pink-500 to-purple-500" />
            )}
            <item.icon className={cn("mr-4 h-5 w-5", isActive ? item.color : "text-slate-500 group-hover:text-slate-300")} />
            {item.name}
        </Link>
    );
}
