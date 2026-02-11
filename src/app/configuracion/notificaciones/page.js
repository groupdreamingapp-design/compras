import { getNotificationRecipients } from '@/actions/notificationActions';
import NotificationRecipientsManager from '@/components/NotificationRecipientsManager';

export const metadata = {
    title: 'Configuración de Notificaciones',
    description: 'Gestión de destinatarios de notificaciones WhatsApp'
};

export default async function NotificacionesPage() {
    const recipients = await getNotificationRecipients();

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Configuración de Notificaciones</h1>
                <p className="text-gray-600 mt-2">
                    Gestiona los destinatarios que recibirán notificaciones por WhatsApp cuando se envíen órdenes de compra o se reciba mercadería.
                </p>
            </div>

            <NotificationRecipientsManager initialRecipients={recipients} />
        </div>
    );
}
