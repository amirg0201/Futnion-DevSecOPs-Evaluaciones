import { API_BASE_URL } from './config.js';

export const loginUser = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, password })
    });
    return response;
};

export const registerUser = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
    });
    return response;
};