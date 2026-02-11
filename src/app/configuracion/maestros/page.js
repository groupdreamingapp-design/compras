'use client';
import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Save, Package, Truck, Layers, Download, Upload, Bell } from 'lucide-react';
import { createRubro, createSubrubro, createProveedor, createInsumo } from '../../../actions/masterDataActions';
import { exportTableToCSV, importDataFromCSV } from '../../../actions/dataActions';
import { getNotificationRecipients } from '../../../actions/notificationActions';
import NotificationRecipientsManager from '../../../components/NotificationRecipientsManager';

export default function ConfigMaestrosPage() {
    const [activeTab, setActiveTab] = useState('proveedores');
    const [recipients, setRecipients] = useState([]);
    const [loadingRecipients, setLoadingRecipients] = useState(false);

    // Cargar destinatarios cuando se selecciona el tab de notificaciones
    useEffect(() => {
        if (activeTab === 'notificaciones') {
            setLoadingRecipients(true);
            getNotificationRecipients().then(data => {
                setRecipients(data);
                setLoadingRecipients(false);
            });
        }
    }, [activeTab]);

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <h1 className="text-3xl font-bold text-white mb-2">Maestros y Configuración</h1>
            <p className="text-slate-400 mb-8">Administra proveedores, insumos, categorías y notificaciones del sistema.</p>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl mb-8 w-fit">
                <TabButton id="proveedores" label="Proveedores" icon={Truck} active={activeTab} onClick={setActiveTab} />
                <TabButton id="rubros" label="Rubros" icon={Layers} active={activeTab} onClick={setActiveTab} />
                <TabButton id="insumos" label="Insumos" icon={Package} active={activeTab} onClick={setActiveTab} />
                <TabButton id="notificaciones" label="Notificaciones" icon={Bell} active={activeTab} onClick={setActiveTab} />
            </div>

            <div className="glass-card p-6 rounded-2xl min-h-[400px]">
                {activeTab === 'proveedores' && <ProveedoresPanel />}
                {activeTab === 'rubros' && <RubrosPanel />}
                {activeTab === 'insumos' && <InsumosPanel />}
                {activeTab === 'notificaciones' && (
                    <NotificacionesPanel recipients={recipients} loading={loadingRecipients} />
                )}
            </div>
        </div>
    );
}

function TabButton({ id, label, icon: Icon, active, onClick }) {
    const isActive = active === id;
    return (
        <button
            onClick={() => onClick(id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition text-sm font-medium ${isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );
}

// --- SUB-PANELS ---

function ProveedoresPanel() {
    const [view, setView] = useState('list'); // list | create
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleExport = async (table) => {
        const csv = await exportTableToCSV(table);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${table.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleImport = async (table, e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const content = evt.target.result;
            const res = await importDataFromCSV(table, content);
            if (res.success) {
                alert(`Importación completada: ${res.imported} registros actualizados/creados.`);
                window.location.reload();
            } else {
                alert(`Error al importar: ${res.message}`);
            }
        };
        reader.readAsText(file);
    };

    // FETCH LIST ON MOUNT
    React.useEffect(() => {
        if (view === 'list') {
            setLoading(true);
            import('../../../actions/masterDataActions').then(mod => {
                mod.getProveedores().then(data => {
                    setProviders(data);
                    setLoading(false);
                });
            });
        }
    }, [view]);

    if (view === 'list') {
        return (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Directorio de Proveedores</h2>
                    <div className="flex gap-2">
                        <button onClick={() => handleExport('Proveedores')} className="btn-secondary flex items-center text-sm px-3 py-2">
                            <Download className="w-4 h-4 mr-2" /> Exportar
                        </button>
                        <label className="btn-secondary flex items-center text-sm px-3 py-2 cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" /> Importar
                            <input type="file" accept=".csv" className="hidden" onChange={(e) => handleImport('Proveedores', e)} />
                        </label>
                        <button
                            onClick={() => setView('create')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition ml-4"
                        >
                            <PlusCircle className="w-5 h-5 mr-2" /> Nuevo Proveedor
                        </button>
                    </div>
                </div>

                {loading ? <div className="text-slate-500">Cargando...</div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-slate-400">
                            <thead className="bg-slate-900/50 text-xs uppercase font-bold text-slate-500">
                                <tr>
                                    <th className="p-4">Código</th>
                                    <th className="p-4">Fantasía</th>
                                    <th className="p-4">Categoría</th>
                                    <th className="p-4">Vendedor</th>
                                    <th className="p-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {providers.map(p => (
                                    <tr key={p.ID} className="hover:bg-slate-800/30 transition">
                                        <td className="p-4 font-mono text-sm">{p.Codigo}</td>
                                        <td className="p-4 font-bold text-white">{p.Nombre_Fantasia}</td>
                                        <td className="p-4">
                                            <span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">
                                                {p.Categoria_Principal}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm">{p.Nombre_Vendedor}</td>
                                        <td className="p-4 text-center">
                                            <a
                                                href={`/configuracion/maestros/proveedores/${p.ID}`}
                                                className="text-indigo-400 hover:text-indigo-300 font-medium text-sm hover:underline"
                                            >
                                                Ver Ficha
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {providers.length === 0 && (
                            <div className="p-8 text-center text-slate-500">No hay proveedores registrados.</div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <ProveedoresForm onCancel={() => setView('list')} />
    );
}

function ProveedoresForm({ onCancel }) {
    const [section, setSection] = useState('general'); // general, fiscal, operativo, financiero, contacto
    const [formData, setFormData] = useState({
        // General
        codigo: '', nombreFantasia: '', razonSocial: '',
        // Fiscal
        cuit: '', condicionIva: 'Resp. Inscripto', iibb: '', condicionIibb: 'Local', agenteRetencion: false,
        // Operativo
        categoria: 'Secos', diasEntrega: '', leadTime: 1, minOrder: 0,
        // Financiero
        condicionPago: '30 Dias FF', cbu: '', alias: '', banco: '',
        // Contacto
        vendedor: '', telefono: '', email: '', emailAdmin: '', whatsapp: ''
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await createProveedor(formData);
        alert('Proveedor creado exitosamente con ficha completa');
        onCancel(); // Go back to list
    };

    return (
        <div className="flex gap-6 animate-in fade-in slide-in-from-right-4">
            <div className="w-1/4 space-y-1">
                <button onClick={onCancel} className="mb-4 text-sm text-slate-500 hover:text-white flex items-center">
                    ← Volver al Listado
                </button>
                <SectionButton id="general" label="Identificación" active={section} onClick={setSection} />
                <SectionButton id="fiscal" label="Datos Fiscales" active={section} onClick={setSection} />
                <SectionButton id="operativo" label="Operativa Logística" active={section} onClick={setSection} />
                <SectionButton id="financiero" label="Datos Financieros" active={section} onClick={setSection} />
                <SectionButton id="contacto" label="Contacto" active={section} onClick={setSection} />
            </div>

            <div className="w-3/4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2">
                        {section === 'general' && 'Identificación Comercial'}
                        {section === 'fiscal' && 'Información Fiscal y Tributaria'}
                        {section === 'operativo' && 'Logística y Abastecimiento'}
                        {section === 'financiero' && 'Tesorería y Pagos'}
                        {section === 'contacto' && 'Agenda de Contactos'}
                    </h2>

                    {/* GENERAL */}
                    {section === 'general' && (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="grid grid-cols-3 gap-4">
                                <Input label="Código Interno" value={formData.codigo} onChange={v => handleChange('codigo', v)} placeholder="PRV-001" />
                                <div className="col-span-2">
                                    <Input label="Nombre Fantasía (Operativo)" value={formData.nombreFantasia} onChange={v => handleChange('nombreFantasia', v)} placeholder="Ej: La Serenísima" required />
                                </div>
                            </div>
                            <Input label="Razón Social (Facturación)" value={formData.razonSocial} onChange={v => handleChange('razonSocial', v)} placeholder="Ej: Mastellone Hnos S.A." />
                        </div>
                    )}

                    {/* FISCAL */}
                    {section === 'fiscal' && (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="CUIT (Sin guiones)" value={formData.cuit} onChange={v => handleChange('cuit', v)} placeholder="30112233445" />
                                <Select label="Condición IVA" value={formData.condicionIva} onChange={v => handleChange('condicionIva', v)}>
                                    <option>Resp. Inscripto</option>
                                    <option>Monotributo</option>
                                    <option>Exento</option>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Nro IIBB" value={formData.iibb} onChange={v => handleChange('iibb', v)} />
                                <Select label="Condición IIBB" value={formData.condicionIibb} onChange={v => handleChange('condicionIibb', v)}>
                                    <option>Local</option>
                                    <option>Convenio Multilateral</option>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                                <input type="checkbox" id="ret" className="checkbox checkbox-primary" checked={formData.agenteRetencion} onChange={e => handleChange('agenteRetencion', e.target.checked)} />
                                <label htmlFor="ret" className="label-text mb-0 cursor-pointer text-white">Es Agente de Retención</label>
                            </div>
                        </div>
                    )}

                    {/* OPERATIVO */}
                    {section === 'operativo' && (
                        <div className="space-y-4 animate-in fade-in">
                            <Select label="Categoría Principal" value={formData.categoria} onChange={v => handleChange('categoria', v)}>
                                <option>Carniceria</option>
                                <option>Verdulería</option>
                                <option>Almacen / Secos</option>
                                <option>Bebidas</option>
                                <option>Descartables</option>
                                <option>Limpieza</option>
                            </Select>
                            <Input label="Días de Entrega" value={formData.diasEntrega} onChange={v => handleChange('diasEntrega', v)} placeholder="Lun, Mie, Vie" />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Lead Time (Días)" type="number" value={formData.leadTime} onChange={v => handleChange('leadTime', v)} />
                                <Input label="Pedido Mínimo ($)" type="number" value={formData.minOrder} onChange={v => handleChange('minOrder', v)} />
                            </div>
                        </div>
                    )}

                    {/* FINANCIERO */}
                    {section === 'financiero' && (
                        <div className="space-y-4 animate-in fade-in">
                            <Select label="Condición de Pago Pactada" value={formData.condicionPago} onChange={v => handleChange('condicionPago', v)}>
                                <option>Contado</option>
                                <option>15 Dias FF</option>
                                <option>30 Dias FF</option>
                                <option>45 Dias FF</option>
                                <option>Cheque 30 Dias</option>
                            </Select>
                            <Input label="CBU / CVU" value={formData.cbu} onChange={v => handleChange('cbu', v)} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Alias" value={formData.alias} onChange={v => handleChange('alias', v)} />
                                <Input label="Banco" value={formData.banco} onChange={v => handleChange('banco', v)} />
                            </div>
                        </div>
                    )}

                    {/* CONTACTO */}
                    {section === 'contacto' && (
                        <div className="space-y-4 animate-in fade-in">
                            <Input label="Nombre Vendedor" value={formData.vendedor} onChange={v => handleChange('vendedor', v)} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Teléfono Pedidos" value={formData.telefono} onChange={v => handleChange('telefono', v)} />
                                <Input label="Email Pedidos" value={formData.email} onChange={v => handleChange('email', v)} />
                            </div>
                            <Input label="Email Administración (Pagos)" value={formData.emailAdmin} onChange={v => handleChange('emailAdmin', v)} />

                            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                                <label className="block text-sm font-medium text-blue-300 mb-2">
                                    📱 WhatsApp para Notificaciones (con código de país)
                                </label>
                                <Input
                                    value={formData.whatsapp}
                                    onChange={v => handleChange('whatsapp', v)}
                                    placeholder="+5491112345678"
                                />
                                <p className="text-xs text-blue-400 mt-2">
                                    Este número recibirá notificaciones automáticas de OC y recepciones. Formato: +54 9 11 1234 5678 (sin espacios)
                                </p>
                            </div>

                            <button type="submit" className="btn-primary w-full flex justify-center mt-8">
                                <Save className="w-5 h-5 mr-2" /> Guardar Ficha Completa
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

function SectionButton({ id, label, active, onClick }) {
    return (
        <button
            type="button"
            onClick={() => onClick(id)}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition ${active === id ? 'bg-slate-700 text-white font-bold border-l-4 border-purple-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
        >
            {label}
        </button>
    )
}

function Input({ label, value, onChange, type = 'text', placeholder, required }) {
    return (
        <div>
            <label className="label-text">{label}</label>
            <input type={type} className="input-dark w-full" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} />
        </div>
    )
}

function Select({ label, value, onChange, children }) {
    return (
        <div>
            <label className="label-text">{label}</label>
            <select className="input-dark w-full" value={value} onChange={e => onChange(e.target.value)}>
                {children}
            </select>
        </div>
    )
}

function RubrosPanel() {
    const [rubro, setRubro] = useState('');

    const handleExport = async (table) => {
        const csv = await exportTableToCSV(table);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${table.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleImport = async (table, e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const content = evt.target.result;
            const res = await importDataFromCSV(table, content);
            if (res.success) {
                alert(`Importación completada: ${res.imported} registros actualizados/creados.`);
                window.location.reload();
            } else {
                alert(`Error al importar: ${res.message}`);
            }
        };
        reader.readAsText(file);
    };

    const handleAddRubro = async (e) => {
        e.preventDefault();
        await createRubro(rubro);
        alert('Rubro creado');
        setRubro('');
    };

    return (
        <div className="grid grid-cols-2 gap-8">
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Nuevo Rubro</h2>
                    <div className="flex gap-2">
                        <button onClick={() => handleExport('Rubros')} className="btn-secondary flex items-center text-sm px-3 py-2">
                            <Download className="w-4 h-4 mr-2" /> Exportar
                        </button>
                        <label className="btn-secondary flex items-center text-sm px-3 py-2 cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" /> Importar
                            <input type="file" accept=".csv" className="hidden" onChange={(e) => handleImport('Rubros', e)} />
                        </label>
                    </div>
                </div>
                <form onSubmit={handleAddRubro} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Nombre Rubro</label>
                        <input className="input-dark w-full" value={rubro} onChange={e => setRubro(e.target.value)} placeholder="Ej: Congelados" required />
                    </div>
                    <button className="btn-primary w-full flex justify-center">
                        <PlusCircle className="w-5 h-5 mr-2" /> Crear Rubro
                    </button>
                </form>
            </div>
            {/* Subrubros Logic simplified for prototype */}
            <div className="opacity-50 pointer-events-none">
                <h2 className="text-xl font-bold text-white mb-6">Subrubros</h2>
                <div className="p-4 border border-dashed border-slate-700 rounded-lg text-center text-slate-500">
                    Selecciona un rubro para gestionar subrubros
                </div>
            </div>
        </div>
    );
}

function InsumosPanel() {
    const [view, setView] = useState('list');
    const [section, setSection] = useState('identificacion');
    const [formData, setFormData] = useState({
        // ID
        codigo: '', nombre: '', idRubro: '', idSubrubro: '',
        // Unidades
        unidadCompra: 'Caja', contenidoNeto: 1, unidadStock: 'Unidad', unidadUso: 'Ml', factor: 1,
        // Costos
        rendimiento: 100, iva: 21,
        // Stock
        min: 5, max: 20, ubicacion: ''
    });

    // --- HANDLERS ---

    const handleExport = async () => {
        const csv = await exportTableToCSV('Insumos');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `insumos_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const content = evt.target.result;
            const res = await importDataFromCSV('Insumos', content);
            if (res.success) {
                alert(`Importación completada: ${res.imported} registros actualizados/creados.`);
                window.location.reload();
            } else {
                alert(`Error al importar: ${res.message}`);
            }
        };
        reader.readAsText(file);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Force manual Rubro 1 for now if empty
        const payload = { ...formData, idRubro: 1, idSubrubro: 1 };
        await createInsumo(payload);
        alert('Insumo registrado correctamente.');
        setFormData({
            codigo: '', nombre: '', idRubro: '', idSubrubro: '',
            unidadCompra: 'Caja', contenidoNeto: 1, unidadStock: 'Unidad', unidadUso: 'Ml', factor: 1,
            rendimiento: 100, iva: 21,
            min: 5, max: 20, ubicacion: ''
        });
        setSection('identificacion');
        setView('list');
    };

    // --- RENDER ---

    if (view === 'list') {
        return (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Maestro de Insumos</h2>
                    <div className="flex gap-2">
                        <button onClick={handleExport} className="btn-secondary flex items-center text-sm px-3 py-2">
                            <Download className="w-4 h-4 mr-2" /> Exportar
                        </button>
                        <label className="btn-secondary flex items-center text-sm px-3 py-2 cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" /> Importar
                            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
                        </label>
                        <button
                            onClick={() => setView('create')}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center transition ml-4"
                        >
                            <PlusCircle className="w-5 h-5 mr-2" /> Nuevo Insumo
                        </button>
                    </div>
                </div>
                <p className="text-slate-500 italic p-4 border border-dashed border-slate-700 rounded-lg text-center">
                    Visualización de lista de insumos pendiente de implementación. Usa Exportar para ver datos.
                </p>
            </div>
        );
    }

    // CREATE FORM
    return (
        <div className="flex gap-6 animate-in fade-in slide-in-from-right-4">
            <div className="w-1/4 space-y-1">
                <button onClick={() => setView('list')} className="mb-4 text-sm text-slate-500 hover:text-white flex items-center">
                    ← Volver
                </button>
                <SectionButton id="identificacion" label="Identificación" active={section} onClick={setSection} />
                <SectionButton id="unidades" label="Unidades y Conversión" active={section} onClick={setSection} />
                <SectionButton id="stock" label="Control de Stock" active={section} onClick={setSection} />
                <SectionButton id="fiscal" label="Datos Fiscales" active={section} onClick={setSection} />
            </div>

            <div className="w-3/4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2">
                        {section === 'identificacion' && 'Definición del Producto'}
                        {section === 'unidades' && 'Lógica de Unidades'}
                        {section === 'stock' && 'Parámetros de Inventario'}
                        {section === 'fiscal' && 'Impuestos y Rendimientos'}
                    </h2>

                    {/* IDENTIFICACION */}
                    {section === 'identificacion' && (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="grid grid-cols-4 gap-4">
                                <Input label="Código SKU" value={formData.codigo} onChange={v => handleChange('codigo', v)} placeholder="CAR-001" required />
                                <div className="col-span-3">
                                    <Input label="Nombre del Insumo" value={formData.nombre} onChange={v => handleChange('nombre', v)} placeholder="Ej: Lomo Vetado Premium" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg border border-dashed border-slate-700 text-center text-slate-500 text-sm">
                                    Selector de Rubro (Pendiente de integrar con DB)
                                </div>
                                <div className="p-4 rounded-lg border border-dashed border-slate-700 text-center text-slate-500 text-sm">
                                    Selector de Sub-Rubro
                                </div>
                            </div>
                        </div>
                    )}

                    {/* UNIDADES */}
                    {section === 'unidades' && (
                        <div className="space-y-6 animate-in fade-in">
                            {/* Layer 1: Purchase -> Stock */}
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <h3 className="text-sm font-bold text-purple-400 mb-4 uppercase tracking-wider">Compra vs Stock</h3>
                                <div className="flex items-end gap-4">
                                    <div className="flex-1">
                                        <Input label="Unidad de Compra" value={formData.unidadCompra} onChange={v => handleChange('unidadCompra', v)} placeholder="Ej: Caja" />
                                    </div>
                                    <div className="pb-3 text-slate-400 font-bold">=</div>
                                    <div className="w-24">
                                        <Input type="number" label="Contenido" value={formData.contenidoNeto} onChange={v => handleChange('contenidoNeto', v)} />
                                    </div>
                                    <div className="flex-1">
                                        <Input label="Unidad de Stock" value={formData.unidadStock} onChange={v => handleChange('unidadStock', v)} placeholder="Ej: Botella" />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 text-center">
                                    Ejemplo: "1 <strong>{formData.unidadCompra || 'Caja'}</strong> contiene <strong>{formData.contenidoNeto} {formData.unidadStock || 'Botellas'}</strong>"
                                </p>
                            </div>

                            {/* Layer 2: Stock -> Usage */}
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <h3 className="text-sm font-bold text-indigo-400 mb-4 uppercase tracking-wider">Stock vs Uso (Receta)</h3>
                                <div className="flex items-end gap-4">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-white mb-2 px-3 py-2 bg-slate-700 rounded-lg opacity-80">{formData.unidadStock || 'Unidad Stock'}</div>
                                    </div>
                                    <div className="pb-3 text-slate-400 font-bold">=</div>
                                    <div className="w-24">
                                        <Input type="number" label="Conversión" value={formData.factor} onChange={v => handleChange('factor', v)} />
                                    </div>
                                    <div className="flex-1">
                                        <Input label="Unidad de Uso" value={formData.unidadUso} onChange={v => handleChange('unidadUso', v)} placeholder="Ej: Ml" />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 text-center">
                                    Ejemplo: "1 <strong>{formData.unidadStock || 'Botella'}</strong> rinde <strong>{formData.factor} {formData.unidadUso || 'Ml'}</strong>"
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STOCK */}
                    {section === 'stock' && (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                <Input type="number" label="Stock Mínimo (Alerta)" value={formData.min} onChange={v => handleChange('min', v)} />
                                <Input type="number" label="Stock Máximo (Ideal)" value={formData.max} onChange={v => handleChange('max', v)} />
                            </div>
                            <Input label="Ubicación Física" value={formData.ubicacion} onChange={v => handleChange('ubicacion', v)} placeholder="Ej: Estante 3B, Cámara Frío" />
                        </div>
                    )}

                    {/* FISCAL */}
                    {section === 'fiscal' && (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                <Select label="Alícuota IVA" value={formData.iva} onChange={v => handleChange('iva', v)}>
                                    <option value="21">21% (General)</option>
                                    <option value="10.5">10.5% (Reducido)</option>
                                    <option value="27">27% (Servicios)</option>
                                    <option value="0">0% (Exento)</option>
                                </Select>
                                <Input type="number" label="Rendimiento % (Yield)" value={formData.rendimiento} onChange={v => handleChange('rendimiento', v)} placeholder="100" />
                            </div>
                            <p className="text-xs text-slate-500">
                                El rendimiento afecta al costo de la receta. Si el rendimiento es 80%, el costo real sube un 25%.
                            </p>

                            <button type="submit" className="btn-primary w-full flex justify-center mt-8">
                                <Save className="w-5 h-5 mr-2" /> Guardar Maestro de Insumo
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

function NotificacionesPanel({ recipients, loading }) {
    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Destinatarios de Notificaciones WhatsApp</h2>
                <p className="text-slate-400 text-sm">
                    Configura los usuarios internos que recibirán notificaciones automáticas cuando se envíen órdenes de compra o se reciba mercadería.
                </p>
            </div>

            {loading ? (
                <div className="text-slate-500 text-center py-8">Cargando destinatarios...</div>
            ) : (
                <NotificationRecipientsManager initialRecipients={recipients} />
            )}
        </div>
    );
}
