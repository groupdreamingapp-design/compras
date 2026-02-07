'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getPOSItems() {
    // Fetch recipes to display as buttons in the POS
    return await db.prepare(`
        SELECT ID as id, Nombre_Plato as name, Precio_Venta_Actual as price 
        FROM Recetas 
        ORDER BY Nombre_Plato ASC
    `).all();
}

export async function processSale(cartItems) {
    // cartItems: [{ recipeId, quantity, price }]

    if (!cartItems || cartItems.length === 0) {
        return { success: false, error: "Cart is empty" };
    }

    const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    try {
        // 1. Create Sale Header
        const saleRes = await db.prepare(`
            INSERT INTO Ventas_Cabecera (Total, Metodo_Pago) VALUES (?, 'Efectivo')
        `).run(total);
        const saleId = saleRes.lastInsertRowid;

        // 2. Process Items
        const insertSaleDetail = db.prepare(`
            INSERT INTO Ventas_Detalle (ID_Venta, ID_Receta, Cantidad, Precio_Unitario)
            VALUES (?, ?, ?, ?)
        `);

        // Prepare statements for stock deduction
        const getRecipeIngredients = db.prepare(`
            SELECT ID_Insumo, Cantidad_Bruta FROM Detalle_Receta WHERE ID_Receta = ?
        `);

        const insertStockMove = db.prepare(`
            INSERT INTO Movimientos_Stock (ID_Insumo, Tipo_Movimiento, Cantidad, Referencia, Fecha)
            VALUES (?, 'Egreso_Venta', ?, ?, CURRENT_TIMESTAMP)
        `);

        const updateStock = db.prepare(`
            UPDATE Insumo_Valuacion 
            SET Stock_Actual = Stock_Actual - ? 
            WHERE ID_Insumo = ?
        `);

        for (const item of cartItems) {
            // Record Sale Detail
            await insertSaleDetail.run(saleId, item.recipeId, item.quantity, item.price);

            // Explode Recipe -> Deduct Stock
            const ingredients = await getRecipeIngredients.all(item.recipeId);

            for (const ing of ingredients) {
                const deductionQty = ing.Cantidad_Bruta * item.quantity;

                // Record Movement
                await insertStockMove.run(ing.ID_Insumo, deductionQty, `Venta #${saleId}`);

                // Update Real Stock
                await updateStock.run(deductionQty, ing.ID_Insumo);
            }
        }

        revalidatePath('/produccion/ventas');
        revalidatePath('/compras/inventario'); // Stock changed
        return { success: true, saleId };

    } catch (error) {
        console.error("Sale Processing Error:", error);
        return { success: false, error: "Failed to process sale" };
    }
}
