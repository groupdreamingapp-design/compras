
import db from '../lib/db';

/**
 * Updates the Weighted Average Cost (PPP) and Stock for an Insumo.
 * Formula: ((CurrentStock * CurrentPPP) + (NewQty * NewReview_UnitCost)) / (CurrentStock + NewQty)
 */
export async function updateStockAndPPP(insumoId, quantity, totalCost) {
    // 1. Get Current State
    const currentStmt = db.prepare('SELECT Stock_Actual, Costo_Promedio_Ponderado FROM Insumo_Valuacion WHERE ID_Insumo = ?');
    let current = await currentStmt.get(insumoId);

    if (!current) {
        // Init if missing
        await db.prepare('INSERT INTO Insumo_Valuacion (ID_Insumo, Stock_Actual, Costo_Promedio_Ponderado) VALUES (?, 0, 0)').run(insumoId);
        current = { Stock_Actual: 0, Costo_Promedio_Ponderado: 0 };
    }

    const oldStock = current.Stock_Actual;
    const oldPPP = current.Costo_Promedio_Ponderado;
    const unitCost = totalCost / quantity;

    let newStock = oldStock + quantity;
    let newPPP = 0;

    if (newStock <= 0) {
        // Edge case: Negative stock or zero. Reset PPP to latest cost if stock is 0.
        newPPP = unitCost;
    } else {
        // Calculate PPP
        const oldValue = oldStock * oldPPP;
        const newValue = totalCost; // (quantity * unitCost)
        newPPP = (oldValue + newValue) / newStock;
    }

    // 2. Update Database
    const updateStmt = db.prepare('UPDATE Insumo_Valuacion SET Stock_Actual = ?, Costo_Promedio_Ponderado = ? WHERE ID_Insumo = ?');
    await updateStmt.run(newStock, newPPP, insumoId);

    // 3. Trigger Recipe Cost Update
    await updateRecipeCosts(insumoId);

    return { oldPPP, newPPP, oldStock, newStock };
}

/**
 * Updates the Costo_Teorico_Actual for all Platos using this Insumo.
 */
export async function updateRecipeCosts(insumoId) {
    // Find all Platos using this Insumo
    const platosStmt = db.prepare(`
        SELECT DISTINCT ID_Plato 
        FROM Fichas_Tecnicas 
        WHERE ID_Insumo = ?
    `);
    const platos = await platosStmt.all(insumoId);

    for (const plato of platos) {
        await calculatePlatoCost(plato.ID_Plato);
    }
}

/**
 * Re-calculates and updates the total cost of a Plato based on its recipe.
 */
export async function calculatePlatoCost(platoId) {
    // Sum (Quantity * Insumo.PPP)
    // Note: Fichas_Tecnicas uses "Cantidad_Teorica_Por_Plato" (in Unidad_Uso).
    // Insumo_Valuacion is usually per "Unidad_Compra" or "Unidad_Uso"? 
    // In seed.mjs:
    // Lomo: Buy=Caja 20kg. Use=Kg. Factor=20.
    // PPP should be per UNIDAD DE USO ideally for recipes? 
    // OR we convert. 
    // Let's check seed data.
    // Insumo_Valuacion inserted: `await insertVal.run(iLomo, 47.5, 10500);` 
    // 47.5 is Kg (47.5). 10500 is Cost per Kg ($10,500).
    // So Valuacion is in UNIDAD DE USO (derived from simple numbers in seed).

    // However, Receipt Quantity is usually in Purchase Units.
    // Ensure we handle conversion if needed. 
    // For MVP/Seed consistency: Let's assume PPP is stored in "Unidad_Uso" equivalent cost, OR we check Factor.

    // In seed: 
    // Unit_Compra='Caja 20kg', Factor=20.
    // Receipt: 5 boxes. Total = 100kg.
    // Invoice: 5 boxes = $1,050,000. => $210,000/box.
    // PPP stored: 10,500. ($210,000 / 20 = 10,500).
    // So PPP is per UNIDAD DE USO (Kg).

    const recipeStmt = db.prepare(`
        SELECT ft.Cantidad_Teorica_Por_Plato, i.Unidad_Uso, i.Factor_Conversion, v.Costo_Promedio_Ponderado
        FROM Fichas_Tecnicas ft
        JOIN Insumos i ON ft.ID_Insumo = i.ID
        LEFT JOIN Insumo_Valuacion v ON i.ID = v.ID_Insumo
        WHERE ft.ID_Plato = ?
    `);

    const ingredients = await recipeStmt.all(platoId);

    let totalCost = 0;
    for (const ing of ingredients) {
        const ppp = ing.Costo_Promedio_Ponderado || 0;
        // PPP is assumed to be per Unidad_Uso based on seed logic.
        totalCost += ing.Cantidad_Teorica_Por_Plato * ppp;
    }

    // Update Plato
    const updatePlato = db.prepare('UPDATE Platos SET Costo_Teorico_Actual = ? WHERE ID = ?');
    await updatePlato.run(totalCost, platoId);

    return totalCost;
}
