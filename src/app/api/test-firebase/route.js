
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
    try {
        if (!adminDb) {
            return NextResponse.json({ error: 'Firebase Admin not initialized (check env vars)' }, { status: 500 });
        }

        const testRef = adminDb.collection('test_connectivity').doc('ping');
        await testRef.set({
            message: 'pong',
            timestamp: new Date().toISOString(),
            user: 'system_test'
        });

        const doc = await testRef.get();

        return NextResponse.json({
            status: 'success',
            data: doc.data(),
            path: doc.ref.path
        });
    } catch (error) {
        console.error("Firebase Test Error:", error);
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
