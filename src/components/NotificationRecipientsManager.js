'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import {
    createNotificationRecipient,
    updateNotificationRecipient,
    deleteNotificationRecipient
} from '@/actions/notificationActions';

export default function NotificationRecipientsManager({ initialRecipients }) {
    const [recipients, setRecipients] = useState(initialRecipients);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        rol: '',
        whatsapp: '',
        notificarOC: true,
        notificarRecepcion: true
    });

    const resetForm = () => {
        setFormData({
            nombre: '',
            rol: '',
            whatsapp: '',
            notificarOC: true,
            notificarRecepcion: true
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (recipient) => {
        setFormData({
            nombre: recipient.Nombre,
            rol: recipient.Rol || '',
            whatsapp: recipient.WhatsApp,
            notificarOC: recipient.Notificar_OC,
            notificarRecepcion: recipient.Notificar_Recepcion
        });
        setEditingId(recipient.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = editingId
            ? await updateNotificationRecipient(editingId, formData)
            : await createNotificationRecipient(formData);

        if (result.success) {
            // Recargar la página para obtener datos actualizados
            window.location.reload();
        } else {
            alert('Error al guardar: ' + (result.message || 'Error desconocido'));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este destinatario?')) return;

        const result = await deleteNotificationRecipient(id);
        if (result.success) {
            window.location.reload();
        } else {
            alert('Error al eliminar');
        }
    };

    return (
        <div className="space-y-6">
            {/* Botón agregar */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                    {showForm ? 'Cancelar' : 'Agregar Destinatario'}
                </button>
            </div>

            {/* Formulario */}
            {showForm && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">
                        {editingId ? 'Editar Destinatario' : 'Nuevo Destinatario'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rol
                                </label>
                                <input
                                    type="text"
                                    value={formData.rol}
                                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Gerente de Compras"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                WhatsApp * (con código de país)
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.whatsapp}
                                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="+5491112345678"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Formato: +54 9 11 1234 5678 (sin espacios ni guiones)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Tipos de Notificación
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.notificarOC}
                                        onChange={(e) => setFormData({ ...formData, notificarOC: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Órdenes de Compra</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.notificarRecepcion}
                                        onChange={(e) => setFormData({ ...formData, notificarRecepcion: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Recepción de Mercadería</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Check size={20} />
                                {editingId ? 'Actualizar' : 'Guardar'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabla de destinatarios */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                WhatsApp
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                OC
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Recepción
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {recipients.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                    No hay destinatarios configurados. Agrega uno para comenzar.
                                </td>
                            </tr>
                        ) : (
                            recipients.map((recipient) => (
                                <tr key={recipient.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {recipient.Nombre}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {recipient.Rol || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {recipient.WhatsApp}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {recipient.Notificar_OC ? (
                                            <span className="text-green-600">✓</span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {recipient.Notificar_Recepcion ? (
                                            <span className="text-green-600">✓</span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-2 py-1 text-xs rounded-full ${recipient.Activo
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {recipient.Activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(recipient)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(recipient.id)}
                                                className="text-red-600 hover:text-red-800"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
