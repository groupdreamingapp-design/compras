import { adminDb as db } from '@/lib/firebaseAdmin';

export async function getGapMetrics(startDate, endDate) {
  if (!db) return [];
  try {
    // 1. Calcular Consumo Teórico
    // Consultas: Ventas_POS -> Platos -> Fichas_Tecnicas -> Insumos -> Rubros
    const salesSnapshot = await db.collection('ventas_pos')
      .where('Fecha', '>=', startDate)
      .where('Fecha', '<=', endDate)
      .get();

    const platesSnapshot = await db.collection('platos').get();
    const platesMap = {};
    platesSnapshot.forEach(doc => { platesMap[doc.id] = doc.data(); });

    const techSheetsSnapshot = await db.collection('fichas_tecnicas').get();
    const techSheets = techSheetsSnapshot.docs.map(doc => doc.data());

    const insumosSnapshot = await db.collection('insumos').get();
    const insumosMap = {};
    insumosSnapshot.forEach(doc => { insumosMap[doc.id] = { ...doc.data(), id: doc.id }; });

    const rubrosSnapshot = await db.collection('rubros').get();
    const rubrosMap = {};
    rubrosSnapshot.forEach(doc => { rubrosMap[doc.id] = doc.data().Nombre; });

    const theoreticalCons = {};

    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      const platoId = sale.ID_Plato.toString();
      // buscar fichas técnicas para este plato
      const relevantSheets = techSheets.filter(ts => ts.ID_Plato.toString() === platoId);
      relevantSheets.forEach(sheet => {
        const insumoId = sheet.ID_Insumo.toString();
        if (!theoreticalCons[insumoId]) theoreticalCons[insumoId] = 0;
        theoreticalCons[insumoId] += (sale.Cantidad_Vendida * sheet.Cantidad_Teorica_Por_Plato);
      });
    });

    // 2. Calcular Consumo Real (desde Recepciones)
    const receptionsSnapshot = await db.collection('recepcion_mercaderia')
      .where('Fecha_Real_Recepcion', '>=', startDate)
      .where('Fecha_Real_Recepcion', '<=', endDate)
      .get();

    const receptionIds = receptionsSnapshot.docs.map(doc => doc.id);
    const realCons = {};

    if (receptionIds.length > 0) {
      // Debido a que Firestore 'in' tiene un límite de 10/30, y podríamos tener muchas recepciones,
      // podríamos necesitar obtener todos los detalles y filtrar manualmente si no está bien indexado.
      // Por simplicidad: Obtener todos los detalle_recepcion (no es lo ideal) o procesarlo por fragmentos.
      const detailsSnapshot = await db.collection('detalle_recepcion').get();
      detailsSnapshot.forEach(doc => {
        const d = doc.data();
        if (receptionIds.includes(d.ID_Recepcion.toString())) {
          const insumoId = d.ID_Insumo.toString();
          const insumo = insumosMap[insumoId];
          if (!realCons[insumoId]) realCons[insumoId] = 0;
          realCons[insumoId] += (d.Cantidad_Recibida * (insumo?.Factor_Conversion || 1));
        }
      });
    }

    // 3. Unificar y Calcular GAP (Brecha)
    const report = Object.keys(theoreticalCons).map(insumoId => {
      const insumo = insumosMap[insumoId];
      const real = realCons[insumoId] || 0;
      const theoretical = theoreticalCons[insumoId];
      const gap = real - theoretical;
      const gapPercentage = theoretical > 0 ? (gap / theoretical) * 100 : 0;

      const categoria = rubrosMap[insumo?.ID_Rubro] || 'Desconocido';
      const isCritical = ['Carne', 'Bebidas'].includes(categoria) || insumo?.Nombre.includes('Café');
      const alert = gapPercentage > 10;

      return {
        ID_Insumo: insumoId,
        Insumo: insumo?.Nombre || 'Insumo Desconocido',
        Categoria: categoria,
        Unidad_Medida: insumo?.Unidad_Uso || '',
        Consumo_Teorico: theoretical,
        Consumo_Real: real,
        Gap: parseFloat(gap.toFixed(2)),
        Gap_Percentage: parseFloat(gapPercentage.toFixed(1)),
        Alert: alert,
        Status: alert ? 'Critical' : 'Normal'
      };
    });

    return report.sort((a, b) => b.Gap_Percentage - a.Gap_Percentage);
  } catch (error) {
    console.error("Error in getGapMetrics:", error);
    return [];
  }
}
