// public/services/config.js

// URL base del Backend (ajusta si usas localhost o Render)
export const API_BASE_URL = 'https://futnion.onrender.com/api'; 
// Ojo: Si estás en local usa: 'http://localhost:5000/api'

// Helper para obtener los headers con el token
export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};