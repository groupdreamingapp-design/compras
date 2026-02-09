'use server';

import { adminDb as db } from '@/lib/firebaseAdmin';

export async function getInflationData() {
    if (!db) return { items: [], data: [] };
    try {
        const detailSnapshot = await db.collection('detalle_factura').get();
        const spendMap = {};
        detailSnapshot.forEach(doc => {
            const d = doc.data();
            if (!spendMap[d.ID_Insumo]) spendMap[d.ID_Insumo] = 0;
            spendMap[d.ID_Insumo] += (d.Cantidad_Facturada * d.Precio_Unitario_Facturado);
        });

        // Get Top 5 IDs
        const topItemIds = Object.keys(spendMap)
            .sort((a, b) => spendMap[b] - spendMap[a])
            .slice(0, 5);

        if (topItemIds.length === 0) {
            return { items: ['Lomo Vetado', 'Aceite Oliva', 'Harina 0000'], data: generateMockHistory() };
        }

        const insumosSnapshot = await db.collection('insumos').get();
        const insumosMap = {};
        insumosSnapshot.forEach(doc => { insumosMap[doc.id] = doc.data().Nombre; });

        const facturaSnapshot = await db.collection('facturas').orderBy('Fecha_Emision', 'asc').get();
        const facturasMap = {};
        facturaSnapshot.forEach(doc => { facturasMap[doc.id] = doc.data(); });

        const chartDataMap = new Map();
        detailSnapshot.forEach(doc => {
            const d = doc.data();
            if (!topItemIds.includes(d.ID_Insumo.toString())) return;

            const factura = facturasMap[d.ID_Factura];
            if (!factura) return;

            const date = new Date(factura.Fecha_Emision).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
            if (!chartDataMap.has(date)) {
                chartDataMap.set(date, { date });
            }
            const entry = chartDataMap.get(date);
            entry[insumosMap[d.ID_Insumo]] = d.Precio_Unitario_Facturado;
        });

        if (chartDataMap.size < 2) {
            const names = topItemIds.map(id => insumosMap[id]);
            return { items: names, data: generateMockHistory(names) };
        }

        return {
            items: topItemIds.map(id => insumosMap[id]),
            data: Array.from(chartDataMap.values())
        };
    } catch (error) {
        console.error("Error in getInflationData:", error);
        return { items: [], data: [] };
    }
}

export async function getABCAnalysis() {
    if (!db) return { items: [], summary: { a: 0, b: 0, c: 0 } };
    try {
        const detailSnapshot = await db.collection('detalle_factura').get();
        const spendMap = {};
        detailSnapshot.forEach(doc => {
            const d = doc.data();
            if (!spendMap[d.ID_Insumo]) spendMap[d.ID_Insumo] = 0;
            spendMap[d.ID_Insumo] += (d.Cantidad_Facturada * d.Precio_Unitario_Facturado);
        });

        const insumosSnapshot = await db.collection('insumos').get();
        const insumosMap = {};
        insumosSnapshot.forEach(doc => { insumosMap[doc.id] = doc.data().Nombre; });

        const spendData = Object.keys(spendMap).map(id => ({
            Nombre: insumosMap[id] || 'Insumo Desconocido',
            TotalValue: spendMap[id]
        })).sort((a, b) => b.TotalValue - a.TotalValue);

        if (spendData.length === 0) return { items: [], summary: { a: 0, b: 0, c: 0 } };

        const totalSpend = spendData.reduce((acc, curr) => acc + curr.TotalValue, 0);
        let cumulative = 0;

        const classifiedItems = spendData.map(item => {
            cumulative += item.TotalValue;
            const percentage = (cumulative / totalSpend) * 100;
            let classification = 'C';
            if (percentage <= 80) classification = 'A';
            else if (percentage <= 95) classification = 'B';

            return { ...item, cumulativePercentage: percentage, classification };
        });

        const summary = {
            a: classifiedItems.filter(i => i.classification === 'A').length,
            b: classifiedItems.filter(i => i.classification === 'B').length,
            c: classifiedItems.filter(i => i.classification === 'C').length
        };

        return { items: classifiedItems, summary, totalSpend };
    } catch (error) {
        console.error("Error in getABCAnalysis:", error);
        return { items: [], summary: { a: 0, b: 0, c: 0 } };
    }
}

function generateMockHistory(itemNames = ['Lomo Vetado', 'Salmón Rosado', 'Aceite Trufa']) {
    const months = ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'];
    return months.map((m, idx) => {
        const entry = { date: m };
        itemNames.forEach(name => {
            const base = 1000 + (name.length * 100);
            const inflation = 1 + (idx * 0.05) + (Math.random() * 0.05);
            entry[name] = Math.round(base * inflation);
        });
        return entry;
    });
}
