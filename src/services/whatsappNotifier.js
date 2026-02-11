'use server';

import { adminDb as db } from '@/lib/firebaseAdmin';
import { getStorage } from 'firebase-admin/storage';
import {
    generateOCPdfForInternalUsers,
    generateOCPdfForProvider,
    generateReceptionPdfForInternalUsers,
    generateReceptionPdfForProvider
} from './pdfGenerator';

/**
 * Sube un PDF a Firebase Storage y retorna la URL pública
 */
async function uploadPdfToStorage(pdfBase64, fileName) {
    try {
        const bucket = getStorage().bucket();
        const file = bucket.file(`notifications/${fileName}`);

        const buffer = Buffer.from(pdfBase64, 'base64');

        await file.save(buffer, {
            metadata: {
                contentType: 'application/pdf',
            },
            public: true
        });

        // Obtener URL pública
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
        return publicUrl;
    } catch (error) {
        console.error('Error uploading PDF to storage:', error);
        return null;
    }
}

/**
 * Genera un link de WhatsApp Web con mensaje pre-cargado
 */
function generateWhatsAppLink(phoneNumber, message) {
    // Limpiar número de teléfono (solo dígitos)
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message);

    // Generar link de WhatsApp Web
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Obtiene destinatarios internos activos para un tipo de notificación
 */
async function getInternalRecipients(notificationType) {
    if (!db) return [];

    try {
        const snapshot = await db.collection('notificacion_destinatarios')
            .where('Activo', '==', true)
            .where(notificationType, '==', true)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting internal recipients:', error);
        return [];
    }
}

/**
 * Envía notificaciones de Orden de Compra
 */
export async function sendOCNotifications(orderId) {
    if (!db) return { success: false, message: 'Database not available' };

    try {
        const links = [];

        // Obtener datos de la OC
        const orderDoc = await db.collection('ordenes_compra').doc(orderId.toString()).get();
        if (!orderDoc.exists) {
            return { success: false, message: 'Order not found' };
        }
        const orderData = orderDoc.data();

        // 1. Generar PDF para usuarios internos
        const internalPdf = await generateOCPdfForInternalUsers(orderId);
        if (internalPdf) {
            const internalPdfUrl = await uploadPdfToStorage(
                internalPdf,
                `OC_${orderId}_interna_${Date.now()}.pdf`
            );

            if (internalPdfUrl) {
                // Obtener destinatarios internos
                const internalRecipients = await getInternalRecipients('Notificar_OC');

                for (const recipient of internalRecipients) {
                    if (recipient.WhatsApp) {
                        const message = `🔔 *Nueva Orden de Compra*\n\n` +
                            `OC #${orderId}\n` +
                            `Fecha: ${orderData.Fecha_Emision}\n` +
                            `Total: $${orderData.Total_Estimado?.toFixed(2) || '0.00'}\n\n` +
                            `Ver PDF completo: ${internalPdfUrl}`;

                        const whatsappLink = generateWhatsAppLink(recipient.WhatsApp, message);
                        links.push({
                            recipient: recipient.Nombre,
                            type: 'internal',
                            link: whatsappLink
                        });
                    }
                }
            }
        }

        // 2. Generar PDF para proveedor
        const providerId = orderData.ID_Proveedor;
        const providerDoc = await db.collection('proveedores').doc(providerId.toString()).get();

        if (providerDoc.exists) {
            const providerData = providerDoc.data();

            if (providerData.WhatsApp) {
                const providerPdf = await generateOCPdfForProvider(orderId, providerId);

                if (providerPdf) {
                    const providerPdfUrl = await uploadPdfToStorage(
                        providerPdf,
                        `OC_${orderId}_proveedor_${providerId}_${Date.now()}.pdf`
                    );

                    if (providerPdfUrl) {
                        const message = `📦 *Nueva Orden de Compra*\n\n` +
                            `Estimado ${providerData.Nombre_Fantasia},\n\n` +
                            `Le enviamos la Orden de Compra #${orderId}\n` +
                            `Fecha: ${orderData.Fecha_Emision}\n` +
                            `Total: $${orderData.Total_Estimado?.toFixed(2) || '0.00'}\n\n` +
                            `Ver detalle: ${providerPdfUrl}\n\n` +
                            `Por favor confirme la recepción.`;

                        const whatsappLink = generateWhatsAppLink(providerData.WhatsApp, message);
                        links.push({
                            recipient: providerData.Nombre_Fantasia,
                            type: 'provider',
                            link: whatsappLink
                        });
                    }
                }
            }
        }

        // Abrir todos los links de WhatsApp (esto se hará desde el cliente)
        return {
            success: true,
            links,
            message: `${links.length} notificaciones generadas`
        };

    } catch (error) {
        console.error('Error sending OC notifications:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Envía notificaciones de Recepción de Mercadería
 */
export async function sendReceptionNotifications(receptionId) {
    if (!db) return { success: false, message: 'Database not available' };

    try {
        const links = [];

        // Obtener datos de la recepción
        const receptionDoc = await db.collection('recepcion_mercaderia').doc(receptionId.toString()).get();
        if (!receptionDoc.exists) {
            return { success: false, message: 'Reception not found' };
        }
        const receptionData = receptionDoc.data();

        // 1. Generar PDF para usuarios internos
        const internalPdf = await generateReceptionPdfForInternalUsers(receptionId);
        if (internalPdf) {
            const internalPdfUrl = await uploadPdfToStorage(
                internalPdf,
                `Recepcion_${receptionId}_interna_${Date.now()}.pdf`
            );

            if (internalPdfUrl) {
                // Obtener destinatarios internos
                const internalRecipients = await getInternalRecipients('Notificar_Recepcion');

                for (const recipient of internalRecipients) {
                    if (recipient.WhatsApp) {
                        const message = `✅ *Recepción de Mercadería*\n\n` +
                            `Recepción #${receptionId}\n` +
                            `Remito: ${receptionData.Numero_Remito}\n` +
                            `Fecha: ${receptionData.Fecha_Real_Recepcion}\n` +
                            `Estado: ${receptionData.Estado_Global}\n\n` +
                            `Ver PDF completo: ${internalPdfUrl}`;

                        const whatsappLink = generateWhatsAppLink(recipient.WhatsApp, message);
                        links.push({
                            recipient: recipient.Nombre,
                            type: 'internal',
                            link: whatsappLink
                        });
                    }
                }
            }
        }

        // 2. Generar PDF para proveedor
        const providerId = receptionData.ID_Proveedor;
        const providerDoc = await db.collection('proveedores').doc(providerId.toString()).get();

        if (providerDoc.exists) {
            const providerData = providerDoc.data();

            if (providerData.WhatsApp) {
                const providerPdf = await generateReceptionPdfForProvider(receptionId, providerId);

                if (providerPdf) {
                    const providerPdfUrl = await uploadPdfToStorage(
                        providerPdf,
                        `Recepcion_${receptionId}_proveedor_${providerId}_${Date.now()}.pdf`
                    );

                    if (providerPdfUrl) {
                        const message = `✅ *Confirmación de Recepción*\n\n` +
                            `Estimado ${providerData.Nombre_Fantasia},\n\n` +
                            `Confirmamos la recepción de su mercadería.\n` +
                            `Remito: ${receptionData.Numero_Remito}\n` +
                            `Fecha: ${receptionData.Fecha_Real_Recepcion}\n` +
                            `Estado: ${receptionData.Estado_Global}\n\n` +
                            `Ver detalle: ${providerPdfUrl}`;

                        const whatsappLink = generateWhatsAppLink(providerData.WhatsApp, message);
                        links.push({
                            recipient: providerData.Nombre_Fantasia,
                            type: 'provider',
                            link: whatsappLink
                        });
                    }
                }
            }
        }

        return {
            success: true,
            links,
            message: `${links.length} notificaciones generadas`
        };

    } catch (error) {
        console.error('Error sending Reception notifications:', error);
        return { success: false, message: error.message };
    }
}
