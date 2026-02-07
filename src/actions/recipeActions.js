'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getRecipes() {
    const raw = await db.prepare(`
        SELECT * FROM Recetas ORDER BY Nombre_Plato ASC
    `).all();
    return raw;
}

export async function getRecipeById(id) {
    const header = await db.prepare(`
        SELECT * FROM Recetas WHERE ID = ?
    `).get(id);

    if (!header) return null;

    const items = await db.prepare(`
        SELECT d.ID_Receta, d.ID_Insumo, d.Cantidad_Bruta as qty, d.Unidad_Uso as unit,
               i.Nombre as name, i.Codigo as code, 
               v.Costo_Promedio_Ponderado as ppp,
               i.Unidad_Stock as stockUnit,
               i.Factor_Conversion as conversion
        FROM Detalle_Receta d
        JOIN Insumos i ON d.ID_Insumo = i.ID
        LEFT JOIN Insumo_Valuacion v ON i.ID = v.ID_Insumo
        WHERE d.ID_Receta = ?
    `).all(id);

    // Calculate dynamic cost per item
    const itemsWithCost = items.map(item => {
        const cost = (item.ppp || 0) * item.qty; // Simple calc, assuming qty is in StockUnit
        // Note: Real logic might need unit conversion if Unidad_Uso != StockUnit
        return {
            ...item,
            cost
        };
    });

    const totalCost = itemsWithCost.reduce((acc, i) => acc + i.cost, 0);

    return {
        header: { ...header, Costo_Teorico_Actual: totalCost },
        items: itemsWithCost
    };
}

export async function createRecipe(payload) {
    // payload: { name, price, targetMargin, items: [{ insumoId, qty, unit }] }

    // We can use a transaction wrapper if updated db.js allows, or sequential
    // For now, sequential
    try {
        const res = await db.prepare(`
            INSERT INTO Recetas (Nombre_Plato, Precio_Venta_Actual, Margen_Objetivo_Pct, Costo_Teorico_Actual, Ultima_Actualizacion)
            VALUES (?, ?, ?, ?, DATE('now'))
        `).run(payload.name, payload.price, payload.targetMargin, 0);

        const recipeId = res.lastInsertRowid;

        const insertItem = db.prepare(`
            INSERT INTO Detalle_Receta (ID_Receta, ID_Insumo, Cantidad_Bruta, Unidad_Uso)
            VALUES (?, ?, ?, ?)
        `);

        for (const item of payload.items) {
            await insertItem.run(recipeId, item.insumoId, item.qty, item.unit);
        }

        revalidatePath('/produccion/recetas');
        return { success: true, id: recipeId };
    } catch (e) {
        console.error(e);
        return { success: false, error: e.message };
    }
}

export async function updateRecipe(id, payload) {
    // Update Header
    await db.prepare(`
        UPDATE Recetas 
        SET Nombre_Plato = ?, Precio_Venta_Actual = ?, Margen_Objetivo_Pct = ?, Ultima_Actualizacion = DATE('now')
        WHERE ID = ?
    `).run(payload.name, payload.price, payload.targetMargin, id);

    // Replace Items
    await db.prepare('DELETE FROM Detalle_Receta WHERE ID_Receta = ?').run(id);

    const insertItem = db.prepare(`
        INSERT INTO Detalle_Receta (ID_Receta, ID_Insumo, Cantidad_Bruta, Unidad_Uso)
        VALUES (?, ?, ?, ?)
    `);

    for (const item of payload.items) {
        await insertItem.run(id, item.insumoId, item.qty, item.unit);
    }

    revalidatePath('/produccion/recetas');
    return { success: true };
}

export async function getInsumosForSelect() {
    const res = await db.prepare(`
        SELECT i.ID as id, i.Nombre as name, i.Unidad_Stock as stockUnit, i.Unidad_Uso as useUnit,
               i.Factor_Conversion as conversion,
               COALESCE(v.Costo_Promedio_Ponderado, 0) as ppp
        FROM Insumos i
        LEFT JOIN Insumo_Valuacion v ON i.ID = v.ID_Insumo
        ORDER BY i.Nombre ASC
    `).all();
    return res;
}
