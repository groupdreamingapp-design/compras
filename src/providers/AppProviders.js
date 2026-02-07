'use client';

import { UserProvider } from '../context/UserContext';

export default function AppProviders({ children }) {
    return (
        <UserProvider>
            {children}
        </UserProvider>
    );
}
