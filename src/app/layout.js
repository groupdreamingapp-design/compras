import './globals.css';
import { Inter } from 'next/font/google';
import AppProviders from '../providers/AppProviders';
import AuthenticatedLayout from '../components/AuthenticatedLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Gestión de Compra',
    description: 'Copiloto de Compras para Gastronomía',
};

export default function RootLayout({ children }) {
    return (
        <html lang="es">
            <body className={`${inter.className} bg-slate-900 text-slate-100 antialiased`}>
                <AppProviders>
                    <AuthenticatedLayout>
                        {children}
                    </AuthenticatedLayout>
                </AppProviders>
            </body>
        </html>
    );
}
