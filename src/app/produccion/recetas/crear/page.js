'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getInsumosForSelect, createRecipe, updateRecipe, getRecipeById } from '@/actions/recipeActions';
import { Save, ArrowLeft, Plus, Trash2, Calculator, Info } from 'lucide-react';

export default function CreateRecipePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const recipeId = searchParams.get('id');
    const isEditing = !!recipeId;

    const [loading, setLoading] = useState(false);
    const [insumos, setInsumos] = useState([]);

    // Header State
    const [header, setHeader] = useState({
        name: '',
        price: '',
        targetMargin: 30, // %
        description: ''
    });

    // Items State
    const [items, setItems] = useState([]);

    // Derived Metrics
    const [stats, setStats] = useState({ cost: 0, margin: 0, suggestedPrice: 0 });

    useEffect(() => {
        // Load Insumos
        getInsumosForSelect().then(setInsumos);

        // Load Recipe if editing
        if (isEditing) {
            setLoading(true);
            getRecipeById(recipeId).then(data => {
                if (data) {
                    setHeader({
                        name: data.header.Nombre_Plato,
                        price: data.header.Precio_Venta_Actual,
                        targetMargin: data.header.Margen_Objetivo_Pct || 30,
                        description: data.header.Descripcion || ''
                    });
                    setItems(data.items.map(i => ({
                        insumoId: i.ID_Insumo,
                        qty: i.qty,
                        unit: i.unit,
                        price: i.cost / i.qty, // implied unit cost
                        ppp: i.ppp,
                        // Helper for UI
                        name: i.name
                    })));
                } // else handle 404
                setLoading(false);
            });
        }
    }, [recipeId, isEditing]);

    // Recalculate metrics whenever items or header changes
    useEffect(() => {
        const totalCost = items.reduce((acc, item) => {
            // If we have PPP, calculate cost. 
            // NOTE: Ideally we check unit conversion here. 
            // For MVP: Assuming Insumo PPP is per 'stockUnit' and Recipe uses 'stockUnit' 
            // OR we rely on a simplified 'price' field if we want to override.
            // Let's use PPP from insumo list if available match.
            const insumoMatch = insumos.find(i => i.id == item.insumoId);
            const unitCost = insumoMatch ? insumoMatch.ppp : 0;
            return acc + (unitCost * parseFloat(item.qty || 0));
        }, 0);

        const currentPrice = parseFloat(header.price) || 0;
        const margin = currentPrice > 0 ? ((1 - (totalCost / currentPrice)) * 100) : 0;

        // Suggested Price = Cost / (1 - Target%)
        const target = parseFloat(header.targetMargin) / 100;
        const suggested = target < 1 ? (totalCost / (1 - target)) : 0;

        setStats({
            cost: totalCost,
            margin: margin,
            suggestedPrice: suggested
        });
    }, [items, header.price, header.targetMargin, insumos]);

    const handleAddItem = () => {
        setItems([...items, { insumoId: '', qty: 0, unit: 'Unidad' }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // If insumo changed, update unit/name
        if (field === 'insumoId') {
            const match = insumos.find(i => i.id == value);
            if (match) {
                newItems[index].name = match.name;
                newItems[index].unit = match.useUnit || match.stockUnit;
                newItems[index].ppp = match.ppp;
            }
        }
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!header.name) return alert('Nombre requerido');
        if (items.length === 0) return alert('Agregue ingredientes');

        setLoading(true);
        const payload = {
            name: header.name,
            price: parseFloat(header.price) || 0,
            targetMargin: parseFloat(header.targetMargin),
            description: header.description,
            items: items.map(i => ({
                insumoId: i.insumoId,
                qty: parseFloat(i.qty),
                unit: i.unit
            }))
        };

        let res;
        if (isEditing) {
            res = await updateRecipe(recipeId, payload);
        } else {
            res = await createRecipe(payload);
        }

        if (res.success) {
            router.push('/produccion/recetas');
        } else {
            alert('Error: ' + res.error);
        }
        setLoading(false);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        {isEditing ? `Editar Receta #${recipeId}` : 'Nueva Receta'}
                    </h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-emerald-900/20 flex items-center transition-all disabled:opacity-50"
                >
                    <Save className="w-5 h-5 mr-2" />
                    {loading ? 'Guardando...' : 'Guardar Ficha'}
                </button>
            </div>

            {/* HEADER CARD */}
            <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nombre del Plato</label>
                        <input
                            type="text"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-pink-500 outline-none"
                            value={header.name}
                            onChange={e => setHeader({ ...header, name: e.target.value })}
                            placeholder="Ej. Bife de Chorizo"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Descripción</label>
                        <textarea
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-pink-500 outline-none h-24"
                            value={header.description}
                            onChange={e => setHeader({ ...header, description: e.target.value })}
                            placeholder="Instrucciones breves o notas..."
                        />
                    </div>
                </div>

                {/* METRICS PANEL */}
                <div className="space-y-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Precio Venta (ARS)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-800 border-2 border-slate-600 focus:border-emerald-500 rounded-lg px-4 py-2 text-emerald-400 font-bold text-lg outline-none"
                                value={header.price}
                                onChange={e => setHeader({ ...header, price: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Margin Target (%)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none"
                                value={header.targetMargin}
                                onChange={e => setHeader({ ...header, targetMargin: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/50 text-center">
                        <div className="p-2 bg-slate-800 rounded">
                            <div className="text-xs text-slate-500">Costo Teorico</div>
                            <div className="text-lg font-bold text-red-400">${stats.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        </div>
                        <div className="p-2 bg-slate-800 rounded">
                            <div className="text-xs text-slate-500">Margen Real</div>
                            <div className={`text-lg font-bold ${stats.margin < header.targetMargin ? 'text-yellow-500' : 'text-emerald-500'}`}>
                                {stats.margin.toFixed(1)}%
                            </div>
                        </div>
                        <div className="p-2 bg-slate-800 rounded">
                            <div className="text-xs text-slate-500">Sugerido</div>
                            <div className="text-lg font-bold text-blue-400">${stats.suggestedPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* INGREDIENTS LIST */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-200 flex items-center">
                        <Calculator className="w-4 h-4 mr-2 text-pink-500" />
                        Estructura de Costos
                    </h3>
                    <button onClick={handleAddItem} className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded border border-slate-600 transition text-white">
                        + Agregar Insumo
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-900/80 text-xs uppercase font-medium text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Insumo</th>
                                <th className="px-4 py-3 w-32">Cantidad</th>
                                <th className="px-4 py-3 w-32">Unidad</th>
                                <th className="px-4 py-3 w-32 text-right">Costo Unit.</th>
                                <th className="px-4 py-3 w-32 text-right">Subtotal</th>
                                <th className="px-4 py-3 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {items.map((item, idx) => {
                                const insumoData = insumos.find(i => i.id == item.insumoId);
                                const unitCost = insumoData ? insumoData.ppp : 0;
                                const subtotal = unitCost * (parseFloat(item.qty) || 0);

                                return (
                                    <tr key={idx} className="hover:bg-slate-800/30">
                                        <td className="px-4 py-2">
                                            {insumos.length > 0 ? (
                                                <select
                                                    className="w-full bg-transparent border-b border-slate-700 focus:border-pink-500 outline-none py-1 text-white"
                                                    value={item.insumoId}
                                                    onChange={e => handleItemChange(idx, 'insumoId', e.target.value)}
                                                >
                                                    <option value="" className="bg-slate-800">Seleccionar...</option>
                                                    {insumos.map(i => (
                                                        <option key={i.id} value={i.id} className="bg-slate-800">
                                                            {i.name} ({i.stockUnit}) - ${i.ppp?.toFixed(0)}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-yellow-500 flex items-center gap-1"><Info className="w-3 h-3" /> Cargando insumos...</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                className="w-full bg-slate-900/50 rounded px-2 py-1 text-white outline-none focus:ring-1 focus:ring-pink-500"
                                                value={item.qty}
                                                onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                                                step="0.001"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="text-slate-500">{item.unit || '-'}</span>
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono">
                                            ${unitCost.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono font-bold text-slate-300">
                                            ${subtotal.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-300 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {items.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        Agrega ingredientes para calcular el costo.
                    </div>
                )}
            </div>
        </div>
    );
}
