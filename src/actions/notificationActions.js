'use server';

import { adminDb as db } from '@/lib/firebaseAdmin';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene todos los destinatarios de notificaciones
 */
export async function getNotificationRecipients() {
    if (!db) return [];
    try {
        const snapshot = await db.collection('notificacion_destinatarios')
            .orderBy('Nombre')
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error in getNotificationRecipients:', error);
        return [];
    }
}

/**
 * Crea un nuevo destinatario de notificaciones
 */
export async function createNotificationRecipient(data) {
    if (!db) return { success: false };

    const { nombre, rol, whatsapp, notificarOC, notificarRecepcion } = data;

    try {
        await db.collection('notificacion_destinatarios').add({
            Nombre: nombre,
            Rol: rol || '',
            WhatsApp: whatsapp,
            Notificar_OC: notificarOC || false,
            Notificar_Recepcion: notificarRecepcion || false,
            Activo: true,
            createdAt: new Date().toISOString()
        });

        revalidatePath('/configuracion/notificaciones');
        return { success: true };
    } catch (error) {
        console.error('Error in createNotificationRecipient:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Actualiza un destinatario de notificaciones
 */
export async function updateNotificationRecipient(id, data) {
    if (!db) return { success: false };

    const { nombre, rol, whatsapp, notificarOC, notificarRecepcion, activo } = data;

    try {
        await db.collection('notificacion_destinatarios').doc(id.toString()).update({
            Nombre: nombre,
            Rol: rol || '',
            WhatsApp: whatsapp,
            Notificar_OC: notificarOC || false,
            Notificar_Recepcion: notificarRecepcion || false,
            Activo: activo !== undefined ? activo : true
        });

        revalidatePath('/configuracion/notificaciones');
        return { success: true };
    } catch (error) {
        console.error('Error in updateNotificationRecipient:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Elimina un destinatario de notificaciones
 */
export async function deleteNotificationRecipient(id) {
    if (!db) return { success: false };

    try {
        await db.collection('notificacion_destinatarios').doc(id.toString()).delete();
        revalidatePath('/configuracion/notificaciones');
        return { success: true };
    } catch (error) {
        console.error('Error in deleteNotificationRecipient:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Actualiza el campo WhatsApp de un proveedor
 */
export async function updateProviderWhatsApp(providerId, whatsapp) {
    if (!db) return { success: false };

    try {
        await db.collection('proveedores').doc(providerId.toString()).update({
            WhatsApp: whatsapp || null
        });

        revalidatePath('/configuracion/maestros');
        return { success: true };
    } catch (error) {
        console.error('Error in updateProviderWhatsApp:', error);
        return { success: false, message: error.message };
    }
}
