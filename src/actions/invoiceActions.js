'use server';

import db from '../lib/db';
import { revalidatePath } from 'next/cache';

// 1. Get Receptions that are not fully invoiced (Simplified: Not in Facturas table)
// Ideally specific status or partial checks, but 1-to-1 matching is easier for V1.
export async function getPendingReceptions() {
    // Select Receptions NOT IN (SELECT ID_Recepcion_Referencia FROM Facturas)
    // Or just all Receptions for now
    const stmt = db.prepare(`
        SELECT r.ID, p.Nombre_Fantasia as Proveedor, r.Numero_Remito, r.Fecha_Real_Recepcion, 
               r.ID_Proveedor, oc.Total_Estimado -- Estimado, we should calc real value from Detalle_Recepcion
        FROM Recepcion_Mercaderia r
        JOIN Proveedores p ON r.ID_Proveedor = p.ID
        JOIN Ordenes_Compra oc ON r.ID_OC_Referencia = oc.ID
        WHERE r.ID NOT IN (SELECT COALESCE(ID_Recepcion_Referencia, 0) FROM Facturas WHERE Estado_Pago != 'Anulado')
        ORDER BY r.Fecha_Real_Recepcion DESC
    `);
    const pending = await stmt.all();

    // Calculate Real Value for each reception (Snapshot Price * Received Qty)
    // We need to fetch details or do a complex join. Let's do a map for simplicity or advanced SQL.
    // Enhanced SQL:
    /*
    SELECT ... SUM(dr.Cantidad_Recibida * doc.Precio_Unitario_Pactado) as Valor_Real
    FROM ...
    JOIN Detalle_Recepcion dr ON r.ID = dr.ID_Recepcion
    JOIN Detalle_OC doc ON dr.ID_Insumo = doc.ID_Insumo AND r.ID_OC_Referencia = doc.ID_OC
    */

    // For MVP, just return the list and let the details be fetched on selection
    return pending;
}

export async function getReceptionDetailsForInvoice(receptionId) {
    // Need: Items, Received Qty, Price (from OC)
    const stmt = db.prepare(`
        SELECT dr.ID_Insumo, i.Nombre as Insumo, dr.Cantidad_Recibida, 
               doc.Precio_Unitario_Pactado as Precio,
               (dr.Cantidad_Recibida * doc.Precio_Unitario_Pactado) as Subtotal_Esperado
        FROM Detalle_Recepcion dr
        JOIN Recepcion_Mercaderia r ON dr.ID_Recepcion = r.ID
        JOIN Detalle_OC doc ON doc.ID_OC = r.ID_OC_Referencia AND doc.ID_Insumo = dr.ID_Insumo
        JOIN Insumos i ON dr.ID_Insumo = i.ID
        WHERE r.ID = ?
    `);

    const items = await stmt.all(receptionId);

    // Header Info
    const headerStmt = db.prepare(`
        SELECT r.*, p.Nombre_Fantasia as Proveedor, p.ID as ID_Proveedor, p.CUIT, p.Condicion_IVA
        FROM Recepcion_Mercaderia r
        JOIN Proveedores p ON r.ID_Proveedor = p.ID
        WHERE r.ID = ?
    `);
    const header = await headerStmt.get(receptionId);

    return { header, items };
}

export async function createInvoice(data) {
    const {
        providerId, receptionId, tipo, puntoVenta, numero, cae,
        fechaEmision, fechaVencimiento,
        neto, iva21, iva105, iva27, percepciones, total,
        items
    } = data;

    // Validation: Check Total Variance?
    // Frontend should warn, Backend can enforce or flag.

    const insertFac = db.prepare(`
        INSERT INTO Facturas (
            ID_Proveedor, ID_Recepcion_Referencia, 
            Tipo_Comprobante, Punto_Venta, Numero_Comprobante, CAE,
            Fecha_Emision, Fecha_Vencimiento_Pago,
            Neto_Gravado, IVA_21, IVA_10_5, IVA_27, Percepciones_IIBB, Total_Facturado,
            Estado_Pago
        ) VALUES (
            ?, ?, 
            ?, ?, ?, ?,
            ?, ?,
            ?, ?, ?, ?, ?, ?,
            'Pendiente'
        )
    `);

    const res = await insertFac.run(
        providerId, receptionId,
        tipo, puntoVenta, numero, cae || null,
        fechaEmision, fechaVencimiento || null,
        neto || 0, iva21 || 0, iva105 || 0, iva27 || 0, percepciones || 0, total,
    );
    const invoiceId = res.lastInsertRowid;

    // Detalle Factura (Usually we copy the items from reception, adjusted by invoice qty if needed)
    // For now assuming 100% matched items
    const insertDet = db.prepare(`
        INSERT INTO Detalle_Factura (ID_Factura, ID_Insumo, Cantidad_Facturada, Precio_Unitario_Facturado)
        VALUES (?, ?, ?, ?)
    `);

    for (const item of items) {
        // item: { insumoId, qty, price }
        await insertDet.run(invoiceId, item.insumoId, item.qty, item.price);
    }

    revalidatePath('/compras/facturas');
    return { success: true, invoiceId };
}
