'use server';

import { adminDb as db } from '@/lib/firebaseAdmin';

export async function getFinanceMetrics() {
    if (!db) return { totalDebt: 0, overdueDebt: 0, dueSoonDebt: 0 };
    try {
        const snapshot = await db.collection('facturas').where('Estado_Pago', '==', 'Pendiente').get();
        const now = new Date().toISOString().split('T')[0];
        const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        let totalDebt = 0;
        let overdueDebt = 0;
        let dueSoonDebt = 0;

        snapshot.forEach(doc => {
            const f = doc.data();
            const total = f.Total_Facturado || 0;
            totalDebt += total;

            if (f.Fecha_Vencimiento_Pago < now) {
                overdueDebt += total;
            } else if (f.Fecha_Vencimiento_Pago >= now && f.Fecha_Vencimiento_Pago <= next7Days) {
                dueSoonDebt += total;
            }
        });

        return { totalDebt, overdueDebt, dueSoonDebt };
    } catch (e) {
        console.error("Error in getFinanceMetrics:", e);
        return { totalDebt: 0, overdueDebt: 0, dueSoonDebt: 0 };
    }
}

export async function getUnpaidInvoices() {
    if (!db) return [];
    try {
        const snapshot = await db.collection('facturas')
            .where('Estado_Pago', '==', 'Pendiente')
            .get();

        const providersSnapshot = await db.collection('proveedores').get();
        const providersMap = {};
        providersSnapshot.forEach(doc => { providersMap[doc.id] = doc.data().Nombre_Fantasia; });

        const invoices = snapshot.docs.map(doc => ({
            ID: doc.id,
            ...doc.data(),
            Proveedor: providersMap[doc.data().ID_Proveedor] || 'Desconocido'
        }));

        return invoices.sort((a, b) => new Date(a.Fecha_Vencimiento_Pago) - new Date(b.Fecha_Vencimiento_Pago));
    } catch (e) {
        console.error("Error in getUnpaidInvoices:", e);
        return [];
    }
}
