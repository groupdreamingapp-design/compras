'use server';

import { adminDb as db } from '@/lib/firebaseAdmin';
import { revalidatePath } from 'next/cache';

export async function getPOSItems() {
    if (!db) return [];
    try {
        const snapshot = await db.collection('recetas').orderBy('Nombre_Plato', 'asc').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().Nombre_Plato,
            price: doc.data().Precio_Venta_Actual
        }));
    } catch (e) {
        console.error("Error in getPOSItems:", e);
        return [];
    }
}

export async function processSale(cartItems) {
    if (!db) return { success: false, error: "Database not connected" };
    if (!cartItems || cartItems.length === 0) return { success: false, error: "Cart is empty" };

    try {
        const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const batch = db.batch();

        const saleRef = db.collection('ventas_cabecera').doc();
        const saleId = saleRef.id;

        batch.set(saleRef, {
            Total: total,
            Metodo_Pago: 'Efectivo',
            Fecha: new Date().toISOString()
        });

        for (const item of cartItems) {
            const detRef = db.collection('ventas_detalle').doc();
            batch.set(detRef, {
                ID_Venta: saleId,
                ID_Receta: item.recipeId.toString(),
                Cantidad: item.quantity,
                Precio_Unitario: item.price
            });

            // Explosión de Receta -> Deducción de Stock
            const detailsSnapshot = await db.collection('detalle_receta').where('ID_Receta', '==', item.recipeId.toString()).get();
            for (const doc of detailsSnapshot.docs) {
                const ing = doc.data();
                const deductionQty = ing.Cantidad_Bruta * item.quantity;
                const insumoId = ing.ID_Insumo.toString();

                const moveRef = db.collection('movimientos_stock').doc();
                batch.set(moveRef, {
                    ID_Insumo: insumoId,
                    Tipo_Movimiento: 'Egreso_Venta',
                    Cantidad: deductionQty,
                    Referencia: `Venta #${saleId}`,
                    Fecha: new Date().toISOString()
                });

                // Actualizar Stock Real
                const valRef = db.collection('insumo_valuacion').doc(insumoId);
                const valDoc = await valRef.get();
                if (valDoc.exists) {
                    batch.update(valRef, {
                        Stock_Actual: (valDoc.data().Stock_Actual || 0) - deductionQty
                    });
                }
            }
        }

        await batch.commit();
        revalidatePath('/produccion/ventas');
        revalidatePath('/compras/inventario');
        return { success: true, saleId };
    } catch (error) {
        console.error("Error al procesar la venta:", error);
        return { success: false, error: "Fallo al procesar la venta" };
    }
}
