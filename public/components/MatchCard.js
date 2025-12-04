// components/MatchCard.js

/**
 * Genera el HTML de una tarjeta de partido con toda su lógica de estilo y botones.
 */
export const createMatchCard = (match, currentUserId) => {
    // Lógica de cálculo
    const spotsLeft = match.requiredPlayers - match.participants.length;
    const isCreator = match.creator && (match.creator._id === currentUserId);
    
    // Variables de estilo y etiquetas
    const cardClass = isCreator ? 'match-card my-match' : 'match-card';
    const creatorTag = isCreator ? '<span class="creator-tag">Mío</span>' : '';
    
    // Botón
    const buttonText = isCreator ? 'Eres el creador' : (spotsLeft <= 0 ? 'Lleno' : 'Unirme');
    const buttonDisabled = (spotsLeft <= 0 || isCreator) ? 'disabled' : '';

    return `
        <div class="${cardClass}" data-id="${match._id}">
            <h3>${match.MatchName} ${creatorTag}</h3>
            <p><strong>Lugar:</strong> ${match.LocationName}</p>
            <p><strong>Organizador:</strong> ${match.creator ? match.creator.username : 'Sistema'}</p>
            <p><strong>Cupos Faltantes:</strong> ${spotsLeft}</p>
            
            <button class="join-btn" data-id="${match._id}" ${buttonDisabled}>
                ${buttonText}
            </button>
        </div>
    `;
};