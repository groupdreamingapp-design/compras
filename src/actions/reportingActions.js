'use server';

import db from '@/lib/db';

export async function getVendorPerformance(providerId) {
    if (!providerId) return null;

    // 1. Quality Score (Based on Receptions)
    // Formula: % of Receptions with Estado_Global = 'Aceptado' (vs 'Rechazado' or 'Condicional')
    // Or better: % of Items Accepted. Let's use Receipt Global Status for simplicity in V1.
    const qualityStats = await db.prepare(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN Estado_Global = 'Aceptado' THEN 1 ELSE 0 END) as accepted,
            SUM(CASE WHEN Estado_Global = 'Rechazado' THEN 1 ELSE 0 END) as rejected
        FROM Recepcion_Mercaderia
        WHERE ID_Proveedor = ?
    `).get(providerId);

    const totalReceipts = qualityStats.total || 0;
    const qualityScore = totalReceipts === 0 ? 100 : ((qualityStats.accepted / totalReceipts) * 100);

    // 2. Timeliness (On Time Delivery)
    // Compare Fecha_Real_Recepcion vs OC.Fecha_Requerida_Entrega
    const timeStats = await db.prepare(`
        SELECT 
            r.Fecha_Real_Recepcion,
            oc.Fecha_Requerida_Entrega
        FROM Recepcion_Mercaderia r
        JOIN Ordenes_Compra oc ON r.ID_OC_Referencia = oc.ID
        WHERE r.ID_Proveedor = ?
    `).all(providerId);

    let onTimeCount = 0;
    timeStats.forEach(t => {
        if (!t.Fecha_Real_Recepcion || !t.Fecha_Requerida_Entrega) return;
        if (new Date(t.Fecha_Real_Recepcion) <= new Date(t.Fecha_Requerida_Entrega)) {
            onTimeCount++;
        }
    });

    const timelinessScore = timeStats.length === 0 ? 100 : ((onTimeCount / timeStats.length) * 100);

    // 3. Reliability / Fulfillment (Items Deliverd vs Ordered)
    // Sum(ReceivedQty) / Sum(OrderedQty) for linked OCs
    // This is expensive if history is huge.
    // Simplified for V1: Just use Quality + Timeliness average, or static placeholder.
    // Let's implement basic Layout/Admin score (e.g. do they send invoices on time?). 
    // Actually, let's keep it simple: Average of Quality and Timeliness for "Global Score".

    // 4. Mock Trends (for Chart)
    // Generate last 6 months dummy data if real data is sparse
    const monthlyTrend = [
        { month: 'Ago', score: 95 },
        { month: 'Sep', score: 92 },
        { month: 'Oct', score: qualityScore }, // Current
    ];

    return {
        scores: {
            global: Math.round((qualityScore + timelinessScore) / 2),
            quality: Math.round(qualityScore),
            timeliness: Math.round(timelinessScore),
            fulfillment: 98 // Hardcoded for V1 until detail matching is robust
        },
        stats: {
            totalOrders: totalReceipts, // Approx
            rejectedParams: qualityStats.rejected
        },
        trend: monthlyTrend
    };
}
