'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

// --- EXPORT ---

export async function exportTableToCSV(tableName) {
    if (!['Insumos', 'Proveedores', 'Rubros'].includes(tableName)) {
        throw new Error('Tabla no permitida');
    }

    const rows = await db.prepare(`SELECT * FROM ${tableName}`).all();
    if (rows.length === 0) return '';

    // Generate Header
    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(';')]; // Using semicolon for Excel compatibility in LATAM

    // Generate Rows
    for (const row of rows) {
        const values = headers.map(header => {
            const val = row[header];
            if (val === null || val === undefined) return '';
            // Escape quotes and wrap in quotes if necessary
            const strVal = String(val);
            if (strVal.includes(';') || strVal.includes('"') || strVal.includes('\n')) {
                return `"${strVal.replace(/"/g, '""')}"`;
            }
            return strVal;
        });
        csvRows.push(values.join(';'));
    }

    return csvRows.join('\n');
}

// --- IMPORT ---

export async function importDataFromCSV(tableName, csvContent) {
    if (!['Insumos', 'Proveedores', 'Rubros'].includes(tableName)) {
        throw new Error('Tabla no permitida');
    }

    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return { success: false, message: 'Archivo vacío o sin datos' };

    const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));

    // Validate Headers vs Table Structure? 
    // For MVP, we assume the CSV structure matches the Export structure (or at least valid columns).

    let successCount = 0;
    let errorCount = 0;

    // Use transaction for bulk insert
    // Note: My db.js wrapper doesn't expose transaction object directly for batching in the same way, 
    // but I can run multiple runs. Ideally should use a transaction.
    // Let's just loop for now, SQLite is fast enough for small datasets.

    for (let i = 1; i < lines.length; i++) {
        try {
            const line = lines[i];
            if (!line) continue;

            // Simple split by ; (ignoring quoted semicolons for now for simplicity in MVP)
            // Real CSV parsing needs a library, but let's try a simple approach first.
            const values = line.split(';').map(v => {
                let val = v.trim();
                if (val.startsWith('"') && val.endsWith('"')) {
                    val = val.substring(1, val.length - 1).replace(/""/g, '"');
                }
                return val === '' ? null : val;
            });

            if (values.length !== headers.length) {
                console.warn(`Line ${i} skipped: column count mismatch`);
                errorCount++;
                continue;
            }

            // Construct Object
            const rowObj = {};
            headers.forEach((h, idx) => {
                rowObj[h] = values[idx];
            });

            // UPSERT logic
            // We need a unique key.
            // For Insumos: ID or Codigo.
            // For Proveedores: ID or Codigo or CUIT.
            // If ID is present, we replace. If not, insert.

            if (tableName === 'Insumos') {
                await upsertInsumo(rowObj);
            } else if (tableName === 'Proveedores') {
                await upsertProveedor(rowObj);
            } else if (tableName === 'Rubros') {
                await upsertRubro(rowObj);
            }

            successCount++;

        } catch (err) {
            console.error(`Error importing line ${i}:`, err);
            errorCount++;
        }
    }

    revalidatePath('/configuracion/maestros');
    return { success: true, imported: successCount, errors: errorCount };
}

async function upsertInsumo(data) {
    // If ID exists and is > 0, Update. Else Insert.
    // However, CSV from export will have IDs.
    // We should use INSERT OR REPLACE INTO logic if possible, but structure of `data` varies.

    // Simplified: Check if ID exists
    let exists = false;
    if (data.ID) {
        const check = await db.prepare('SELECT ID FROM Insumos WHERE ID = ?').get(data.ID);
        exists = !!check;
    }

    if (exists) {
        // Build UPDATE string dynamically
        const updates = Object.keys(data).filter(k => k !== 'ID').map(k => `${k} = ?`).join(', ');
        const values = Object.keys(data).filter(k => k !== 'ID').map(k => data[k]);
        values.push(data.ID);
        await db.prepare(`UPDATE Insumos SET ${updates} WHERE ID = ?`).run(...values);
    } else {
        // Insert
        const cols = Object.keys(data).filter(k => k !== 'ID').join(', ');
        const placeholders = Object.keys(data).filter(k => k !== 'ID').map(() => '?').join(', ');
        const values = Object.keys(data).filter(k => k !== 'ID').map(k => data[k]);
        await db.prepare(`INSERT INTO Insumos (${cols}) VALUES (${placeholders})`).run(...values);
    }
}

async function upsertProveedor(data) {
    let exists = false;
    if (data.ID) {
        const check = await db.prepare('SELECT ID FROM Proveedores WHERE ID = ?').get(data.ID);
        exists = !!check;
    }

    if (exists) {
        const updates = Object.keys(data).filter(k => k !== 'ID').map(k => `${k} = ?`).join(', ');
        const values = Object.keys(data).filter(k => k !== 'ID').map(k => data[k]);
        values.push(data.ID);
        await db.prepare(`UPDATE Proveedores SET ${updates} WHERE ID = ?`).run(...values);
    } else {
        const cols = Object.keys(data).filter(k => k !== 'ID').join(', ');
        const placeholders = Object.keys(data).filter(k => k !== 'ID').map(() => '?').join(', ');
        const values = Object.keys(data).filter(k => k !== 'ID').map(k => data[k]);
        await db.prepare(`INSERT INTO Proveedores (${cols}) VALUES (${placeholders})`).run(...values);
    }
}

async function upsertRubro(data) {
    let exists = false;
    if (data.ID) {
        const check = await db.prepare('SELECT ID FROM Rubros WHERE ID = ?').get(data.ID);
        exists = !!check;
    }

    if (exists) {
        const updates = Object.keys(data).filter(k => k !== 'ID').map(k => `${k} = ?`).join(', ');
        const values = Object.keys(data).filter(k => k !== 'ID').map(k => data[k]);
        values.push(data.ID);
        await db.prepare(`UPDATE Rubros SET ${updates} WHERE ID = ?`).run(...values);
    } else {
        const cols = Object.keys(data).filter(k => k !== 'ID').join(', ');
        const placeholders = Object.keys(data).filter(k => k !== 'ID').map(() => '?').join(', ');
        const values = Object.keys(data).filter(k => k !== 'ID').map(k => data[k]);
        await db.prepare(`INSERT INTO Rubros (${cols}) VALUES (${placeholders})`).run(...values);
    }
}
