import React from 'react';
import { getOpenOrders } from '@/actions/receptionActions';
import ReceptionView from '@/components/Reception/ReceptionView';

export default async function NewReceptionPage() {
    const orders = await getOpenOrders();
    return <ReceptionView initialOrders={orders} />;
}
