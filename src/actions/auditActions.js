'use server';

import db from '@/lib/db';

// 1. Top Ingredients by Price Increase (Watchlist)
export async function getTopInflationIngredients() {
    // Basic logic: Compare average price of last 30 days vs previous 30 days
    // For simplicity in this demo, we'll take the difference between the last purchase price and the average of the previous ones.

    // We get the last 2 prices for each item
    const priceChanges = await db.prepare(`
        WITH RankedPrices AS (
            SELECT 
                df.ID_Insumo,
                df.Precio_Unitario_Facturado as Precio,
                f.Fecha_Emision as Fecha,
                ROW_NUMBER() OVER (PARTITION BY df.ID_Insumo ORDER BY f.Fecha_Emision DESC) as rn
            FROM Detalle_Factura df
            JOIN Facturas f ON df.ID_Factura = f.ID
        )
        SELECT 
            i.Nombre,
            p1.Precio as LastPrice,
            p2.Precio as PrevPrice,
            ((p1.Precio - p2.Precio) / p2.Precio) * 100 as ChangePercent
        FROM RankedPrices p1
        JOIN RankedPrices p2 ON p1.ID_Insumo = p2.ID_Insumo AND p2.rn = 2
        JOIN Insumos i ON p1.ID_Insumo = i.ID
        WHERE p1.rn = 1
        AND ChangePercent > 0
        ORDER BY ChangePercent DESC
        LIMIT 10
    `).all();

    return priceChanges;
}

// 2. Supplier Dependence (Spending Concentration)
export async function getSupplierDependence() {
    const dependence = await db.prepare(`
        SELECT 
            p.Razon_Social as Nombre,
            COUNT(DISTINCT f.ID) as TotalOrders,
            SUM(df.Cantidad_Facturada * df.Precio_Unitario_Facturado) as TotalSpend
        FROM Detalle_Factura df
        JOIN Facturas f ON df.ID_Factura = f.ID
        JOIN Proveedores p ON f.ID_Proveedor = p.ID
        GROUP BY p.ID
        ORDER BY TotalSpend DESC
    `).all();

    // Calculate total spend to get percentages
    const totalSpend = dependence.reduce((sum, d) => sum + d.TotalSpend, 0);

    return dependence.map(d => ({
        ...d,
        percentage: ((d.TotalSpend / totalSpend) * 100).toFixed(1)
    }));
}

// 3. CMV Impact (Top Contributors to Cost)
export async function getCMVImpact() {
    const cmv = await db.prepare(`
        SELECT 
            i.Nombre,
            SUM(df.Cantidad_Facturada * df.Precio_Unitario_Facturado) as TotalCost
        FROM Detalle_Factura df
        JOIN Insumos i ON df.ID_Insumo = i.ID
        GROUP BY i.ID
        ORDER BY TotalCost DESC
        LIMIT 10
    `).all();

    const totalCMV = cmv.reduce((sum, item) => sum + item.TotalCost, 0);

    return cmv.map(item => ({
        ...item,
        percentage: ((item.TotalCost / totalCMV) * 100).toFixed(1)
    }));
}
