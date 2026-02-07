
import { adminDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        if (!adminDb) {
            console.error('Firebase Admin not initialized');
            return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
        }

        const snapshot = await adminDb.collection('usuarios').orderBy('ID').get();
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users from Firestore:', error);
        return NextResponse.json({
            error: 'Failed to fetch users',
            details: error.message,
            initialized: !!adminDb
        }, { status: 500 });
    }
}
