// main.js - EL ORQUESTADOR CENTRAL

// ======================================
// 1. IMPORTACIONES
// ======================================
import { initializeDashboardUI } from './components/DashboardUI.js'; // <-- NUEVO MÓDULO UI
import { loginUser, registerUser, getMatches, createMatch as createMatchService, getMatchById, joinMatchAPI } from './services/api.js';
import { createMatchCard } from './components/MatchCard.js';

document.addEventListener('DOMContentLoaded', () => {

  // ======================================
  // 2. DECLARACIÓN DE VARIABLES DEL DOM (INICIALIZACIÓN INMEDIATA)
  // ======================================
  const loginContainer = document.querySelector('.form-container');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegisterLink = document.getElementById('show-register-link');
  const showLoginLink = document.getElementById('show-login-link');
  
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

  // Lógica para mostrar/ocultar login/registro (Se mantiene en main.js por ser el setup inicial)
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
        
        // Ejecutamos la lógica de inicialización y navegación
        setupApp(); 
      } else {
        alert(`Error: ${data.msg}`);
      }
    } catch (error) {
      console.error('Error en el login:', error);
      alert('No se pudo conectar con el servidor.');
    }
  });

  // FUNCIÓN PRINCIPAL DE CONFIGURACIÓN DE LA UI
  function setupApp() {
    // 1. Transición de UI
    loginContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');

    // 2. Agrupar Variables y Funciones
    const elements = {
        appContainer, homePage, createPage, navHome, navCreate, navLogout, 
        createMatchForm, matchesListDiv, modalContainer, modalBody, modalClose
    };
    const handlers = {
        loadMatches, createMatch, showMatchDetails, joinMatch // Las funciones de la capa de datos
    };

    // 3. Inicializar el Dashboard: El módulo DashboardUI toma el control de los eventos
    initializeDashboardUI(elements, handlers); 
    
    // 4. Carga inicial de datos
    loadMatches();
  }

  // ======================================
  // 4. LÓGICA DE DATOS Y ACCIONES (CONTROLADORES FRONTEND)
  // ======================================
  
  // FUNCIÓN PARA CARGAR PARTIDOS (Usa el componente y el servicio)
  async function loadMatches() {
    const currentUserId = localStorage.getItem('userId');
    matchesListDiv.innerHTML = "Cargando partidos...";

    try {
      const response = await getMatches(); // <-- Servicio API
      if (!response.ok) throw new Error('Error al cargar partidos');
      const matches = await response.json();
      
      if (matches.length === 0) {
        matchesListDiv.innerHTML = '<p>No hay partidos disponibles. ¡Crea el primero!</p>';
        return;
      }

      // Renderizado: El main.js solo se encarga de ORQUESTAR
      matchesListDiv.innerHTML = matches.map(match => {
        return createMatchCard(match, currentUserId); // <-- Componente UI
      }).join('');

      // --- Asignación de Eventos Dinámicos ---
      // El módulo DashboardUI NO PUEDE hacer esto porque los elementos no existen al inicio.
      // Debe hacerse aquí, DENTRO de loadMatches, que es cuando el HTML se crea.

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

    } catch (error) {
      matchesListDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
  }

  // FUNCIÓN PARA CREAR PARTIDO (Usa el servicio)
  async function createMatch(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return alert('Tu sesión ha expirado');

    const matchData = {
      MatchName: document.getElementById('match-name').value,
      LocationName: document.getElementById('match-location').value,
      MatchDate: document.getElementById('match-date').value,
      PlayersBySide: parseInt(document.getElementById('match-players-side').value),
      requiredPlayers: parseInt(document.getElementById('match-required').value)
    };

    try {
      const response = await createMatchService(matchData); 
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.msg || 'Error al crear el partido');

      alert('¡Partido creado con éxito!');
      createMatchForm.reset();
      
      // Simula el clic en el botón Home para volver al feed
      navHome.click(); 
    } catch (error) {
      alert(error.message);
    }
  }

  // FUNCIÓN PARA UNIRSE A PARTIDO (Usa el servicio)
  async function joinMatch(matchId) {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Tu sesión ha expirado, por favor inicia sesión de nuevo.');
      return;
    }

    try {
      const response = await joinMatchAPI(matchId);
      const data = await response.json();

      if (response.ok) {
        alert('¡Te has unido al partido!');
        loadMatches(); // Recargamos la lista de partidos
      } else {
        alert(`Error: ${data.msg}`);
      }
    } catch (error) {
      alert('Error de red al intentar unirse.');
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

  // LÓGICA DE REGISTRO (Usando servicio registerUser)
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

