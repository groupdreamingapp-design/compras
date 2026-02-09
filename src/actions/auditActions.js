'use server';

import { adminDb as db } from '@/lib/firebaseAdmin';

export async function getTopInflationIngredients() {
    if (!db) return [];
    try {
        // Fetch all invoice details and invoices to calculate price changes
        // SQL: Join Detalle_Factura + Facturas.
        const facturaSnapshot = await db.collection('facturas').orderBy('Fecha_Emision', 'desc').get();
        const facturasMap = {};
        facturaSnapshot.forEach(doc => { facturasMap[doc.id] = doc.data(); });

        const detailSnapshot = await db.collection('detalle_factura').get();
        const insumoPrices = {};

        detailSnapshot.forEach(doc => {
            const data = doc.data();
            const factura = facturasMap[data.ID_Factura];
            if (!factura) return;

            if (!insumoPrices[data.ID_Insumo]) insumoPrices[data.ID_Insumo] = [];
            insumoPrices[data.ID_Insumo].push({
                precio: data.Precio_Unitario_Facturado,
                fecha: factura.Fecha_Emision
            });
        });

        // Filter for top 10 with highest increase
        const insumosSnapshot = await db.collection('insumos').get();
        const insumosMap = {};
        insumosSnapshot.forEach(doc => { insumosMap[doc.id] = doc.data().Nombre; });

        const results = Object.keys(insumoPrices).map(id => {
            const history = insumoPrices[id].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            if (history.length < 2) return null;

            const lastPrice = history[0].precio;
            const prevPrice = history[1].precio;
            const changePercent = ((lastPrice - prevPrice) / prevPrice) * 100;

            if (changePercent <= 0) return null;

            return {
                Nombre: insumosMap[id] || 'Insumo Desconocido',
                LastPrice: lastPrice,
                PrevPrice: prevPrice,
                ChangePercent: changePercent
            };
        }).filter(Boolean);

        return results.sort((a, b) => b.ChangePercent - a.ChangePercent).slice(0, 10);
    } catch (error) {
        console.error("Error in getTopInflationIngredients:", error);
        return [];
    }
}

export async function getSupplierDependence() {
    if (!db) return [];
    try {
        const detailSnapshot = await db.collection('detalle_factura').get();
        const facturaSnapshot = await db.collection('facturas').get();
        const facturasMap = {};
        facturaSnapshot.forEach(doc => { facturasMap[doc.id] = doc.data(); });

        const supplierSpend = {};
        detailSnapshot.forEach(doc => {
            const data = doc.data();
            const factura = facturasMap[data.ID_Factura];
            if (!factura) return;

            const provID = factura.ID_Proveedor;
            if (!supplierSpend[provID]) supplierSpend[provID] = { TotalSpend: 0, TotalOrders: new Set() };
            supplierSpend[provID].TotalSpend += (data.Cantidad_Facturada * data.Precio_Unitario_Facturado);
            supplierSpend[provID].TotalOrders.add(data.ID_Factura);
        });

        const providersSnapshot = await db.collection('proveedores').get();
        const providersMap = {};
        providersSnapshot.forEach(doc => { providersMap[doc.id] = doc.data().Razon_Social || doc.data().Nombre_Fantasia; });

        const results = Object.keys(supplierSpend).map(id => ({
            Nombre: providersMap[id] || 'Proveedor Desconocido',
            TotalOrders: supplierSpend[id].TotalOrders.size,
            TotalSpend: supplierSpend[id].TotalSpend
        }));

        const totalSpend = results.reduce((sum, d) => sum + d.TotalSpend, 0);

        return results.map(d => ({
            ...d,
            percentage: ((d.TotalSpend / totalSpend) * 100).toFixed(1)
        })).sort((a, b) => b.TotalSpend - a.TotalSpend);

    } catch (error) {
        console.error("Error in getSupplierDependence:", error);
        return [];
    }
}

export async function getCMVImpact() {
    if (!db) return [];
    try {
        const detailSnapshot = await db.collection('detalle_factura').get();
        const itemSpend = {};
        detailSnapshot.forEach(doc => {
            const data = doc.data();
            if (!itemSpend[data.ID_Insumo]) itemSpend[data.ID_Insumo] = 0;
            itemSpend[data.ID_Insumo] += (data.Cantidad_Facturada * data.Precio_Unitario_Facturado);
        });

        const insumosSnapshot = await db.collection('insumos').get();
        const insumosMap = {};
        insumosSnapshot.forEach(doc => { insumosMap[doc.id] = doc.data().Nombre; });

        const results = Object.keys(itemSpend).map(id => ({
            Nombre: insumosMap[id] || 'Insumo Desconocido',
            TotalCost: itemSpend[id]
        }));

        const totalCMV = results.reduce((sum, item) => sum + item.TotalCost, 0);

        return results.map(item => ({
            ...item,
            percentage: ((item.TotalCost / totalCMV) * 100).toFixed(1)
        })).sort((a, b) => b.TotalCost - a.TotalCost).slice(0, 10);

    } catch (error) {
        console.error("Error in getCMVImpact:", error);
        return [];
    }
}
