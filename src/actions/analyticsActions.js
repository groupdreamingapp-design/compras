'use server';

import db from '@/lib/db';

export async function getMenuEngineeringData() {
    // 1. Get Sales Aggregated by Recipe (Popularity)
    // For MVP we take ALL time sales. In prod, this should be filtered by date.
    const sales = await db.prepare(`
        SELECT ID_Receta, SUM(Cantidad) as totalSold
        FROM Ventas_Detalle
        GROUP BY ID_Receta
    `).all();

    // 2. Get Recipe Details (Profitability)
    const recipes = await db.prepare(`
        SELECT ID, Nombre_Plato, Precio_Venta_Actual, Costo_Teorico_Actual
        FROM Recetas
    `).all();

    if (recipes.length === 0) return { items: [], averages: {} };

    // 3. Combine Data
    let totalSalesQty = 0;
    let totalMarginSum = 0; // for weighted average

    const combined = recipes.map(r => {
        const sold = sales.find(s => s.ID_Receta === r.ID)?.totalSold || 0;
        const cost = r.Costo_Teorico_Actual || 0;
        const price = r.Precio_Venta_Actual || 0;
        const margin = price - cost; // Contribution Margin ($)

        totalSalesQty += sold;
        totalMarginSum += (margin * sold);

        return {
            id: r.ID,
            name: r.Nombre_Plato,
            price,
            cost,
            margin,
            sold
        };
    });

    // 4. Calculate Thresholds
    // Average Margin (Weighted)
    const avgMargin = totalSalesQty > 0 ? (totalMarginSum / totalSalesQty) : 0;

    // Average Popularity (100% / N * 70%) - Common Kasavana/Smith model rule
    // Or simpler: Median. Let's use (1 / N) * 0.7 * TotalSales
    // "High Popularity" is usually defined as > 70% of Expected Popularity (1/N)
    const n = combined.length;
    const expectedShare = n > 0 ? (1 / n) : 0;
    const popularityBenchmark = (totalSalesQty * expectedShare * 0.7);

    // 5. Classify
    const items = combined.map(i => {
        const isHighMargin = i.margin >= avgMargin;
        const isHighPop = i.sold >= popularityBenchmark;

        let classification = '';
        if (isHighMargin && isHighPop) classification = 'STAR';      // High Profit, High Pop
        else if (!isHighMargin && isHighPop) classification = 'PLOWHORSE'; // Low Profit, High Pop
        else if (isHighMargin && !isHighPop) classification = 'PUZZLE';  // High Profit, Low Pop
        else classification = 'DOG';                                     // Low Profit, Low Pop

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
}
