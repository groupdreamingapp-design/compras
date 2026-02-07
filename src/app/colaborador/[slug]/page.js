export default async function ColaboradorPage({ params }) {
    const { slug } = await params;
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent capitalize">
                {slug.replace('-', ' ')}
            </h1>
            <p className="text-slate-400 max-w-md">
                Esta sección es exclusiva para el perfil de Colaborador.
                Aquí verás tus herramientas de día a día.
            </p>
            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 mt-8">
                <span className="text-sm font-mono text-slate-300">Vista de Demostración</span>
            </div>
        </div>
    );
}
