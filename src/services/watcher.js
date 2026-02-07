import db from '../lib/db';

/**
 * Calculates theoretical vs real consumption for a given date range.
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<Array>} List of ingredients with consumption metrics and gap.
 */
export async function getGapMetrics(startDate, endDate) {
  // 1. Calculate Theoretical Consumption (from Sales * Recipes)
  // We join Sales -> Recipes -> Ingredients
  const theoreticalQuery = db.prepare(`
    SELECT 
      i.ID as ID_Insumo,
      i.Nombre as Insumo,
      r.Nombre as Categoria,
      i.Unidad_Uso as Unidad_Medida, -- Alias for compatibility or just use Unidad_Uso
      SUM(v.Cantidad_Vendida * f.Cantidad_Teorica_Por_Plato) as Consumo_Teorico
    FROM Ventas_POS v
    JOIN Platos p ON v.ID_Plato = p.ID
    JOIN Fichas_Tecnicas f ON p.ID = f.ID_Plato
    JOIN Insumos i ON f.ID_Insumo = i.ID
    JOIN Rubros r ON i.ID_Rubro = r.ID
    WHERE v.Fecha BETWEEN ? AND ?
    GROUP BY i.ID
  `);

  // 2. Calculate Real Consumption (from Purchases)
  const realQuery = db.prepare(`
    SELECT 
      d.ID_Insumo,
      SUM(d.Cantidad_Recibida * i.Factor_Conversion) as Consumo_Real
    FROM Detalle_Recepcion d
    JOIN Recepcion_Mercaderia r ON d.ID_Recepcion = r.ID
    JOIN Insumos i ON d.ID_Insumo = i.ID
    WHERE r.Fecha_Real_Recepcion BETWEEN ? AND ?
    GROUP BY d.ID_Insumo
  `);

  // ASYNC CALLS
  const theoreticalData = await theoreticalQuery.all(startDate, endDate);
  const realData = await realQuery.all(startDate, endDate);

  // Map Real Data for easy lookup
  const realMap = new Map();
  realData.forEach(r => realMap.set(r.ID_Insumo, r.Consumo_Real));

  // 3. Merge and Calculate GAP
  const report = theoreticalData.map(item => {
    const real = realMap.get(item.ID_Insumo) || 0;
    const theoretical = item.Consumo_Teorico;
    const gap = real - theoretical;
    const gapPercentage = theoretical > 0 ? (gap / theoretical) * 100 : 0;

    // Alert Logic: Gap > 10% in critical ingredients
    const isCritical = ['Carne', 'Bebidas'].includes(item.Categoria) || item.Insumo.includes('Café');
    const alert = gapPercentage > 10;

    return {
      ...item,
      Consumo_Real: real,
      Gap: parseFloat(gap.toFixed(2)),
      Gap_Percentage: parseFloat(gapPercentage.toFixed(1)),
      Alert: alert,
      Status: alert ? 'Critical' : 'Normal'
    };
  });

  // Sort by highest gap percentage
  return report.sort((a, b) => b.Gap_Percentage - a.Gap_Percentage);
}
