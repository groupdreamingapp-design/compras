'use server';

import db from '../lib/db';
import { revalidatePath } from 'next/cache';

// --- Rubros ---
export async function createRubro(nombre) {
    const stmt = db.prepare('INSERT INTO Rubros (Nombre) VALUES (?)');
    stmt.run(nombre);
    revalidatePath('/configuracion/maestros');
    return true;
}

export async function getRubros() {
    const stmt = db.prepare('SELECT * FROM Rubros ORDER BY Nombre');
    // Using simple db wrapper if it supports .all() synchronously inside async action?
    // Wrapper uses promises but actions are async.
    // Wait, my db.js wrapper returns promises for .all().
    // So I must await.
    return await stmt.all();
}

// --- Subrubros ---
export async function createSubrubro(nombre, idRubro) {
    const stmt = db.prepare('INSERT INTO Subrubros (Nombre, ID_Rubro) VALUES (?, ?)');
    stmt.run(nombre, idRubro);
    revalidatePath('/configuracion/maestros');
    return true;
}

export async function getSubrubros(idRubro) {
    const stmt = db.prepare('SELECT * FROM Subrubros WHERE ID_Rubro = ? ORDER BY Nombre');
    return await stmt.all(idRubro);
}

// --- Proveedores ---
// --- Proveedores ---
export async function createProveedor(data) {
    const {
        codigo, nombreFantasia, razonSocial,
        cuit, condicionIva, iibb, condicionIibb, agenteRetencion,
        categoria, diasEntrega, leadTime, minOrder,
        condicionPago, cbu, alias, banco,
        vendedor, telefono, email, emailAdmin
    } = data;

    const stmt = db.prepare(`
        INSERT INTO Proveedores (
            Codigo, Nombre_Fantasia, Razon_Social, 
            CUIT, Condicion_IVA, Ingresos_Brutos, Condicion_IIBB, Agente_Retencion,
            Categoria_Principal, Dias_Entrega, Lead_Time, Pedido_Minimo,
            Condicion_Pago, CBU, Alias, Banco,
            Nombre_Vendedor, Telefono_Pedidos, Email_Pedidos, Email_Administracion
        ) VALUES (
            ?, ?, ?, 
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?
        )
    `);

    stmt.run(
        codigo || null, nombreFantasia, razonSocial || null,
        cuit || null, condicionIva || 'Resp. Inscripto', iibb || null, condicionIibb || 'Local', agenteRetencion ? 1 : 0,
        categoria || null, diasEntrega || '', leadTime || 1, minOrder || 0,
        condicionPago || '30 Dias FF', cbu || null, alias || null, banco || null,
        vendedor || null, telefono || null, email || null, emailAdmin || null
    );

    revalidatePath('/configuracion/maestros');
    revalidatePath('/configuracion/maestros');
    return true;
}

export async function getProveedores() {
    const stmt = db.prepare('SELECT * FROM Proveedores ORDER BY Nombre_Fantasia');
    return await stmt.all();
}

export async function getProveedorById(id) {
    const stmt = db.prepare('SELECT * FROM Proveedores WHERE ID = ?');
    return await stmt.get(id);
}

// --- Insumos ---
// --- Insumos ---
export async function createInsumo(data) {
    const {
        codigo, nombre, idRubro, idSubrubro,
        unidadCompra, contenidoNeto, unidadStock, unidadUso, factor,
        rendimiento, iva,
        min, max, ubicacion
    } = data;

    const stmt = db.prepare(`
        INSERT INTO Insumos (
            Codigo, Nombre, ID_Rubro, ID_Subrubro, 
            Unidad_Compra, Contenido_Neto, Unidad_Stock, Unidad_Uso, Factor_Conversion,
            Factor_Rendimiento, Alicuota_IVA, 
            Stock_Minimo, Stock_Maximo, Ubicacion_Deposito
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
        codigo || null, nombre, idRubro || null, idSubrubro || null,
        unidadCompra, contenidoNeto || 1, unidadStock, unidadUso, factor || 1,
        rendimiento || 100, iva || 21,
        min || 0, max || 0, ubicacion || null
    );

    revalidatePath('/configuracion/maestros');
    return true;
}
