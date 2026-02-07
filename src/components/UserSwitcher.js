'use client';

import { useUser } from '../context/UserContext';
import { ChevronDown } from 'lucide-react';

export default function UserSwitcher() {
    const { users, currentUser, login } = useUser();

    if (!Array.isArray(users) || users.length === 0) return null;

    return (
        <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-md bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="py-1">
                <div className="px-4 py-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Cambiar Usuario
                </div>
                {users.map((user) => (
                    <button
                        key={user.ID}
                        onClick={() => login(user.ID)}
                        className={`block w-full text-left px-4 py-2 text-sm ${currentUser?.ID === user.ID
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        <div className="font-medium">{user.Nombre}</div>
                        <div className="text-xs text-slate-500">{user.Rol} - {user.Puesto}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}
