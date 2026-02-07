'use server';

import db from '../lib/db';
import { revalidatePath } from 'next/cache';

export async function getOpenOrders() {
    const stmt = db.prepare(`
        SELECT oc.ID, p.Nombre_Fantasia as Proveedor, oc.Fecha_Emision, oc.Total_Estimado, oc.Estado
        FROM Ordenes_Compra oc
        JOIN Proveedores p ON oc.ID_Proveedor = p.ID
        WHERE oc.Estado IN ('Enviada', 'Recepcionada_Parcial')
        ORDER BY oc.Fecha_Emision DESC
    `);
    return await stmt.all();
}

export async function getOrderDetails(orderId) {
    const stmt = db.prepare(`
        SELECT d.*, i.Nombre as Insumo, i.Unidad_Compra
        FROM Detalle_OC d
        JOIN Insumos i ON d.ID_Insumo = i.ID
        WHERE d.ID_OC = ?
    `);
    const details = await stmt.all(orderId);

    const headerStmt = db.prepare(`
        SELECT oc.*, p.Nombre_Fantasia as Proveedor 
        FROM Ordenes_Compra oc
        JOIN Proveedores p ON oc.ID_Proveedor = p.ID
        WHERE oc.ID = ?
    `);
    const header = await headerStmt.get(orderId);

    return { header, items: details };
}

export async function createReception(data) {
    const { orderId, remito, chofer, patente, temperatura, items, qc } = data;
    // data.qc = { receptionUserId, globalStatus: 'Aceptado'|'Rechazado'|'Condicional' }

    // 1. Insert Header
    const insertRec = db.prepare(`
        INSERT INTO Recepcion_Mercaderia 
        (ID_OC_Referencia, ID_Proveedor, Numero_Remito, Fecha_Real_Recepcion, Temperatura_Ingreso, Chofer, Patente, ID_Usuario_Recepcion, Estado_Global)
        VALUES (?, ?, ?, DATE('now'), ?, ?, ?, ?, ?)
    `);

    const order = await db.prepare('SELECT ID_Proveedor FROM Ordenes_Compra WHERE ID = ?').get(orderId);

    const res = await insertRec.run(
        orderId,
        order.ID_Proveedor,
        remito,
        temperatura || null,
        chofer || '',
        patente || '',
        qc?.receptionUserId || 1, // Default to mock user if not sent
        qc?.globalStatus || 'Aceptado'
    );
    const receptionId = res.lastInsertRowid;

    // 2. Insert Details & Update Stock
    const insertDet = db.prepare(`
        INSERT INTO Detalle_Recepcion 
        (ID_Recepcion, ID_Insumo, Cantidad_Recibida, Cantidad_Rechazada, Motivo_Rechazo, Lote, Vencimiento, Estado_Envases)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Stock Updates
    const updateStock = db.prepare(`
        UPDATE Insumo_Valuacion 
        SET Stock_Actual = COALESCE(Stock_Actual, 0) + ? 
        WHERE ID_Insumo = ?
    `);

    // Check if valuacion row exists? Usually Seed ensures it, but safe to INSERT OR IGNORE if needed.
    // For MVP assuming row exists or trigger handles it. Just running UPDATE.

    const insertMov = db.prepare(`
        INSERT INTO Movimientos_Stock (ID_Insumo, Tipo_Movimiento, Cantidad, Referencia, Fecha)
        VALUES (?, 'Recepcion', ?, ?, DATE('now'))
    `);

    for (const item of items) {
        // item: { insumoId, receivedQty, rejectedQty, reason, lot, expiry, packageStatus }
        if (item.receivedQty > 0 || item.rejectedQty > 0) {
            await insertDet.run(
                receptionId,
                item.insumoId,
                item.receivedQty,
                item.rejectedQty || 0,
                item.reason || '',
                item.lot || '',
                item.expiry || '',
                item.packageStatus || 'Integro'
            );

            // Update Stock if Accepted
            if (item.receivedQty > 0) {
                await updateStock.run(item.receivedQty, item.insumoId);
                await insertMov.run(item.insumoId, item.receivedQty, `Recepcion #${remito}`);
            }
        }
    }

    // 3. Update PO Status
    // Logic: If all items received >= requested, Close. Else Partial.
    // Simplifying: If GlobalStatus is 'Rechazado', PO stays 'Enviada' w/ alert? 
    // For now: Always 'Recepcionada_Parcial' to allow further receivals, unless user specifically "Closes" it. 
    // Let's set to 'Recepcionada_Parcial'.
    const updatePO = db.prepare("UPDATE Ordenes_Compra SET Estado = 'Recepcionada_Parcial' WHERE ID = ?");
    await updatePO.run(orderId);

    revalidatePath('/compras/recepcion');
    return { success: true, receptionId };
}
