'use server';

import { adminDb as db } from '@/lib/firebaseAdmin';

export async function getOrdersByStatus() {
    if (!db) return { 'Pendiente_Aprobacion': [], 'Enviada': [], 'Recepcionada_Parcial': [], 'Cerrada': [] };

    try {
        const snapshot = await db.collection('ordenes_compra').orderBy('Fecha_Emision', 'desc').get();
        const providersSnapshot = await db.collection('proveedores').get();
        const providersMap = {};
        providersSnapshot.forEach(doc => { providersMap[doc.id] = doc.data().Nombre_Fantasia; });

        const columns = {
            'Pendiente_Aprobacion': [],
            'Enviada': [],
            'Recepcionada_Parcial': [],
            'Cerrada': []
        };

        snapshot.docs.forEach(doc => {
            const o = { id: doc.id, ...doc.data(), Proveedor: providersMap[doc.data().ID_Proveedor] || 'Desconocido' };
            let status = o.Estado;
            if (status === 'Borrador') status = 'Pendiente_Aprobacion';

            if (columns[status]) {
                columns[status].push(o);
            }
        });

        return columns;
    } catch (e) {
        console.error("Error in getOrdersByStatus:", e);
        return { 'Pendiente_Aprobacion': [], 'Enviada': [], 'Recepcionada_Parcial': [], 'Cerrada': [] };
    }
}

export async function createOrder(data) {
    if (!db) return null;
    const { providerId, items, comments } = data;

    try {
        const batch = db.batch();
        const orderRef = db.collection('ordenes_compra').doc();
        const total = items.reduce((acc, i) => acc + (i.qty * i.price), 0);

        batch.set(orderRef, {
            ID_Proveedor: providerId.toString(),
            Estado: 'Pendiente_Aprobacion',
            Fecha_Emision: new Date().toISOString().split('T')[0],
            Total_Estimado: total,
            Comentarios: comments || '',
            createdAt: new Date().toISOString()
        });

        const insumosSnapshot = await db.collection('insumos').get();
        const insumosMap = {};
        insumosSnapshot.forEach(doc => { insumosMap[doc.id] = doc.data().Unidad_Compra || 'Unidad'; });

        for (const item of items) {
            const detRef = db.collection('detalle_oc').doc();
            batch.set(detRef, {
                ID_OC: orderRef.id,
                ID_Insumo: item.insumoId.toString(),
                Cantidad_Solicitada: item.qty,
                Unidad_Compra: insumosMap[item.insumoId] || 'Unidad',
                Precio_Unitario_Pactado: item.price,
                Subtotal_Linea: item.qty * item.price
            });
        }

        await batch.commit();
        return orderRef.id;
    } catch (e) {
        console.error("Error in createOrder service:", e);
        return null;
    }
}

export async function updateOrderStatus(ocId, newStatus) {
    if (!db) return false;
    try {
        await db.collection('ordenes_compra').doc(ocId.toString()).update({ Estado: newStatus });
        return true;
    } catch (e) {
        return false;
    }
}

export async function getSuggestions() {
    if (!db) return [];
    try {
        const insumosSnapshot = await db.collection('insumos').get();
        const valuationsSnapshot = await db.collection('insumo_valuacion').get();
        const valMap = {};
        valuationsSnapshot.forEach(doc => { valMap[doc.data().ID_Insumo.toString()] = doc.data(); });

        const suggestions = [];
        insumosSnapshot.docs.forEach(doc => {
            const i = doc.data();
            const id = doc.id;
            const val = valMap[id] || { Stock_Actual: 0, Costo_Promedio_Ponderado: 0 };

            if (val.Stock_Actual < i.Stock_Minimo) {
                suggestions.push({
                    ID: id,
                    Nombre: i.Nombre,
                    Stock_Minimo: i.Stock_Minimo,
                    Unidad_Compra: i.Unidad_Compra,
                    Stock_Actual: val.Stock_Actual,
                    LastCost: val.Costo_Promedio_Ponderado,
                    suggestedQty: Math.ceil((i.Stock_Maximo || i.Stock_Minimo * 2) - val.Stock_Actual)
                });
            }
        });

        return suggestions;
    } catch (e) {
        console.error("Error in getSuggestions:", e);
        return [];
    }
}
