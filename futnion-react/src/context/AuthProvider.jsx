// src/context/AuthProvider.jsx
import { useState } from 'react';
import { AuthContext } from './authContext'; // Importamos el contexto del otro archivo

export const AuthProvider = ({ children }) => {
    // Inicialización Perezosa
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const role = localStorage.getItem('userRole');

        if (token && userId) {
            return { token, userId, role };
        }
        return null;
    });

    const login = (data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userRole', data.role);
        setUser(data);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        setUser(null);
    };

    // Retornamos el Provider usando el contexto importado
    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};