'use client';
import React, { useState } from 'react';

import Sidebar from './Sidebar';
import { Bell, User, LayoutDashboard, PieChart, Search, HelpCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import UserSwitcher from './UserSwitcher';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ManualUsuarioModal from './ManualUsuarioModal';

export default function AuthenticatedLayout({ children }) {
    const { currentUser, loading } = useUser();
    const pathname = usePathname();
    const [isManualOpen, setIsManualOpen] = useState(false);

    if (loading) return <div className="flex h-screen items-center justify-center text-slate-400">Cargando...</div>;

    const analysisItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Estrategia', href: '/estrategia', icon: PieChart },
        { name: 'Auditoría', href: '/auditoria', icon: Search },
    ];

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="flex h-20 items-center justify-between px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm relative z-10">
                    <div className="flex items-center space-x-12">
                        <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent shrink-0">
                            GESTIÓN DE COMPRA
                        </h1>

                        {/* Analysis Menu */}
                        <nav className="hidden lg:flex items-center bg-slate-800/40 p-1 rounded-xl border border-slate-700/50">
                            {analysisItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                            }`}
                                    >
                                        <item.icon className={`w-4 h-4 mr-2 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center space-x-6">
                        <button
                            onClick={() => setIsManualOpen(true)}
                            className="flex items-center space-x-2 p-2 px-3 text-slate-400 hover:text-white transition-all bg-slate-800/40 hover:bg-slate-800 rounded-xl border border-slate-700/50 group"
                            title="Manual de Usuario"
                        >
                            <HelpCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Manual</span>
                        </button>

                        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-900" />
                        </button>

                        {/* User Profile Area */}
                        <div className="flex items-center space-x-3 pl-6 border-l border-slate-800">
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-medium text-white">{currentUser?.Nombre || 'Usuario'}</div>
                                <div className="text-xs text-slate-500">{currentUser?.Puesto || 'Invitado'}</div>
                            </div>
                            <div className="relative group">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center ring-2 ring-slate-800 cursor-pointer">
                                    <span className="text-white font-bold">{currentUser?.Avatar || <User className="h-5 w-5" />}</span>
                                </div>
                                <UserSwitcher />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-8 relative z-20">
                    {/* Abstract decorative background */}
                    <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
                    <div className="relative z-0">
                        {children}
                    </div>
                </main>
            </div>

            {/* User Manual Modal */}
            <ManualUsuarioModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
        </div>
    );
}
