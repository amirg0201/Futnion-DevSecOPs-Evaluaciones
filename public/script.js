document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    const formContainer = document.querySelector('.form-container'); // Contenedor para mostrar mensajes
    const mainContainer = document.querySelector('.form-container');

    // --- Lógica para cambiar entre formularios ---
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

    // --- LÓGICA DE LOGIN ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/usuarios/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // ¡ÉXITO!
                // 1. Guardamos el token en el navegador
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);
                
                // 2. Mostramos el dashboard
                showDashboard();
            } else {
                alert(`Error: ${data.msg}`);
            }
        } catch (error) {
    // ESTO ES LO IMPORTANTE:
    // Imprime el error real en la consola para que podamos verlo.
    console.error('¡Error DESPUÉS de un login exitoso!', error); 
    
    // Mostramos un alert más específico
    alert('Error al mostrar el dashboard: ' + error.message);
}
    });

    // --- FUNCIÓN PARA MOSTRAR EL DASHBOARD ---
    function showDashboard() {
        mainContainer.innerHTML = `
            <h2>Partidos Disponibles</h2>
            <div id="matches-list">Cargando partidos...</div>
            <button id="logout-btn">Cerrar Sesión</button>
        `;
        loadMatches(); // Cargamos los partidos
        
        // Asignamos evento al botón de logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('token');
            // Recargamos la página para volver al login
            window.location.reload(); 
        });
    }

    // --- FUNCIÓN PARA CARGAR PARTIDOS ---
    async function loadMatches() {
        const listDiv = document.getElementById('matches-list');
        try {
            const response = await fetch('/api/partidos');
            if (!response.ok) throw new Error('Error al cargar partidos');
            
            const matches = await response.json();
            
            if (matches.length === 0) {
                listDiv.innerHTML = '<p>No hay partidos disponibles en este momento.</p>';
                return;
            }

            // Construimos el HTML de cada partido
            listDiv.innerHTML = matches.map(match => {
                // Calculamos los cupos restantes
                const spotsLeft = match.requiredPlayers - match.participants.length;
                
                return `
                    <div class="match-card">
                        <h3>${match.MatchName}</h3>
                        <p><strong>Lugar:</strong> ${match.LocationName}</p>
                        <p><strong>Organizador:</strong> ${match.creator.username}</p>
                        <p><strong>Cupos Faltantes:</strong> ${spotsLeft}</p>
                        <button class="join-btn" data-id="${match._id}" ${spotsLeft <= 0 ? 'disabled' : ''}>
                            ${spotsLeft <= 0 ? 'Lleno' : 'Unirme'}
                        </button>
                    </div>
                `;
            }).join('');

            // Asignamos evento a los botones "Unirme"
            document.querySelectorAll('.join-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const matchId = e.target.dataset.id;
                    joinMatch(matchId);
                });
            });

        } catch (error) {
            listDiv.innerHTML = `<p>${error.message}</p>`;
        }
    }

    // --- LÓGICA DE REGISTRO ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(registerForm);
        const userData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/usuarios', { // Endpoint de registro
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
                // Cambiamos al formulario de login
                registerForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
                loginForm.reset(); // Limpiamos los campos
            } else {
                alert(`Error en el registro: ${data.msg || data.error}`);
            }
        } catch (error) {
            console.error('Error de red:', error);
            alert('No se pudo conectar con el servidor.');
        }
    });

    // --- NUEVA FUNCIÓN: Unirse a un Partido ---

    async function joinMatch(matchId) {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Tu sesión ha expirado, por favor inicia sesión de nuevo.');
            return;
        }

        try {
            const response = await fetch(`/api/partidos/${matchId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // ¡Enviamos el token para la autenticación!
                    'Authorization': `Bearer ${token}` 
                }
            });

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
});