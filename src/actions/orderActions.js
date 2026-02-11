'use server';

import { adminDb as db } from '@/lib/firebaseAdmin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getOrders(status = null) {
    if (!db) return [];
    try {
        let query = db.collection('ordenes_compra');
        if (status) query = query.where('Estado', '==', status);
        const snapshot = await query.orderBy('Fecha_Emision', 'desc').get();

        const providersSnapshot = await db.collection('proveedores').get();
        const providersMap = {};
        providersSnapshot.forEach(doc => { providersMap[doc.id] = doc.data().Nombre_Fantasia; });

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            Proveedor: providersMap[doc.data().ID_Proveedor] || 'Desconocido'
        }));
    } catch (e) {
        console.error("Error in getOrders:", e);
        return [];
    }
}

export async function createOrder(data) {
    if (!db) return { success: false };
    const { providerId, total, items, notes } = data;
    try {
        const batch = db.batch();
        const orderRef = db.collection('ordenes_compra').doc();
        const orderId = orderRef.id;

        batch.set(orderRef, {
            ID_Proveedor: providerId.toString(),
            Fecha_Emision: new Date().toISOString().split('T')[0],
            Total_Estimado: total,
            Estado: 'Borrador',
            Notas: notes || '',
            createdAt: new Date().toISOString()
        });

        for (const item of items) {
            const detRef = db.collection('detalle_oc').doc();
            batch.set(detRef, {
                ID_OC: orderId,
                ID_Insumo: item.id.toString(),
                Cantidad_Solicitada: item.qty,
                Precio_Unitario_Pactado: item.price,
                Unidad_Compra: item.unit
            });
        }

        await batch.commit();
        revalidatePath('/compras/ordenes');
        return { success: true, id: orderId };
    } catch (e) {
        console.error("Error in createOrder:", e);
        return { success: false };
    }
}

export async function updateOrderStatus(id, newStatus) {
    if (!db) return false;
    try {
        await db.collection('ordenes_compra').doc(id.toString()).update({ Estado: newStatus });

        // Enviar notificaciones si el estado es "Enviada"
        if (newStatus === 'Enviada') {
            // Importar dinámicamente para evitar problemas de dependencias circulares
            const { sendOCNotifications } = await import('@/services/whatsappNotifier');
            const notificationResult = await sendOCNotifications(id);

            if (notificationResult.success && notificationResult.links?.length > 0) {
                // Los links se retornarán para que el cliente los abra
                revalidatePath('/compras/ordenes');
                return { success: true, whatsappLinks: notificationResult.links };
            }
        }

        revalidatePath('/compras/ordenes');
        return true;
    } catch (e) {
        console.error('Error in updateOrderStatus:', e);
        return false;
    }
}
