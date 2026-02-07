'use server';

import * as orderService from '../services/orders';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import db from '@/lib/db';

export async function createOrder(payload) {
    // Payload V7: { providerId, branch, requesterId, approverId, requiredDate, comments, items: [{ insumoId, unit, qty, price }] }

    // 1. Generate Nro_OC (Simple Timestamp or Random for now)
    const nroOC = `OC-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // 2. Insert Header
    const stmt = db.prepare(`
        INSERT INTO Ordenes_Compra (
            Nro_OC, ID_Proveedor, ID_Usuario_Solicitante, ID_Usuario_Aprobador, Sucursal_Destino,
            Estado, Fecha_Emision, Fecha_Requerida_Entrega, Comentarios, Total_Estimado
        ) VALUES (?, ?, ?, ?, ?, 'Enviada', DATE('now'), ?, ?, ?)
    `);

    // Calculate Total
    const total = payload.items.reduce((acc, item) => acc + (item.qty * item.price), 0);

    const result = stmt.run(
        nroOC, payload.providerId, payload.requesterId || 1, payload.approverId || null, payload.branch || 'Central',
        payload.requiredDate || null, payload.comments || '', total
    );
    const ocId = result.lastInsertRowid;

    // 3. Insert Details (Snapshot Pricing)
    const stmtDet = db.prepare(`
        INSERT INTO Detalle_OC (
            ID_OC, ID_Insumo, Cantidad_Solicitada, Unidad_Compra, 
            Precio_Unitario_Pactado, Subtotal_Linea
        ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of payload.items) {
        // item.price MUST be passed from frontend (which looks it up) or we look it up here.
        // Assuming Frontend sends the "Current Price" visible to user.
        stmtDet.run(ocId, item.insumoId, item.qty, item.unit, item.price, item.qty * item.price);
    }

    revalidatePath('/compras/ordenes');
    return { success: true, nroOC };
}

export async function getSuggestionsAction() {
    return await orderService.getSuggestions();
}

export async function getOrderById(id) {
    const headerStmt = db.prepare(`
        SELECT oc.ID, oc.ID_Proveedor as providerId, oc.Sucursal_Destino as branch, 
               oc.ID_Usuario_Solicitante as requesterId, oc.ID_Usuario_Aprobador as approverId,
               oc.Fecha_Requerida_Entrega as requiredDate, oc.Comentarios as comments,
               oc.Total_Estimado, oc.Nro_OC
        FROM Ordenes_Compra oc
        WHERE oc.ID = ?
    `);
    const header = await headerStmt.get(id);

    if (!header) return null;

    const itemsStmt = db.prepare(`
        SELECT d.ID_Insumo as id, i.Nombre as name, i.Unidad_Compra as unit, 
               i.Contenido_Neto as content, i.Unidad_Stock as stockUnit,
               d.Precio_Unitario_Pactado as price, d.Cantidad_Solicitada as finalQty
        FROM Detalle_OC d
        JOIN Insumos i ON d.ID_Insumo = i.ID
        WHERE d.ID_OC = ?
    `);
    const rawItems = await itemsStmt.all(id);
    const items = rawItems.map(i => ({
        ...i,
        // Reverse calc for display? If finalQty = 40kg and content = 20kg/box, buyQty = 2.
        buyQty: i.content ? i.finalQty / i.content : i.finalQty,
        finalUnit: i.stockUnit
    }));

    return { header, items };
}

export async function updateOrder(id, payload) {
    // 1. Update Header
    const updateHeader = db.prepare(`
        UPDATE Ordenes_Compra 
        SET ID_Proveedor = ?, Sucursal_Destino = ?, ID_Usuario_Aprobador = ?, 
            Fecha_Requerida_Entrega = ?, Comentarios = ?, Total_Estimado = ?
        WHERE ID = ?
    `);

    const total = payload.items.reduce((acc, item) => acc + (item.qty * item.price), 0);

    updateHeader.run(
        payload.providerId, payload.branch || 'Central', payload.approverId || null,
        payload.requiredDate || null, payload.comments || '', total, id
    );

    // 2. Re-create Details (Delete all for ID, Insert new)
    const deleteDet = db.prepare('DELETE FROM Detalle_OC WHERE ID_OC = ?');
    deleteDet.run(id);

    const insertDet = db.prepare(`
        INSERT INTO Detalle_OC (
            ID_OC, ID_Insumo, Cantidad_Solicitada, Unidad_Compra, 
            Precio_Unitario_Pactado, Subtotal_Linea
        ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of payload.items) {
        insertDet.run(id, item.insumoId, item.qty, item.unit, item.price, item.qty * item.price);
    }

    revalidatePath('/compras/ordenes');
    return { success: true };
}
