'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { createOrder, getOrderById, updateOrder } from '@/actions/orderActions';
import { ArrowLeft, Search, Save, Calendar, MapPin, UserCheck, ShieldCheck, Plus, Trash2 } from 'lucide-react';

export default function CreateOrderPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('id');
    const isEditing = !!orderId;

    // Header State
    const [header, setHeader] = useState({
        providerId: '',
        branch: 'Central',
        requesterId: 1, // Mock
        approverId: '', // Mock selection
        requiredDate: '',
        comments: ''
    });

    // Items State
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    // Mock Data (Should be fetched)
    const providers = [
        { id: 1, name: 'Carnes del Sur' },
        { id: 2, name: 'Distribuidora Central' },
        { id: 3, name: 'Café Import' }
    ];

    // Mock Data (Should be fetched with Full Insumo Details)
    const insumosMock = [
        { id: 1, name: 'Lomo Vetado', unit: 'Caja', content: 20, stockUnit: 'Kg', price: 10000 }, // Price per Kg? Or per Box? Usually price is per Buy Unit. Let's say 200k/Box -> 10k/Kg.
        { id: 2, name: 'Salmón Premium', unit: 'Pieza', content: 5, stockUnit: 'Kg', price: 15000 },
        { id: 3, name: 'Fernet Branca', unit: 'Caja', content: 6, stockUnit: 'Botella', price: 7500 } // Price per Bottle
    ];

    useEffect(() => {
        if (isEditing) {
            setLoadingData(true);
            getOrderById(orderId).then(data => {
                if (data) {
                    setHeader({
                        providerId: data.header.providerId,
                        branch: data.header.branch,
                        requesterId: data.header.requesterId,
                        approverId: data.header.approverId || '',
                        requiredDate: data.header.requiredDate || '',
                        comments: data.header.comments || ''
                    });
                    setItems(data.items.map(i => ({
                        id: i.insumoId, // Assuming insumoId from backend maps to local 'id'
                        name: i.name,
                        unit: i.buyUnit, // Assuming backend returns buyUnit
                        content: i.conversionFactor, // Assuming backend returns conversionFactor
                        stockUnit: i.stockUnit || 'Unidad', // fallback
                        price: i.price,
                        buyQty: i.buyQty,
                        finalQty: i.finalQty, // Corrected property name from backend
                        finalUnit: i.unit // This is the final unit (stockUnit)
                    })));
                }
                setLoadingData(false);
            });
        }
    }, [orderId, isEditing]);

    const addItem = (insumo) => {
        // Default to 1 Buying Unit (e.g. 1 Box)
        setItems(prev => [...prev, {
            ...insumo,
            buyQty: 1, // User inputs Boxes
            finalQty: insumo.content, // System calculated Kg
            finalUnit: insumo.stockUnit
        }]);
    };

    const updateQty = (idx, val) => {
        const newItems = [...items];
        const qty = parseFloat(val) || 0;
        newItems[idx].buyQty = qty;
        newItems[idx].finalQty = qty * (newItems[idx].content || 1);
        setItems(newItems);
    };

    const removeItem = (idxToRemove) => {
        setItems(prev => prev.filter((_, idx) => idx !== idxToRemove));
    };

    const totalEstimado = items.reduce((acc, i) => acc + (i.finalQty * i.price), 0);

    const handleSubmit = async () => {
        if (!header.providerId || items.length === 0) return alert('Complete los datos obligatorios');

        setLoading(true);
        const payload = {
            ...header,
            items: items.map(i => ({
                insumoId: i.id,
                qty: i.finalQty, // Store 40 Kg, not 2 Boxes
                unit: i.finalUnit, // Store Kg
                price: i.price, // Price per Kg
                buyQty: i.buyQty, // Store the buy quantity
                buyUnit: i.unit, // Store the buy unit
                conversionFactor: i.content // Store the conversion factor
                // Append observation? Usually handled in Comments or a specific field if schema allows.
                // Assuming backend doesn't support 'LineComment' yet, we skip or add to main comment? 
                // For now, core request is "Pido 2 cajas -> Se piden 40kg". Logic satisfied using finalQwty.
            }))
        };

        let res;
        if (isEditing) {
            res = await updateOrder(orderId, payload);
            if (res.success) alert('Orden actualizada!');
        } else {
            res = await createOrder(payload);
            if (res.success) alert(`Orden ${res.nroOC} creada exitosamente!`);
        }

        if (res?.success) {
            router.push('/compras/ordenes');
        } else {
            alert('Error al procesar orden');
        }
        setLoading(false);
    };

    if (loadingData) return <div className="p-8 text-white">Cargando Orden...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto pb-20">
            {/* Header Title */}
            <div className="flex items-center mb-8">
                <Link href="/compras/ordenes" className="mr-4 p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Search className="text-purple-400" /> {isEditing ? `Editar Orden #${orderId}` : 'Nueva Orden de Compra'}
                </h1>
            </div>

            {/* HEADER FORM */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-8 grid grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">

                {/* Col 1: Provider & Branch */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Proveedor</label>
                        <select
                            className="input-dark w-full"
                            value={header.providerId}
                            onChange={(e) => setHeader({ ...header, providerId: e.target.value })}
                            disabled={isEditing} // Often provider can't convert if we change it? Let's leave enabled but warn? For simplicity disabled to avoid price recalc issues.
                        >
                            <option value="">Seleccionar...</option>
                            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Sucursal Destino</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <select
                                className="input-dark w-full pl-10"
                                value={header.branch}
                                onChange={(e) => setHeader({ ...header, branch: e.target.value })}
                            >
                                <option value="Central">Sucursal Central</option>
                                <option value="Norte">Sucursal Norte</option>
                                <option value="Playa">Sucursal Playa</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Col 2: Dates & Requester */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Fecha Requerida Entrega</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <input
                                type="date"
                                className="input-dark w-full pl-10"
                                value={header.requiredDate}
                                onChange={(e) => setHeader({ ...header, requiredDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Solicitado Por</label>
                        <div className="relative">
                            <UserCheck className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <input className="input-dark w-full pl-10 bg-slate-900 text-slate-500" value="Usuario Actual (Juan)" disabled />
                        </div>
                    </div>
                </div>

                {/* Col 3: Approver & Totals */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Aprobador (Si excede monto)</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <select
                                className="input-dark w-full pl-10"
                                value={header.approverId}
                                onChange={(e) => setHeader({ ...header, approverId: e.target.value })}
                            >
                                <option value="">No requiere (Auto)</option>
                                <option value="2">Gerente Compras</option>
                                <option value="3">Director Financiero</option>
                            </select>
                        </div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-right">
                        <div className="text-slate-400 text-xs uppercase tracking-wider">Total Estimado</div>
                        <div className="text-2xl font-bold text-emerald-400">
                            ${totalEstimado.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* ITEM SELECTION */}
            <div className="grid grid-cols-12 gap-8">
                {/* Search Panel */}
                <div className="col-span-4 bg-slate-800 p-4 rounded-xl border border-slate-700 h-fit">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-purple-400" /> Agregar Insumos
                    </h3>
                    <div className="space-y-2">
                        {insumosMock.map(ins => (
                            <div key={ins.id} onClick={() => addItem(ins)} className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg cursor-pointer flex justify-between items-center transition-colors group">
                                <div>
                                    <div className="text-white text-sm font-medium">{ins.name}</div>
                                    <div className="text-xs text-slate-400">{ins.unit} ({ins.content} {ins.stockUnit})</div>
                                </div>
                                <div className="text-emerald-400 font-bold text-sm group-hover:text-emerald-300">
                                    ${ins.price.toLocaleString()} /{ins.stockUnit}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="col-span-8 bg-slate-800 p-4 rounded-xl border border-slate-700 min-h-[400px]">
                    <h3 className="text-white font-bold mb-4">Detalle de Orden</h3>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 text-sm border-b border-slate-700">
                                <th className="p-2">Insumo</th>
                                <th className="p-2 text-center">Cant. Recipiente</th>
                                <th className="p-2 text-center">Conversión</th>
                                <th className="p-2 text-right">Cant. Real</th>
                                <th className="p-2 text-right">Subtotal</th>
                                <th className="p-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {items.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                    <td className="p-2 text-white">
                                        {item.name}
                                        <div className="text-xs text-slate-500">Unidad: {item.unit}</div>
                                    </td>
                                    <td className="p-2 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <input
                                                type="number"
                                                className="bg-slate-900 text-white w-16 p-1 rounded border border-slate-600 text-center focus:border-purple-500 outline-none"
                                                value={item.buyQty}
                                                onChange={(e) => updateQty(idx, e.target.value)}
                                            />
                                            <span className="text-xs text-slate-400">{item.unit}s</span>
                                        </div>
                                    </td>
                                    <td className="p-2 text-center text-xs text-slate-400">
                                        x {item.content} {item.stockUnit}
                                    </td>
                                    <td className="p-2 text-right font-medium text-purple-300">
                                        {item.finalQty} {item.stockUnit}
                                    </td>
                                    <td className="p-2 text-right text-white font-bold">${(item.finalQty * item.price).toLocaleString()}</td>
                                    <td className="p-2 text-center">
                                        <button onClick={() => removeItem(idx)} className="text-slate-500 hover:text-red-400 transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-500 italic">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mb-2">
                                                <Search className="w-6 h-6 text-slate-600" />
                                            </div>
                                            Seleccione insumos del panel izquierdo para comenzar.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="btn-primary px-8 py-3 flex items-center gap-2 shadow-lg shadow-purple-500/20"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Procesando...' : (isEditing ? 'Actualizar Orden' : 'Generar Orden de Compra')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
