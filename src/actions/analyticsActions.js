'use server';

import { adminDb as db } from '@/lib/firebaseAdmin';

export async function getMenuEngineeringData() {
    if (!db) return { items: [], averages: {} };
    try {
        const salesSnapshot = await db.collection('ventas_detalle').get();
        const recipesSnapshot = await db.collection('recetas').get();

        if (recipesSnapshot.empty) return { items: [], averages: {} };

        const salesMap = {};
        salesSnapshot.forEach(doc => {
            const d = doc.data();
            const rid = d.ID_Receta?.toString();
            if (!salesMap[rid]) salesMap[rid] = 0;
            salesMap[rid] += (d.Cantidad || 0);
        });

        let totalSalesQty = 0;
        let totalMarginSum = 0;

        const combined = recipesSnapshot.docs.map(doc => {
            const r = doc.data();
            const id = doc.id;
            const sold = salesMap[id] || 0;
            const cost = r.Costo_Teorico_Actual || 0;
            const price = r.Precio_Venta_Actual || 0;
            const margin = price - cost;

            totalSalesQty += sold;
            totalMarginSum += (margin * sold);

            return {
                id: id,
                name: r.Nombre_Plato,
                price,
                cost,
                margin,
                sold
            };
        });

        const avgMargin = totalSalesQty > 0 ? (totalMarginSum / totalSalesQty) : 0;
        const n = combined.length;
        const expectedShare = n > 0 ? (1 / n) : 0;
        const popularityBenchmark = (totalSalesQty * expectedShare * 0.7);

        const items = combined.map(i => {
            const isHighMargin = i.margin >= avgMargin;
            const isHighPop = i.sold >= popularityBenchmark;

            let classification = '';
            if (isHighMargin && isHighPop) classification = 'STAR';
            else if (!isHighMargin && isHighPop) classification = 'PLOWHORSE';
            else if (isHighMargin && !isHighPop) classification = 'PUZZLE';
            else classification = 'DOG';

            return { ...i, classification };
        });

        return {
            items,
            averages: {
                margin: avgMargin,
                popularity: popularityBenchmark,
                totalSales: totalSalesQty
            }
        };
    } catch (e) {
        console.error("Error in getMenuEngineeringData:", e);
        return { items: [], averages: {} };
    }
}
