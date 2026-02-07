
import db from '../lib/db';
import { scoreSuppliers } from './negotiator';

// V3: Order Management Services

export async function getOrdersByStatus() {
    // Group by status for Kanban
    const stmt = db.prepare(`
        SELECT oc.*, p.Nombre_Fantasia as Proveedor 
        FROM Ordenes_Compra oc
        JOIN Proveedores p ON oc.ID_Proveedor = p.ID
        ORDER BY oc.Fecha_Emision DESC
    `);
    const all = await stmt.all();

    // Grouping
    const columns = {
        'Pendiente_Aprobacion': [], // Includes Drafts
        'Enviada': [],
        'Recepcionada_Parcial': [],
        'Cerrada': []
    };

    all.forEach(o => {
        let status = o.Estado;
        if (status === 'Borrador') status = 'Pendiente_Aprobacion'; // Map Draft -> Pending

        if (columns[status]) {
            columns[status].push(o);
        }
    });

    return columns;
}

export async function createOrder(data) {
    const { providerId, items, comments } = data;

    // 1. Calculate Total
    let total = 0;
    items.forEach(i => total += (i.qty * i.price));

    // 2. Insert Header
    const insertOC = db.prepare(`
        INSERT INTO Ordenes_Compra (ID_Proveedor, Estado, Fecha_Emision, Total_Estimado, Comentarios)
        VALUES (?, 'Pendiente_Aprobacion', DATE('now'), ?, ?)
    `);



    const result = await insertOC.run(providerId, total, comments || '');
    const ocId = result.lastInsertRowid;

    // 3. Insert Details
    const insertDet = db.prepare(`
        INSERT INTO Detalle_OC(ID_OC, ID_Insumo, Cantidad_Solicitada, Unidad_Compra, Precio_Unitario_Pactado, Subtotal_Linea)
    VALUES(?, ?, ?, ?, ?, ?)
        `);

    // Fetch Unit for Snapshot
    const unitStmt = db.prepare('SELECT Unidad_Compra FROM Insumos WHERE ID = ?');

    for (const item of items) {
        const u = await unitStmt.get(item.insumoId);
        const unit = u ? u.Unidad_Compra : 'Unidad';
        const subtotal = item.qty * item.price;

        await insertDet.run(ocId, item.insumoId, item.qty, unit, item.price, subtotal);
    }

    return ocId;
}

export async function updateOrderStatus(ocId, newStatus) {
    const stmt = db.prepare('UPDATE Ordenes_Compra SET Estado = ? WHERE ID = ?');
    await stmt.run(newStatus, ocId);
    return true;
}

export async function getSuggestions() {
    // "Magic Button": Find items below Safety Stock (Stock_Minimo)
    // Join with Insumo_Valuacion to see current stock.

    const stmt = db.prepare(`
        SELECT i.ID, i.Nombre, i.Stock_Minimo, i.Unidad_Compra,
        COALESCE(v.Stock_Actual, 0) as Stock_Actual,
        COALESCE(v.Costo_Promedio_Ponderado, 0) as LastCost
        FROM Insumos i
        LEFT JOIN Insumo_Valuacion v ON i.ID = v.ID_Insumo
        WHERE COALESCE(v.Stock_Actual, 0) < i.Stock_Minimo
        `);

    const lowStockItems = await stmt.all();

    // For each item, find best supplier using Negotiator?
    // Or just return the item and let UI call negotiator.
    // Let's return items populated with "SuggestedQty" = Max - Current?

    return lowStockItems.map(i => ({
        ...i,
        suggestedQty: Math.ceil((i.Stock_Maximo || i.Stock_Minimo * 2) - i.Stock_Actual)
    }));
}
