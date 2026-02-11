'use client';

import { useEffect } from 'react';

/**
 * Hook para abrir automáticamente links de WhatsApp
 * @param {Array} whatsappLinks - Array de objetos con { recipient, type, link }
 */
export function useWhatsAppNotifications(whatsappLinks) {
    useEffect(() => {
        if (!whatsappLinks || whatsappLinks.length === 0) return;

        // Abrir cada link con un pequeño delay para evitar que el navegador bloquee las ventanas
        whatsappLinks.forEach((linkData, index) => {
            setTimeout(() => {
                window.open(linkData.link, '_blank');
            }, index * 1000); // 1 segundo de delay entre cada link
        });
    }, [whatsappLinks]);
}

/**
 * Componente para mostrar notificación de éxito con links de WhatsApp
 */
export default function WhatsAppNotificationHandler({ whatsappLinks, onClose }) {
    useWhatsAppNotifications(whatsappLinks);

    if (!whatsappLinks || whatsappLinks.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg max-w-md z-50 animate-in slide-in-from-bottom-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h3 className="font-bold mb-2">✅ Notificaciones Enviadas</h3>
                    <p className="text-sm mb-2">
                        Se abrirán {whatsappLinks.length} ventanas de WhatsApp:
                    </p>
                    <ul className="text-xs space-y-1">
                        {whatsappLinks.map((link, index) => (
                            <li key={index} className="flex items-center gap-2">
                                <span className="opacity-75">
                                    {link.type === 'internal' ? '👤' : '🏢'}
                                </span>
                                {link.recipient}
                            </li>
                        ))}
                    </ul>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition-colors"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}
