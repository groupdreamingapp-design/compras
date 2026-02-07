'use client';

import Sidebar from './Sidebar';
import { Bell, User } from 'lucide-react';
import { useUser } from '../context/UserContext';
import UserSwitcher from './UserSwitcher';

export default function AuthenticatedLayout({ children }) {
    const { currentUser, loading } = useUser();

    if (loading) return <div className="flex h-screen items-center justify-center text-slate-400">Cargando...</div>;

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="flex h-20 items-center justify-between px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm z-10">
                    <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                        GESTIÓN DE COMPRA
                    </h1>

                    <div className="flex items-center space-x-6">
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
                <main className="flex-1 overflow-y-auto p-8 relative">
                    {/* Abstract decorative background */}
                    <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
                    <div className="relative z-0">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
