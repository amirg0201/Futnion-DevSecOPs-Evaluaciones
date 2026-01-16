// src/services/authService.js
import { API_BASE_URL } from './config';

export const loginUser = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Error al iniciar sesión');
    }

    return await response.json();
};

export const registerUser = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/usuarios/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Error al registrarse');
    }

    return await response.json();
};