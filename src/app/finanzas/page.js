import React from 'react';
import { getFinanceMetrics, getUnpaidInvoices } from '@/services/finance';
import FinanceDashboardView from '@/components/Finance/FinanceDashboardView';

export default async function FinanceDashboard() {
    const [metrics, invoices] = await Promise.all([
        getFinanceMetrics(),
        getUnpaidInvoices()
    ]);

    return <FinanceDashboardView metrics={metrics} invoices={invoices} />;
}
