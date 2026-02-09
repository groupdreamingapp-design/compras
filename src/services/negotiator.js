import { adminDb as db } from '@/lib/firebaseAdmin';

/**
 * Califica y clasifica a los proveedores para un insumo específico.
 * @param {string} ingredientId - ID del insumo a cotizar.
 * @param {Array} quotes - Array de { supplierId, price, paymentDays }. 
 * @param {number} monthlyInflation - Porcentaje de inflación mensual proyectada.
 * @returns {Promise<Array>} Lista clasificada de proveedores con sus puntajes.
 */
export async function scoreSuppliers(ingredientId, quotes = [], monthlyInflation = 5) {
    if (!db) return [];
    try {
        const providersSnapshot = await db.collection('proveedores').get();
        const allSuppliers = providersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const supplierMap = new Map(allSuppliers.map(s => [s.id, s]));

        let activeQuotes = quotes;
        if (activeQuotes.length === 0) {
            // Generar cotizaciones simuladas para el insumo dado
            activeQuotes = allSuppliers.map(s => {
                const basePrice = 1000;
                const priceVariation = (Math.random() * 200) - 100;
                const paymentDays = parseInt((s.Condicion_Pago || '0').split(' ')[0]) || 0;

                return {
                    supplierId: s.id,
                    price: basePrice + priceVariation,
                    paymentDays: paymentDays
                };
            });
        }

        const minPrice = Math.min(...activeQuotes.map(q => q.price));

        const scoredQuotes = activeQuotes.map(quote => {
            const supplier = supplierMap.get(quote.supplierId);
            if (!supplier) return null;

            const priceScore = (minPrice / quote.price) * 100;
            const financialScore = Math.min((quote.paymentDays / 60) * 100, 100);
            const reliabilityScore = ((supplier.Rating_Calidad || 5) / 5) * 100;

            const finalScore = (priceScore * 0.50) + (financialScore * 0.30) + (reliabilityScore * 0.20);

            return {
                supplierName: supplier.Nombre_Fantasia || supplier.Nombre,
                price: quote.price.toFixed(2),
                paymentDays: quote.paymentDays,
                rating: supplier.Rating_Calidad || 5,
                scores: {
                    price: priceScore.toFixed(1),
                    financial: financialScore.toFixed(1),
                    reliability: reliabilityScore.toFixed(1)
                },
                finalScore: finalScore.toFixed(1),
                recommendationType: priceScore > financialScore ? 'Mejor Precio' : 'Ventaja Financiera'
            };
        }).filter(q => q !== null);

        return scoredQuotes.sort((a, b) => b.finalScore - a.finalScore);
    } catch (e) {
        console.error("Error in scoreSuppliers:", e);
        return [];
    }
}
