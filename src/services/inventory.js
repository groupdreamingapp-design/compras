'use server';

import { adminDb as db } from '@/lib/firebaseAdmin';

export async function updateStockAndPPP(insumoId, quantity, totalCost) {
    if (!db) return null;
    try {
        const valRef = db.collection('insumo_valuacion').doc(insumoId.toString());
        const valDoc = await valRef.get();
        let current = valDoc.exists ? valDoc.data() : { Stock_Actual: 0, Costo_Promedio_Ponderado: 0 };

        const oldStock = current.Stock_Actual || 0;
        const oldPPP = current.Costo_Promedio_Ponderado || 0;
        const unitCost = totalCost / quantity;

        let newStock = oldStock + quantity;
        let newPPP = 0;

        if (newStock <= 0) {
            newPPP = unitCost;
        } else {
            const oldValue = oldStock * oldPPP;
            const newValue = totalCost;
            newPPP = (oldValue + newValue) / newStock;
        }

        // Actualizar datos en Firestore
        await valRef.set({
            ID_Insumo: parseInt(insumoId),
            Stock_Actual: newStock,
            Costo_Promedio_Ponderado: newPPP,
            lastUpdated: new Date().toISOString()
        }, { merge: true });

        await updateRecipeCosts(insumoId);
        return { oldPPP, newPPP, oldStock, newStock };
    } catch (e) {
        console.error("Error in updateStockAndPPP:", e);
        return null;
    }
}

export async function updateRecipeCosts(insumoId) {
    if (!db) return;
    try {
        const techSheetsSnapshot = await db.collection('fichas_tecnicas').where('ID_Insumo', '==', parseInt(insumoId)).get();
        const plateIds = [...new Set(techSheetsSnapshot.docs.map(doc => doc.data().ID_Plato.toString()))];

        for (const plateId of plateIds) {
            // Recalcular el costo del plato basado en los nuevos PPP de sus insumos
            await calculatePlatoCost(plateId);
        }
    } catch (e) {
        console.error("Error in updateRecipeCosts:", e);
    }
}

export async function calculatePlatoCost(platoId) {
    if (!db) return 0;
    try {
        const techSheetsSnapshot = await db.collection('fichas_tecnicas').where('ID_Plato', '==', parseInt(platoId)).get();
        const insumosSnapshot = await db.collection('insumos').get();
        const insumosMap = {};
        insumosSnapshot.forEach(doc => { insumosMap[doc.id] = doc.data(); });

        const valuationsSnapshot = await db.collection('insumo_valuacion').get();
        const valuationsMap = {};
        valuationsSnapshot.forEach(doc => { valuationsMap[doc.data().ID_Insumo.toString()] = doc.data(); });

        let totalCost = 0;
        techSheetsSnapshot.forEach(doc => {
            const ts = doc.data();
            const insumoId = ts.ID_Insumo.toString();
            const ppp = valuationsMap[insumoId]?.Costo_Promedio_Ponderado || 0;
            totalCost += ts.Cantidad_Teorica_Por_Plato * ppp;
        });

        await db.collection('platos').doc(platoId.toString()).update({ Costo_Teorico_Actual: totalCost });
        return totalCost;
    } catch (e) {
        console.error("Error in calculatePlatoCost:", e);
        return 0;
    }
}
