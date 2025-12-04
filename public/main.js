// main.js - EL ORQUESTADOR CENTRAL (FINAL)

// ======================================
// 1. IMPORTACIONES
// ======================================
import { initializeDashboardUI } from './components/DashboardUI.js'; // <-- ¡NUEVO MÓDULO UI!
import { loginUser, registerUser, getMatches, createMatch as createMatchService, getMatchById, joinMatchAPI, deleteMatchAPI, getMyMatches } from './services/api.js';
import { createMatchCard } from './components/MatchCard.js';

document.addEventListener('DOMContentLoaded', () => {

  // ======================================
  // 2. DECLARACIÓN DE VARIABLES DEL DOM
  // ======================================
  const loginContainer = document.querySelector('.form-container');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegisterLink = document.getElementById('show-register-link');
  const showLoginLink = document.getElementById('show-login-link');
  const navMyMatches = document.getElementById('nav-my-matches'); // Nuevo Botón
  const myMatchesPage = document.getElementById('my-matches-page'); // Nueva Página
  const myMatchesListDiv = document.getElementById('my-matches-list'); // Nuevo Div de lista
// ...    
  // Variables de la App y el Modal
  const appContainer = document.getElementById('app-container');
  const homePage = document.getElementById('home-page');
  const createPage = document.getElementById('create-page');
  const navHome = document.getElementById('nav-home');
  const navCreate = document.getElementById('nav-create');
  const navLogout = document.getElementById('nav-logout');
  const createMatchForm = document.getElementById('create-match-form');
  const matchesListDiv = document.getElementById('matches-list');
  const modalContainer = document.getElementById('modal-container');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');

  // ======================================
  // 3. LÓGICA DE INICIO Y ORQUESTACIÓN
  // ======================================

  // Lógica de transición Login/Registro (Permanece aquí)
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

  // LÓGICA DE LOGIN (Punto de entrada principal)
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
        
        setupApp(); // Ejecuta la inicialización de la interfaz
      } else {
        alert(`Error: ${data.msg}`);
      }
    } catch (error) {
      console.error('Error en el login:', error);
      alert('No se pudo conectar con el servidor.');
    }
  });

  // FUNCIÓN PRINCIPAL DE CONFIGURACIÓN DE LA UI (El nuevo cerebro)
  function setupApp() {
    // Transición visual
    loginContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');

    // 1. Agrupar las funciones que el UI Manager necesita
    const handlers = {
        loadMatches, createMatch, showMatchDetails, joinMatch, loadMyMatches
    };

    // 2. Agrupar los elementos del DOM que el UI Manager necesita
    const elements = {
        appContainer, homePage, createPage, navHome, navCreate, navLogout, 
        createMatchForm, matchesListDiv, modalContainer, modalBody, modalClose, navMyMatches, myMatchesPage, myMatchesListDiv
    };

    // 3. ¡Llamada al módulo que se encarga de los clics y eventos!
    initializeDashboardUI(elements, handlers); 
    
    // 4. Carga inicial de datos (para el feed)
    loadMatches();
  }

  // ======================================
  // 4. LÓGICA DE DATOS Y ACCIONES (CONTROLADORES FRONTEND)
  // ESTAS FUNCIONES YA NO TIENEN ADDEVENTLISTENER
  // ======================================
  
  // FUNCIÓN PARA CARGAR PARTIDOS (Usa el componente y el servicio)
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
        return createMatchCard(match, currentUserId); // <-- Componente UI
      }).join('');

      // --- Asignación de Eventos Dinámicos (Permanece aquí) ---
      // El módulo DashboardUI NO puede hacer esto porque los elementos se crean aquí.

      // 1. Clic en el botón "Unirme"
      document.querySelectorAll('.join-btn').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          const matchId = e.target.dataset.id;
          joinMatch(matchId); 
        });
      });

      // 2. Clic en la tarjeta (para "Ver Más" - Modal)
      document.querySelectorAll('.match-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.join-btn')) return;
          const matchId = card.dataset.id;
          showMatchDetails(matchId);
        });
      });

      document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation(); // Evita que el clic abra también el modal
          const matchId = e.target.dataset.id;
          handleDeleteMatch(matchId); // <-- Llama a la función que acabamos de crear
        });
      });

    } catch (error) {
      matchesListDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
  }

  // FUNCIÓN PARA CREAR PARTIDO
  // main.js

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
          console.log("--- INICIANDO VALIDACIÓN DE CONFLICTO (CREAR) ---");
          
          // ============================================================
          // CAMBIO IMPORTANTE: Usamos el endpoint específico
          // ============================================================
          
          // 1. Pedimos directamente MIS partidos al backend
          const myMatchesResponse = await getMyMatches();
          if (!myMatchesResponse.ok) throw new Error('No se pudo verificar tu agenda');
          
          // El backend ya nos da la lista filtrada y limpia
          const myMatches = await myMatchesResponse.json();

          // ============================================================

          // 2. Calcular ventana del NUEVO partido
          const newWindow = calculateMatchWindow(matchData);
          console.log(`NUEVO INTENTO: ${newWindow.name} | ${newWindow.humanStart} - ${newWindow.humanEnd}`);

          // 3. Comparar con mis partidos existentes
          for (const existingMatch of myMatches) {
              const existingWindow = calculateMatchWindow(existingMatch);
              console.log(`COMPARANDO CON: ${existingWindow.name} | ${existingWindow.humanStart} - ${existingWindow.humanEnd}`);

              if (isOverlapping(existingWindow, newWindow)) {
                  console.warn("❌ CRUCE DETECTADO");
                  alert(`⚠️ CONFLICTO: Ya tienes el partido "${existingMatch.MatchName}" a esa hora.`);
                  return; // DETIENE TODO
              }
          }
          
          console.log("✅ Horario libre. Creando...");

          // 4. Crear si no hay conflicto
          const response = await createMatchService(matchData); 
          const data = await response.json();
          
          if (!response.ok) throw new Error(data.msg || 'Error al crear');

          alert('¡Partido creado con éxito!');
          createMatchForm.reset();
          document.getElementById('nav-home').click(); 

      } catch (error) {
          alert(error.message);
      }
  }

  // FUNCIÓN PARA UNIRSE A PARTIDO
  // main.js

  async function joinMatch(matchId) {
    const token = localStorage.getItem('token');
    const currentUserId = localStorage.getItem('userId'); 
    
    if (!token || !currentUserId) {
        alert('Tu sesión ha expirado, por favor inicia sesión de nuevo.');
        return;
    }

    try {
        console.log("--- INICIANDO VALIDACIÓN DE CONFLICTO (UNIRSE) ---");

        // 1. Obtener el partido al que me quiero unir (Target)
        // (Podríamos hacer un fetch solo de este partido, pero como ya cargamos todos en el feed,
        // podemos intentar buscarlo en el DOM o hacer un fetch rápido si queremos ser muy precisos.
        // Para simplificar y asegurar datos frescos, hacemos un getMatchById o reutilizamos la lógica).
        
        // Opción A: Pedir los detalles de ESTE partido específico para tener su hora exacta
        const targetMatchResponse = await getMatchById(matchId);
        if (!targetMatchResponse.ok) throw new Error('No se pudo obtener información del partido destino');
        const matchToJoin = await targetMatchResponse.json();

        // 2. Obtener MI AGENDA (Mis partidos)
        const myMatchesResponse = await getMyMatches();
        if (!myMatchesResponse.ok) throw new Error('No se pudo verificar tu agenda');
        const myMatches = await myMatchesResponse.json();

        // 3. Verificar Conflictos
        // Calculamos el horario del partido al que quiero entrar
        const targetWindow = calculateMatchWindow(matchToJoin);
        console.log(`INTENTO UNIRME A: ${targetWindow.name} | ${targetWindow.humanStart} - ${targetWindow.humanEnd}`);

        for (const existingMatch of myMatches) {
            // Calculamos el horario de cada partido que ya tengo
            const existingWindow = calculateMatchWindow(existingMatch);
            console.log(`REVISANDO MI AGENDA: ${existingWindow.name} | ${existingWindow.humanStart} - ${existingWindow.humanEnd}`);

            if (isOverlapping(existingWindow, targetWindow)) {
                console.warn("❌ CRUCE DETECTADO");
                alert(`⚠️ IMPOSIBLE UNIRSE: Choca con tu partido "${existingMatch.MatchName}" (${existingWindow.humanStart} - ${existingWindow.humanEnd}).`);
                return; // Detiene el proceso, no te une.
            }
        }
        
        // 4. Si la agenda está libre, procedemos a unirnos
        const response = await joinMatchAPI(matchId);
        const data = await response.json();

        if (response.ok) {
            alert('¡Te has unido al partido!');
            loadMatches(); // Recargamos el feed
        } else {
            alert(`Error: ${data.msg}`);
        }
    } catch (error) {
        console.error(error);
        alert('Error al intentar unirse. Revisa la consola para más detalles.');
    }
  }

  // FUNCIÓN PARA VER DETALLES DEL PARTIDO (Modal)
  async function showMatchDetails(matchId) {
    try {
      modalBody.innerHTML = 'Cargando...';
      modalContainer.classList.remove('hidden');

      const response = await getMatchById(matchId); 
      if (!response.ok) throw new Error('No se pudo cargar la información del partido.');
      
      const match = await response.json();

      // Formateo y construcción del HTML para el modal
      const matchDate = new Date(match.MatchDate).toLocaleString('es-ES', {
        dateStyle: 'full',
        timeStyle: 'short'
      });

      let participantsList;
      if (match.participants.length > 0) {
        participantsList = match.participants
          .map(user => `<li class="participant-item">${user ? user.username : 'Usuario no encontrado'}</li>`)
          .join('');
      } else {
        participantsList = '<li>Aún no hay jugadores inscritos.</li>';
      }

      // Construir el HTML final del modal
      const html = `
        <h3>${match.MatchName}</h3>
        <p><strong>Cuándo:</strong> ${matchDate}</p>
        <p><strong>Dónde:</strong> ${match.LocationName}</p>
        <p><strong>Formato:</strong> ${match.PlayersBySide} vs ${match.PlayersBySide}</p>
        <p><strong>Organizador:</strong> ${match.creator.username}</p>
        <p><strong>Duración:</strong> ${match.MatchDuration || '1'} horas</p>
        <div class="participants-container">
          <strong>Inscritos (${match.participants.length} / ${match.requiredPlayers}):</strong>
          <ul class="participants-list">
            ${participantsList}
          </ul>
        </div>
      `;
      
      modalBody.innerHTML = html;

    } catch (error) {
      modalBody.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
  }

/**
 * Maneja la eliminación de un partido, usando la ruta correcta según el rol.
 * @param {string} matchId - El ID del partido a eliminar.
 */
async function handleDeleteMatch(matchId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este partido? Esta acción es irreversible.')) return;

    const userRole = localStorage.getItem('userRole'); // Obtenemos el rol

    try {
        // Llamamos al servicio (que ya sabe la URL de Render)
        const response = await deleteMatchAPI(matchId, userRole);

        if (response.ok) {
            alert('Partido eliminado con éxito.');
            loadMatches(); // Recargar el feed
        } else {
            const data = await response.json();
            alert(`Error al eliminar: ${data.msg}`);
        }
    } catch (error) {
        console.error(error);
        alert('Error de red al intentar eliminar el partido.');
    }
}
  
  // LÓGICA DE REGISTRO (Permanece aquí)
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

});

async function loadMyMatches() {
    const currentUserId = localStorage.getItem('userId');
    myMatchesListDiv.innerHTML = "Cargando tus partidos...";

    try {
        // Usamos el servicio que ya creamos antes
        const response = await getMyMatches(); 
        
        if (!response.ok) throw new Error('Error al cargar tus partidos');
        const matches = await response.json();
        
        if (matches.length === 0) {
            myMatchesListDiv.innerHTML = '<p>No estás inscrito en ningún partido aún.</p>';
            return;
        }

        // Reutilizamos el componente MatchCard.js ¡La magia de la modularidad!
        myMatchesListDiv.innerHTML = matches.map(match => {
            return createMatchCard(match, currentUserId);
        }).join('');

        // IMPORTANTE: Asignar eventos a los botones de ESTA lista también
        // (Podríamos crear una función auxiliar para no repetir esto, pero por ahora copiemos)
        
        // 1. Botones Unirme/Dejar (en "Mis Partidos" podrías querer salirte)
        myMatchesListDiv.querySelectorAll('.join-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                joinMatch(e.target.dataset.id); 
            });
        });

        // 2. Tarjetas (Ver detalles)
        myMatchesListDiv.querySelectorAll('.match-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.join-btn') || e.target.closest('.delete-btn')) return;
                showMatchDetails(card.dataset.id);
            });
        });
        
        // 3. Botones Eliminar
        myMatchesListDiv.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                handleDeleteMatch(e.target.dataset.id); 
            });
        });

    } catch (error) {
        myMatchesListDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}

// --- FUNCIONES AUXILIARES PARA DETECCIÓN DE CONFLICTOS ---

/**
 * Calcula el inicio y fin de un partido en Milisegundos.
 */
function calculateMatchWindow(match) {
    // 1. Obtener fecha de inicio
    const startDate = new Date(match.MatchDate);
    const startMs = startDate.getTime();

    // 2. Obtener duración (dando prioridad al input si es un partido nuevo)
    // Nota: 'match-duration' es el ID del input en el formulario
    let durationHours = match.MatchDuration;
    
    // Si no viene en el objeto (ej: estamos creando el partido), leemos del DOM
    if ((durationHours === undefined || durationHours === null) && document.getElementById('match-duration')) {
        durationHours = parseFloat(document.getElementById('match-duration').value);
    }

    // Validación de seguridad
    if (!durationHours || isNaN(durationHours)) {
        durationHours = 1; // 1 hora por defecto si falla
    }

    // 3. Calcular fin: Inicio + (Horas * 3.6 millones de ms)
    const durationMs = durationHours * 60 * 60 * 1000;
    const endMs = startMs + durationMs;

    return { 
        start: startMs, 
        end: endMs, 
        name: match.MatchName || 'Nuevo Partido',
        humanStart: startDate.toLocaleTimeString(),
        humanEnd: new Date(endMs).toLocaleTimeString()
    };
}

/**
 * Verifica si dos rangos de tiempo se cruzan.
 * Lógica: Un partido A se cruza con B si:
 * El inicio de A es antes del final de B Y el final de A es después del inicio de B.
 */
function isOverlapping(windowA, windowB) {
    return windowA.start < windowB.end && windowA.end > windowB.start;
}
// --------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
   // ... resto de tu código ...
});
