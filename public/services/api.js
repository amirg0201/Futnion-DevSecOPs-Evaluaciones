// services/api.js

const API_BASE_URL = 'https://futnion.onrender.com/api';

// Función auxiliar para obtener el token de localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

// ======================================
// 1. USUARIOS / AUTENTICACIÓN
// ======================================

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

// ======================================
// 2. PARTIDOS
// ======================================

export const createMatch = async (matchData) => {
    const response = await fetch(`${API_BASE_URL}/partidos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(matchData)
    });
    return response;
};

export const getMatches = async () => {
    // La ruta GET /partidos es pública, solo necesita el Content-Type
    const response = await fetch(`${API_BASE_URL}/partidos`);
    return response;
};

export const getMatchById = async (matchId) => {
    const response = await fetch(`${API_BASE_URL}/partidos/${matchId}`);
    return response;
};

export const joinMatchAPI = async (matchId) => {
    const response = await fetch(`${API_BASE_URL}/partidos/${matchId}/join`, {
        method: 'POST',
        headers: getAuthHeaders()
        // No necesita body
    });
    return response;
};

export const deleteMatchAPI = async (matchId, userRole) => {
    // Decidir la ruta basada en el rol
    const route = userRole === 'admin' 
        ? `/partidos/admin/${matchId}` 
        : `/partidos/${matchId}`;

    // Usar la URL base correcta (Render o Localhost)
    const response = await fetch(`${API_BASE_URL}${route}`, {
        method: 'DELETE',
        headers: getAuthHeaders() // Usa tus headers con el token
    });
    
    return response;
};

export const getMyMatches = async () => {
    const response = await fetch(`${API_BASE_URL}/partidos/mis-partidos`, {
        method: 'GET',
        headers: getAuthHeaders() // Necesita token para saber quién eres
    });
    return response;
};

export const leaveMatchAPI = async (matchId) => {
    const response = await fetch(`${API_BASE_URL}/partidos/${matchId}/leave`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return response;
};

export const removeParticipantAPI = async (matchId, userId) => {
    const response = await fetch(`${API_BASE_URL}/partidos/${matchId}/participants/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return response;
};