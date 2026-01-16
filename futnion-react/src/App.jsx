// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import LoginPage from './pages/LoginPage';

// Un componente temporal para probar el Home
const HomePage = () => <h1>🏠 ¡Bienvenido al Home de React!</h1>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Ruta por defecto: Si no hay login, vamos a login */}
            <Route path="/" element={<HomePage />} />
            
            {/* Redirección si la ruta no existe */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;