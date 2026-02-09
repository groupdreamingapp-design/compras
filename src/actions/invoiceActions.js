'use server';

import { adminDb as db } from '@/lib/firebaseAdmin';
import { revalidatePath } from 'next/cache';

export async function getPendingReceptions() {
    if (!db) return [];
    try {
        const receptionsSnapshot = await db.collection('recepcion_mercaderia').orderBy('Fecha_Real_Recepcion', 'desc').get();
        const invoiceSnapshot = await db.collection('facturas').where('Estado_Pago', '!=', 'Anulado').get();
        const invoicedReceptionIds = new Set();
        invoiceSnapshot.forEach(doc => {
            if (doc.data().ID_Recepcion_Referencia) {
                invoicedReceptionIds.add(doc.data().ID_Recepcion_Referencia.toString());
            }
        });

        const pending = [];
        const providersSnapshot = await db.collection('proveedores').get();
        const providersMap = {};
        providersSnapshot.forEach(doc => { providersMap[doc.id] = doc.data().Nombre_Fantasia; });

        receptionsSnapshot.forEach(doc => {
            if (!invoicedReceptionIds.has(doc.id)) {
                pending.push({
                    ID: doc.id,
                    ...doc.data(),
                    Proveedor: providersMap[doc.data().ID_Proveedor] || 'Proveedor Desconocido'
                });
            }
        });

        return pending;
    } catch (error) {
        console.error("Error in getPendingReceptions:", error);
        return [];
    }
}

export async function getReceptionDetailsForInvoice(receptionId) {
    if (!db) return null;
    try {
        const receptionDoc = await db.collection('recepcion_mercaderia').doc(receptionId.toString()).get();
        if (!receptionDoc.exists) return null;
        const receptionData = receptionDoc.data();

        const providerDoc = await db.collection('proveedores').doc(receptionData.ID_Proveedor.toString()).get();
        const providerData = providerDoc.exists ? providerDoc.data() : { Nombre_Fantasia: 'Desconocido' };

        const detailsSnapshot = await db.collection('detalle_recepcion').where('ID_Recepcion', '==', receptionId.toString()).get();

        // Need to match with OC Prices
        const ocId = receptionData.ID_OC_Referencia;
        const ocDetailsSnapshot = await db.collection('detalle_oc').where('ID_OC', '==', parseInt(ocId)).get();
        const ocPricesMap = {};
        ocDetailsSnapshot.forEach(doc => {
            ocPricesMap[doc.data().ID_Insumo] = doc.data().Precio_Unitario_Pactado;
        });

        const insumosSnapshot = await db.collection('insumos').get();
        const insumosMap = {};
        insumosSnapshot.forEach(doc => { insumosMap[doc.id] = doc.data().Nombre; });

        const items = detailsSnapshot.docs.map(doc => {
            const d = doc.data();
            const precio = ocPricesMap[d.ID_Insumo] || 0;
            return {
                ID_Insumo: d.ID_Insumo,
                Insumo: insumosMap[d.ID_Insumo] || 'Insumo Desconocido',
                Cantidad_Recibida: d.Cantidad_Recibida,
                Precio: precio,
                Subtotal_Esperado: d.Cantidad_Recibida * precio
            };
        });

        return {
            header: { ...receptionData, ID: receptionDoc.id, Proveedor: providerData.Nombre_Fantasia, CUIT: providerData.CUIT, Condicion_IVA: providerData.Condicion_IVA },
            items
        };
    } catch (error) {
        console.error("Error in getReceptionDetailsForInvoice:", error);
        return null;
    }
}

export async function createInvoice(data) {
    if (!db) return { success: false };
    const {
        providerId, receptionId, tipo, puntoVenta, numero, cae,
        fechaEmision, fechaVencimiento,
        neto, iva21, iva105, iva27, percepciones, total,
        items
    } = data;

    try {
        const batch = db.batch();
        const invoiceRef = db.collection('facturas').doc();
        const invoiceId = invoiceRef.id;

        batch.set(invoiceRef, {
            ID_Proveedor: providerId,
            ID_Recepcion_Referencia: receptionId,
            Tipo_Comprobante: tipo,
            Punto_Venta: puntoVenta,
            Numero_Comprobante: numero,
            CAE: cae || null,
            Fecha_Emision: fechaEmision,
            Fecha_Vencimiento_Pago: fechaVencimiento || null,
            Neto_Gravado: neto || 0,
            IVA_21: iva21 || 0,
            IVA_10_5: iva105 || 0,
            IVA_27: iva27 || 0,
            Percepciones_IIBB: percepciones || 0,
            Total_Facturado: total,
            Estado_Pago: 'Pendiente',
            createdAt: new Date().toISOString()
        });

        for (const item of items) {
            const detRef = db.collection('detalle_factura').doc();
            batch.set(detRef, {
                ID_Factura: invoiceId,
                ID_Insumo: item.insumoId,
                Cantidad_Facturada: item.qty,
                Precio_Unitario_Facturado: item.price
            });
        }

        await batch.commit();
        revalidatePath('/compras/facturas');
        return { success: true, invoiceId };
    } catch (error) {
        console.error("Error creating invoice:", error);
        return { success: false };
    }
}
