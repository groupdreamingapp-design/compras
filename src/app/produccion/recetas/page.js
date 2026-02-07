import Link from 'next/link';
import { getRecipes } from '@/actions/recipeActions';
import { Plus, ChefHat, Salad } from 'lucide-react';

export default async function RecipesPage() {
    const recipes = await getRecipes();

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Fichas Técnicas</h1>
                    <p className="text-slate-400 mt-1">Gestión de recetas, costos y precios de venta.</p>
                </div>
                <Link href="/produccion/recetas/crear">
                    <button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-lg shadow-purple-500/20 transition-all">
                        <Plus className="w-5 h-5 mr-2" />
                        Nueva Receta
                    </button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recipes.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                        No hay recetas registradas.
                    </div>
                )}

                {recipes.map(recipe => (
                    <Link key={recipe.ID} href={`/produccion/recetas/${recipe.ID}`}>
                        <div className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-pink-500/50 rounded-xl p-5 transition-all cursor-pointer relative overflow-hidden">
                            {/* Decorator */}
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <ChefHat className="w-16 h-16 text-pink-500" />
                            </div>

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-pink-400 transition-colors">
                                        {recipe.Nombre_Plato}
                                    </h3>
                                    <p className="text-sm text-slate-400 line-clamp-2">
                                        {recipe.Descripcion || 'Sin descripción'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700/50">
                                <div>
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Costo Teórico</span>
                                    <div className="text-lg font-bold text-slate-200">
                                        ${recipe.Costo_Teorico_Actual?.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Precio Venta</span>
                                    <div className="text-lg font-bold text-emerald-400">
                                        ${recipe.Precio_Venta_Actual?.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-xs">
                                <span className="bg-slate-900/50 px-2 py-1 rounded text-slate-400">
                                    Margen: {((1 - (recipe.Costo_Teorico_Actual / recipe.Precio_Venta_Actual)) * 100).toFixed(1)}%
                                </span>
                                <span className="text-slate-500">
                                    Actualizado: {recipe.Ultima_Actualizacion || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
