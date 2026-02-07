'use client';
import { useState, useEffect } from 'react';
import { getPOSItems, processSale } from '@/actions/salesActions';
import { ShoppingCart, CreditCard, Trash2, CheckCircle, ChefHat } from 'lucide-react';

export default function POSPage() {
    const [items, setItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastSaleId, setLastSaleId] = useState(null);

    useEffect(() => {
        getPOSItems().then(setItems);
    }, []);

    const addToCart = (item) => {
        const existing = cart.find(c => c.recipeId === item.id);
        if (existing) {
            setCart(cart.map(c =>
                c.recipeId === item.id ? { ...c, quantity: c.quantity + 1 } : c
            ));
        } else {
            setCart([...cart, {
                recipeId: item.id,
                name: item.name,
                price: item.price,
                quantity: 1
            }]);
        }
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        const res = await processSale(cart);
        if (res.success) {
            setLastSaleId(res.saleId);
            setCart([]);
            // Clear success msg after 3s
            setTimeout(() => setLastSaleId(null), 3000);
        } else {
            alert('Error: ' + res.error);
        }
        setLoading(false);
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <div className="flex h-screen bg-slate-900 border-l border-slate-800 text-slate-100">
            {/* LEFT: ITEM GRID */}
            <div className="flex-1 p-6 overflow-y-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Punto de Venta</h1>
                    <p className="text-slate-400">Selecciona los productos para registrar la venta y descontar stock.</p>
                </header>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map(item => (
                        <button
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-sky-500 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all group h-32 relative"
                        >
                            <ChefHat className="w-8 h-8 text-slate-600 group-hover:text-sky-400 mb-2 transition-colors" />
                            <span className="font-semibold text-sm line-clamp-2">{item.name}</span>
                            <span className="text-emerald-400 font-bold mt-1">${item.price?.toLocaleString()}</span>

                            {/* Tap Effect Overlay */}
                            <div className="absolute inset-0 bg-white/5 opacity-0 active:opacity-100 rounded-xl transition-opacity pointer-events-none" />
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT: CART SIDEBAR */}
            <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-10">
                <div className="p-4 border-b border-slate-800 bg-slate-800/50">
                    <h2 className="font-bold flex items-center text-lg">
                        <ShoppingCart className="w-5 h-5 mr-2 text-sky-400" />
                        Ticket Actual
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center py-20 text-slate-600 italic">
                            El carrito está vacío
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-800 rounded-lg p-3 border border-slate-700">
                                <div>
                                    <div className="font-medium text-sm">{item.name}</div>
                                    <div className="text-xs text-slate-400">
                                        {item.quantity} x ${item.price.toLocaleString()}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="font-bold text-slate-200">
                                        ${(item.quantity * item.price).toLocaleString()}
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(idx)}
                                        className="text-slate-500 hover:text-red-400 p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* SUCCESS OVERLAY */}
                {lastSaleId && (
                    <div className="absolute inset-x-0 top-20 bg-emerald-600 text-white p-4 text-center shadow-lg animate-in slide-in-from-top-4 fade-in z-20 mx-4 rounded-lg">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                        <div className="font-bold">¡Venta Registrada!</div>
                        <div className="text-sm opacity-90">ID #{lastSaleId}</div>
                    </div>
                )}

                <div className="p-6 bg-slate-800 border-t border-slate-700">
                    <div className="flex justify-between items-center mb-4 text-xl font-bold">
                        <span className="text-slate-400">Total</span>
                        <span className="text-emerald-400">${total.toLocaleString()}</span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={loading || cart.length === 0}
                        className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white py-4 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                        {loading ? 'Procesando...' : (
                            <>
                                <CreditCard className="w-5 h-5 mr-2" />
                                Cobrar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
