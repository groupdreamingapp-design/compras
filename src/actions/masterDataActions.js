'use server';

import { adminDb as db } from '@/lib/firebaseAdmin';
import { revalidatePath } from 'next/cache';

// --- Rubros ---
export async function createRubro(nombre) {
    if (!db) return false;
    await db.collection('rubros').add({ Nombre: nombre });
    revalidatePath('/configuracion/maestros');
    return true;
}

export async function getRubros() {
    if (!db) return [];
    try {
        const snapshot = await db.collection('rubros').orderBy('Nombre').get();
        return snapshot.docs.map(doc => ({ ID: doc.id, ...doc.data() }));
    } catch (e) { return []; }
}

// --- Subrubros ---
export async function createSubrubro(nombre, idRubro) {
    if (!db) return false;
    await db.collection('subrubros').add({ Nombre: nombre, ID_Rubro: idRubro });
    revalidatePath('/configuracion/maestros');
    return true;
}

export async function getSubrubros(idRubro) {
    if (!db) return [];
    try {
        const snapshot = await db.collection('subrubros').where('ID_Rubro', '==', idRubro.toString()).orderBy('Nombre').get();
        return snapshot.docs.map(doc => ({ ID: doc.id, ...doc.data() }));
    } catch (e) { return []; }
}

// --- Proveedores ---
export async function createProveedor(data) {
    if (!db) return false;
    const {
        codigo, nombreFantasia, razonSocial,
        cuit, condicionIva, iibb, condicionIibb, agenteRetencion,
        categoria, diasEntrega, leadTime, minOrder,
        condicionPago, cbu, alias, banco,
        vendedor, telefono, email, emailAdmin, whatsapp
    } = data;

    await db.collection('proveedores').add({
        Codigo: codigo || null, Nombre_Fantasia: nombreFantasia, Razon_Social: razonSocial || null,
        CUIT: cuit || null, Condicion_IVA: condicionIva || 'Resp. Inscripto', Ingresos_Brutos: iibb || null, Condicion_IIBB: condicionIibb || 'Local', Agente_Retencion: agenteRetencion ? 1 : 0,
        Categoria_Principal: categoria || null, Dias_Entrega: diasEntrega || '', Lead_Time: leadTime || 1, Pedido_Minimo: minOrder || 0,
        Condicion_Pago: condicionPago || '30 Dias FF', CBU: cbu || null, Alias: alias || null, Banco: banco || null,
        Nombre_Vendedor: vendedor || null, Telefono_Pedidos: telefono || null, Email_Pedidos: email || null, Email_Administracion: emailAdmin || null,
        WhatsApp: whatsapp || null,
        createdAt: new Date().toISOString()
    });

    revalidatePath('/configuracion/maestros');
    return true;
}

export async function getProveedores() {
    if (!db) return [];
    try {
        const snapshot = await db.collection('proveedores').orderBy('Nombre_Fantasia').get();
        return snapshot.docs.map(doc => ({ ID: doc.id, ...doc.data() }));
    } catch (e) { return []; }
}

export async function getProveedorById(id) {
    if (!db) return null;
    try {
        const doc = await db.collection('proveedores').doc(id.toString()).get();
        return doc.exists ? { ID: doc.id, ...doc.data() } : null;
    } catch (e) { return null; }
}

// --- Insumos ---
export async function createInsumo(data) {
    if (!db) return false;
    const {
        codigo, nombre, idRubro, idSubrubro,
        unidadCompra, contenidoNeto, unidadStock, unidadUso, factor,
        rendimiento, iva,
        min, max, ubicacion
    } = data;

    await db.collection('insumos').add({
        Codigo: codigo || null, Nombre: nombre, ID_Rubro: idRubro || null, ID_Subrubro: idSubrubro || null,
        Unidad_Compra: unidadCompra, Contenido_Neto: contenidoNeto || 1, Unidad_Stock: unidadStock, Unidad_Uso: unidadUso, Factor_Conversion: factor || 1,
        Factor_Rendimiento: rendimiento || 100, Alicuota_IVA: iva || 21,
        Stock_Minimo: min || 0, Stock_Maximo: max || 0, Ubicacion_Deposito: ubicacion || null,
        createdAt: new Date().toISOString()
    });

    revalidatePath('/configuracion/maestros');
    return true;
}
