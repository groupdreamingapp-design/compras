'use server';

import { adminDb as db } from '@/lib/firebaseAdmin';
import { revalidatePath } from 'next/cache';

export async function getOpenOrders() {
    if (!db) return [];
    try {
        // Obtenemos todas las órdenes ordenadas por fecha y filtramos en memoria
        // para evitar el requerimiento de un índice compuesto manual en Firestore.
        const snapshot = await db.collection('ordenes_compra')
            .orderBy('Fecha_Emision', 'desc')
            .get();

        const filteredDocs = snapshot.docs.filter(doc =>
            ['Enviada', 'Recepcionada_Parcial'].includes(doc.data().Estado)
        );

        const providersSnapshot = await db.collection('proveedores').get();
        const providersMap = {};
        providersSnapshot.forEach(doc => {
            providersMap[doc.id] = doc.data().Nombre_Fantasia;
        });

        return snapshot.docs.map(doc => ({
            ID: doc.id,
            ...doc.data(),
            Proveedor: providersMap[doc.data().ID_Proveedor] || 'Proveedor Desconocido'
        }));
    } catch (error) {
        console.error("Error in getOpenOrders:", error);
        return [];
    }
}

export async function getOrderDetails(orderId) {
    if (!db) return null;
    try {
        const orderDoc = await db.collection('ordenes_compra').doc(orderId.toString()).get();
        if (!orderDoc.exists) return null;

        const orderData = orderDoc.data();

        // Fetch Provider
        const providerDoc = await db.collection('proveedores').doc(orderData.ID_Proveedor.toString()).get();
        const providerName = providerDoc.exists ? providerDoc.data().Nombre_Fantasia : 'Proveedor Desconocido';

        // Fetch Details
        const detailsSnapshot = await db.collection('detalle_oc')
            .where('ID_OC', '==', parseInt(orderId))
            .get();

        // Fetch Insumos for names
        const insumosSnapshot = await db.collection('insumos').get();
        const insumosMap = {};
        insumosSnapshot.forEach(doc => {
            insumosMap[doc.id] = doc.data().Nombre;
        });

        const items = detailsSnapshot.docs.map(doc => ({
            ...doc.data(),
            Insumo: insumosMap[doc.data().ID_Insumo] || 'Insumo Desconocido'
        }));

        return {
            header: { ID: orderDoc.id, ...orderData, Proveedor: providerName },
            items: items.map(i => ({
                ...i,
                name: i.Insumo,
                unit: i.Unidad_Compra,
                qty: i.Cantidad_Solicitada,
                insumoId: i.ID_Insumo
            }))
        };
    } catch (error) {
        console.error("Error in getOrderDetails:", error);
        return null;
    }
}

export async function createReception(data) {
    if (!db) return { success: false };
    const { orderId, remito, chofer, patente, temperatura, items, qc } = data;

    try {
        const batch = db.batch();

        // 1. Get Provider Info from Order
        const orderDocRef = db.collection('ordenes_compra').doc(orderId.toString());
        const orderDoc = await orderDocRef.get();
        if (!orderDoc.exists) throw new Error("Order not found");
        const orderData = orderDoc.data();

        // 2. Insert Header
        const receptionRef = db.collection('recepcion_mercaderia').doc();
        const receptionId = receptionRef.id;

        batch.set(receptionRef, {
            ID_OC_Referencia: orderId,
            ID_Proveedor: orderData.ID_Proveedor,
            Numero_Remito: remito,
            Fecha_Real_Recepcion: new Date().toISOString().split('T')[0],
            Temperatura_Ingreso: temperatura || null,
            Chofer: chofer || '',
            Patente: patente || '',
            ID_Usuario_Recepcion: qc?.receptionUserId || 1,
            Estado_Global: qc?.globalStatus || 'Aceptado',
            createdAt: new Date().toISOString()
        });

        // 3. Insert Details & Update Stock
        for (const item of items) {
            if (item.receivedQty > 0 || item.rejectedQty > 0) {
                const detRef = db.collection('detalle_recepcion').doc();
                batch.set(detRef, {
                    ID_Recepcion: receptionId,
                    ID_Insumo: item.insumoId,
                    Cantidad_Recibida: item.receivedQty,
                    Cantidad_Rechazada: item.rejectedQty || 0,
                    Motivo_Rechazo: item.reason || '',
                    Lote: item.lot || '',
                    Vencimiento: item.expiry || '',
                    Estado_Envases: item.packageStatus || 'Integro'
                });

                if (item.receivedQty > 0) {
                    // Update Valuacion (Stock)
                    // Simplified: We'd need to find the doc by ID_Insumo. 
                    // To keep it clean, maybe stock is in 'insumo_valuacion' collection
                    const valSnapshot = await db.collection('insumo_valuacion')
                        .where('ID_Insumo', '==', parseInt(item.insumoId))
                        .limit(1)
                        .get();

                    if (!valSnapshot.empty) {
                        const valDoc = valSnapshot.docs[0];
                        batch.update(valDoc.ref, {
                            Stock_Actual: (valDoc.data().Stock_Actual || 0) + item.receivedQty
                        });
                    }

                    const movRef = db.collection('movimientos_stock').doc();
                    batch.set(movRef, {
                        ID_Insumo: item.insumoId,
                        Tipo_Movimiento: 'Recepcion',
                        Cantidad: item.receivedQty,
                        Referencia: `Recepcion #${remito}`,
                        Fecha: new Date().toISOString().split('T')[0]
                    });
                }
            }
        }

        // 4. Update PO Status
        batch.update(orderDocRef, { Estado: 'Recepcionada_Parcial' });

        await batch.commit();

        // Enviar notificaciones de recepción
        const { sendReceptionNotifications } = await import('@/services/whatsappNotifier');
        const notificationResult = await sendReceptionNotifications(receptionId);

        revalidatePath('/compras/recepcion');

        if (notificationResult.success && notificationResult.links?.length > 0) {
            return { success: true, receptionId, whatsappLinks: notificationResult.links };
        }

        return { success: true, receptionId };

    } catch (error) {
        console.error("Error creating reception:", error);
        return { success: false, message: error.message };
    }
}
