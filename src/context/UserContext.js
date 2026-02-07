'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetch('/api/users');
                const data = await res.json();

                if (Array.isArray(data)) {
                    setUsers(data);
                    // Default to first user (Admin) if available
                    if (data.length > 0) {
                        setCurrentUser(data[0]);
                    }
                } else {
                    console.error('User API returned invalid format:', data);
                    setUsers([]);
                }
            } catch (error) {
                console.error('Failed to load users', error);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, []);

    const login = (userId) => {
        const user = users.find(u => u.ID === parseInt(userId));
        if (user) {
            setCurrentUser(user);
        }
    };

    return (
        <UserContext.Provider value={{ users, currentUser, login, loading }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
