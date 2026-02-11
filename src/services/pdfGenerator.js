'use server';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { adminDb as db } from '@/lib/firebaseAdmin';

/**
 * Genera PDF de Orden de Compra para usuarios internos (vista completa)
 */
export async function generateOCPdfForInternalUsers(orderId) {
    if (!db) return null;

    try {
        // Obtener datos de la OC
        const orderDoc = await db.collection('ordenes_compra').doc(orderId.toString()).get();
        if (!orderDoc.exists) return null;
        const orderData = orderDoc.data();

        // Obtener detalles de la OC
        const detailsSnapshot = await db.collection('detalle_oc')
            .where('ID_OC', '==', orderId.toString())
            .get();

        // Obtener proveedores
        const providersSnapshot = await db.collection('proveedores').get();
        const providersMap = {};
        providersSnapshot.forEach(doc => {
            providersMap[doc.id] = doc.data();
        });

        // Obtener insumos
        const insumosSnapshot = await db.collection('insumos').get();
        const insumosMap = {};
        insumosSnapshot.forEach(doc => {
            insumosMap[doc.id] = doc.data();
        });

        // Crear PDF
        const doc = new jsPDF();

        // Título
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('ORDEN DE COMPRA - VISTA INTERNA', 105, 20, { align: 'center' });

        // Información general
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`OC #: ${orderId}`, 20, 35);
        doc.text(`Fecha Emisión: ${orderData.Fecha_Emision}`, 20, 42);
        doc.text(`Estado: ${orderData.Estado}`, 20, 49);
        doc.text(`Total Estimado: $${orderData.Total_Estimado?.toFixed(2) || '0.00'}`, 20, 56);

        if (orderData.Notas) {
            doc.text(`Notas: ${orderData.Notas}`, 20, 63);
        }

        // Agrupar items por proveedor
        const itemsByProvider = {};
        detailsSnapshot.docs.forEach(detailDoc => {
            const detail = detailDoc.data();
            const insumo = insumosMap[detail.ID_Insumo];
            const providerId = orderData.ID_Proveedor; // En caso de múltiples proveedores, ajustar lógica

            if (!itemsByProvider[providerId]) {
                itemsByProvider[providerId] = [];
            }

            itemsByProvider[providerId].push({
                insumo: insumo?.Nombre || 'Insumo Desconocido',
                cantidad: detail.Cantidad_Solicitada,
                unidad: detail.Unidad_Compra,
                precioUnitario: detail.Precio_Unitario_Pactado,
                subtotal: detail.Cantidad_Solicitada * detail.Precio_Unitario_Pactado
            });
        });

        let yPosition = 75;

        // Tabla por cada proveedor
        Object.keys(itemsByProvider).forEach(providerId => {
            const provider = providersMap[providerId];
            const items = itemsByProvider[providerId];

            // Encabezado del proveedor
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Proveedor: ${provider?.Nombre_Fantasia || 'Desconocido'}`, 20, yPosition);
            yPosition += 7;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            if (provider?.Telefono_Pedidos) {
                doc.text(`Tel: ${provider.Telefono_Pedidos}`, 20, yPosition);
                yPosition += 5;
            }
            if (provider?.Email_Pedidos) {
                doc.text(`Email: ${provider.Email_Pedidos}`, 20, yPosition);
                yPosition += 5;
            }

            // Tabla de items
            const tableData = items.map(item => [
                item.insumo,
                item.cantidad,
                item.unidad,
                `$${item.precioUnitario.toFixed(2)}`,
                `$${item.subtotal.toFixed(2)}`
            ]);

            doc.autoTable({
                startY: yPosition,
                head: [['Insumo', 'Cantidad', 'Unidad', 'Precio Unit.', 'Subtotal']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                styles: { fontSize: 9 },
                margin: { left: 20, right: 20 }
            });

            yPosition = doc.lastAutoTable.finalY + 10;

            // Total del proveedor
            const totalProveedor = items.reduce((sum, item) => sum + item.subtotal, 0);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Proveedor: $${totalProveedor.toFixed(2)}`, 150, yPosition);
            yPosition += 15;

            // Nueva página si es necesario
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
        });

        // Generar buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        return pdfBuffer.toString('base64');

    } catch (error) {
        console.error('Error generating OC PDF for internal users:', error);
        return null;
    }
}

/**
 * Genera PDF de Orden de Compra para proveedor específico
 */
export async function generateOCPdfForProvider(orderId, providerId) {
    if (!db) return null;

    try {
        // Obtener datos de la OC
        const orderDoc = await db.collection('ordenes_compra').doc(orderId.toString()).get();
        if (!orderDoc.exists) return null;
        const orderData = orderDoc.data();

        // Verificar que la OC es para este proveedor
        if (orderData.ID_Proveedor !== providerId.toString()) {
            return null;
        }

        // Obtener datos del proveedor
        const providerDoc = await db.collection('proveedores').doc(providerId.toString()).get();
        const providerData = providerDoc.exists ? providerDoc.data() : {};

        // Obtener detalles de la OC
        const detailsSnapshot = await db.collection('detalle_oc')
            .where('ID_OC', '==', orderId.toString())
            .get();

        // Obtener insumos
        const insumosSnapshot = await db.collection('insumos').get();
        const insumosMap = {};
        insumosSnapshot.forEach(doc => {
            insumosMap[doc.id] = doc.data();
        });

        // Crear PDF
        const doc = new jsPDF();

        // Encabezado con datos del proveedor
        doc.setFillColor(52, 73, 94);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('ORDEN DE COMPRA', 105, 15, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Para: ${providerData.Nombre_Fantasia || 'Proveedor'}`, 105, 25, { align: 'center' });
        doc.text(`OC #${orderId}`, 105, 32, { align: 'center' });

        // Información de la OC
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`Fecha de Emisión: ${orderData.Fecha_Emision}`, 20, 50);
        doc.text(`Estado: ${orderData.Estado}`, 20, 57);

        if (orderData.Notas) {
            doc.setFontSize(9);
            doc.text(`Notas: ${orderData.Notas}`, 20, 64);
        }

        // Tabla de items
        const tableData = [];
        detailsSnapshot.docs.forEach(detailDoc => {
            const detail = detailDoc.data();
            const insumo = insumosMap[detail.ID_Insumo];

            tableData.push([
                insumo?.Nombre || 'Insumo Desconocido',
                detail.Cantidad_Solicitada,
                detail.Unidad_Compra,
                `$${detail.Precio_Unitario_Pactado.toFixed(2)}`,
                `$${(detail.Cantidad_Solicitada * detail.Precio_Unitario_Pactado).toFixed(2)}`
            ]);
        });

        doc.autoTable({
            startY: 75,
            head: [['Producto', 'Cantidad', 'Unidad', 'Precio Unitario', 'Subtotal']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [52, 73, 94], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10 },
            margin: { left: 20, right: 20 },
            columnStyles: {
                0: { cellWidth: 70 },
                1: { halign: 'center', cellWidth: 25 },
                2: { halign: 'center', cellWidth: 25 },
                3: { halign: 'right', cellWidth: 30 },
                4: { halign: 'right', cellWidth: 30 }
            }
        });

        // Total
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`TOTAL: $${orderData.Total_Estimado?.toFixed(2) || '0.00'}`, 150, finalY);

        // Pie de página
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Por favor confirme la recepción de esta orden.', 105, 280, { align: 'center' });

        // Generar buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        return pdfBuffer.toString('base64');

    } catch (error) {
        console.error('Error generating OC PDF for provider:', error);
        return null;
    }
}

/**
 * Genera PDF de Recepción para usuarios internos
 */
export async function generateReceptionPdfForInternalUsers(receptionId) {
    if (!db) return null;

    try {
        // Obtener datos de la recepción
        const receptionDoc = await db.collection('recepcion_mercaderia').doc(receptionId.toString()).get();
        if (!receptionDoc.exists) return null;
        const receptionData = receptionDoc.data();

        // Obtener OC de referencia
        const orderDoc = await db.collection('ordenes_compra').doc(receptionData.ID_OC_Referencia.toString()).get();
        const orderData = orderDoc.exists ? orderDoc.data() : {};

        // Obtener proveedor
        const providerDoc = await db.collection('proveedores').doc(receptionData.ID_Proveedor.toString()).get();
        const providerData = providerDoc.exists ? providerDoc.data() : {};

        // Obtener detalles de recepción
        const detailsSnapshot = await db.collection('detalle_recepcion')
            .where('ID_Recepcion', '==', receptionId.toString())
            .get();

        // Obtener insumos
        const insumosSnapshot = await db.collection('insumos').get();
        const insumosMap = {};
        insumosSnapshot.forEach(doc => {
            insumosMap[doc.id] = doc.data();
        });

        // Crear PDF
        const doc = new jsPDF();

        // Título
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('RECEPCIÓN DE MERCADERÍA - VISTA INTERNA', 105, 20, { align: 'center' });

        // Información general
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Recepción #: ${receptionId}`, 20, 35);
        doc.text(`Fecha: ${receptionData.Fecha_Real_Recepcion}`, 20, 42);
        doc.text(`OC Referencia: ${receptionData.ID_OC_Referencia}`, 20, 49);
        doc.text(`Proveedor: ${providerData.Nombre_Fantasia || 'Desconocido'}`, 20, 56);
        doc.text(`Remito: ${receptionData.Numero_Remito}`, 20, 63);
        doc.text(`Estado: ${receptionData.Estado_Global}`, 20, 70);

        if (receptionData.Chofer) {
            doc.text(`Chofer: ${receptionData.Chofer}`, 120, 63);
        }
        if (receptionData.Patente) {
            doc.text(`Patente: ${receptionData.Patente}`, 120, 70);
        }
        if (receptionData.Temperatura_Ingreso) {
            doc.text(`Temperatura: ${receptionData.Temperatura_Ingreso}°C`, 120, 77);
        }

        // Tabla de items
        const tableData = [];
        detailsSnapshot.docs.forEach(detailDoc => {
            const detail = detailDoc.data();
            const insumo = insumosMap[detail.ID_Insumo];

            tableData.push([
                insumo?.Nombre || 'Insumo Desconocido',
                detail.Cantidad_Recibida || 0,
                detail.Cantidad_Rechazada || 0,
                detail.Lote || '-',
                detail.Vencimiento || '-',
                detail.Estado_Envases || '-',
                detail.Motivo_Rechazo || '-'
            ]);
        });

        doc.autoTable({
            startY: 85,
            head: [['Insumo', 'Recibido', 'Rechazado', 'Lote', 'Vencimiento', 'Envases', 'Motivo Rechazo']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [39, 174, 96], textColor: 255 },
            styles: { fontSize: 8 },
            margin: { left: 20, right: 20 },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { halign: 'center', cellWidth: 20 },
                2: { halign: 'center', cellWidth: 20 },
                3: { cellWidth: 25 },
                4: { cellWidth: 25 },
                5: { cellWidth: 20 },
                6: { cellWidth: 30 }
            }
        });

        // Generar buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        return pdfBuffer.toString('base64');

    } catch (error) {
        console.error('Error generating Reception PDF for internal users:', error);
        return null;
    }
}

/**
 * Genera PDF de Recepción para proveedor específico
 */
export async function generateReceptionPdfForProvider(receptionId, providerId) {
    if (!db) return null;

    try {
        // Obtener datos de la recepción
        const receptionDoc = await db.collection('recepcion_mercaderia').doc(receptionId.toString()).get();
        if (!receptionDoc.exists) return null;
        const receptionData = receptionDoc.data();

        // Verificar que la recepción es de este proveedor
        if (receptionData.ID_Proveedor !== providerId.toString()) {
            return null;
        }

        // Obtener proveedor
        const providerDoc = await db.collection('proveedores').doc(providerId.toString()).get();
        const providerData = providerDoc.exists ? providerDoc.data() : {};

        // Obtener detalles de recepción
        const detailsSnapshot = await db.collection('detalle_recepcion')
            .where('ID_Recepcion', '==', receptionId.toString())
            .get();

        // Obtener insumos
        const insumosSnapshot = await db.collection('insumos').get();
        const insumosMap = {};
        insumosSnapshot.forEach(doc => {
            insumosMap[doc.id] = doc.data();
        });

        // Crear PDF
        const doc = new jsPDF();

        // Encabezado
        doc.setFillColor(39, 174, 96);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('CONFIRMACIÓN DE RECEPCIÓN', 105, 15, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`${providerData.Nombre_Fantasia || 'Proveedor'}`, 105, 25, { align: 'center' });
        doc.text(`Remito #${receptionData.Numero_Remito}`, 105, 32, { align: 'center' });

        // Información
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`Fecha de Recepción: ${receptionData.Fecha_Real_Recepcion}`, 20, 50);
        doc.text(`OC Referencia: ${receptionData.ID_OC_Referencia}`, 20, 57);
        doc.text(`Estado: ${receptionData.Estado_Global}`, 20, 64);

        // Tabla de items
        const tableData = [];
        detailsSnapshot.docs.forEach(detailDoc => {
            const detail = detailDoc.data();
            const insumo = insumosMap[detail.ID_Insumo];

            tableData.push([
                insumo?.Nombre || 'Insumo Desconocido',
                detail.Cantidad_Recibida || 0,
                detail.Cantidad_Rechazada || 0,
                detail.Motivo_Rechazo || '-'
            ]);
        });

        doc.autoTable({
            startY: 75,
            head: [['Producto', 'Cantidad Recibida', 'Cantidad Rechazada', 'Motivo Rechazo']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [39, 174, 96], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10 },
            margin: { left: 20, right: 20 }
        });

        // Pie de página
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Gracias por su entrega.', 105, finalY, { align: 'center' });

        // Generar buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        return pdfBuffer.toString('base64');

    } catch (error) {
        console.error('Error generating Reception PDF for provider:', error);
        return null;
    }
}
