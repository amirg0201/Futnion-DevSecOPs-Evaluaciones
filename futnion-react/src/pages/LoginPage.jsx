// src/pages/LoginPage.jsx
import { useState } from 'react';
import { loginUser } from '../services/authService'; // Importamos el servicio
import { useAuth } from '../hooks/useAuth';  // Importamos el contexto
import { useNavigate } from 'react-router-dom';     // Para redireccionar

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth(); // Sacamos la función login del contexto global
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiar errores previos

    try {
      // 1. Llamamos al servicio (API)
      const data = await loginUser(email, password);
      
      // 2. Guardamos en el estado global (Context)
      login(data);
      
      // 3. Redireccionamos al Home
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <h2>Iniciar Sesión (React) ⚛️</h2>
        
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="input-group">
          <label>Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        
        <div className="input-group">
          <label>Contraseña</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
};

export default LoginPage;