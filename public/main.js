// main.js - EL ORQUESTADOR CENTRAL (FINAL CORREGIDO)

// ======================================
// 1. IMPORTACIONES
// ======================================
import { initializeDashboardUI } from './components/DashboardUI.js';
import { loginUser, registerUser, getMatches, createMatch as createMatchService, getMatchById, joinMatchAPI, deleteMatchAPI, getMyMatches, leaveMatchAPI } from './services/api.js';
import { createMatchCard } from './components/MatchCard.js';

// ======================================
// 2. FUNCIONES AUXILIARES (UTILIDADES)
// ======================================

/**
 * Calcula el inicio y fin de un partido en Milisegundos.
 */
function calculateMatchWindow(match) {
    const startDate = new Date(match.MatchDate);
    const startMs = startDate.getTime();

    let durationHours = match.MatchDuration;
    
    // Si no viene en el objeto, leemos del DOM (para creación)
    if ((durationHours === undefined || durationHours === null) && document.getElementById('match-duration')) {
        durationHours = parseFloat(document.getElementById('match-duration').value);
    }

    if (!durationHours || isNaN(durationHours)) {
        durationHours = 1; 
    }

    const durationMs = durationHours * 60 * 60 * 1000;
    const endMs = startMs + durationMs;

    return { 
        start: startMs, 
        end: endMs, 
        name: match.MatchName || 'Nuevo Partido',
        humanStart: startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        humanEnd: new Date(endMs).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
}

function isOverlapping(windowA, windowB) {
    return windowA.start < windowB.end && windowA.end > windowB.start;
}


// ======================================
// 3. INICIO DE LA APLICACIÓN (DOM READY)
// ======================================
document.addEventListener('DOMContentLoaded', () => {

  // --- VARIABLES DEL DOM ---
  const loginContainer = document.querySelector('.form-container');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegisterLink = document.getElementById('show-register-link');
  const showLoginLink = document.getElementById('show-login-link');
  
  const appContainer = document.getElementById('app-container');
  const homePage = document.getElementById('home-page');
  const createPage = document.getElementById('create-page');
  
  // Navegación y Botones
  const navHome = document.getElementById('nav-home');
  const navCreate = document.getElementById('nav-create');
  const navLogout = document.getElementById('nav-logout');
  const navMyMatches = document.getElementById('nav-my-matches'); // Nuevo
  
  // Secciones y Listas
  const createMatchForm = document.getElementById('create-match-form');
  const matchesListDiv = document.getElementById('matches-list');
  const myMatchesPage = document.getElementById('my-matches-page'); // Nuevo
  const myMatchesListDiv = document.getElementById('my-matches-list'); // Nuevo
  
  // Modal
  const modalContainer = document.getElementById('modal-container');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');


  // --- LÓGICA DE LOGIN/REGISTRO ---
  showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  });

  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const response = await loginUser(email, password);
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userRole', data.role);
        
        setupApp(); 
      } else {
        alert(`Error: ${data.msg}`);
      }
    } catch (error) {
      console.error('Error en el login:', error);
      alert('No se pudo conectar con el servidor.');
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const userData = Object.fromEntries(formData.entries());

    try {
      const response = await registerUser(userData); 
      const data = await response.json();

      if (response.ok) {
        alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        loginForm.reset(); 
      } else {
        alert(`Error en el registro: ${data.msg || data.error}`);
      }
    } catch (error) {
      console.error('Error de red:', error);
      alert('No se pudo conectar con el servidor.');
    }
  });


  // --- CONFIGURACIÓN DE LA UI ---
  function setupApp() {
    loginContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');

    const elements = {
        appContainer, homePage, createPage, navHome, navCreate, navLogout, 
        createMatchForm, matchesListDiv, modalContainer, modalBody, modalClose,
        navMyMatches, myMatchesPage, myMatchesListDiv // Pasamos los nuevos elementos
    };
    
    // Pasamos todas las funciones de lógica al UI Manager
    const handlers = {
        loadMatches, createMatch, showMatchDetails, joinMatch, loadMyMatches 
    };

    initializeDashboardUI(elements, handlers); 
    
    loadMatches();
  }


  // ======================================
  // 4. LÓGICA DE DATOS (CONTROLADORES)
  // ======================================
  
  // --- CARGAR TODOS LOS PARTIDOS (HOME) ---
  async function loadMatches() {
    const currentUserId = localStorage.getItem('userId');
    matchesListDiv.innerHTML = "Cargando partidos...";

    try {
      const response = await getMatches(); 
      if (!response.ok) throw new Error('Error al cargar partidos');
      const matches = await response.json();
      
      if (matches.length === 0) {
        matchesListDiv.innerHTML = '<p>No hay partidos disponibles. ¡Crea el primero!</p>';
        return;
      }

      matchesListDiv.innerHTML = matches.map(match => {
        return createMatchCard(match, currentUserId);
      }).join('');

      attachDynamicEvents(matchesListDiv); // Helper para eventos

    } catch (error) {
      matchesListDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
  }

  // --- CARGAR MIS PARTIDOS (NUEVA PESTAÑA) ---
  async function loadMyMatches() {
    const currentUserId = localStorage.getItem('userId');
    myMatchesListDiv.innerHTML = "Cargando tus partidos...";

    try {
        const response = await getMyMatches(); 
        if (!response.ok) throw new Error('Error al cargar tus partidos');
        const matches = await response.json();
        
        if (matches.length === 0) {
            myMatchesListDiv.innerHTML = '<p>No estás inscrito en ningún partido aún.</p>';
            return;
        }

        myMatchesListDiv.innerHTML = matches.map(match => {
            return createMatchCard(match, currentUserId);
        }).join('');

        attachDynamicEvents(myMatchesListDiv); // Reutilizamos el helper

    } catch (error) {
        myMatchesListDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
  }

  // --- HELPER PARA ASIGNAR EVENTOS A TARJETAS ---
  function attachDynamicEvents(container) {
      // 1. Botón Unirse
      container.querySelectorAll('.join-btn').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          joinMatch(e.target.dataset.id); 
        });
      });

      // 2. Botón Salir (Amarillo/Rojo) - ¡NUEVO!
      container.querySelectorAll('.leave-match-btn').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          // Llamamos a la función leaveMatch (que definiremos abajo)
          leaveMatch(e.target.dataset.id); 
        });
      });

      // 2. Click en Tarjeta (Modal)
      container.querySelectorAll('.match-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.join-btn') || e.target.closest('.delete-btn')) return;
          showMatchDetails(card.dataset.id);
        });
      });

      // 3. Botón Eliminar
      container.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          handleDeleteMatch(e.target.dataset.id); 
        });
      });
  }


  // --- CREAR PARTIDO (CON VALIDACIÓN DE TIEMPO) ---
  async function createMatch(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const currentUserId = localStorage.getItem('userId');
    
    if (!token || !currentUserId) return alert('Tu sesión ha expirado.');

    const matchData = {
      MatchName: document.getElementById('match-name').value,
      LocationName: document.getElementById('match-location').value,
      MatchDate: document.getElementById('match-date').value,
      MatchDuration: parseFloat(document.getElementById('match-duration').value),
      PlayersBySide: parseInt(document.getElementById('match-players-side').value),
      requiredPlayers: parseInt(document.getElementById('match-required').value)
    };

    if (isNaN(matchData.MatchDuration) || matchData.MatchDuration <= 0) {
        return alert("Ingresa una duración válida (ej: 1 o 1.5).");
    }

    try {
      // Validación de Conflicto
      const myMatchesResponse = await getMyMatches();
      if (myMatchesResponse.ok) {
          const myMatches = await myMatchesResponse.json();
          const newWindow = calculateMatchWindow(matchData);

          for (const existingMatch of myMatches) {
              const existingWindow = calculateMatchWindow(existingMatch);
              if (isOverlapping(existingWindow, newWindow)) {
                  return alert(`⚠️ CONFLICTO: Ya tienes el partido "${existingMatch.MatchName}" a esa hora.`);
              }
          }
      }

      const response = await createMatchService(matchData); 
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.msg || 'Error al crear el partido');

      alert('¡Partido creado con éxito!');
      createMatchForm.reset();
      navHome.click(); 

    } catch (error) {
      alert(error.message);
    }
  }

  // --- UNIRSE A PARTIDO (CON VALIDACIÓN DE TIEMPO) ---
  async function joinMatch(matchId) {
    const token = localStorage.getItem('token');
    const currentUserId = localStorage.getItem('userId'); 
    
    if (!token || !currentUserId) return alert('Tu sesión ha expirado.');

    try {
        // Validación de Conflicto
        const targetMatchResponse = await getMatchById(matchId);
        const myMatchesResponse = await getMyMatches();

        if (targetMatchResponse.ok && myMatchesResponse.ok) {
            const matchToJoin = await targetMatchResponse.json();
            const myMatches = await myMatchesResponse.json();
            
            const targetWindow = calculateMatchWindow(matchToJoin);

            for (const existingMatch of myMatches) {
                const existingWindow = calculateMatchWindow(existingMatch);
                if (isOverlapping(existingWindow, targetWindow)) {
                    return alert(`⚠️ IMPOSIBLE UNIRSE: Choca con tu partido "${existingMatch.MatchName}".`);
                }
            }
        }

        const response = await joinMatchAPI(matchId);
        const data = await response.json();

        if (response.ok) {
            alert('¡Te has unido al partido!');
            loadMatches(); 
        } else {
            alert(`Error: ${data.msg}`);
        }
    } catch (error) {
        alert('Error de red al intentar unirse.');
    }
  }

  // --- ELIMINAR PARTIDO ---
  async function handleDeleteMatch(matchId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este partido?')) return;
    const userRole = localStorage.getItem('userRole');

    try {
        const response = await deleteMatchAPI(matchId, userRole);
        if (response.ok) {
            alert('Partido eliminado con éxito.');
            loadMatches(); 
            // Si estamos en la pestaña de mis partidos, recargar esa también
            if (!myMatchesPage.classList.contains('hidden')) {
                loadMyMatches();
            }
        } else {
            const data = await response.json();
            alert(`Error al eliminar: ${data.msg}`);
        }
    } catch (error) {
        alert('Error de red al intentar eliminar.');
    }
  }

  // --- VER DETALLES ---
  async function showMatchDetails(matchId) {
    try {
      modalBody.innerHTML = 'Cargando...';
      modalContainer.classList.remove('hidden');

      const response = await getMatchById(matchId); 
      if (!response.ok) throw new Error('No se pudo cargar la información.');
      
      const match = await response.json();

      const matchDate = new Date(match.MatchDate).toLocaleString('es-ES', {
        dateStyle: 'full', timeStyle: 'short'
      });

      let participantsList = '<li>Aún no hay jugadores inscritos.</li>';
      if (match.participants && match.participants.length > 0) {
        participantsList = match.participants
          .map(user => `<li class="participant-item">${user ? user.username : 'Usuario desconocido'}</li>`)
          .join('');
      }

      modalBody.innerHTML = `
        <h3>${match.MatchName}</h3>
        <p><strong>Cuándo:</strong> ${matchDate}</p>
        <p><strong>Duración:</strong> ${match.MatchDuration || 1} horas</p>
        <p><strong>Dónde:</strong> ${match.LocationName}</p>
        <p><strong>Formato:</strong> ${match.PlayersBySide} vs ${match.PlayersBySide}</p>
        <p><strong>Organizador:</strong> ${match.creator ? match.creator.username : 'Sistema'}</p>
        
        <div class="participants-container">
          <strong>Inscritos (${match.participants.length} / ${match.requiredPlayers}):</strong>
          <ul class="participants-list">${participantsList}</ul>
        </div>
      `;
    } catch (error) {
      modalBody.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
  }

  async function leaveMatch(matchId) {
    if (!confirm('¿Quieres salirte de este partido?')) return;

    try {
        const response = await leaveMatchAPI(matchId); // <-- Servicio API
        const data = await response.json();

        if (response.ok) {
            alert('Has salido del partido.');
            loadMatches(); // Recargar
            if (!document.getElementById('my-matches-page').classList.contains('hidden')) {
                loadMyMatches();
            }
        } else {
            alert(`Error: ${data.msg}`); // Aquí saldrá el mensaje del Cooldown si aplica
        }
    } catch (error) {
        alert('Error de red al intentar salir.');
    }
}

// FUNCIÓN ADMIN: EXPULSAR JUGADOR
async function kickPlayer(matchId, userId) {
    if (!confirm('¿Expulsar a este jugador del partido?')) return;

    try {
        const response = await removeParticipantAPI(matchId, userId); // <-- Servicio API
        const data = await response.json();

        if (response.ok) {
            alert('Jugador eliminado.');
            showMatchDetails(matchId); // Recargar el modal para ver que desapareció
            loadMatches(); // Actualizar contadores del fondo
        } else {
            alert(`Error: ${data.msg}`);
        }
    } catch (error) {
        alert('Error al expulsar.');
    }
  }
});