import { adminDb as db } from '@/lib/firebaseAdmin';
import * as inventoryService from './inventory';

export async function processInvoice(invoiceData) {
    if (!db) return null;
    const { providerId, receiptId, invoiceNumber, date, total, items } = invoiceData;

    try {
        const receiptDoc = await db.collection('recepcion_mercaderia').doc(receiptId.toString()).get();
        if (!receiptDoc.exists) throw new Error('Receipt not found');
        const rHeader = receiptDoc.data();

        const detailsSnapshot = await db.collection('detalle_recepcion').where('ID_Recepcion', '==', receiptId.toString()).get();
        const receivedItems = detailsSnapshot.docs.map(doc => doc.data());

        const results = [];
        let hasCriticalMismatch = false;
        const receivedMap = new Map(receivedItems.map(i => [i.ID_Insumo?.toString(), i]));

        for (const item of items) {
            const received = receivedMap.get(item.insumoId?.toString());
            const matchResult = { insumoId: item.insumoId, qtyMatch: true, priceMatch: true, alerts: [] };

            if (!received) {
                matchResult.qtyMatch = false;
                matchResult.alerts.push("Ítem facturado no figura en la recepción.");
                hasCriticalMismatch = true;
            } else if (parseFloat(item.qty) > received.Cantidad_Recibida) {
                matchResult.qtyMatch = false;
                matchResult.alerts.push(`Facturado (${item.qty}) excede Recibido (${received.Cantidad_Recibida}).`);
                hasCriticalMismatch = true;
            }
            results.push(matchResult);
        }

        const batch = db.batch();
        const invoiceRef = db.collection('facturas').doc();
        const invoiceId = invoiceRef.id;

        batch.set(invoiceRef, {
            ID_Proveedor: providerId.toString(),
            ID_Recepcion_Referencia: receiptId.toString(),
            Numero_Factura: invoiceNumber,
            Fecha_Emision: date,
            Total_Facturado: total,
            Estado_Pago: hasCriticalMismatch ? 'Bloqueado (Mismatch)' : 'Pendiente',
            createdAt: new Date().toISOString()
        });

        for (const item of items) {
            const detRef = db.collection('detalle_factura').doc();
            batch.set(detRef, {
                ID_Factura: invoiceId,
                ID_Insumo: item.insumoId.toString(),
                Cantidad_Facturada: item.qty,
                Precio_Unitario_Facturado: item.unitPrice
            });
        }

        await batch.commit();

        // Actualizar el PPP (Precio Promedio Ponderado) de forma secuencial
        for (const item of items) {
            try {
                const insumoDoc = await db.collection('insumos').doc(item.insumoId.toString()).get();
                const factor = insumoDoc.exists ? (insumoDoc.data().Factor_Conversion || 1) : 1;
                await inventoryService.updateStockAndPPP(item.insumoId, item.qty * factor, item.qty * item.unitPrice);
            } catch (e) {
                console.error("PPP Update Failed for item", item.insumoId, e);
            }
        }

        return { facId: invoiceId, hasCriticalMismatch };
    } catch (e) {
        console.error("Error in processInvoice:", e);
        return null;
    }
}

export async function getOpenReceipts() {
    if (!db) return [];
    try {
        const snapshot = await db.collection('recepcion_mercaderia').orderBy('Fecha_Real_Recepcion', 'desc').get();
        const providersSnapshot = await db.collection('proveedores').get();
        const providersMap = {};
        providersSnapshot.forEach(doc => { providersMap[doc.id] = doc.data().Nombre_Fantasia || doc.data().Nombre; });

        return snapshot.docs.map(doc => ({
            ID: doc.id,
            Numero_Remito: doc.data().Numero_Remito,
            Proveedor: providersMap[doc.data().ID_Proveedor.toString()] || 'Desconocido',
            Fecha_Real_Recepcion: doc.data().Fecha_Real_Recepcion
        }));
    } catch (e) {
        console.error("Error in getOpenReceipts:", e);
        return [];
    }
}

export async function getReceiptDetails(receiptId) {
    if (!db) return [];
    try {
        const detailsSnapshot = await db.collection('detalle_recepcion').where('ID_Recepcion', '==', receiptId.toString()).get();
        const insumosSnapshot = await db.collection('insumos').get();
        const insumosMap = {};
        insumosSnapshot.forEach(doc => { insumosMap[doc.id] = doc.data(); });

        return detailsSnapshot.docs.map(doc => {
            const d = doc.data();
            return {
                ID_Insumo: d.ID_Insumo,
                Nombre: insumosMap[d.ID_Insumo.toString()]?.Nombre || 'Desconocido',
                Cantidad_Recibida: d.Cantidad_Recibida,
                Unidad_Compra: insumosMap[d.ID_Insumo.toString()]?.Unidad_Compra || 'Unidad'
            };
        });
    } catch (e) {
        console.error("Error in getReceiptDetails:", e);
        return [];
    }
}
