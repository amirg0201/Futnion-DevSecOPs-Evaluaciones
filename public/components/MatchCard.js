// components/MatchCard.js

/**
 * Genera el HTML de una tarjeta de partido con toda su lógica de estilo y botones.
 */
export const createMatchCard = (match, currentUserId) => {
    
    // --- Lógica de Seguridad y Roles ---
    const userRole = localStorage.getItem('userRole'); 
    
    // Lógica de cálculo básico
    const spotsLeft = match.requiredPlayers - match.participants.length;
    const isCreator = match.creator && (match.creator._id === currentUserId);
    
    // Determinar si el botón de eliminar debe ser visible
    const canDelete = (userRole === 'admin') || isCreator; 

    // --- Variables de Estilo y Etiqueta ---
    const cardClass = isCreator ? 'match-card my-match' : 'match-card';
    const creatorTag = isCreator ? '<span class="creator-tag">Mío</span>' : '';

    // --- LÓGICA DE ESTADO (JOIN/LEAVE) ---
    // Verificar si el usuario ya es participante
    const isJoined = match.participants.some(p => {
        const id = p._id || p; // Maneja si está poblado (objeto) o no (string)
        return id === currentUserId;
    });
    
    // Definir estado del botón principal
    let buttonText = 'Unirme';
    let buttonClass = 'join-btn'; // Clase por defecto (Verde)
    let buttonDisabled = '';

    if (isCreator) {
        // Prioridad 1: Si eres el dueño, no te unes ni te sales (por ahora)
        buttonText = 'Eres el creador';
        buttonDisabled = 'disabled';
    } else if (isJoined) {
        // Prioridad 2: Si ya estás dentro, el botón permite SALIR
        buttonText = 'Salir del Partido';
        buttonClass = 'leave-match-btn'; // Clase nueva (Rojo/Naranja) para el evento de salir
    } else if (spotsLeft <= 0) {
        // Prioridad 3: Si no estás dentro y está lleno
        buttonText = 'Lleno';
        buttonDisabled = 'disabled';
    }
    // Si nada de lo anterior, queda como "Unirme" (join-btn)

    // --- Renderizado Final ---
    return `
        <div class="${cardClass}" data-id="${match._id}">
            <h3>${match.MatchName} ${creatorTag}</h3>
            <p><strong>Lugar:</strong> ${match.LocationName}</p>
            <p><strong>Duración:</strong> ${match.MatchDuration || 1} horas</p>
            <p><strong>Organizador:</strong> ${match.creator ? match.creator.username : 'Sistema'}</p>
            <p><strong>Cupos Faltantes:</strong> ${spotsLeft}</p>
            
            <div class="card-actions">
                <button class="${buttonClass}" data-id="${match._id}" ${buttonDisabled}>
                    ${buttonText}
                </button>
                
                ${canDelete ? `
                    <button class="delete-btn" data-id="${match._id}">🗑️</button>
                ` : ''}
            </div>
        </div>
    `;
};