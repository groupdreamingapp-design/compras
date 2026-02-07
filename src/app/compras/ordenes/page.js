
import React from 'react';
import Link from 'next/link';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { getOrdersByStatus } from '../../../services/orders';

// In Next.js App Router, we can fetch data directly in Server Components
// But for a Kanban with Draft & Drop, Client Component is easier for state.
// We'll make this Server Component fetch initial data, then pass to Client Kanban.

// Actually, let's keep it simple: Server Component fetches, renders columns.
// Or Client Component fetches on mount.
// Since `orders.js` uses `db.js` (Node-only), we MUST fetch via Server Action or API.
// But `services/orders.js` IS a server-side service.
// So we can use it in a Server Component directly.

// However, I previously imported service in `page.js` and it worked because `page.js` is Server Component by default.
// Let's create `KanbanBoard.js` as a client component and `page.js` as server.

export default async function OrdenesPage() {
    const columns = await getOrdersByStatus(); // Server-side call

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Gestor de Compras</h1>
                <Link href="/compras/ordenes/crear">
                    <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition flex items-center">
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Nueva Orden
                    </button>
                </Link>
            </div>

            {/* Kanban Container */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex space-x-4 min-w-[1000px] h-full pb-4">
                    <Column title="Pendientes" status="Pendiente_Aprobacion" items={columns['Pendiente_Aprobacion']} color="border-yellow-500" />
                    <Column title="Enviadas" status="Enviada" items={columns['Enviada']} color="border-blue-500" />
                    <Column title="Recepcionadas" status="Recepcionada_Parcial" items={columns['Recepcionada_Parcial']} color="border-orange-500" />
                    <Column title="Cerradas" status="Cerrada" items={columns['Cerrada']} color="border-green-500" />
                </div>
            </div>
        </div>
    );
}

function Column({ title, items, color }) {
    return (
        <div className={`flex-1 min-w-[280px] bg-slate-800/50 rounded-xl p-4 border-t-4 ${color} flex flex-col`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-200">{title}</h3>
                <span className="bg-slate-700 text-xs px-2 py-1 rounded text-slate-400">{items.length}</span>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                {items.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded-lg">
                        Vacio
                    </div>
                )}
                {items.map(order => (
                    <Card key={order.ID} order={order} />
                ))}
            </div>
        </div>
    );
}

function Card({ order }) {
    return (
        <Link href={`/compras/ordenes/crear?id=${order.ID}`}>
            <div className="bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-700 hover:border-blue-500 transition group cursor-pointer relative mb-3">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-slate-500">#{order.ID.toString().padStart(4, '0')}</span>
                    <span className="text-xs text-slate-400">{order.Fecha_Emision}</span>
                </div>
                <h4 className="font-medium text-white mb-1">{order.Proveedor}</h4>
                <div className="flex justify-between items-end mt-3">
                    <div className="text-sm font-bold text-emerald-400">
                        ${order.Total_Estimado?.toLocaleString() || 0}
                    </div>
                </div>
            </div>
        </Link>
    );
}

import { MessageCircle } from 'lucide-react';
