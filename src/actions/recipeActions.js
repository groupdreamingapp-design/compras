'use server';

import { adminDb as db } from '@/lib/firebaseAdmin';
import { revalidatePath } from 'next/cache';

export async function getRecipes() {
    if (!db) return [];
    try {
        const snapshot = await db.collection('recetas').orderBy('Nombre_Plato', 'asc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error in getRecipes:", e);
        return [];
    }
}

export async function getRecipeById(id) {
    if (!db) return null;
    try {
        const headerDoc = await db.collection('recetas').doc(id.toString()).get();
        if (!headerDoc.exists) return null;
        const header = headerDoc.data();

        const detailsSnapshot = await db.collection('detalle_receta').where('ID_Receta', '==', id.toString()).get();
        const insumosSnapshot = await db.collection('insumos').get();
        const insumosMap = {};
        insumosSnapshot.forEach(doc => { insumosMap[doc.id] = doc.data(); });

        const valuationsSnapshot = await db.collection('insumo_valuacion').get();
        const valuationsMap = {};
        valuationsSnapshot.forEach(doc => { valuationsMap[doc.data().ID_Insumo?.toString()] = doc.data(); });

        const itemsWithCost = detailsSnapshot.docs.map(doc => {
            const d = doc.data();
            const insumoId = d.ID_Insumo?.toString();
            const insumo = insumosMap[insumoId] || {};
            const val = valuationsMap[insumoId] || {};
            const ppp = val.Costo_Promedio_Ponderado || 0;
            const cost = ppp * d.Cantidad_Bruta;

            return {
                id: doc.id,
                ...d,
                name: insumo.Nombre || 'Desconocido',
                code: insumo.Codigo || '',
                ppp: ppp,
                stockUnit: insumo.Unidad_Stock || '',
                conversion: insumo.Factor_Conversion || 1,
                unit: d.Unidad_Uso,
                qty: d.Cantidad_Bruta,
                cost: cost
            };
        });

        const totalCost = itemsWithCost.reduce((acc, i) => acc + i.cost, 0);

        return {
            header: { id: headerDoc.id, ...header, Costo_Teorico_Actual: totalCost },
            items: itemsWithCost
        };
    } catch (e) {
        console.error("Error in getRecipeById:", e);
        return null;
    }
}

export async function createRecipe(payload) {
    if (!db) return { success: false };
    try {
        const batch = db.batch();
        const recipeRef = db.collection('recetas').doc();
        const recipeId = recipeRef.id;

        batch.set(recipeRef, {
            Nombre_Plato: payload.name,
            Precio_Venta_Actual: payload.price,
            Margen_Objetivo_Pct: payload.targetMargin,
            Costo_Teorico_Actual: 0,
            Ultima_Actualizacion: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        });

        for (const item of payload.items) {
            const detRef = db.collection('detalle_receta').doc();
            batch.set(detRef, {
                ID_Receta: recipeId,
                ID_Insumo: item.insumoId.toString(),
                Cantidad_Bruta: item.qty,
                Unidad_Uso: item.unit
            });
        }

        await batch.commit();
        revalidatePath('/produccion/recetas');
        return { success: true, id: recipeId };
    } catch (e) {
        console.error("Error in createRecipe:", e);
        return { success: false, error: e.message };
    }
}

export async function updateRecipe(id, payload) {
    if (!db) return { success: false };
    try {
        const batch = db.batch();
        const recipeRef = db.collection('recetas').doc(id.toString());

        batch.update(recipeRef, {
            Nombre_Plato: payload.name,
            Precio_Venta_Actual: payload.price,
            Margen_Objetivo_Pct: payload.targetMargin,
            Ultima_Actualizacion: new Date().toISOString().split('T')[0]
        });

        // Replacing items in Firestore is different than SQL DELETE.
        // We need to find existing and delete them, or use a subcollection.
        // For simplicity, let's assume they are top-level and we find them.
        const existingDetails = await db.collection('detalle_receta').where('ID_Receta', '==', id.toString()).get();
        existingDetails.forEach(doc => batch.delete(doc.ref));

        for (const item of payload.items) {
            const detRef = db.collection('detalle_receta').doc();
            batch.set(detRef, {
                ID_Receta: id.toString(),
                ID_Insumo: item.insumoId.toString(),
                Cantidad_Bruta: item.qty,
                Unidad_Uso: item.unit
            });
        }

        await batch.commit();
        revalidatePath('/produccion/recetas');
        return { success: true };
    } catch (e) {
        console.error("Error in updateRecipe:", e);
        return { success: false, error: e.message };
    }
}

export async function getInsumosForSelect() {
    if (!db) return [];
    try {
        const insumosSnapshot = await db.collection('insumos').orderBy('Nombre', 'asc').get();
        const valuationsSnapshot = await db.collection('insumo_valuacion').get();
        const valMap = {};
        valuationsSnapshot.forEach(doc => { valMap[doc.data().ID_Insumo?.toString()] = doc.data(); });

        return insumosSnapshot.docs.map(doc => {
            const i = doc.data();
            const id = doc.id;
            return {
                id: id,
                name: i.Nombre,
                stockUnit: i.Unidad_Stock,
                useUnit: i.Unidad_Uso,
                conversion: i.Factor_Conversion,
                ppp: valMap[id]?.Costo_Promedio_Ponderado || 0
            };
        });
    } catch (e) {
        console.error("Error in getInsumosForSelect:", e);
        return [];
    }
}
