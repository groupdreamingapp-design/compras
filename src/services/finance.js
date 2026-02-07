'use server';
import db from '../lib/db';

export async function getFinanceMetrics() {
    // 1. Total Payable (Pendiente)
    const totalStmt = db.prepare(`
        SELECT SUM(Total_Facturado) as Total 
        FROM Facturas 
        WHERE Estado_Pago = 'Pendiente'
    `);
    const totalDebt = totalStmt.get()?.Total || 0;

    // 2. Overdue (Vencido) VS Due Soon (Next 7 Days)
    const overdueStmt = db.prepare(`
        SELECT SUM(Total_Facturado) as Total 
        FROM Facturas 
        WHERE Estado_Pago = 'Pendiente' AND Fecha_Vencimiento_Pago < DATE('now')
    `);
    const overdueDebt = overdueStmt.get()?.Total || 0;

    const dueSoonStmt = db.prepare(`
        SELECT SUM(Total_Facturado) as Total 
        FROM Facturas 
        WHERE Estado_Pago = 'Pendiente' 
        AND Fecha_Vencimiento_Pago BETWEEN DATE('now') AND DATE('now', '+7 days')
    `);
    const dueSoonDebt = dueSoonStmt.get()?.Total || 0;

    return { totalDebt, overdueDebt, dueSoonDebt };
}

export async function getUnpaidInvoices() {
    const stmt = db.prepare(`
        SELECT f.ID, p.Nombre_Fantasia as Proveedor, f.Numero_Comprobante, 
               f.Fecha_Emision, f.Fecha_Vencimiento_Pago, f.Total_Facturado, f.Condicion_Pago_Pactada
        FROM Facturas f
        LEFT JOIN Proveedores p ON f.ID_Proveedor = p.ID 
        WHERE f.Estado_Pago = 'Pendiente'
        ORDER BY f.Fecha_Vencimiento_Pago ASC
    `);
    return await stmt.all();
}
